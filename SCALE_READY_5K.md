# Production Scale Setup - PocketBizz (5k Users)

## Overview
PocketBizz dah ready untuk scale sampai 5,000 users dengan architecture yang betul. Ni checklist untuk optimize performance.

## 🎯 Current Status

### ✅ Already Configured
- **Backend:** Express.js dengan session-based auth
- **Database:** Neon PostgreSQL (serverless, Singapore region)
- **Caching:** Dual-layer (Redis + in-memory fallback)
- **Session Store:** Redis-first, PostgreSQL fallback
- **Rate Limiting:** 100 req/15min global, 5/15min auth endpoints
- **Security:** Helmet, CORS, bcrypt passwords

### ⚠️ Needs Action
- **Redis Setup** - Untuk optimal performance at scale
- **Monitoring** - Track errors dan performance
- **Database Indexes** - Verify critical queries optimized

## 🚀 Redis Setup (Critical for 5k Users)

### Why Redis?
- **Sessions:** 5k users = lots of session reads/writes. PostgreSQL akan slow.
- **Cache:** Reduce database load by 60-80% untuk frequently-accessed data.
- **Performance:** Redis 10-100x faster than PostgreSQL untuk key-value operations.

### Setup Steps

#### 1. Add Redis Database dalam Railway
```bash
# Via Railway Dashboard:
1. Go to your project
2. Click "+ New"
3. Select "Database" → "Redis"
4. Railway will auto-create REDIS_URL env var
5. Redeploy your service (it will auto-detect Redis)
```

#### 2. Verify Redis Connection
Check logs after deploy:
```
✓ Redis connected successfully
✓ Redis client ready
✓ Redis reachable
✓ Using Redis for session storage
```

Kalau nampak warning:
```
⚠️  REDIS_URL not configured - Redis features disabled
⚠️  Using PostgreSQL for session storage (Redis not configured)
```
Means Redis belum setup - pergi step 1.

### Expected Impact
| Metric | Without Redis | With Redis | Improvement |
|--------|---------------|------------|-------------|
| Session Read | ~50ms | ~2ms | 25x faster |
| Cache Hit | N/A | ~1ms | Massive |
| DB Load | 100% | 20-40% | 60-80% reduction |
| Response Time | 200-500ms | 50-150ms | 3-4x faster |

## 📊 Performance Optimization

### Database Indexes
Critical indexes already created (via Drizzle schema):
```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);

-- Products table  
CREATE INDEX idx_products_user ON products("userId");
CREATE INDEX idx_products_category ON products(category);

-- Sales table
CREATE INDEX idx_sales_user ON sales("userId");
CREATE INDEX idx_sales_date ON sales("saleDate");

-- Stock movements
CREATE INDEX idx_stock_user ON "stockMovements"("userId");
CREATE INDEX idx_stock_date ON "stockMovements"("movementDate");
```

Verify indexes exist:
```bash
node verify-db.js
# Should show all indexes listed
```

### Caching Strategy
PocketBizz auto-caches frequently-accessed data:

**Cached Endpoints:**
- `GET /api/products` - 5min TTL (CACHE_TTL.MEDIUM)
- `GET /api/dashboard/stats` - 1min TTL (CACHE_TTL.SHORT)
- `GET /api/vendors` - 5min TTL
- `GET /api/stock/low` - 5min TTL

**Cache Invalidation:**
Cache automatically cleared when data changes:
```typescript
// Example: Creating product
await storage.createProduct(userId, productData);
await cache.del(CACHE_KEYS.PRODUCTS_LIST); // Clear product cache
```

**Monitor Cache Performance:**
```typescript
// Check cache stats (add to health endpoint)
const stats = cache.getStats();
console.log(stats);
// { memoryKeys: 45, redisAvailable: true }
```

### Rate Limiting
Current limits (configured in `server/index.ts`):
```typescript
// Global rate limit
windowMs: 15 * 60 * 1000,  // 15 minutes
max: 100,                   // 100 requests per window

// Auth endpoints
windowMs: 15 * 60 * 1000,  // 15 minutes  
max: 5,                     // 5 requests per window (login/register)
```

**For 5k users:**
- ✅ Current limits are good starting point
- Adjust jika nampak legitimate users kena block
- Monitor logs untuk "Too many requests" errors

### Session Configuration
Current settings (already optimized):
```typescript
cookie: {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,                   // Security
  secure: process.env.NODE_ENV === "production", // HTTPS only
  sameSite: "lax",                  // CSRF protection
}
```

**Session Store Performance:**
- Redis: Can handle 10k+ sessions easily
- PostgreSQL fallback: Max ~1k concurrent users before slowdown
- **Action:** Setup Redis for 5k users

## 🔍 Monitoring Setup

### 1. Health Check Endpoint
Already available:
```bash
curl https://your-domain.com/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T...",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected",
  "cache": {
    "memoryKeys": 45,
    "redisAvailable": true
  }
}
```

### 2. Railway Logs
Monitor for errors:
```bash
railway logs --tail

# Watch for:
- Database connection errors
- Redis connection failures  
- 500 Internal Server Error
- High memory usage warnings
```

### 3. Database Monitoring
Neon dashboard provides:
- Query performance stats
- Connection pool usage
- Storage size
- Active connections

**Alert thresholds:**
- Connections > 80% of limit → Add connection pooling
- Query time > 500ms → Check indexes
- Storage > 80% → Plan upgrade

