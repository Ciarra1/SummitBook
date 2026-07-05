# SaaS-Proj: Deployment & Infrastructure Guide

## Overview

This document outlines the deployment architecture, CI/CD pipeline, environment configurations, and operational procedures for SaaS-Proj.

---

## 1. Deployment Architecture

### 1.1 High-Level Deployment Topology

```
┌─────────────────────────────────────────────────────────┐
│                  GitHub Repository                      │
│  (Source of Truth for all code & infrastructure)       │
└────────────────────────┬────────────────────────────────┘
                         │ Git Push
        ┌────────────────┼────────────────┐
        │                │                │
   DEVELOPMENT      STAGING          PRODUCTION
        │                │                │
        ▼                ▼                ▼
  Vercel (Dev)    Vercel (Staging)  Vercel (Prod)
   Auto-deploy     Manual Approval   Manual Approval
        │                │                │
        └────────────────┼────────────────┘
                         │
                    Supabase DB
                  (Environment-specific)
```

---

## 2. Environment Configuration

### 2.1 Development Environment

**Frontend**

```
URL: https://saas-proj-dev.vercel.app
Branch: develop
Deployment: Auto (every push)
```

**Backend**

```
Database: Supabase Development Tier
Region: Asia-Pacific (Singapore)
Backups: Daily
```

**Credentials**

- PayMongo: Sandbox Mode
- Email Service: Resend (free tier)

---

### 2.2 Staging Environment

**Frontend**

```
URL: https://staging.saas-proj.dev
Branch: staging
Deployment: Manual approval required
```

**Backend**

```
Database: Supabase Development Tier (staging clone)
Region: Asia-Pacific (Singapore)
Backups: Daily + on-demand
```

**Credentials**

- PayMongo: Sandbox Mode
- Email Service: Resend

---

### 2.3 Production Environment

**Frontend**

```
URL: https://app.saas-proj.dev (Primary)
       https://www.saas-proj.dev (Alias)
Branch: main
Deployment: Manual approval + automated checks
CDN: Vercel global CDN
```

**Backend**

```
Database: Supabase Production Tier
Region: Asia-Pacific (Singapore)
Backups: Automated daily + 30-day retention
High Availability: Enabled
```

**Credentials**

- PayMongo: Live Mode
- Email Service: Resend (paid plan)
- Monitoring: Sentry + Datadog

---

## 3. CI/CD Pipeline

### 3.1 GitHub Actions Workflow

**Trigger**: Push to `develop`, `staging`, or `main` branch

```yaml
# .github/workflows/deploy.yml

name: Build, Test & Deploy

on:
  push:
    branches: [develop, staging, main]
  pull_request:
    branches: [develop, staging]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter (ESLint)
        run: npm run lint

      - name: Run formatter check (Prettier)
        run: npm run format:check

      - name: Run unit tests (Jest)
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL_STAGING }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_STAGING }}

      - name: Build application
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: .next/

  deploy-dev:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    steps:
      - name: Deploy to Vercel (Development)
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npx vercel deploy --prod \
            --token=$VERCEL_TOKEN \
            --scope=saas-proj

  deploy-staging:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging' && github.event_name == 'push'
    environment: staging
    steps:
      - name: Await approval
        run: echo "Manual approval required for staging deployment"

      - name: Deploy to Vercel (Staging)
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npx vercel deploy --prod \
            --token=$VERCEL_TOKEN \
            --scope=saas-proj \
            --alias=staging.saas-proj.dev

  deploy-prod:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    steps:
      - name: Await approval
        run: echo "Manual approval required for production deployment"

      - name: Run smoke tests
        env:
          STAGING_URL: https://staging.saas-proj.dev
        run: npm run test:smoke -- --baseUrl=$STAGING_URL

      - name: Deploy to Vercel (Production)
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npx vercel deploy --prod \
            --token=$VERCEL_TOKEN \
            --scope=saas-proj \
            --alias=app.saas-proj.dev

  e2e-tests:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npm run test:e2e:install

      - name: Run E2E tests
        env:
          BASE_URL: https://staging.saas-proj.dev
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-results
          path: test-results/

  notify:
    needs: [deploy-dev, deploy-staging, deploy-prod]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "Deployment Status: ${{ job.status }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*SaaS-Proj Deployment*\nBranch: ${{ github.ref }}\nStatus: ${{ job.status }}"
                  }
                }
              ]
            }
```

---

## 4. Database Deployment

### 4.1 Schema Migrations

All schema changes are version-controlled in `/packages/db/migrations/`:

```
migrations/
├── 001_initial_schema.sql
├── 002_add_audit_log.sql
├── 003_add_review_categories.sql
└── 004_create_materialized_views.sql
```

**Migration Process**:

1. Create `.sql` file with version number
2. Add migration script to GitHub
3. Run on staging first (validate)
4. Schedule for production (low-traffic window)

**Manual Migration (via Supabase Console)**:

```sql
-- Open Supabase SQL Editor and run:
\i migrations/001_initial_schema.sql
```

---

### 4.2 Database Backup Strategy

**Supabase Production Backups**:

- **Automatic**: Daily automated backups (retained 30 days)
- **Point-in-time Recovery**: Enabled (last 7 days)
- **Manual**: On-demand backups before major deployments

**Restore Process**:

1. Access Supabase Dashboard → Settings → Backups
2. Select backup point
3. Click "Restore" (creates new DB instance)
4. Verify data integrity
5. Update connection string if necessary

---

## 5. Environment Variables

### 5.1 Frontend Environment Variables

**Development** (`.env.development`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxx...
NEXT_PUBLIC_ANALYTICS_ID=dev-123
```

**Staging** (`.env.staging`)

```env
NEXT_PUBLIC_API_URL=https://staging.saas-proj.dev/api
NEXT_PUBLIC_SUPABASE_URL=https://xxx-staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxx...
NEXT_PUBLIC_ANALYTICS_ID=staging-456
```

**Production** (`.env.production`)

```env
NEXT_PUBLIC_API_URL=https://app.saas-proj.dev/api
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxx...
NEXT_PUBLIC_ANALYTICS_ID=prod-789
```

### 5.2 Backend Environment Variables (Supabase)

**Set via Supabase Dashboard → Settings → API Settings**:

```env
# Database
DATABASE_URL=postgresql://user:pass@host/db

# Auth
SUPABASE_JWT_SECRET=xxxxx
SUPABASE_AUTH_EXTERNAL_GOOGLE_ENABLED=true

# Payment
PAYMONGO_SECRET_KEY=pk_xxx
PAYMONGO_WEBHOOK_SECRET=whsec_xxx

# Email
RESEND_API_KEY=re_xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/123

# Feature Flags
FEATURE_EARLY_BIRD_DISCOUNT=true
FEATURE_SMS_REMINDERS=false
```

---

## 6. Vercel Deployment Configuration

### 6.1 vercel.json Configuration

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": {
      "required": true
    },
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": {
      "required": true
    }
  },
  "envPrefix": "NEXT_PUBLIC_",
  "regions": ["sfo1", "sin1"],
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  },
  "redirects": [
    {
      "source": "/old-page",
      "destination": "/new-page",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.saas-proj.dev/:path*"
    }
  ]
}
```

### 6.2 Vercel Project Settings

**Org**: saas-proj
**Project Name**: saas-proj-web

**Git Integration**:

- GitHub repo: saas-proj/app
- Production branch: main
- Preview branches: develop, staging

**Build Settings**:

- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js Version: 20.x

**Environment Variables** (Vercel Settings):

```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 7. Supabase Configuration

### 7.1 Project Settings

**Project URL**: https://xxx.supabase.co
**Database Region**: Asia-Pacific (Singapore)

### 7.2 Auth Configuration

**Email Verification**:

- Required: Yes
- Template: Custom branded

**OAuth Providers**:

- Google: Enabled
- Facebook: Enabled

**JWT Expiry**:

- Access Token: 1 hour
- Refresh Token: 7 days

### 7.3 Database Connection

**Connection String**:

```
postgresql://postgres:<password>@db.xxx.supabase.co:5432/postgres
```

**Connection Pooling** (PgBouncer):

- Pool Mode: Transaction
- Connection Limit: 30

---

## 8. Monitoring & Observability

### 8.1 Error Tracking (Sentry)

**Setup**:

1. Create Sentry org: `saas-proj`
2. Create projects: `frontend`, `backend`
3. Add DSN to environment variables

**Frontend Configuration** (`pages/_app.tsx`):

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
```

**Backend Configuration** (Edge Functions):

```typescript
import * as Sentry from "@sentry/deno";

Sentry.init({
  dsn: Deno.env.get("SENTRY_DSN"),
  environment: Deno.env.get("ENV"),
});
```

### 8.2 Vercel Analytics

**Web Vitals Dashboard**:

- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**Access**: Vercel Dashboard → Analytics

### 8.3 Database Monitoring (Supabase)

**Key Metrics**:

- Query Performance: Monitor slow queries
- Connection Pool Usage: Alert if > 80%
- Storage Usage: Monitor disk space
- Replication Lag: < 1s

**Set Alerts**:

1. Supabase Dashboard → Monitoring
2. Create alerts for:
   - High error rate (> 1% of queries)
   - Slow queries (> 1s)
   - Connection pool exhaustion

### 8.4 Payment Monitoring

**Monitor**:

- Payment success rate (target: > 98%)
- Webhook delivery failures
- Refund processing time
- Daily revenue metrics

**Dashboard**: PayMongo Dashboard → Analytics

---

## 9. Scaling Strategy

### 9.1 Database Scaling

**Current Capacity**:

- Connections: 100 (dev), 1000 (prod)
- Storage: 1 GB (auto-scales)

**Scaling Triggers**:

- Query latency > 500ms → Add read replicas
- Connection pool > 80% → Increase pool size
- Storage > 80% → Alert

**Upgrade Path**:

1. Supabase Pro: For production traffic
2. Multi-region: Add read replicas in other regions
3. On-demand pricing: For spiky traffic

### 9.2 Frontend Scaling

**Auto-scaling** (Vercel):

- Automatic based on traffic
- No manual intervention needed

**CDN Optimization**:

- Enable compression: gzip, brotli
- Image optimization: Next.js Image component
- Cache static assets: 1 year expiry

### 9.3 API Scaling

**Edge Functions** (Supabase):

- Auto-scale per region
- Current quotas: 50 concurrent executions

**Rate Limiting**:

- 100 requests/minute per user (enforced in Edge Functions)
- Implement request queuing for burst traffic

---

## 10. Disaster Recovery

### 10.1 Backup Strategy

| Component      | Backup Frequency | Retention | Recovery Time |
| -------------- | ---------------- | --------- | ------------- |
| Database       | Daily            | 30 days   | < 1 hour      |
| Uploaded Files | Continuous (S3)  | 90 days   | < 5 minutes   |
| Source Code    | GitHub           | ∞         | N/A           |

### 10.2 Recovery Procedures

**Database Corruption**:

1. Check Supabase Dashboard for backup points
2. Select latest valid backup
3. Restore to new instance
4. Verify data integrity
5. Update connection strings

**Service Outage**:

1. Check Supabase Status Page
2. If regional outage: Switch to standby region (if available)
3. Notify users via status page
4. Await service restoration

**Data Loss**:

1. Contact Supabase support immediately
2. Provide timestamp of last known good state
3. Perform point-in-time recovery
4. Run audit queries to verify integrity

---

## 11. Security Hardening

### 11.1 Network Security

**Vercel**:

- DDoS protection: Enabled by default
- WAF: Enabled with basic rules
- HTTPS/TLS 1.3: Enforced

**Supabase**:

- Network Restrictions: IP whitelist if needed
- VPC: Available for enterprise tier
- Encryption in transit: TLS 1.3

### 11.2 Secrets Management

**GitHub Secrets** (for CI/CD):

```
VERCEL_TOKEN
SUPABASE_URL
SUPABASE_ANON_KEY
PAYMONGO_SECRET_KEY
SENTRY_DSN
```

**Rotation Policy**:

- Rotate PayMongo keys: Every 90 days
- Rotate database passwords: Every 180 days
- Review access: Monthly

### 11.3 Access Control

**GitHub**:

- Branch protection on `main`, `staging`
- Require pull request reviews (2 approvals)
- Enforce status checks

**Supabase**:

- Enable 2FA for all team members
- Use SSO if available
- Regular access audits

---

## 12. Rollback Procedures

### 12.1 Frontend Rollback

**Via Vercel Dashboard**:

1. Go to Deployments
2. Select previous stable deployment
3. Click "Promote to Production"
4. Verify health checks pass

**Manual Rollback** (Git):

```bash
git revert <commit-hash>
git push origin main
# Vercel auto-deploys
```

### 12.2 Database Rollback

**If migration fails**:

1. Stop ongoing requests
2. Restore database from backup point (pre-migration)
3. Fix migration script
4. Test on staging
5. Re-run migration

---

## 13. Operational Checklists

### 13.1 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code review approved
- [ ] Staging deployment successful
- [ ] E2E tests passed
- [ ] Security scan passed
- [ ] Performance baseline acceptable
- [ ] Monitoring alerts configured

### 13.2 Post-Deployment Checklist

- [ ] Production deployment successful
- [ ] Health checks passing
- [ ] No error spikes in Sentry
- [ ] Payment processing functioning
- [ ] Database queries performant
- [ ] Analytics ingesting data
- [ ] Status page updated

### 13.3 Incident Response

**Critical Issue** (service down):

1. Declare incident (Slack #incidents)
2. Gather team
3. Investigate root cause
4. Implement fix or rollback
5. Verify resolution
6. Post-mortem within 24 hours

---

## 14. Cost Optimization

### 14.1 Monthly Cost Breakdown

| Service   | Dev  | Staging | Prod     | Notes                      |
| --------- | ---- | ------- | -------- | -------------------------- |
| Vercel    | Free | $20     | $100     | Pro plan                   |
| Supabase  | Free | $25     | $200     | Dev/Pro tier               |
| PayMongo  | -    | -       | Variable | 2.9% + ₱15 per transaction |
| Sentry    | Free | Free    | $29      | Pro for error tracking     |
| Resend    | -    | -       | $20      | Transactional email        |
| **Total** | -    | ~$70    | ~$370    | Excludes payment fees      |

### 14.2 Cost Reduction Opportunities

- Use Supabase free tier for development
- Implement aggressive caching (reduce database queries)
- Compress images before upload
- Monitor unused Edge Functions

---

**Last Updated**: June 2026
**Maintained By**: DevOps Team
**Emergency Contact**: devops@saas-proj.dev
