# SaaS-Proj: Application Architecture

## 1. System Overview

SaaS-Proj is a B2B2C Software-as-a-Service platform designed to modernize the Philippine mountaineering and eco-tourism booking ecosystem. The platform connects hikers (consumers) with tour organizers (businesses) through a centralized marketplace and management dashboard.

### Core Value Proposition

- **For Hikers**: Secure discovery, transparent booking, automated payment verification
- **For Organizers**: Real-time roster management, automated compliance documentation, financial tracking
- **Platform**: Trusted marketplace with verified profiles, escrow payments, and data-driven insights

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Web)                       │
│  Next.js (React) + Tailwind CSS | Vercel Deployment            │
│  - Hiker Discovery Hub (SSR/SSG)                               │
│  - Organizer Dashboard (CSR)                                    │
│  - Authentication Pages (OAuth + Email)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS / WebSocket
┌────────────────────────▼────────────────────────────────────────┐
│                    API LAYER (Edge Functions)                   │
│  Supabase Edge Functions (Deno/TypeScript)                      │
│  - Authentication & Authorization (JWT)                        │
│  - Payment Webhook Handler (PayMongo)                          │
│  - Business Logic Orchestration                                │
└────────────────────────┬────────────────────────────────────────┘
                         │ SQL / Real-time Events
┌────────────────────────▼────────────────────────────────────────┐
│                   DATA LAYER (Supabase)                         │
│  PostgreSQL Database + Real-time Subscriptions                  │
│  - User & Auth Management                                      │
│  - Expedition Catalog & Inventory                              │
│  - Booking & Transaction Records                               │
│  - Reviews & Trust Metadata                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                          │
│  ├─ PayMongo (Payment Processing)                              │
│  ├─ PDF Generation (pdf-lib)                                   │
│  └─ Email Service (Resend / SendGrid)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. System Components & Responsibilities

### 3.1 Frontend Application (Next.js + React)

**Purpose**: User-facing interfaces for hikers and organizers

**Key Modules**:

- **Public Discovery Hub** (`pages/climbs/[...slug]`)
  - Search, filter, sort expeditions
  - View organizer profiles & reviews
  - Read-only itinerary details
- **Authentication** (`pages/auth/`)
  - Email/password signup (hikers & organizers)
  - OAuth integration (Google, Facebook)
  - Email verification & password reset

- **Hiker Portal** (`pages/hiker/`)
  - Booking history & upcoming expeditions
  - Payment status tracking
  - Manifest downloads
  - Review submission

- **Organizer Dashboard** (`pages/organizer/`)
  - Expedition creation & editing
  - Real-time slot availability & booking status
  - Payment reconciliation
  - Participant roster & manifest export
  - Basic analytics (popular destinations, conversion rates)
  - Payout management

**Deployment**: Vercel (automatic Git-based deployments)

---

### 3.2 API Layer (Supabase Edge Functions)

**Purpose**: Secure business logic, event handling, external integrations

**Key Functions**:

#### Authentication & Authorization

- `auth/signup` - User registration with role assignment
- `auth/login` - JWT token generation
- `auth/refresh` - Token refresh mechanism
- `auth/verify-email` - Email verification logic

#### Payment Processing

- `payments/webhook-handler` - PayMongo webhook receiver
  - Payment success/failure handling
  - Booking status updates
  - Notification triggers
  - Idempotency for duplicate events
- `payments/initiate-payment` - Create PayMongo payment intent
- `payments/refund-request` - Handle cancellations & refunds

#### Expedition Management

- `expeditions/create` - Organizer creates new expedition
- `expeditions/update` - Modify expedition details
- `expeditions/publish` - Make expedition discoverable
- `expeditions/archive` - Soft delete completed expeditions

#### Booking Management

- `bookings/create` - Create booking (before payment)
- `bookings/confirm-payment` - Mark booking as paid
- `bookings/cancel` - Cancel booking + refund logic
- `bookings/list` - Retrieve user's bookings (role-aware)

#### Document Generation

- `documents/generate-manifest` - Create PDF hiker manifest
- `documents/export-roster` - Export roster as CSV

#### Reviews & Trust

- `reviews/submit` - Post review after expedition completion
- `reviews/report-organizer` - Flag suspicious activity

#### Notifications

- `notifications/send-email` - Email alerts (booking confirmation, reminders)
- `notifications/send-sms` - SMS reminders (future enhancement)

