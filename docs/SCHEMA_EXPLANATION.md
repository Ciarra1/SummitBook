# SaaS-Proj: Database Schema Explained (SIMPLIFIED)

## How to Use the dbdiagram.io Schema

1. Go to **https://dbdiagram.io/d**
2. Click **"Create New Diagram"**
3. Copy the entire content from [DBDIAGRAM_SCHEMA.dbml](DBDIAGRAM_SCHEMA.dbml)
4. Paste it into the editor
5. Click **"Draw"** to visualize

You'll see a complete ER diagram with all tables, relationships, and cardinality!

---

## Schema Overview

The database is organized into **5 logical groups** with **8 core tables**:

```
┌─────────────────────────────────────────────────────────┐
│                  AUTHENTICATION LAYER                    │
│              (users, organizer_profiles)                │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   BUSINESS   │ │ TRANSACTIONS │ │   SOCIAL     │
│ (expeditions)│ │ (bookings,   │ │  (reviews)   │
│              │ │  payments)   │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
                       │
                       ▼
              ┌──────────────┐
              │  OPERATIONS  │
              │(notifications)
              └──────────────┘
```

---

## Table Groups & Explanations

### 1️⃣ AUTHENTICATION LAYER

#### `users` (Core identity)

**Purpose**: Every person on the platform (hikers, organizers, admins)

**Key Columns**:

- `role`: Determines what they can do (`'hiker'`, `'organizer'`, `'admin'`)
- `email_verified`: Only verified users can book
- `last_login_at`: Track engagement

**Example Row** (Hiker):

```json
{
  "id": "user_1",
  "email": "john@example.com",
  "first_name": "John",
  "role": "hiker",
  "email_verified": true
}
```

---

#### `organizer_profiles` (Business metadata - SIMPLIFIED)

**Purpose**: Extended profile for organizers only

**Key Columns**:

- `verification_status`: `'pending'` → `'verified'`
- `average_rating`: Aggregated from reviews
- `bank_account_details`: Encrypted for payouts

**What we removed** (for simplicity):

- ❌ company_website, company_logo_url
- ❌ verification_documents, verification_date
- ❌ total_expeditions_completed, total_revenue (can calculate)
- ❌ service_area, preferred_contact_method
- ❌ payout_frequency

**Example Row**:

```json
{
  "id": "org_1",
  "user_id": "user_2",
  "company_name": "Mountain Guides PH",
  "verification_status": "verified",
  "average_rating": 4.8,
  "total_reviews": 42
}
```

---

### 2️⃣ BUSINESS LAYER

#### `expeditions` (The offerings - SIMPLIFIED)

**Purpose**: Each scheduled climbing expedition

**Key Columns**:

- `start_date`, `end_date`: When the climb happens
- `difficulty_level`: `'beginner'`, `'intermediate'`, `'advanced'`
- `price_per_person`: Core pricing
- `booked_slots`: Real-time availability (merged from inventory table)
- `itinerary`: Text (not JSON) for simplicity
- `is_published`: Only published expeditions show in search

**What we removed** (for simplicity):

- ❌ Separate `expedition_inventory` table (merged into here)
- ❌ mountain_region, elevation_meters
- ❌ early_bird_discount, early_bird_cutoff_date
- ❌ thumbnail_image_url, gallery_images (add to app later)
- ❌ fitness_level_required, min_participants, max_participants
- ❌ permit_requirements, special_notes, excluded_items

**What we kept** (essential):

- ✅ mountain_name, difficulty_level, dates
- ✅ price_per_person, total_van_slots, booked_slots (for real-time availability)
- ✅ title, description, itinerary
- ✅ is_published, is_cancelled
- ✅ location (latitude, longitude)

**Example Row**:

```json
{
  "id": "exp_1",
  "organizer_id": "org_1",
  "mountain_name": "Mount Pinatubo",
  "difficulty_level": "intermediate",
  "start_date": "2026-07-15",
  "end_date": "2026-07-17",
  "total_van_slots": 20,
  "booked_slots": 12,
  "price_per_person": 3500,
  "title": "Crater Lake Trek",
  "is_published": true,
  "itinerary": "Day 1: Registration and equipment briefing\\nDay 2: Hike to Crater Lake"
}
```

