# 🚀 PocketBizz - Production Deployment Guide

## 📋 **Overview**
PocketBizz is a comprehensive bakery management system for Malaysian SMEs, featuring inventory, sales, delivery tracking, and customer management.

---

## 🏗️ **Architecture**

### **Current Stack:**
- **Frontend**: React 18 + Vite + TypeScript + Shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: Neon Serverless PostgreSQL (Singapore region)
- **Session Store**: PostgreSQL (connect-pg-simple)
- **ORM**: Drizzle ORM

### **Production Architecture:**
```
┌─────────────────┐
│   Railway App   │  ← Full-stack deployment
│  PocketBizz     │  ← Frontend + Backend
└────────┬────────┘
         │
         ├──────→ Neon PostgreSQL (ap-southeast-1)
         │        └─ Connection Pooling enabled
         │
         └──────→ Cloudflare (Optional CDN)
```

---

## 🌐 **Railway Deployment**

### **Step 1: Prepare Repository**
```bash
# Ensure all changes are committed
git add .
git commit -m "Production ready - PocketBizz"
git push origin main
```

### **Step 2: Railway Setup**
1. Go to: https://railway.app
2. Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose: `bnidigitalmy/pocketbizz`

### **Step 3: Configure Environment Variables**
Add these in Railway dashboard:

```env
# Database (Already on Neon)
DATABASE_URL=postgresql://neondb_owner:npg_8kHAn4vFRuVO@ep-morning-thunder-a1qym7wn-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Session (Generate new for production!)
SESSION_SECRET=<generate-new-64-byte-hex>

# Application
NODE_ENV=production
PORT=5000

# CORS (Update with your production domain)
ALLOWED_ORIGINS=https://pocketbizz.up.railway.app,https://yourdomain.com

# Payment Gateway (ToyyibPay)
TOYYIBPAY_SECRET_KEY=your_secret_key
TOYYIBPAY_CATEGORY_CODE=your_category_code

# Google Drive (Optional)
GOOGLE_DRIVE_CLIENT_ID=your_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REDIRECT_URI=your_redirect_uri
```

### **Step 4: Generate Production Session Secret**
```bash
# Run this to generate new SESSION_SECRET for production
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **Step 5: Build Settings**
Railway will auto-detect from `package.json`:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### **Step 6: Deploy**
Click **"Deploy"** - Railway will:
1. Install dependencies
2. Run build
3. Start production server
4. Assign public URL: `https://pocketbizz.up.railway.app`

---

## 🔒 **Security Checklist**

### **Before Production:**
- [x] Helmet security headers ✅
- [x] CORS configured ✅
- [x] Rate limiting (100/15min, auth 5/15min) ✅
- [x] Password complexity (8+ chars, mixed) ✅
- [x] Bcrypt cost factor 12 ✅
- [x] Session regeneration on login ✅
- [x] Input sanitization ✅
- [x] SSL/TLS (Neon + Railway auto) ✅
- [ ] Change admin password
- [ ] Update ALLOWED_ORIGINS
- [ ] Generate new SESSION_SECRET
- [ ] Configure custom domain SSL

### **Post-Deployment:**
- [ ] Enable 2FA (Phase 2)
- [ ] Setup audit logging
- [ ] Configure monitoring (Railway metrics)
- [ ] Setup backups (Neon auto-backup)
- [ ] Load testing
- [ ] Penetration testing

---

## 📊 **Database Migration**

### **Production Database Setup:**
```bash
# Already done! Tables created in Neon
# Total: 38 tables deployed

# To verify:
npm run db:push

# Create production admin:
node create-admin.js
```

---

## 🌍 **Custom Domain Setup**

### **Option 1: Railway Domain**
Free subdomain: `pocketbizz.up.railway.app`

### **Option 2: Custom Domain**
1. Go to Railway project settings
2. Click **"Custom Domain"**
3. Add: `app.pocketbizz.com` or `pocketbizz.com`
4. Update DNS records:
   ```
   Type: CNAME
   Name: app (or @)
   Value: <railway-domain>
   ```
5. SSL auto-provisioned by Railway

---

## 📈 **Scaling Strategy**

### **Current Capacity (Free/Starter Tier):**
- **Users**: 0-500 concurrent
- **Database**: 500MB storage (Neon free)
- **Bandwidth**: 3GB/month (Neon)
- **Railway**: $5/month compute

### **Scale to 1K Users:**
- **Neon**: Upgrade to Scale ($19/month)
  - 10GB storage
  - 300 compute hours
- **Railway**: $20-30/month
- **Total**: ~$40-50/month

### **Scale to 10K Users:**
- **Neon**: Pro plan ($69/month)
- **Railway**: $100-150/month
- **Redis**: $10/month (session caching)
- **CDN**: Cloudflare (free)
- **Load Balancer**: Railway handles this
- **Total**: ~$180-230/month

---

## 🔍 **Monitoring**

### **Railway Built-in:**
- CPU/Memory usage
- Request logs
- Error tracking
- Deployment history

### **External Monitoring (Optional):**
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Datadog**: APM monitoring
- **UptimeRobot**: Uptime monitoring (free)

---

## 🚨 **Rollback Strategy**

### **Quick Rollback:**
1. Go to Railway deployments
2. Click previous successful deployment
3. Click **"Redeploy"**

### **Database Rollback:**
Neon provides point-in-time recovery:
1. Go to Neon console
2. Create branch from earlier timestamp
3. Update DATABASE_URL
4. Redeploy

---

## 💰 **Cost Breakdown**

### **Development (Current):**
- Neon: FREE (500MB)
- Railway: FREE ($5 credit)
- **Total**: $0/month

### **Production (0-500 users):**
- Neon: FREE tier sufficient
- Railway: $5-10/month
- Domain: $10-15/year
- **Total**: ~$10-15/month

### **Production (500-5K users):**
- Neon Scale: $19/month
- Railway: $30-50/month
- Cloudflare CDN: FREE
- **Total**: ~$50-70/month

### **Production (5K-10K users):**
- Neon Pro: $69/month
- Railway: $100-150/month
- Redis Cache: $10/month
- Monitoring: $20/month
- **Total**: ~$200-250/month

---

## 📞 **Support & Maintenance**

### **Database (Neon):**
- Auto backups: Daily
- Point-in-time recovery: 7 days (Scale plan)
- Region: ap-southeast-1 (Singapore)
- Support: Email support on paid plans

### **Hosting (Railway):**
- Auto SSL: Yes
- DDoS Protection: Yes
- Support: Discord + Email
- SLA: 99.9% uptime on Pro

---

## 🎯 **Next Steps**

1. **Immediate:**
   - [ ] Push code to GitHub
   - [ ] Connect Railway
   - [ ] Configure environment variables
   - [ ] Deploy!

2. **Week 1:**
   - [ ] Setup custom domain
   - [ ] Change admin password
   - [ ] Test all features in production
   - [ ] Setup monitoring

3. **Month 1:**
   - [ ] Collect user feedback
   - [ ] Optimize performance
   - [ ] Add Phase 2 security (2FA)
   - [ ] Setup automated backups

---

## 📚 **Resources**

- **Railway Docs**: https://docs.railway.app
- **Neon Docs**: https://neon.tech/docs
- **Project Repo**: https://github.com/bnidigitalmy/pocketbizz
- **Support**: Create GitHub issues

---

**PocketBizz** - Empowering Malaysian Bakeries 🥐🇲🇾

*Last Updated: October 30, 2025*
