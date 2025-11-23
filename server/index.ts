// Load environment variables first (before any other imports)
import dotenv from "dotenv";
dotenv.config();

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import session from "express-session";
import { RedisStore } from "connect-redis";
import ConnectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { redis } from "./redis";
import { registerRoutes } from "./routes";
import { log } from "./log";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Validate environment and connectivity checks before starting the server
async function validateEnvironment(): Promise<void> {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
  if (!process.env.SESSION_SECRET) missing.push('SESSION_SECRET');

  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  // quick DB connectivity check
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000, // 10 second timeout
      ssl: { rejectUnauthorized: false } // Allow self-signed certs for Neon
    });
    await pool.query('SELECT 1');
    await pool.end();
    log('✓ Database reachable');
  } catch (err: any) {
    log(`⚠️  Database connectivity check failed: ${err.message}`);
    // Don't throw - let app try to start anyway, might be temporary network issue
  }

  // test Redis if configured
  if (process.env.REDIS_URL) {
    try {
      const { redis } = await import('./redis');
      if (redis) {
        await redis.ping();
        log('✓ Redis reachable');
      }
    } catch (err: any) {
      log(`⚠️  Redis connectivity check failed: ${err.message}`);
    }
  }
}

function serveStatic(app: express.Express) {
  const distPath = path.resolve(__dirname, "public");
  log(`Serving static files from: ${distPath}`);

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// Initialize Sentry (must be first!)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    integrations: [
      // Express integration for automatic error tracking
      Sentry.expressIntegration({ app }),
      // Profiling
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0, // 10% in prod, 100% in dev
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
  
  log('✓ Sentry error monitoring initialized');
} else {
  log('⚠️  Sentry DSN not configured - error monitoring disabled');
}

// Export helper for tests so they can import the app without starting the server
export async function setupTestApp() {
  await registerRoutes(app);
  return app;
}

// Capture raw body for HMAC signature verification (e.g., BCL.my webhooks)
app.use(express.json({
  verify: (req: any, _res, buf) => {
    try {
      req.rawBody = buf.toString('utf8');
    } catch {
      // ignore
    }
  },
}));
app.use(express.urlencoded({ extended: false }));

// Security Headers (Helmet)
app.use(helmet({
  // Strict-Transport-Security: Force HTTPS (only in production)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // Content-Security-Policy: Prevent XSS attacks
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"], // Added blob: for workers
      workerSrc: ["'self'", "blob:"], // Added worker-src
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'", 
        "https://api.pocketbizz.my", 
        "https://app.pocketbizz.my", 
        "https://fonts.googleapis.com", 
        "https://fonts.gstatic.com",
        "https://*.ingest.us.sentry.io" // Allow Sentry
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  
  // X-Frame-Options: Prevent clickjacking
  frameguard: {
    action: 'deny',
  },
  
  // X-Content-Type-Options: Prevent MIME sniffing
  noSniff: true,
  
  // Referrer-Policy: Control referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  
  // Permissions-Policy: Control browser features
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
}));

// Additional security headers
app.use((_req, res, next) => {
  // Permissions-Policy (newer replacement for Feature-Policy)
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=()');
  
  // X-XSS-Protection (legacy but still useful)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
});

log('✓ Security headers configured (Helmet + custom policies)');

// Trust proxy for Replit deployment (required for secure cookies behind proxy)
app.set('trust proxy', 1);

// Session store configuration (Redis if available, PostgreSQL as fallback)
let sessionStore;

if (redis) {
  // Use Redis for sessions (preferred - faster and persistent)
  sessionStore = new RedisStore({
    client: redis,
    prefix: "pocketbizz:sess:",
    ttl: 30 * 24 * 60 * 60, // 30 days in seconds
  });
  log('✓ Using Redis for session storage');
} else {
  // Fallback to PostgreSQL for sessions (slower but reliable)
  const PgSession = ConnectPgSimple(session);
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  sessionStore = new PgSession({
    pool: pgPool,
    createTableIfMissing: true,
  });
  log('⚠️  Using PostgreSQL for session storage (Redis not configured)');
}

// Session middleware
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "pocketbizz-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset maxAge on every response
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (reduced from 30 for better security)
      path: '/', // Explicitly set cookie path
      domain: process.env.NODE_ENV === "production" ? '.pocketbizz.my' : undefined, // Allow subdomains in production
    },
    proxy: true, // Trust the reverse proxy for secure cookie handling
    name: 'pocketbizz.sid', // Custom session cookie name to avoid conflicts
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      log('Starting server initialization...');
      // Validate env and connectivity before registering routes
      await validateEnvironment();
      const server = await registerRoutes(app);
      log('Routes registered successfully');

      // Error handler
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        res.status(status).json({ message });
        throw err;
      });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  log(`Attempting to bind to port ${port}`);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
    } catch (error: any) {
      console.error('❌ Fatal startup error:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  })();
}