**Relationship**: `Many expeditions : 1 organizer_profile`

---

### 3️⃣ TRANSACTIONS LAYER

#### `bookings` (Hiker reservations - MERGED)

**Purpose**: One hiker → one expedition reservation (now includes participant info)

**Key Columns**:

- `booking_status`: `'pending'` → `'confirmed'` or `'cancelled'`
- `payment_status`: `'pending'` → `'completed'` or `'failed'`
- `final_price`: Final amount charged
- `paymongo_payment_id`: Links to payment record

**Participant Info** (merged from expedition_participants):

- `participant_name`, `participant_email`, `participant_phone`
- `emergency_contact_name`, `emergency_contact_phone`
- `medical_conditions`: Brief notes

**What we removed** (for simplicity):

- ❌ Separate `expedition_participants` table (merged here)
- ❌ base_price, discount_amount (just keep final_price)
- ❌ date_of_birth, gender, blood_type, id_type, id_number
- ❌ has_travel_insurance, medications, allergies
- ❌ cancellation_reason, refund_amount, cancellation_approved_at

**Example Row**:

```json
{
  "id": "booking_1",
  "hiker_id": "user_1",
  "expedition_id": "exp_1",
  "booking_status": "confirmed",
  "payment_status": "completed",
  "final_price": 3500,
  "participant_name": "John Doe",
  "participant_phone": "09171234567",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "09179876543",
  "medical_conditions": "None",
  "paymongo_payment_id": "pay_1"
}
```

---

#### `payments` (Immutable transaction log)

**Purpose**: Record of every payment (for auditing & webhooks)

**Key Columns**:

- `paymongo_payment_id`: From PayMongo webhook
- `idempotency_key`: Prevents duplicate processing
- `payment_status`: `'pending'` → `'succeeded'` or `'failed'`

**Example Row**:

```json
{
  "id": "pay_1",
  "booking_id": "booking_1",
  "paymongo_payment_id": "pay_xxx789",
  "amount": 350000,
  "payment_status": "succeeded",
  "payment_method_type": "gcash",
  "idempotency_key": "idempotency_abc123"
}
```

**Relationship**: `Many payments : 1 booking`

---

### 4️⃣ SOCIAL LAYER

#### `reviews` (Ratings & testimonials - SIMPLIFIED)

**Purpose**: Hikers rate organizers after expedition

**Key Columns**:

- `rating`: Overall 1-5 score
- `verified_participant`: Only hikers who actually booked can review
- `is_approved`: Moderation flag

**What we removed** (for simplicity):

- ❌ rating_organization, rating_guide_quality, rating_accommodations (subcategory ratings)
- ❌ review_title (just text)
- ❌ moderation_notes, reported_as_abuse

**Example Row**:

```json
{
  "id": "review_1",
  "expedition_id": "exp_1",
  "hiker_id": "user_1",
  "organizer_id": "org_1",
  "rating": 5,
  "review_text": "Amazing experience! Professional guides, great itinerary",
  "verified_participant": true,
  "is_approved": true
}
```

---

### 5️⃣ OPERATIONS LAYER

#### `notifications` (Communication log - SIMPLIFIED)

**Purpose**: Track notifications sent to users

**Key Columns**:

- `notification_type`: `'booking_confirmation'`, `'payment_receipt'`, etc.
- `status`: `'pending'`, `'sent'`, `'failed'`

**What we removed** (for simplicity):

- ❌ Separate channels (email, sms, in_app) - just email for MVP
- ❌ is_read, read_at (in-app notifications come later)
- ❌ failure_reason

**Example Row**:

```json
{
  "id": "notif_1",
  "recipient_id": "user_1",
  "notification_type": "booking_confirmation",
  "title": "Booking Confirmed!",
  "message": "Your spot on Mount Pinatubo is confirmed...",
  "status": "sent"
}
```

**What we removed entirely**:

- ❌ `audit_log` table (can add compliance logging later if needed)

