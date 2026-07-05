# SaaS-Proj: Architecture Quick Reference

## System at a Glance

**What**: B2B2C SaaS marketplace for Philippine mountaineering bookings
**Who**: Hikers (consumers) ↔ Tour organizers (businesses)
**When**: Real-time discovery, booking, payment, and roster management
**Tech**: Next.js + React | Supabase (PostgreSQL) | PayMongo | Vercel

---

## Core Components

### 1. Frontend (Client)

```
Technology: Next.js 14 + React 18 + Tailwind CSS
Hosting: Vercel (global CDN)
Build: SSR + SSG for optimal SEO
Key Pages:
  ├─ / (Home + Discovery Hub)
  ├─ /climbs/:id (Expedition Details)
  ├─ /auth/signup (Registration)
  ├─ /auth/login (Authentication)
  ├─ /hiker/bookings (Hiker Dashboard)
  ├─ /hiker/profile (Profile Management)
  ├─ /organizer/dashboard (Organizer Dashboard)
  └─ /organizer/expeditions/:id/roster (Manifest)
```

### 2. Backend (API Layer)

```
Technology: Supabase Edge Functions (Deno/TypeScript)
Deployment: Serverless (auto-scales)
Key Functions:
  ├─ auth/* (JWT management, OAuth)
  ├─ expeditions/* (CRUD operations)
  ├─ bookings/* (Reservation management)
  ├─ payments/webhook (PayMongo integration)
  └─ documents/* (PDF manifest generation)
```

### 3. Database (Data Layer)

```
Technology: PostgreSQL 15 (Supabase)
Region: Asia-Pacific (Singapore)
Key Tables:
  ├─ users (Authentication)
  ├─ organizer_profiles (Business metadata)
  ├─ expeditions (Offerings)
  ├─ bookings (Reservations)
  ├─ payments (Transaction log)
  ├─ expedition_participants (Manifest data)
  ├─ reviews (Ratings & testimonials)
  └─ audit_log (Compliance trail)
Security: Row-Level Security (RLS) enabled
```

### 4. External Integrations

```
PayMongo → Payment processing (GCash, Maya, InstaPay)
Resend → Transactional emails
pdf-lib → Client-side PDF generation
Sentry → Error tracking & monitoring
Vercel Analytics → Performance metrics
```

---

## User Journeys

### Hiker Flow

```
1. Discover
   Homepage → Search by mountain/date/difficulty
   ↓
2. Explore
   View expedition details, reviews, organizer profile
   ↓
3. Book
   Click "Book Now" → Enter participant details → Create booking
   ↓
4. Pay
   Redirected to PayMongo payment → Choose payment method
   ↓
5. Confirm
   Payment success → Booking confirmed → Receive confirmation email
   ↓
6. Prepare
   Access manifest PDF → Gear checklist → Pre-climb info
   ↓
7. Climb
   Day of: Attend expedition with official manifest
```

### Organizer Flow

```
1. Setup Profile
   Sign up as organizer → Add company details → Get verified
   ↓
2. Create Expedition
   Dashboard → "New Expedition" → Fill details (mountain, dates, price, itinerary)
   ↓
3. Publish
   Publish to marketplace → Appears in public discovery
   ↓
4. Manage
   Real-time bookings → See confirmed participants → Track revenue
   ↓
5. Roster
   Before expedition → Generate manifest PDF → Ready for LGU
   ↓
6. Complete
   After expedition → Receive reviews → Update analytics
```

### Payment Flow

```
User creates booking → Booking status: "pending"
          ↓
      PayMongo generates payment intent
          ↓
    User redirected to PayMongo checkout
          ↓
  User chooses payment method (GCash, Maya, etc.)
          ↓
    PayMongo processes payment
          ↓
  PayMongo sends webhook → Supabase Edge Function
          ↓
   Verify HMAC signature + Idempotency key
          ↓
  Update payment & booking status → "confirmed"
          ↓
   Email confirmation sent to hiker
          ↓
 Inventory updated (--available_slots)
```

