# SaaS-Proj: Development Checklist

**Start Date**: June 15, 2026  
**Target MVP Launch**: August 31, 2026 (12 weeks)  
**Developer**: [Your Name]

---

## Phase 1: Environment Setup ⏳

- [ ] **1.1** Install Node.js 18+ (`node --version`)
- [ ] **1.2** Create GitHub SSH keys (`ssh-keygen -t ed25519`)
- [ ] **1.3** Create Supabase account + new project (Singapore region)
- [ ] **1.4** Create PayMongo sandbox account
- [ ] **1.5** Create Vercel account + link GitHub
- [ ] **1.6** Clone repository (`git clone ...`)
- [ ] **1.7** Install dependencies (`npm install`)
- [ ] **1.8** Create `.env.local` with all values
- [ ] **1.9** Test Supabase connection (`node test-supabase.js`)

**⏱️ Timeline**: 1 day | **Status**: Not started

---

## Phase 2: Database Setup 🗄️

### Core Tables

- [ ] **2.1** Create `users` table + RLS policies
- [ ] **2.2** Create `organizer_profiles` table + RLS
- [ ] **2.3** Create `expeditions` table + indexes + RLS
- [ ] **2.4** Create `bookings` table + RLS
- [ ] **2.5** Create `payments` table + unique constraints
- [ ] **2.6** Create `reviews` table
- [ ] **2.7** Create `notifications` table
- [ ] **2.8** Verify all tables in Supabase Table Editor
- [ ] **2.9** Create database triggers (booked_slots auto-increment)
- [ ] **2.10** Test RLS policies with sample inserts

### Validation

- [ ] All 7 tables present
- [ ] All foreign keys configured
- [ ] All indexes created
- [ ] RLS enabled on all tables
- [ ] Soft delete fields present

**⏱️ Timeline**: 1 day | **Status**: Not started

---

## Phase 3: Project Structure 🏗️

- [ ] **3.1** Create folder structure (`src/app`, `src/lib`, etc.)
- [ ] **3.2** Initialize Supabase client (`src/lib/supabase.ts`)
- [ ] **3.3** Create TypeScript types (`src/types/database.ts`)
- [ ] **3.4** Setup Next.js config
- [ ] **3.5** Create Tailwind config (if needed)
- [ ] **3.6** Setup ESLint + Prettier

**⏱️ Timeline**: 1 day | **Status**: Not started

---

## Phase 4: Authentication 🔐

### UI Components

- [ ] **4.1** Create auth layout (`src/app/(auth)/layout.tsx`)
- [ ] **4.2** Create signup page (`src/app/(auth)/signup/page.tsx`)
- [ ] **4.3** Create login page (`src/app/(auth)/login/page.tsx`)
- [ ] **4.4** Create email verification page
- [ ] **4.5** Create password reset flow

### Functionality

- [ ] **4.6** Implement signup (hiker + organizer)
- [ ] **4.7** Auto-create organizer_profile for organizer signups
- [ ] **4.8** Implement login + JWT token handling # done 
- [ ] **4.9** Implement logout
- [ ] **4.10** Implement password reset
- [ ] **4.11** Email verification flow (Resend integration)
- [ ] **4.12** Persist auth state (cookies/session) #done

### Testing

- [ ] **4.13** Test hiker signup → login flow
- [ ] **4.14** Test organizer signup → auto profile creation
- [ ] **4.15** Test email verification
- [ ] **4.16** Test logout + redirect

**⏱️ Timeline**: 3-4 days | **Status**: Not started

---

## Phase 5: Expedition Discovery 📍

### Pages

- [ ] **5.1** Create expedition listing page
- [ ] **5.2** Create expedition detail page
- [ ] **5.3** Create search/filter component (by difficulty, date, price)

### Features

- [ ] **5.4** Fetch published expeditions from database
- [ ] **5.5** Display real-time slot availability
- [ ] **5.6** Show organizer details (ratings, reviews)
- [ ] **5.7** Pagination (20 per page)
- [ ] **5.8** Sorting (by date, popularity, price)

### Testing

- [ ] **5.9** Test listing loads 10+ expeditions
- [ ] **5.10** Test detail page loads correctly
- [ ] **5.11** Test filters work
- [ ] **5.12** Test slot availability updates in real-time