---

## Relationships Explained

### One-to-Many (1:N)

```
1 organizer_profile → Many expeditions
1 expedition → Many bookings
1 user → Many bookings
1 user → Many reviews
1 expedition → Many reviews
```

### One-to-One (1:1)

```
1 user ↔ 1 organizer_profile
```

### Many-to-One (N:1)

```
Many bookings → 1 user (hiker_id)
Many bookings → 1 expedition
Many payments → 1 booking
```

---

## Key Simplifications Made

| Removed                         | Why                                                          | Impact                                   |
| ------------------------------- | ------------------------------------------------------------ | ---------------------------------------- |
| `expedition_inventory` table    | Denormalized into `expeditions.booked_slots`                 | Simpler queries, one update point        |
| `expedition_participants` table | Merged into `bookings` (one participant per booking for MVP) | Fewer joins, simpler manifest generation |
| `audit_log` table               | Not essential for MVP, can add later                         | Reduced schema complexity                |
| Subcategory ratings             | Removed rating_organization, rating_guide_quality            | Simpler review system                    |
| Multi-channel notifications     | Only email for MVP                                           | Add SMS/in-app later                     |
| Extra organizer fields          | Removed: website, logo, documents, payout_frequency          | Reduced data bloat                       |
| Image URLs                      | Removed: thumbnail, gallery_images                           | Add media layer separately               |
| Complex JSONB fields            | itinerary as TEXT, not JSONB                                 | Easier to query initially                |

---

## Common Data Flows

### 1. Hiker Books & Pays

```
POST /bookings
  ├─ Insert into bookings (status: pending)
  ├─ Create PayMongo payment intent
  ├─ Hiker redirected to PayMongo
  └─ PayMongo webhook calls /payments/webhook
     ├─ Insert into payments
     ├─ Update bookings (status: confirmed)
     ├─ Update expeditions (booked_slots++)
     └─ Insert notification (email sent)
```

### 2. Organizer Creates Expedition

```
POST /organizer/expeditions
  ├─ Insert into expeditions (is_published: false)
  └─ Organizer can edit before publishing
     POST /organizer/expeditions/:id/publish
     └─ Update expeditions (is_published: true)
```

### 3. Hiker Cancels Booking

```
POST /bookings/:id/cancel
  ├─ Update bookings (booking_status: cancelled)
  ├─ Update payments (payment_status: refunded)
  ├─ Update expeditions (booked_slots--)
  └─ Insert notification (refund email)
```

---

## Migration Order

1. ✅ `users`
2. ✅ `organizer_profiles`
3. ✅ `expeditions`
4. ✅ `bookings`
5. ✅ `payments`
6. ✅ `reviews`
7. ✅ `notifications`

All done in ~30 minutes!

---

## File Size Comparison

| Schema Version | Tables | Fields | Complexity |
| -------------- | ------ | ------ | ---------- |
| Original       | 11     | 200+   | High       |
| Simplified     | 8      | 100+   | **Medium** |
| Reduction      | -27%   | -50%   | ✅         |

---

**Last Updated**: June 2026
**Version**: 1.0 (SIMPLIFIED)
**Difficulty**: ⭐⭐ (Beginner-friendly)

```
┌─────────────────────────────────────────────────────────┐
│                  AUTHENTICATION LAYER                    │
│              (users, organizer_profiles)                │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   BUSINESS   │ │ TRANSACTIONS │ │   SOCIAL     │
│  (expeditions)│ │ (bookings,   │ │  (reviews)   │
│              │ │  payments)   │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
        │              │
        └──────────────┼──────────────┐
                       │              │
                       ▼              ▼
              ┌──────────────┐ ┌──────────────┐
              │  OPERATIONS  │ │   MANIFEST   │
              │(notifications)│ │ (participants)
              └──────────────┘ └──────────────┘
```

---

## Table Groups & Explanations

### 1️⃣ AUTHENTICATION LAYER

#### `users` (Core identity)

**Purpose**: Every person on the platform (hikers, organizers, admins)

**Key Columns**:

- `role`: Determines what they can do (`'hiker'`, `'organizer'`, `'admin'`)
- `email_verified`: Only verified users can book
- `last_login_at`: Track user engagement

**Why separate from organizers?**

- One user can be both a hiker AND an organizer
- Simpler to have single auth table

**Example Row** (Hiker):

```json
{
  "id": "user_1",
  "email": "john@example.com",
  "first_name": "John",
  "role": "hiker",
  "email_verified": true
}
```

---

#### `organizer_profiles` (Business metadata)

**Purpose**: Extended profile for organizers only

**Key Columns**:

- `verification_status`: `'pending'` → `'verified'` (trust system)
- `average_rating`: Aggregated from reviews
- `bank_account_details`: Encrypted (for payouts)

**Relationship**: `1 organizer_profile : 1 user` (unique foreign key)

**Example Row**:

```json
{
  "id": "org_1",
  "user_id": "user_2",
  "company_name": "Mountain Guides PH",
  "verification_status": "verified",
  "average_rating": 4.8,
  "total_revenue": 150000
}
```

---

### 2️⃣ BUSINESS LAYER

#### `expeditions` (The offerings)

**Purpose**: Each scheduled climbing expedition

**Key Columns**:

- `start_date`, `end_date`: When the climb happens
- `difficulty_level`: Helps hikers search
- `price_per_person`: Core pricing
- `itinerary`: JSONB array (day-by-day activities)
- `is_published`: Only published expeditions show in search

**Relationship**: `Many expeditions : 1 organizer_profile`

- An organizer can list many climbs
- Each climb belongs to exactly one organizer

**Example Row**:

```json
{
  "id": "exp_1",
  "organizer_id": "org_1",
  "mountain_name": "Mount Pinatubo",
  "difficulty_level": "intermediate",
  "start_date": "2026-07-15",
  "end_date": "2026-07-17",
  "price_per_person": 3500,
  "total_van_slots": 20,
  "is_published": true,
  "itinerary": [
    {
      "day": 1,
      "activities": ["Registration", "Equipment briefing"],
      "meals": ["Dinner"]
    }
  ]
}
```

---

#### `expedition_inventory` (Real-time slots)

**Purpose**: Track available van slots in real-time

**Key Columns**:

- `total_slots`: Hard limit (e.g., 20 people per van)
- `booked_slots`: Updated via trigger when booking is confirmed
- `available_slots`: Auto-calculated (`total_slots - booked_slots`)

**Why separate table?**

- Fast inventory queries (1 row per expedition)
- Avoids expensive re-calculations
- Trigger automatically updates on booking changes

**Relationship**: `1 expedition_inventory : 1 expedition` (unique)

- One inventory record per expedition

**Example Row**:

```json
{
  "id": "inv_1",
  "expedition_id": "exp_1",
  "total_slots": 20,
  "booked_slots": 12,
  "available_slots": 8 // Auto-generated
}
```

**Trigger Logic** (Pseudo-code):

```sql
WHEN booking is CONFIRMED:
  UPDATE expedition_inventory SET booked_slots = booked_slots + 1
WHEN booking is REFUNDED:
  UPDATE expedition_inventory SET booked_slots = booked_slots - 1
```

---

### 3️⃣ TRANSACTIONS LAYER

#### `bookings` (Hiker reservations)

**Purpose**: One hiker → one expedition reservation

**Key Columns**:

- `booking_status`: `'pending'` → `'confirmed'` or `'cancelled'`
- `payment_status`: `'pending'` → `'completed'` or `'failed'`
- `base_price`, `discount_amount`, `final_price`: Pricing breakdown
- `paymongo_payment_id`: Links to payment record

**Relationship**: `Many bookings : 1 hiker` + `Many bookings : 1 expedition`

- Hikers can book many expeditions
- Expeditions have many bookings

**State Machine** (Example timeline):

```
1. Hiker creates booking → booking_status: pending, payment_status: pending
2. Hiker clicks "Pay" → Redirected to PayMongo
3. PayMongo webhook received → payment_status: completed
4. Payment confirmed → booking_status: confirmed
5. (Later) Hiker cancels → booking_status: cancelled, payment_status: refunded
```