---

### 3.3 Data Layer (PostgreSQL + Supabase)

**Purpose**: Persistent storage, real-time subscriptions, access control

**Core Tables**:

#### Users & Authentication

```sql
users
├── id (UUID, PK)
├── email (UNIQUE)
├── password_hash
├── first_name
├── last_name
├── profile_picture_url
├── phone_number
├── role (ENUM: 'hiker', 'organizer', 'admin')
├── verified (BOOLEAN)
├── created_at
└── updated_at
```

#### Organizer Profiles

```sql
organizer_profiles
├── id (UUID, PK)
├── user_id (FK → users)
├── company_name
├── company_registration_number
├── verification_status (ENUM: 'pending', 'verified', 'rejected')
├── verification_date
├── average_rating
├── total_reviews
├── total_expeditions_completed
├── bio
├── bank_account_details (JSON: encrypted)
└── updated_at
```

#### Expeditions (Offerings)

```sql
expeditions
├── id (UUID, PK)
├── organizer_id (FK → organizer_profiles)
├── mountain_name
├── difficulty_level (ENUM: 'beginner', 'intermediate', 'advanced')
├── start_date
├── end_date
├── total_van_slots
├── price_per_person
├── itinerary (TEXT: detailed day-by-day plan)
├── included_amenities (JSONB)
├── excluded_items (JSONB)
├── gear_requirements (JSONB)
├── published_status (BOOLEAN)
├── cancellation_policy (TEXT)
├── created_at
└── updated_at
```

#### Inventory (Real-time Slots)

```sql
expedition_inventory
├── id (UUID, PK)
├── expedition_id (FK → expeditions)
├── total_slots
├── booked_slots (updated via trigger)
├── available_slots (GENERATED: total_slots - booked_slots)
├── last_updated
```

#### Bookings

```sql
bookings
├── id (UUID, PK)
├── hiker_id (FK → users)
├── expedition_id (FK → expeditions)
├── booking_status (ENUM: 'pending', 'confirmed', 'cancelled')
├── payment_status (ENUM: 'pending', 'completed', 'failed', 'refunded')
├── price_paid
├── payment_method (ENUM: 'gcash', 'maya', 'instapay')
├── paymongo_payment_id (FK)
├── booking_date
├── cancellation_date
└── updated_at
```

#### Payments

```sql
payments
├── id (UUID, PK)
├── booking_id (FK → bookings)
├── paymongo_payment_id (UNIQUE)
├── amount
├── currency (DEFAULT: 'PHP')
├── payment_status (ENUM: 'pending', 'succeeded', 'failed')
├── payment_method_type
├── webhook_received_at
├── idempotency_key (UNIQUE)
└── created_at
```

#### Participants (Manifest)

```sql
expedition_participants
├── id (UUID, PK)
├── booking_id (FK → bookings)
├── expedition_id (FK → expeditions)
├── full_name
├── emergency_contact_name
├── emergency_contact_number
├── date_of_birth
├── medical_conditions
├── created_at
```

#### Reviews & Ratings

```sql
reviews
├── id (UUID, PK)
├── hiker_id (FK → users)
├── organizer_id (FK → organizer_profiles)
├── expedition_id (FK → expeditions)
├── rating (1-5)
├── review_text
├── verified_participant (BOOLEAN)
├── created_at
└── updated_at
```

**Row-Level Security (RLS) Policies**:

- Hikers: See only their own bookings, can view published expeditions
- Organizers: See only their own expeditions & participant rosters
- Admin: Full read/write access

---

## 4. Data Flow Diagrams

### 4.1 Hiker Booking Flow

```
Hiker Search → Display Expeditions → Select Expedition → Review Details
    ↓
Create Booking (Status: pending) → Redirect to Payment
    ↓
PayMongo Payment Gateway → Payment Confirmation
    ↓
Webhook: Payment Success → Update Booking Status (confirmed)
    ↓
Send Confirmation Email → Update Inventory (--available_slots)
    ↓
Hiker receives Receipt & Manifest Link
```

### 4.2 Organizer Expedition & Roster Management

```
Organizer Creates Expedition → Save to DB (published_status: false)
    ↓
Add Expedition Details (itinerary, price, slots) → Publish (true)
    ↓
Real-time Slot Tracking (via subscription)
    ↓
As Hikers Book → Inventory updates, Organizer sees confirmed bookings
    ↓
Days Before Climb → Generate Manifest PDF → Share with Organizer
    ↓
Manifest Ready for LGU Submission
```