**⏱️ Timeline**: 3-4 days | **Status**: Not started

---

## Phase 6: Booking Flow 🎫

### UI Components

- [ ] **6.1** Create booking form component
- [ ] **6.2** Create participant info form
- [ ] **6.3** Create booking confirmation component

### Functionality

- [ ] **6.4** Validate availability on form submit
- [ ] **6.5** Validate participant data (email, phone, emergency contact)
- [ ] **6.6** Create booking record in database
- [ ] **6.7** Generate idempotency key
- [ ] **6.8** Call PayMongo API to create payment intent
- [ ] **6.9** Redirect to PayMongo checkout page
- [ ] **6.10** Handle payment success/failure redirects

### Testing

- [ ] **6.11** Book 1 expedition successfully
- [ ] **6.12** Test slot count decreases after booking
- [ ] **6.13** Test duplicate bookings prevented
- [ ] **6.14** Test form validation (missing fields)
- [ ] **6.15** Test cancelled bookings free up slots

**⏱️ Timeline**: 4-5 days | **Status**: Not started

---

## Phase 7: Payment Integration 💳

### Setup

- [ ] **7.1** Create PayMongo webhook endpoint (`/api/webhooks/paymongo`)
- [ ] **7.2** Implement webhook signature verification
- [ ] **7.3** Register webhook URL in PayMongo dashboard

### Handlers

- [ ] **7.4** Handle `payment.paid` event
- [ ] **7.5** Update payment status in database
- [ ] **7.6** Update booking to confirmed
- [ ] **7.7** Increment expedition booked_slots
- [ ] **7.8** Create notification email
- [ ] **7.9** Handle `payment.failed` event
- [ ] **7.10** Handle `payment.expired` event

### Testing

- [ ] **7.11** Send PayMongo test webhook successfully
- [ ] **7.12** Verify payment records created
- [ ] **7.13** Verify bookings marked confirmed
- [ ] **7.14** Verify notifications sent
- [ ] **7.15** Test with real PayMongo sandbox transaction

**⏱️ Timeline**: 3-4 days | **Status**: Not started

---

## Phase 8: Organizer Dashboard 📊

### Pages

- [ ] **8.1** Create organizer dashboard layout
- [ ] **8.2** Create expedition management page
- [ ] **8.3** Create create/edit expedition form
- [ ] **8.4** Create bookings list page
- [ ] **8.5** Create manifest PDF preview

### Functionality

- [ ] **8.6** List organizer's expeditions
- [ ] **8.7** Create new expedition
- [ ] **8.8** Edit expedition details
- [ ] **8.9** Publish/unpublish expedition
- [ ] **8.10** View confirmed bookings for expedition
- [ ] **8.11** Generate PDF manifest (pdf-lib)
- [ ] **8.12** Export participant list (CSV)

### Testing

- [ ] **8.13** Create expedition as organizer
- [ ] **8.14** Edit expedition details
- [ ] **8.15** View list of participants
- [ ] **8.16** Generate PDF manifest
- [ ] **8.17** Test unpublishing hides from listings

**⏱️ Timeline**: 5-6 days | **Status**: Not started

---

## Phase 9: Reviews & Ratings ⭐

### Features

- [ ] **9.1** Only allow reviews from confirmed participants
- [ ] **9.2** Create review form
- [ ] **9.3** Calculate organizer average rating
- [ ] **9.4** Display reviews on expedition detail page
- [ ] **9.5** Update organizer average rating on new review

### Testing

- [ ] **9.6** Non-participants cannot review
- [ ] **9.7** Review submission works
- [ ] **9.8** Average rating updates correctly

**⏱️ Timeline**: 2-3 days | **Status**: Not started

---

## Phase 10: Email Notifications 📧

### Setup

- [ ] **10.1** Configure Resend API
- [ ] **10.2** Create email templates

### Triggers

- [ ] **10.3** Booking confirmation email
- [ ] **10.4** Payment receipt email
- [ ] **10.5** Booking cancellation email
- [ ] **10.6** Review request email
- [ ] **10.7** Organizer profile verification email

### Testing

- [ ] **10.8** Send test emails
- [ ] **10.9** Verify email formatting
- [ ] **10.10** Check deliverability