**Example Row**:

```json
{
  "id": "booking_1",
  "hiker_id": "user_1",
  "expedition_id": "exp_1",
  "booking_status": "confirmed",
  "payment_status": "completed",
  "base_price": 3500,
  "discount_amount": 0,
  "final_price": 3500,
  "paymongo_payment_id": "pay_1"
}
```

---

#### `payments` (Immutable transaction log)

**Purpose**: Record of every payment attempt (for auditing)

**Key Columns**:

- `paymongo_payment_id`: From PayMongo webhook
- `idempotency_key`: Prevents duplicate processing (webhook safety)
- `payment_status`: `'pending'` → `'succeeded'` or `'failed'`
- `webhook_received_at`: Timestamp payment confirmed

**Why immutable?**

- Never update payment records (only insert)
- Audit trail for compliance
- PayMongo webhooks can arrive out-of-order

**Relationship**: `Many payments : 1 booking`

- A booking can have multiple payment attempts (retry logic)
- Each payment record is final

**Example Row**:

```json
{
  "id": "pay_1",
  "booking_id": "booking_1",
  "paymongo_payment_id": "pay_xxx789",
  "amount": 350000, // In centavos for PayMongo
  "payment_status": "succeeded",
  "payment_method_type": "gcash",
  "idempotency_key": "idempotency_abc123",
  "webhook_received_at": "2026-06-15T10:35:00Z"
}
```

**Webhook Safety** (Why idempotency_key matters):

```
Scenario: Network delay causes PayMongo to send webhook twice

1st webhook → Insert payment, update booking
2nd webhook → Check idempotency_key exists → Skip (prevent duplicate)
```

---

### 4️⃣ MANIFEST LAYER

#### `expedition_participants` (Hiker manifest data)

**Purpose**: Personal details for each participant (used in PDF manifest)

**Key Columns**:

- `full_name`, `date_of_birth`, `gender`: Basic identity
- `emergency_contact_*`: Safety info (required by LGU)
- `medical_conditions`, `allergies`, `blood_type`: Health & safety
- `id_type`, `id_number`: Government ID for verification
- `has_travel_insurance`: For liability
- `data_verified`: Admin verification flag

**Why separate from bookings?**

- Manifest data is specific to this expedition
- Bookings can include multiple participants
- Manifest is printed/exported, needs to be accurate

**Relationship**: `1 expedition_participant : 1 booking` (unique)

- Each booking has exactly one participant record
- But in future, could support "group bookings" with multiple participants

**Example Row**:

```json
{
  "id": "part_1",
  "booking_id": "booking_1",
  "expedition_id": "exp_1",
  "full_name": "John Doe",
  "date_of_birth": "1990-05-15",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_number": "09171234567",
  "medical_conditions": "None",
  "blood_type": "O+",
  "id_type": "national_id",
  "id_number": "123-456-789",
  "data_verified": true
}
```

**Used For**:

- Generating official manifest PDF (for LGU submission)
- Safety briefing (emergency contacts)
- Insurance verification

---

### 5️⃣ SOCIAL LAYER

#### `reviews` (Ratings & testimonials)

**Purpose**: Hikers rate organizers after expedition

**Key Columns**:

- `rating`: Overall 1-5 score
- `rating_organization`, `rating_guide_quality`, `rating_accommodations`: Subcategories
- `verified_participant`: Only hikers who actually booked can review
- `is_approved`: Moderation flag (prevent fake reviews)

**Relationship**: `Many reviews : 1 expedition` + `Many reviews : 1 organizer`

- Expeditions get reviews
- Organizers' average rating aggregated across all reviews

**Example Row**:

```json
{
  "id": "review_1",
  "expedition_id": "exp_1",
  "hiker_id": "user_1",
  "organizer_id": "org_1",
  "rating": 5,
  "rating_organization": 5,
  "rating_guide_quality": 5,
  "rating_accommodations": 4,
  "review_title": "Amazing experience!",
  "review_text": "Professional guides, great itinerary...",
  "verified_participant": true, // Checked via booking_id
  "is_approved": true
}
```