---

## Data Model (Simplified)

```
USERS (Authentication Core)
├─ ID, Email, Password, Role (hiker|organizer|admin)
├─ FirstName, LastName, ProfilePicture
└─ PhoneNumber, EmailVerified

ORGANIZER_PROFILES (Business metadata)
├─ UserID (FK → users)
├─ CompanyName, RegistrationNumber, Website
├─ VerificationStatus (pending|verified|rejected)
├─ AverageRating, TotalReviews, BankDetails
└─ CancellationPolicy

EXPEDITIONS (Offerings)
├─ ID, OrganizerID (FK → organizer_profiles)
├─ MountainName, Difficulty, StartDate, EndDate
├─ PricePerPerson, TotalVanSlots, AvailableSlots
├─ Itinerary (day-by-day activities), GearRequirements
├─ IncludedAmenities, ExcludedItems
└─ PublishedStatus, CancellationPolicy

BOOKINGS (Reservations)
├─ ID, HikerID (FK → users), ExpeditionID (FK → expeditions)
├─ BookingStatus (pending|confirmed|cancelled)
├─ PaymentStatus (pending|completed|failed|refunded)
├─ FinalPrice, PaymentMethod, PayMongoPaymentID (FK)
└─ BookingDate, CancellationDate

PAYMENTS (Transaction Log)
├─ ID, BookingID (FK → bookings)
├─ PayMongoPaymentID (UNIQUE)
├─ Amount, Currency, PaymentStatus
├─ PaymentMethodType, WebhookReceivedAt
└─ IdempotencyKey (UNIQUE - prevent duplicates)

EXPEDITION_PARTICIPANTS (Manifest)
├─ ID, BookingID (FK), ExpeditionID (FK)
├─ FullName, DateOfBirth, Gender
├─ EmergencyContactName, EmergencyContactNumber
├─ MedicalConditions, Allergies, BloodType
└─ IDType, IDNumber, DataVerified

REVIEWS (Ratings)
├─ ID, HikerID (FK), OrganizerID (FK), ExpeditionID (FK)
├─ Rating (1-5), ReviewTitle, ReviewText
├─ RatingOrganization, RatingGuideQuality, RatingAccommodations
└─ VerifiedParticipant (from actual booking)

AUDIT_LOG (Compliance)
├─ ID, TableName, Operation (INSERT|UPDATE|DELETE)
├─ RecordID, ActorID, OldValues, NewValues
└─ CreatedAt, IPAddress
```

---

## API Endpoints (Quick Ref)

### Public (No Auth Required)

```
GET    /expeditions              (List with filters)
GET    /expeditions/:id          (Details + reviews)
GET    /expeditions/:id/reviews  (Paginated reviews)
POST   /auth/signup              (Register)
POST   /auth/login               (Login)
```

### Hiker (Role: hiker)

```
POST   /bookings                 (Create booking)
GET    /hiker/bookings           (My bookings)
GET    /bookings/:id             (Booking details)
POST   /bookings/:id/cancel      (Cancel booking)
GET    /bookings/:id/manifest    (Download PDF)
POST   /reviews                  (Submit review)
PATCH  /profile                  (Update profile)
```

### Organizer (Role: organizer)

```
POST   /organizer/expeditions    (Create expedition)
PATCH  /organizer/expeditions/:id (Update expedition)
POST   /organizer/expeditions/:id/publish (Publish)
GET    /organizer/expeditions    (My expeditions)
GET    /organizer/expeditions/:id/bookings (Bookings for expedition)
POST   /organizer/expeditions/:id/manifest (Generate manifest PDF)
GET    /organizer/dashboard      (Analytics)
PATCH  /organizer/profile        (Update profile)
```

### Webhooks (External)

```
POST   /payments/webhook         (PayMongo events)
```

---

## Technology Stack