### 4.3 Payment Processing (Webhook Integrity)

```
PayMongo sends webhook event
    ↓
Supabase Edge Function receives webhook
    ↓
Verify PayMongo signature (security check)
    ↓
Check idempotency_key (prevent duplicates)
    ↓
Update payment record & booking status
    ↓
Trigger downstream notifications & inventory updates
    ↓
Return 200 OK to PayMongo (webhook acknowledged)
```

---

## 5. API Endpoint Design

### 5.1 Authentication Endpoints

```
POST   /api/auth/signup
       Body: { email, password, firstName, lastName, role }
       Returns: { userId, token, expiresIn }

POST   /api/auth/login
       Body: { email, password }
       Returns: { token, expiresIn, user }

POST   /api/auth/logout
       Returns: { success: true }

POST   /api/auth/refresh
       Body: { refreshToken }
       Returns: { token, expiresIn }

POST   /api/auth/verify-email
       Body: { email, verificationCode }
       Returns: { verified: true }
```

### 5.2 Expedition Endpoints (Public)

```
GET    /api/expeditions
       Query: { search, difficulty, startDate, endDate, mountain }
       Returns: { expeditions: [...], total, page, pageSize }

GET    /api/expeditions/:id
       Returns: { expedition, organizer, reviews, availableSlots }

GET    /api/expeditions/:id/reviews
       Returns: { reviews: [...], averageRating, totalCount }
```

### 5.3 Expedition Endpoints (Organizer)

```
POST   /api/organizer/expeditions
       Body: { mountainName, difficulty, startDate, endDate, ... }
       Returns: { expeditionId, ... }

PATCH  /api/organizer/expeditions/:id
       Body: { mountainName, price, totalSlots, ... }
       Returns: { updatedExpedition }

DELETE /api/organizer/expeditions/:id
       Returns: { success: true }

GET    /api/organizer/expeditions/:id/bookings
       Returns: { bookings: [...], confirmedCount, pendingPayment }

GET    /api/organizer/expeditions/:id/manifest
       Returns: { participants, manifestUrl }

POST   /api/organizer/expeditions/:id/export-manifest
       Returns: { downloadUrl, expiresIn }
```

### 5.4 Booking Endpoints

```
POST   /api/bookings
       Body: { expeditionId, numberOfPeople }
       Returns: { bookingId, paymentIntentUrl }

GET    /api/bookings/:id
       Returns: { booking, expedition, paymentStatus }

GET    /api/hiker/bookings
       Query: { status, upcoming, past }
       Returns: { bookings: [...] }

POST   /api/bookings/:id/cancel
       Body: { reason }
       Returns: { cancellationId, refundAmount, processingTime }

GET    /api/bookings/:id/manifest
       Returns: { manifestUrl }
```

### 5.5 Payment Endpoints

```
POST   /api/payments/webhook
       Body: { event, data } (from PayMongo)
       Returns: { acknowledged: true }

POST   /api/payments/:bookingId/initiate
       Body: { amount, paymentMethod }
       Returns: { paymentIntentId, paymentUrl, expiresIn }

GET    /api/payments/:id/status
       Returns: { status, amount, method, timestamp }
```

### 5.6 User Profile Endpoints

```
GET    /api/profile
       Returns: { user, role, profileData }

PATCH  /api/profile
       Body: { firstName, lastName, phoneNumber, ... }
       Returns: { updatedUser }

GET    /api/organizer/profile
       Returns: { organizerProfile, verificationStatus, metrics }

PATCH  /api/organizer/profile
       Body: { companyName, bio, bankDetails, ... }
       Returns: { updatedProfile }
```

---

## 6. Security Architecture

### 6.1 Authentication & Authorization

- **Auth Method**: Supabase Auth (JWT-based)
- **Token Expiry**: 1 hour (access), 7 days (refresh)
- **OAuth**: Google, Facebook integrations
- **MFA**: Email verification required for signup

### 6.2 Data Protection

- **Database Encryption**: Supabase handles at-rest encryption
- **Sensitive Fields**: Bank details, payment info encrypted with field-level encryption
- **PII Protection**: Email, phone only accessible to authorized users

### 6.3 Payment Security