**Trust System**:

```
Review visibility:
- Only "verified_participant" & "is_approved" reviews are shown
- Prevents fake/competitor reviews
- Organizers can't delete reviews, only flag for moderation
```

---

### 6️⃣ OPERATIONS LAYER

#### `notifications` (Communication log)

**Purpose**: Track all system notifications sent to users

**Key Columns**:

- `notification_type`: `'booking_confirmation'`, `'payment_receipt'`, etc.
- `channel`: `'email'`, `'sms'`, `'in_app'`
- `status`: `'pending'` → `'sent'` or `'failed'`
- `is_read`: For in-app notifications

**Why track?**

- Audit trail (compliance)
- Resend failed notifications
- Analytics (which notifications get read?)

**Example Row**:

```json
{
  "id": "notif_1",
  "recipient_id": "user_1",
  "notification_type": "booking_confirmation",
  "title": "Booking Confirmed!",
  "message": "Your spot on Mount Pinatubo is confirmed...",
  "channel": "email",
  "sent_at": "2026-06-15T10:35:00Z",
  "status": "sent"
}
```

---

#### `audit_log` (Compliance trail)

**Purpose**: Immutable record of who changed what, when

**Key Columns**:

- `table_name`, `operation`: Which table was modified (INSERT/UPDATE/DELETE)
- `record_id`: Which row was affected
- `actor_id`: Who made the change
- `old_values`, `new_values`: What changed (JSON)

**Why separate?**

