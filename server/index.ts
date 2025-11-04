import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { RedisStore } from "connect-redis";
import ConnectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { redis } from "./redis";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Initialize Sentry (must be first!)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    integrations: [
      // Tracing
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: express() }),
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

const app = express();

// Sentry request handler (must be first middleware!)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', // 'none' required for cross-origin cookies in production
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
    proxy: true, // Trust the reverse proxy for secure cookie handling
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

(async () => {
  const server = await registerRoutes(app);

  // Sentry error handler (must be before other error handlers!)
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }

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
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