- **PCI Compliance**: All payments handled by PayMongo (no card data stored)
- **Webhook Verification**: HMAC-SHA256 signature validation on PayMongo events
- **Idempotency**: Prevent duplicate webhook processing with unique keys
- **Encryption**: All sensitive communication over HTTPS/TLS 1.3+

### 6.4 API Security

- **Rate Limiting**: 100 requests/minute per user (per Edge Function)
- **Input Validation**: Server-side validation on all endpoints
- **CORS**: Restricted to verified domain (Vercel deployment)
- **CSRF Protection**: SameSite cookies + token validation

---

## 7. Database Design Patterns

### 7.1 Materialized Views (Performance Optimization)

```sql
-- Real-time expedition metrics
CREATE MATERIALIZED VIEW expedition_metrics AS
SELECT
  e.id,
  COUNT(b.id) as total_bookings,
  COUNT(CASE WHEN b.payment_status = 'completed' THEN 1 END) as confirmed_bookings,
  AVG(r.rating) as average_rating,
  COUNT(DISTINCT r.id) as review_count
FROM expeditions e
LEFT JOIN bookings b ON e.id = b.expedition_id
LEFT JOIN reviews r ON e.id = r.expedition_id
GROUP BY e.id;

-- Refresh strategy: Trigger on booking/review changes
```

### 7.2 Audit Logging

```sql
-- Track all changes for compliance
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  table_name TEXT,
  operation (INSERT | UPDATE | DELETE),
  record_id UUID,
  changed_by UUID FK → users,
  changes JSONB,
  created_at TIMESTAMP
);
```

### 7.3 Soft Deletes & Archive

```sql
-- Expeditions are soft-deleted, not hard-deleted
ALTER TABLE expeditions ADD COLUMN deleted_at TIMESTAMP;
-- RLS policy: WHERE deleted_at IS NULL
```

---

## 8. Technology Stack Integration

### 8.1 Frontend Stack

| Component     | Technology             | Purpose                               |
| ------------- | ---------------------- | ------------------------------------- |
| Framework     | Next.js 14             | SSR/SSG for SEO, optimal performance  |
| UI Library    | React 18               | Component-based UI                    |
| Styling       | Tailwind CSS           | Utility-first CSS for rapid iteration |
| State Mgmt    | SWR + Context API      | Lightweight data fetching & caching   |
| Forms         | React Hook Form        | Performant form handling              |
| Date Handling | date-fns               | Lightweight date utilities            |
| PDF Download  | html2pdf               | Client-side PDF generation            |
| HTTP Client   | Fetch API + Node-fetch | Lightweight, no external deps         |
| Analytics     | Vercel Web Analytics   | Built-in performance insights         |

### 8.2 Backend Stack

| Component | Technology                     | Purpose                                  |
| --------- | ------------------------------ | ---------------------------------------- |
| Runtime   | Supabase Edge Functions (Deno) | Serverless, low latency                  |
| Database  | PostgreSQL 15                  | ACID compliance, relational integrity    |
| Auth      | Supabase Auth                  | JWT management, OAuth providers          |
| Real-time | Supabase Realtime              | WebSocket subscriptions for live updates |
| Storage   | Supabase Storage               | PDF manifests, profile pictures          |
| Payments  | PayMongo                       | Philippine e-wallet integration          |
| PDF Gen   | pdf-lib                        | Lightweight PDF manipulation             |
| Email     | Resend                         | Transactional emails                     |

### 8.3 Deployment Stack

| Component | Service                         | Purpose                             |
| --------- | ------------------------------- | ----------------------------------- |
| Frontend  | Vercel                          | Zero-config Next.js deployments     |
| Backend   | Supabase (Region: Asia-Pacific) | Managed PostgreSQL + Edge Functions |
| Database  | Supabase PostgreSQL             | HA setup with automated backups     |
| Storage   | Supabase Storage (CDN-backed)   | Global distribution for manifests   |
| DNS       | Vercel / CloudFlare             | DDoS protection, DNS failover       |

---

## 9. Scalability Considerations

### 9.1 Database Optimization

- **Indexing**: Composite indexes on frequently queried columns
  ```sql
  CREATE INDEX idx_expeditions_mountain_date ON expeditions(mountain_name, start_date);
  CREATE INDEX idx_bookings_expedition_status ON bookings(expedition_id, payment_status);
  ```