- Audit logs are write-once (can't be modified)
- Compliance requirements (PDPA in Philippines)
- Security forensics

**Example Row**:

```json
{
  "id": "audit_1",
  "table_name": "expeditions",
  "operation": "UPDATE",
  "record_id": "exp_1",
  "actor_id": "org_1_user",
  "old_values": {
    "price_per_person": 3000
  },
  "new_values": {
    "price_per_person": 3500
  },
  "changed_fields": ["price_per_person"],
  "created_at": "2026-06-15T10:35:00Z"
}
```

---

## Relationships Explained

### One-to-Many (1:N)

```
1 organizer_profile → Many expeditions
1 expedition → Many bookings
1 user → Many bookings
1 user → Many reviews
1 expedition → Many reviews
```

**Symbol in dbdiagram**: `>` (crow's foot notation)

**Example**: "An organizer can list 20 different expeditions"

---

### One-to-One (1:1)

```
1 user ↔ 1 organizer_profile
1 expedition ↔ 1 expedition_inventory
1 booking ↔ 1 expedition_participant
```

**Symbol in dbdiagram**: `-` (line)

**Example**: "Each user has exactly one organizer profile (or none if they're a hiker)"

---

### Many-to-One (N:1)

```
Many bookings → 1 user (hiker_id)
Many bookings → 1 expedition
Many payments → 1 booking
```

**Example**: "Multiple bookings belong to the same expedition"

---

## Data Types Used

| Type            | Used For                  | Examples                  |
| --------------- | ------------------------- | ------------------------- |
| `UUID`          | Primary keys (unique IDs) | User ID, Expedition ID    |
| `VARCHAR(n)`    | Text with max length      | Email (255), Company name |
| `TEXT`          | Unlimited text            | Descriptions, reviews     |
| `INTEGER`       | Whole numbers             | Elevation, slot counts    |
| `DECIMAL(10,2)` | Money (2 decimal places)  | Prices, ratings           |
| `DATE`          | Just the date             | Start date, birth date    |
| `TIMESTAMP`     | Date + time               | Created at, last updated  |
| `BOOLEAN`       | True/False                | Is published, verified    |
| `JSONB`         | Nested objects/arrays     | Itinerary, amenities      |
| `INET`          | IP addresses              | For audit logging         |

---

## Key Constraints

### PRIMARY KEY (pk)

Uniquely identifies each row

```sql
id UUID [pk]  -- Each user has a unique ID
```

### FOREIGN KEY (ref)

Links to another table

```sql
user_id UUID [ref: - users.id]  -- Must reference an existing user
```

### UNIQUE

No duplicate values allowed

```sql
email VARCHAR(255) [unique]  -- No two users with same email
paymongo_payment_id TEXT [unique]  -- Each payment is unique
```

### NOT NULL

Field must have a value

```sql
first_name VARCHAR(100) [not null]  -- Required
```

### DEFAULT

Use this value if none provided

```sql
role TEXT [default: "'hiker'"]  -- Default role is hiker
```

---

## Row-Level Security (RLS) Overview

Although RLS policies aren't shown in dbdiagram, they're crucial:

```sql
-- Hikers can only see their own bookings
SELECT * FROM bookings WHERE hiker_id = auth.uid()

-- Organizers can only see bookings for their expeditions
SELECT * FROM bookings
WHERE expedition_id IN (
  SELECT id FROM expeditions
  WHERE organizer_id = (
    SELECT id FROM organizer_profiles
    WHERE user_id = auth.uid()
  )
)
```

---

## Scaling Considerations

### Indexing (Performance)

Most important indexes:

```
expeditions(organizer_id, start_date, mountain_name)
bookings(hiker_id, expedition_id, payment_status)
payments(booking_id, paymongo_payment_id)
```

### Query Patterns

**Most common queries**:

```sql
-- Search expeditions by date & difficulty
SELECT * FROM expeditions
WHERE start_date >= NOW() AND difficulty_level = 'intermediate'

-- Get hiker's bookings
SELECT b.*, e.mountain_name FROM bookings b
JOIN expeditions e ON b.expedition_id = e.id
WHERE b.hiker_id = ?

-- Organizer dashboard stats
SELECT COUNT(*) booked, SUM(final_price) revenue
FROM bookings WHERE expedition_id = ?
```

### Materialized View (Optimization)

```sql
CREATE MATERIALIZED VIEW expedition_metrics AS
SELECT e.id, COUNT(b.id) bookings, AVG(r.rating) rating
FROM expeditions e
LEFT JOIN bookings b ON e.id = b.expedition_id
LEFT JOIN reviews r ON e.id = r.expedition_id
GROUP BY e.id;
```

---

## Common Data Flows

### 1. Hiker Books & Pays

```
POST /bookings
  ├─ Insert into bookings (status: pending)
  ├─ Create PayMongo payment intent
  ├─ Hiker redirected to PayMongo
  └─ PayMongo webhook calls /payments/webhook
     ├─ Insert into payments
     ├─ Update bookings (status: confirmed)
     ├─ Update expedition_inventory (--available_slots)
     └─ Insert notification (email sent)
```

### 2. Organizer Creates Expedition

```
POST /organizer/expeditions
  ├─ Insert into expeditions (is_published: false)
  ├─ Insert into expedition_inventory
  ├─ Update organizer_profiles (total_expeditions_completed++)
  └─ Organizer can now edit before publishing
     POST /organizer/expeditions/:id/publish
     └─ Update expeditions (is_published: true, published_at: now)
```

### 3. Hiker Cancels Booking

```
POST /bookings/:id/cancel
  ├─ Update bookings (booking_status: cancelled)
  ├─ Update payments (payment_status: refunded)
  ├─ Update expedition_inventory (--booked_slots)
  ├─ Refund via PayMongo
  └─ Insert notification (refund confirmed email)
```

---

## Migration Strategy

Tables should be created in this order:

1. ✅ `users` (no dependencies)
2. ✅ `organizer_profiles` (FK to users)
3. ✅ `expeditions` (FK to organizer_profiles)
4. ✅ `expedition_inventory` (FK to expeditions)
5. ✅ `bookings` (FK to users + expeditions)
6. ✅ `payments` (FK to bookings)
7. ✅ `expedition_participants` (FK to bookings + expeditions)
8. ✅ `reviews` (FK to expeditions + users + organizer_profiles)
9. ✅ `notifications` (FK to users)
10. ✅ `audit_log` (FK to users)

Then create indexes and RLS policies.

---

**Last Updated**: June 2026
**Total Tables**: 11 core + 1 materialized view
**Relationships**: 15+ foreign keys