| Layer           | Technology              | Purpose                             |
| --------------- | ----------------------- | ----------------------------------- |
| **Frontend**    | Next.js 14              | SSR/SSG for SEO + performance       |
|                 | React 18                | Component-based UI                  |
|                 | Tailwind CSS            | Utility-first CSS                   |
|                 | SWR                     | Data fetching + caching             |
| **Backend**     | Supabase Edge Functions | Serverless API layer                |
|                 | TypeScript              | Type safety                         |
|                 | Deno Runtime            | Secure, modern runtime              |
| **Database**    | PostgreSQL 15           | ACID-compliant relational DB        |
|                 | Supabase                | Managed Postgres + auth + real-time |
| **Payments**    | PayMongo                | Philippine e-wallet integration     |
| **Email**       | Resend                  | Transactional emails                |
| **Storage**     | Supabase Storage        | User uploads (manifests, images)    |
| **Hosting**     | Vercel                  | Frontend CDN + serverless functions |
| **Monitoring**  | Sentry                  | Error tracking                      |
|                 | Vercel Analytics        | Performance insights                |
| **Development** | GitHub                  | Version control + CI/CD             |

---

## Deployment Environments

```
Development (develop branch)
├─ URL: https://saas-proj-dev.vercel.app
├─ Auto-deploy on push
├─ Database: Supabase Dev tier
└─ PayMongo: Sandbox mode

Staging (staging branch)
├─ URL: https://staging.saas-proj.dev
├─ Manual approval required
├─ Database: Supabase Dev tier (staging copy)
└─ PayMongo: Sandbox mode

Production (main branch)
├─ URL: https://app.saas-proj.dev
├─ Manual approval + health checks
├─ Database: Supabase Production tier (HA)
└─ PayMongo: Live mode
```

---

## Security Features

✓ JWT authentication (1-hour access token, 7-day refresh token)
✓ OAuth (Google, Facebook)
✓ Row-Level Security on all tables
✓ HTTPS/TLS 1.3 everywhere
✓ Payment data never stored (PayMongo handles PCI compliance)
✓ Webhook signature verification (HMAC-SHA256)
✓ Idempotency keys prevent duplicate transactions
✓ Rate limiting (100 requests/min per user)
✓ Input validation (server-side)
✓ Audit logging for compliance
✓ Email verification required
✓ Encrypted sensitive fields (bank details)

---

## Performance Targets

| Metric                   | Target             |
| ------------------------ | ------------------ |
| API Response Time (p99)  | < 500ms            |
| Page Load Time           | < 3s               |
| First Contentful Paint   | < 1.5s             |
| Largest Contentful Paint | < 2.5s             |
| Database Query Time      | < 100ms            |
| Payment Processing       | 99.5% success rate |
| Manifest PDF Generation  | < 2s               |
| Platform Uptime          | 99.5% SLA          |

---

## Scalability Strategy

### Current Capacity

- Concurrent users: 1,000+
- Bookings/second: 50+
- Database connections: 100 (scales to 1,000)
- Storage: Auto-scales (starts at 1 GB)

### Scaling Path

1. **Connections**: Increase via Supabase connection pooling
2. **Throughput**: Enable Supabase Pro plan (more connections)
3. **Replicas**: Add read replicas for reporting queries
4. **Caching**: Implement Redis for frequently accessed data
5. **Global**: Add regions for low-latency access

---

## Cost Breakdown (Monthly)

| Service   | Dev  | Staging | Prod                      |
| --------- | ---- | ------- | ------------------------- |
| Vercel    | Free | $20     | $100                      |
| Supabase  | Free | $25     | $200                      |
| PayMongo  | -    | -       | Variable (2.9% + ₱15/txn) |
| Sentry    | Free | Free    | $29                       |
| Resend    | -    | -       | $20                       |
| **Total** | $0   | ~$70    | ~$370+                    |

---

## Monitoring & Alerts

**Dashboards**:

- Vercel: Performance metrics
- Supabase: Database health
- Sentry: Error tracking
- PayMongo: Payment analytics