- **Connection Pooling**: Supabase handles connection pooling
- **Caching**: Redis cache layer for expedition searches (future enhancement)

### 9.2 API Scaling

- **Edge Functions**: Auto-scale with traffic
- **Caching Headers**: HTTP caching on GET endpoints
- **CDN**: Vercel CDN for static assets & Next.js pages

### 9.3 Load Testing Targets

- Support 1,000 concurrent users browsing expeditions
- Handle 50 bookings/second during peak mountain season
- Manifest generation < 2 seconds for 200-person rosters

---

## 10. Monitoring & Observability

### 10.1 Key Metrics

- **API Response Time**: Target < 500ms (p99)
- **Payment Processing**: 99.9% success rate
- **Database Query Performance**: < 100ms for common queries
- **Uptime**: 99.9% SLA

### 10.2 Observability Stack

- **Logs**: Supabase logs + Vercel log streaming
- **Errors**: Sentry integration for exception tracking
- **Performance**: Vercel Web Analytics + custom metrics
- **Alerts**: PagerDuty for critical incidents

---

## 11. Deployment Architecture

### 11.1 Environments

```
Development (vercel.dev)
├── Frontend: Auto-deploy on GitHub push to 'develop'
├── Database: Supabase staging DB
└── Payments: PayMongo sandbox mode

Staging (staging.saas-proj.dev)
├── Frontend: Manual approval from 'staging' branch
├── Database: Supabase staging DB replica
└── Payments: PayMongo sandbox mode

Production (app.saas-proj.dev)
├── Frontend: Manual approval from 'main' branch
├── Database: Supabase production DB (HA + backups)
└── Payments: PayMongo production mode
```

### 11.2 CI/CD Pipeline (GitHub Actions)

```yaml
Trigger: Push to GitHub
  ├─ Lint & Format Check
  ├─ Unit Tests (Jest)
  ├─ Integration Tests (Supertest + Docker)
  ├─ E2E Tests (Playwright) on staging
  └─ Deploy to Vercel
```

---

## 12. Future Enhancements & Extensibility

### 12.1 Phase 2 Features

- **SMS Notifications**: Reminder SMSes via Twilio
- **Multi-language Support**: Support for Tagalog, Ilocano
- **Analytics Dashboard**: Time-series metrics for organizers
- **Referral System**: Incentivize hiker referrals
- **Insurance Integration**: Partner with local insurers

### 12.2 Modular Architecture for Expansion

The platform is designed to support additional eco-tourism verticals:

- **Surfing Packages**: Reuse expedition model + booking logic
- **Island Hopping**: Day-trip variant of the expedition model
- **Freediving Courses**: Certification + booking workflow

**Extensibility Strategy**:

- Activity types: Configurable enum (mountaineering, surfing, diving, etc.)
- Permit templates: LGU-specific manifest generators
- Pricing models: Support dynamic, group-rate, seasonal pricing

---

## 13. Project Structure (Suggested)

```
SaaS-Proj/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages
│   │   │   ├── components/           # React components
│   │   │   ├── lib/                  # Utilities & helpers
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── types/                # TypeScript types
│   │   │   └── styles/               # Global styles
│   │   └── package.json
│   └── api/                          # Supabase Edge Functions (future)
│
├── packages/
│   ├── db/                           # Supabase schema & migrations
│   │   ├── migrations/
│   │   ├── seed/
│   │   └── schema.sql
│   ├── types/                        # Shared TypeScript types
│   │   ├── models/
│   │   └── api.ts
│   └── config/                       # Shared configuration
│
├── docs/
│   ├── ARCHITECTURE.md               # This file
│   ├── API.md                        # API documentation
│   ├── DATABASE.md                   # Schema details
│   └── DEPLOYMENT.md                 # Deployment guide
│
├── .github/
│   └── workflows/                    # CI/CD pipelines
│
└── package.json                      # Monorepo root
```

---

## 14. Success Metrics (MVP Launch)

- **User Acquisition**: 500 hikers, 50 organizers in first quarter
- **Booking Volume**: 100 expeditions booked monthly
- **Platform Reliability**: 99.5% uptime
- **User Satisfaction**: NPS score > 40
- **Payment Success Rate**: > 98%

---

**Last Updated**: June 2026
**Architecture Owner**: SaaS-Proj Team
**Version**: 1.0