### 4. Error Tracking (Recommended)
Consider adding Sentry atau similar:
```bash
npm install @sentry/node

# In server/index.ts
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

## 💾 Database Connection Pooling

Neon PostgreSQL auto-handles pooling, but verify config:

```typescript
// In drizzle.config.ts (already configured)
export default {
  schema: "./shared/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Connection pooling via Neon
  // Max 10 concurrent connections per serverless instance
};
```

**For 5k users:**
- Neon auto-scales connections
- Railway might need connection pool setting if using multiple instances
- Monitor via Neon dashboard

## 🔐 Security at Scale

### Current Security Measures (8/10 rating)
- ✅ Helmet.js (XSS, CSP, etc.)
- ✅ CORS whitelist
- ✅ Rate limiting
- ✅ bcrypt password hashing
- ✅ httpOnly session cookies
- ✅ Signature verification (BCL webhook)
- ✅ SQL injection protection (Drizzle ORM)
- ✅ Session security

### Additional Recommendations for 5k Users
1. **DDoS Protection:** Consider Cloudflare (free plan sufficient)
2. **Backup Strategy:** Setup automated daily backups (Neon has this built-in)
3. **Monitoring Alerts:** Setup Railway alerts for uptime < 99%
4. **HTTPS Only:** Verify production uses HTTPS (Railway auto-handles)

## 📈 Load Testing (Before Launch)

Test app under load:
```bash
# Install k6 atau artillery
npm install -g artillery

# Create load test (test-load.yml)
artillery quick --count 100 --num 10 https://your-domain.com
# 100 virtual users, 10 requests each = 1000 total requests
```

**Success criteria untuk 5k users:**
- Average response time < 200ms
- 95th percentile < 500ms
- Error rate < 0.1%
- No database connection timeouts

## 🎯 Pre-Launch Checklist

### Infrastructure
- [ ] Redis database added dalam Railway
- [ ] Verify Redis connection dalam logs
- [ ] Health endpoint returns "redis: connected"
- [ ] Database indexes verified
- [ ] Backup strategy confirmed (Neon auto-backup)

### Performance
- [ ] Cache hit rate > 60% (check logs)
- [ ] Average API response < 200ms
- [ ] Session storage using Redis (not PostgreSQL)
- [ ] Load test passed (1000+ requests without errors)

### Security
- [ ] `BCL_WEBHOOK_SECRET` configured
- [ ] `SESSION_SECRET` is 64-byte random (not default)
- [ ] `ALLOWED_ORIGINS` whitelist set correctly
- [ ] HTTPS enforced (Railway auto-handles)
- [ ] Rate limits tested and working

### Monitoring
- [ ] Health endpoint accessible
- [ ] Railway alerts configured
- [ ] Neon dashboard reviewed
- [ ] Error tracking setup (optional but recommended)

### BCL Integration
- [ ] All 4 BCL forms created and tested
- [ ] Webhook URL configured dalam BCL dashboard
- [ ] Test payment completed successfully
- [ ] Subscription auto-activation verified
- [ ] Debug logging disabled (`BCL_DEBUG_LOG=0`)

## 🚨 Troubleshooting at Scale

### High Memory Usage
**Symptom:** Railway logs show "Memory usage: 450/512 MB"
**Solutions:**
1. Clear cache periodically: Add cron job to clear old cache
2. Reduce in-memory cache TTL (currently 5min)
3. Upgrade Railway plan (512MB → 1GB)

### Slow Database Queries
**Symptom:** Requests taking > 500ms
**Solutions:**
1. Check Neon dashboard for slow queries
2. Add missing indexes
3. Review N+1 query patterns
4. Enable caching for slow endpoints

### Session Store Issues
**Symptom:** Users getting logged out randomly
**Solutions:**
1. Verify Redis connection stable
2. Check session `maxAge` setting (7 days)
3. Monitor PostgreSQL connections if using PG session store

### Cache Misses
**Symptom:** Cache hit rate < 30%
**Solutions:**
1. Increase TTL for stable data
2. Verify cache.del() not called too frequently
3. Check Redis memory limit (shouldn't fill up with current usage)

## 📞 Next Steps

1. **Setup Redis NOW** - Critical untuk 5k users
2. **Run load test** - Verify performance before real traffic
3. **Complete BCL test payment** - Follow BCL_TESTING_GUIDE.md
4. **Monitor first 24 hours** - Watch logs closely after launch
5. **Iterate based on metrics** - Adjust caching, rate limits as needed

## 💡 Estimated Costs (5k Users)

**Railway:**
- Hobby Plan: $5/month (512MB RAM) - Good untuk startup
- Pro Plan: $20/month (8GB RAM, priority support) - Recommended untuk 5k users

**Neon PostgreSQL:**
- Free tier: 0.5GB storage, 3M rows - OK untuk testing
- Launch tier: $19/month (10GB, 10M rows) - Recommended untuk 5k users

**Redis:**
- Railway Redis: Free (256MB) - Sufficient untuk 5k users
- Upstash Redis: $10/month (1GB) - Alternative kalau need more

**Total estimated: $30-40/month untuk 5k users**

With subscription revenue (5k users × RM27/month = RM135k/month), cost is < 0.1% of revenue.

## ✅ You're Ready When:
- ✅ Redis connected dan working
- ✅ Load test passed
- ✅ BCL payment tested end-to-end
- ✅ All 5 disabled features have "Soon" badges
- ✅ No errors dalam logs
- ✅ Health endpoint returns all green

**Target go-live date:** As soon as checklist complete (could be today jika Redis setup!)