**⏱️ Timeline**: 2-3 days | **Status**: Not started

---

## Phase 11: Testing & QA 🧪

### Unit Tests

- [ ] **11.1** Auth functions
- [ ] **11.2** Booking validation
- [ ] **11.3** Payment calculation
- [ ] **11.4** PDF generation

### Integration Tests

- [ ] **11.5** Full booking flow (signup → pay → confirm)
- [ ] **11.6** Organizer flow (create exp → list bookings)
- [ ] **11.7** Payment webhook flow
- [ ] **11.8** Email notification flow

### E2E Tests

- [ ] **11.9** Playwright test: Hiker journey
- [ ] **11.10** Playwright test: Organizer journey
- [ ] **11.11** Playwright test: Payment flow

### Manual Testing

- [ ] **11.12** Test on mobile browsers
- [ ] **11.13** Test on desktop
- [ ] **11.14** Test error scenarios

**⏱️ Timeline**: 5 days | **Status**: Not started

---

## Phase 12: Deployment & Monitoring 🚀

### Staging

- [ ] **12.1** Deploy to staging environment
- [ ] **12.2** Configure staging database backups
- [ ] **12.3** Setup Sentry error tracking
- [ ] **12.4** Setup Vercel Analytics
- [ ] **12.5** Test all features in staging
- [ ] **12.6** Performance test

### Production

- [ ] **12.7** Setup production database (HA)
- [ ] **12.8** Configure production environment variables
- [ ] **12.9** Setup monitoring alerts
- [ ] **12.10** Deploy to production
- [ ] **12.11** Run smoke tests
- [ ] **12.12** Monitor error logs (first 24h)

### Documentation

- [ ] **12.13** Document deployment process
- [ ] **12.14** Create runbook for common issues
- [ ] **12.15** Document API rate limits
- [ ] **12.16** Document backup/restore procedure

**⏱️ Timeline**: 3-4 days | **Status**: Not started

---

## Phase 13: Post-Launch Improvements 📈

### Performance

- [ ] **13.1** Optimize images (next/image)
- [ ] **13.2** Implement caching strategy
- [ ] **13.3** Database query optimization

### Features (v2)

- [ ] **13.4** SMS notifications
- [ ] **13.5** In-app notifications
- [ ] **13.6** Admin dashboard
- [ ] **13.7** Advanced analytics
- [ ] **13.8** Multi-language support

### Operations

- [ ] **13.9** Setup automated backups
- [ ] **13.10** Create monitoring dashboard
- [ ] **13.11** Setup on-call rotation

**⏱️ Timeline**: Ongoing | **Status**: Backlog

---

## 📊 Summary

| Phase                   | Tasks         | Days            | Status |
| ----------------------- | ------------- | --------------- | ------ |
| 1. Env Setup            | 9             | 1               | ⏳     |
| 2. Database             | 10            | 1               | ⏳     |
| 3. Project Structure    | 6             | 1               | ⏳     |
| 4. Authentication       | 12            | 4               | ⏳     |
| 5. Expedition Discovery | 12            | 4               | ⏳     |
| 6. Booking Flow         | 15            | 5               | ⏳     |
| 7. Payment Integration  | 15            | 4               | ⏳     |
| 8. Organizer Dashboard  | 17            | 6               | ⏳     |
| 9. Reviews & Ratings    | 5             | 3               | ⏳     |
| 10. Email Notifications | 7             | 3               | ⏳     |
| 11. Testing & QA        | 10            | 5               | ⏳     |
| 12. Deployment          | 16            | 4               | ⏳     |
| **TOTAL MVP**           | **142 tasks** | **~8-12 weeks** | ⏳     |

---

## 🎯 Weekly Goal Template

**Week [X] Goals:**

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Completed This Week:**

- [x] Task 1
- [ ] Task 2 (blocked by X)

**Blockers:**

- None yet

**Notes:**

-

---

## 🔗 Resources

- **DEVELOPMENT_START.md**: Step-by-step development guide
- **ARCHITECTURE.md**: System architecture overview
- **API_REFERENCE.md**: API endpoint specifications
- **DATABASE_SCHEMA.md**: Database design
- **DEPLOYMENT.md**: Deployment procedures

---

**Good luck! You've got this! 🚀**