**Alerts**:

- Error rate > 1% → Sentry + Slack
- API latency > 1s → Sentry + PagerDuty
- Database connections > 80% → Email alert
- Payment failure rate > 2% → Slack + manual review
- Disk space > 80% → Email alert

---

## File Structure

```
SaaS-Proj/
├── README.md
├── ARCHITECTURE.md                  # THIS FILE
│
├── docs/
│   ├── DATABASE_SCHEMA.md          # PostgreSQL schema & RLS policies
│   ├── API_REFERENCE.md            # Complete API endpoints
│   └── DEPLOYMENT.md               # CI/CD, environments, monitoring
│
├── apps/
│   └── web/                        # Next.js frontend
│       ├── src/
│       │   ├── app/               # App Router pages
│       │   ├── components/        # React components
│       │   ├── lib/               # Utilities, API clients
│       │   ├── hooks/             # Custom hooks
│       │   ├── types/             # TypeScript types
│       │   └── styles/            # Global CSS
│       ├── package.json
│       └── vercel.json            # Vercel config
│
├── packages/
│   ├── db/                         # Database schemas
│   │   ├── migrations/            # SQL migrations
│   │   └── seed/                  # Test data
│   └── types/                      # Shared TypeScript types
│
├── .github/
│   └── workflows/                  # GitHub Actions
│       ├── lint.yml
│       ├── test.yml
│       └── deploy.yml
│
└── package.json                    # Monorepo config
```

---

## Key Decisions & Rationale

| Decision       | Why                              | Tradeoff                    |
| -------------- | -------------------------------- | --------------------------- |
| Next.js        | SSR/SSG for SEO                  | Requires Node.js runtime    |
| Supabase       | Managed DB + Auth + Real-time    | Vendor lock-in              |
| PayMongo       | Best Philippine e-wallet support | Limited to PH market        |
| Vercel         | Zero-config Next.js deployments  | Expensive at scale          |
| Edge Functions | Low latency, serverless          | No long-running tasks       |
| PostgreSQL     | ACID compliance, relational      | Overkill for key-value only |

---

## Getting Started Checklist

- [ ] Clone repository: `git clone https://github.com/saas-proj/app.git`
- [ ] Install dependencies: `npm install`
- [ ] Create Supabase project → Copy credentials
- [ ] Create PayMongo account → Get sandbox keys
- [ ] Set environment variables (`.env.local`)
- [ ] Run migrations: `npm run db:migrate:dev`
- [ ] Seed test data: `npm run db:seed`
- [ ] Start dev server: `npm run dev`
- [ ] Open http://localhost:3000
- [ ] Test hiker signup & booking flow
- [ ] Test organizer signup & expedition creation

---

## Troubleshooting

| Issue                       | Solution                                          |
| --------------------------- | ------------------------------------------------- |
| "Cannot find module"        | Run `npm install`                                 |
| Database connection refused | Check Supabase credentials in `.env.local`        |
| Payment webhook not firing  | Verify PayMongo webhook URL & signature secret    |
| PDF generation fails        | Check pdf-lib is installed: `npm install pdf-lib` |
| Slow API responses          | Check database query times in Supabase console    |
| Vercel deployment fails     | Review build logs, check all env vars set         |

---

## Support & Resources

**Documentation**: [GitHub Wiki](https://github.com/saas-proj/app/wiki)
**Issue Tracker**: [GitHub Issues](https://github.com/saas-proj/app/issues)
**Slack**: #saas-proj (team communication)
**Email**: hello@saas-proj.dev

**External Docs**:

- [Next.js Docs](https://nextjs.org)
- [Supabase Docs](https://supabase.com/docs)
- [PayMongo API](https://developers.paymongo.com)
- [Vercel Docs](https://vercel.com/docs)

---

**Last Updated**: June 2026
**Version**: 1.0.0
**Maintainers**: SaaS-Proj Architecture Team
