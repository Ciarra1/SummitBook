# SaaS-Proj: Technical Development Startup Guide

**Status**: Ready to code  
**Target Timeline**: 8-12 weeks (MVP)  
**Tech Stack**: Next.js 14 + Supabase + PayMongo

---

## 🎯 Phase 1: Environment Setup (Week 1, Days 1-2)

### Step 1.1: Prerequisites

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git configured (`git config --list`)
- [ ] GitHub account with SSH keys set up
- [ ] Supabase account created (https://supabase.com)
- [ ] PayMongo account (sandbox) created (https://paymongo.com)
- [ ] Vercel account linked to GitHub (https://vercel.com)

**Time**: 30 minutes

---

### Step 1.2: Clone & Install

#done

```bash
# Clone the repository
git clone git@github.com:YOUR_USERNAME/SaaS-Proj.git
cd SaaS-Proj

# Install dependencies
npm install

# Verify installation
npm run dev
```

**Expected Output**: Server running on http://localhost:3000  
**Time**: 10 minutes

---

### Step 1.3: Create `.env.local` File

Copy this template and fill in your values:

```bash
# .env.local (NEVER commit this!)

# ===== SUPABASE =====
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===== PAYMONGO =====
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_...
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_WEBHOOK_SECRET=whsec_...

# ===== RESEND (Email) =====
RESEND_API_KEY=re_...

# ===== SENTRY (Monitoring) =====
NEXT_PUBLIC_SENTRY_DSN=https://...

# ===== APP CONFIG =====
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Where to find each value**:

- Supabase: Dashboard → Project Settings → API
  URL: https://lckpglsjyurwcuilycky.supabase.co

ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxja3BnbHNqeXVyd2N1aWx5Y2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDU5NTMsImV4cCI6MjA5NzA4MTk1M30.GYf58TN-hVGC6KVgeg-8t_fN4zA79QVclH9hQ8K9aBo

- PayMongo: Dashboard → Developers → API Keys
- Resend: Dashboard → API Keys
- Sentry: Project Settings → Client Keys (DSN)

**Time**: 15 minutes

---

### Step 1.4: Test Supabase Connection

Create `test-supabase.js`:

```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const { data, error } = await supabase.from("users").select("*").limit(1);

if (error) {
  console.error("❌ Connection failed:", error);
  process.exit(1);
} else {
  console.log("✅ Supabase connected!");
  console.log("Users table accessible");
}
```

Run: `node test-supabase.js`

**Time**: 5 minutes

---

## 🔧 Phase 2: Database Setup (Week 1, Days 3-5)

### Step 2.1: Create Supabase Project

1. Go to **supabase.com** → New Project
2. **Name**: `SaaS-Proj`
3. **Region**: Singapore (for Philippines customers)
4. **Database Password**: Store securely (LastPass/1Password)
5. Wait for provisioning (2-5 minutes)

**Time**: 10 minutes

---

### Step 2.2: Create Database Tables

Use the SQL migrations below. In Supabase dashboard:

**Path**: SQL Editor → New Query → Copy the SQL

#### Migration 1: Authentication Layer

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  profile_picture_url TEXT,
  phone_number VARCHAR(20),
  phone_verified BOOLEAN DEFAULT false,
  role TEXT NOT NULL CHECK (role IN ('hiker', 'organizer', 'admin')),
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read/update their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);
```

**Run this first**, then verify:

- Go to **SQL Editor** → Run
- Check **Table Editor** → `users` table exists

**Time**: 5 minutes

---

#### Migration 2: Organizer Profiles

```sql
-- Create organizer_profiles table
CREATE TABLE IF NOT EXISTS organizer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  company_registration_number VARCHAR(100),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  bio TEXT,
  bank_account_details JSONB,
  cancellation_policy TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX idx_organizer_profiles_verification_status ON organizer_profiles(verification_status);

-- Enable RLS
ALTER TABLE organizer_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only organizers can access their own profile
CREATE POLICY "organizer_profiles_select_own" ON organizer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "organizer_profiles_update_own" ON organizer_profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

**Time**: 5 minutes

---

#### Migration 3: Business Layer

```sql
-- Create expeditions table
CREATE TABLE IF NOT EXISTS expeditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES organizer_profiles(id) ON DELETE CASCADE,
  mountain_name VARCHAR(255) NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_van_slots INTEGER NOT NULL,
  booked_slots INTEGER DEFAULT 0,
  price_per_person DECIMAL(10,2) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  itinerary TEXT,
  included_amenities TEXT,
  gear_requirements TEXT,
  is_published BOOLEAN DEFAULT false,
  is_cancelled BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_expeditions_organizer_id ON expeditions(organizer_id);
CREATE INDEX idx_expeditions_start_date ON expeditions(start_date);
CREATE INDEX idx_expeditions_is_published ON expeditions(is_published);

-- Enable RLS
ALTER TABLE expeditions ENABLE ROW LEVEL SECURITY;

-- RLS: Everyone can see published expeditions
CREATE POLICY "expeditions_select_published" ON expeditions
  FOR SELECT USING (is_published = true);

-- RLS: Organizers can see their own (published or not)
CREATE POLICY "expeditions_select_own" ON expeditions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organizer_profiles
      WHERE organizer_profiles.id = expeditions.organizer_id
      AND organizer_profiles.user_id = auth.uid()
    )
  );
```

**Time**: 5 minutes

## ADDED

-- Allow users to insert their own profile during signup
CREATE POLICY "users_insert_own" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow organizers to insert their profile during signup
CREATE POLICY "organizer_profiles_insert_own" ON organizer_profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

---

#### Migration 4: Transactions Layer

```sql
-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hiker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expedition_id UUID NOT NULL REFERENCES expeditions(id) ON DELETE CASCADE,
  booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  final_price DECIMAL(10,2) NOT NULL,
  paymongo_payment_id UUID,
  payment_method TEXT CHECK (payment_method IN ('gcash', 'maya', 'instapay')),
  participant_name VARCHAR(255) NOT NULL,
  participant_email VARCHAR(255),
  participant_phone VARCHAR(20),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  medical_conditions TEXT,
  booking_date TIMESTAMP DEFAULT NOW(),
  payment_completed_at TIMESTAMP,
  cancellation_requested_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bookings_hiker_id ON bookings(hiker_id);
CREATE INDEX idx_bookings_expedition_id ON bookings(expedition_id);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS: Hikers can see their own bookings
CREATE POLICY "bookings_select_own" ON bookings
  FOR SELECT USING (auth.uid() = hiker_id);

-- RLS: Organizers can see bookings for their expeditions
CREATE POLICY "bookings_select_organizer" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM expeditions
      WHERE expeditions.id = bookings.expedition_id
      AND EXISTS (
        SELECT 1 FROM organizer_profiles
        WHERE organizer_profiles.id = expeditions.organizer_id
        AND organizer_profiles.user_id = auth.uid()
      )
    )
  );
```

**Time**: 5 minutes

---

#### Migration 5: Payments & Social

```sql
-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  paymongo_payment_id TEXT UNIQUE NOT NULL,
  paymongo_source_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'PHP',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  payment_method_type TEXT,
  last_four_digits VARCHAR(4),
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  webhook_received_at TIMESTAMP,
  webhook_event_type TEXT,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refunded_at TIMESTAMP,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_paymongo_payment_id ON payments(paymongo_payment_id);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expedition_id UUID NOT NULL REFERENCES expeditions(id) ON DELETE CASCADE,
  hiker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES organizer_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  verified_participant BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reviews_expedition_id ON reviews(expedition_id);
CREATE INDEX idx_reviews_organizer_id ON reviews(organizer_id);
```

**Time**: 5 minutes

---

#### Migration 6: Operations

```sql
  -- Create notifications table
  CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('booking_confirmation', 'payment_receipt', 'reminder', 'cancellation')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    expedition_id UUID REFERENCES expeditions(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Indexes
  CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
  CREATE INDEX idx_notifications_status ON notifications(status);

  -- Enable RLS
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

  -- RLS: Users can only see their own notifications
  CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (auth.uid() = recipient_id);
```

**Time**: 5 minutes

---

### Step 2.3: Verify All Tables

In Supabase **Table Editor**, you should see:

✅ users  
✅ organizer_profiles  
✅ expeditions  
✅ bookings  
✅ payments  
✅ reviews  
✅ notifications

**Total Time for Phase 2**: 45 minutes

---

... step 2 done

## 🚀 Phase 3: Project Structure Setup (Week 1, Days 5-7)

### Step 3.1: Create Folder Structure

```bash
cd SaaS-Proj

# Create folders
mkdir -p "src/app/(auth)" "src/app/(dashboard)" src/app/api src/lib src/components src/hooks src/types
mkdir -p src/server/functions src/server/middleware
mkdir -p public/icons

# Create files
touch src/lib/supabase.ts
touch src/lib/paymongo.ts
touch src/types/database.ts
touch src/middleware.ts
```

**Time**: 5 minutes

---

### Step 3.2: Initialize Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Browser client (for client-side queries)
export const createBrowserSupabaseClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

// Server client (for server-side queries & auth)
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Handle errors silently in server context
          }
        },
      },
    },
  );
};
```

## revised 3.2

created /lib/supabase/client.ts and /lib/supabase/server.ts

## client

import { createBrowserClient } from "@supabase/ssr";

export const createBrowserSupabaseClient = () =>
createBrowserClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

## server

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createServerSupabaseClient = () => {
const cookieStore = cookies();
return createServerClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
{
cookies: {
get(name: string) {
return cookieStore.get(name)?.value;
},
set(name: string, value: string, options: any) {
cookieStore.set({ name, value, ...options });
},
remove(name: string, options: any) {
cookieStore.set({ name, value: "", ...options });
},
},
}
);
};

# client import

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

# server import

import { createServerSupabaseClient } from "@/lib/supabase/server";

**Time**: 5 minutes

---

### Step 3.3: Create TypeScript Types

Create `src/types/database.ts`:

```typescript
export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "hiker" | "organizer" | "admin";
  email_verified: boolean;
  created_at: string;
};

export type OrganizerProfile = {
  id: string;
  user_id: string;
  company_name: string;
  verification_status: "pending" | "verified" | "rejected";
  average_rating: number;
  total_reviews: number;
  bio?: string;
  created_at: string;
};

export type Expedition = {
  id: string;
  organizer_id: string;
  mountain_name: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  start_date: string;
  end_date: string;
  total_van_slots: number;
  booked_slots: number;
  price_per_person: number;
  title: string;
  description: string;
  is_published: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  hiker_id: string;
  expedition_id: string;
  booking_status: "pending" | "confirmed" | "cancelled";
  payment_status: "pending" | "completed" | "failed" | "refunded";
  final_price: number;
  participant_name: string;
  participant_phone?: string;
  created_at: string;
};

export type Payment = {
  id: string;
  booking_id: string;
  paymongo_payment_id: string;
  amount: number;
  payment_status: "pending" | "succeeded" | "failed";
  created_at: string;
};
```

**Time**: 10 minutes

---

### Step 3.4: Setup Next.js Config

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "app.saas-proj.dev"],
    },
  },
  images: {
    domains: ["*.supabase.co"],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

module.exports = nextConfig;
```

**Time**: 5 minutes

---

**Total Time for Phase 3**: 25 minutes
...done

---

## 📋 Phase 4: First Feature - User Authentication (Week 2)

### Step 4.1: Create Auth Layout

Create `src/app/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
```

**Time**: 5 minutes

---

### Step 4.2: Create Signup Page

Create "src/app/(auth)/signup/page.tsx":

```typescript
'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'hiker' | 'organizer'>('hiker');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Insert user profile
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user?.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        email_verified: false,
      });

      if (profileError) throw profileError;

      // 3. If organizer, create organizer profile
      if (role === 'organizer') {
        const { error: orgError } = await supabase
          .from('organizer_profiles')
          .insert({
            user_id: authData.user?.id,
            company_name: '', // Will be filled in later
          });

        if (orgError) throw orgError;
      }

      router.push('/verify-email');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <h1 className="text-2xl font-bold">Create Account</h1>

      <input
        type="text"
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-full px-4 py-2 border rounded"
        required
      />

      <input
        type="text"
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="w-full px-4 py-2 border rounded"
        required
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 border rounded"
        required
      />

      <input
        type="password"
        placeholder="Password (min 6 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-2 border rounded"
        required
      />

      <select
        value={role}
        onChange={(e) => setRole(e.target.value as 'hiker' | 'organizer')}
        className="w-full px-4 py-2 border rounded"
      >
        <option value="hiker">I'm a Hiker</option>
        <option value="organizer">I'm an Organizer</option>
      </select>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

**Time**: 20 minutes

---

### Step 4.3: Test Authentication

```bash
# Start dev server
npm run dev

# Visit http://localhost:3000/signup
# Try creating an account
# Check Supabase: Auth Users & users table
```

**Expected Result**:

- ✅ User created in Supabase Auth
- ✅ User profile in `users` table
- ✅ If organizer, `organizer_profiles` entry created

**Time**: 10 minutes

---

## 📊 Phase 5: Core Feature - Expedition Discovery (Week 2-3)

### Step 5.1: Create Expedition Listing Page

Create `src/app/(dashboard)/expeditions/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { Expedition } from '@/types/database';

export default function ExpeditionsPage() {
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const fetchExpeditions = async () => {
      const { data, error } = await supabase
        .from('expeditions')
        .select('*')
        .eq('is_published', true)
        .order('start_date', { ascending: true });

      if (error) console.error('Error:', error);
      else setExpeditions(data || []);
      setLoading(false);
    };

    fetchExpeditions();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Available Expeditions</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expeditions.map((exp) => (
          <div key={exp.id} className="border rounded p-4">
            <h2 className="text-xl font-bold">{exp.mountain_name}</h2>
            <p className="text-gray-600">{exp.title}</p>
            <p className="text-sm mt-2">
              📅 {new Date(exp.start_date).toLocaleDateString()} -{' '}
              {new Date(exp.end_date).toLocaleDateString()}
            </p>
            <p className="text-sm">⛰️ {exp.difficulty_level}</p>
            <p className="text-sm">💰 ₱{exp.price_per_person}/person</p>
            <p className="text-sm">📍 {exp.booked_slots}/{exp.total_van_slots} booked</p>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Time**: 20 minutes

---

### Step 5.2: Create Expedition Detail Page

Create `src/app/(dashboard)/expeditions/[id]/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { Expedition } from '@/types/database';

export default function ExpeditionDetailPage() {
  const { id } = useParams();
  const [expedition, setExpedition] = useState<Expedition | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const fetchExpedition = async () => {
      const { data, error } = await supabase
        .from('expeditions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) console.error('Error:', error);
      else setExpedition(data);
      setLoading(false);
    };

    if (id) fetchExpedition();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!expedition) return <div>Expedition not found</div>;

  const availableSlots = expedition.total_van_slots - expedition.booked_slots;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">{expedition.mountain_name}</h1>
      <p className="text-xl text-gray-600 mt-2">{expedition.title}</p>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <p className="text-sm text-gray-600">Difficulty</p>
          <p className="text-lg font-bold">{expedition.difficulty_level}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Price per Person</p>
          <p className="text-lg font-bold">₱{expedition.price_per_person}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Dates</p>
          <p className="text-lg font-bold">
            {new Date(expedition.start_date).toLocaleDateString()} -{' '}
            {new Date(expedition.end_date).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Available Slots</p>
          <p className="text-lg font-bold">{availableSlots} / {expedition.total_van_slots}</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-bold">Itinerary</h2>
        <p className="mt-2 whitespace-pre-wrap">{expedition.itinerary}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-bold">What's Included</h2>
        <p className="mt-2">{expedition.included_amenities}</p>
      </div>

      {availableSlots > 0 && (
        <button className="mt-6 w-full bg-green-600 text-white py-3 rounded text-lg font-bold">
          Book Now
        </button>
      )}
      {availableSlots === 0 && (
        <button disabled className="mt-6 w-full bg-gray-400 text-white py-3 rounded text-lg font-bold">
          Fully Booked
        </button>
      )}
    </div>
  );
}
```

**Time**: 20 minutes

---

### Step 5.3: Test Listing & Detail

```bash
# Add test expedition to database
# In Supabase SQL Editor:
INSERT INTO expeditions (
  organizer_id, mountain_name, difficulty_level,
  start_date, end_date, total_van_slots, price_per_person,
  title, description, is_published
) VALUES (
  'org_uuid_here', 'Mount Pinatubo', 'intermediate',
  '2026-07-15', '2026-07-17', 20, 3500,
  'Crater Lake Trek', 'Amazing crater experience', true
);

# Visit http://localhost:3000/expeditions
# Should see listing, click to view details
```

**Time**: 15 minutes

---

## 🎫 Phase 6: Booking Flow (Week 3-4)

### Step 6.1: Create Booking Page

Create `src/app/(dashboard)/expeditions/[id]/book/page.tsx` and `src/app/(dashboard)/bookings/page.tsx`

_(Time commitment: 4-5 hours)_

**Key Tasks**:

1. Create booking form component
2. Validate slot availability
3. Submit booking to database
4. Initiate PayMongo payment
5. Redirect to payment gateway

**Checklist**:

- [ ] Form validation (email, phone, emergency contact)
- [ ] Real-time slot availability check
- [ ] Create booking record with `payment_status='pending'`
- [ ] Call PayMongo API to create payment intent
- [ ] Redirect to PayMongo checkout
- [ ] Handle payment callback

---

## 💳 Phase 7: Payment Integration (Week 4-5)

### Step 7.1: Create PayMongo Webhook Handler

Create `src/app/api/webhooks/paymongo/route.ts`:

```typescript
import { createServerSupabaseClient } from "@/lib/supabase";
import crypto from "crypto";

const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paymongo-signature");

    // 1. Verify webhook signature
    const hash = crypto
      .createHmac("sha256", PAYMONGO_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // 2. Handle payment.paid event
    if (event.type === "payment.paid") {
      const paymongo_payment_id = event.data.id;

      // 3. Update booking payment status
      const supabase = await createServerSupabaseClient();
      await supabase
        .from("payments")
        .update({ payment_status: "succeeded" })
        .eq("paymongo_payment_id", paymongo_payment_id);

      // 4. Update booking to confirmed
      const { data: payment } = await supabase
        .from("payments")
        .select("booking_id")
        .eq("paymongo_payment_id", paymongo_payment_id)
        .single();

      if (payment) {
        await supabase
          .from("bookings")
          .update({
            booking_status: "confirmed",
            payment_status: "completed",
            payment_completed_at: new Date().toISOString(),
          })
          .eq("id", payment.booking_id);

        // 5. Update expedition booked_slots
        const { data: booking } = await supabase
          .from("bookings")
          .select("expedition_id")
          .eq("id", payment.booking_id)
          .single();

        if (booking) {
          await supabase.rpc("increment_booked_slots", {
            exp_id: booking.expedition_id,
          });
        }

        // 6. Send confirmation email notification
        await supabase.from("notifications").insert({
          recipient_id: booking.hiker_id,
          notification_type: "booking_confirmation",
          title: "Booking Confirmed!",
          message: "Your expedition booking has been confirmed.",
          booking_id: payment.booking_id,
          status: "pending",
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
```

**Time**: 30 minutes

---

## ✅ Phase 8: Testing & QA (Week 5-6)

### Step 8.1: Create Test Cases

**Authentication Tests**:

- [ ] User signup (hiker)
- [ ] User signup (organizer)
- [ ] Email verification
- [ ] Login/Logout
- [ ] Password reset

**Expedition Tests**:

- [ ] List published expeditions
- [ ] Filter by difficulty
- [ ] View expedition details
- [ ] Check slot availability

**Booking Tests**:

- [ ] Create booking
- [ ] Validate participant info
- [ ] Submit to payment gateway

**Payment Tests**:

- [ ] Test PayMongo webhook
- [ ] Verify payment status updates
- [ ] Confirm booking after payment

---

## 🚀 Deploy & Monitor

### Step 9.1: Deploy to Vercel

```bash
git add .
git commit -m "Initial MVP implementation"
git push origin main

# Vercel auto-deploys on push to main
```

### Step 9.2: Monitor with Sentry

```bash
# Already integrated in next.config.js
# Errors automatically reported to Sentry dashboard
```

---

## 📝 Development Workflow

```bash
# Daily workflow

# 1. Pull latest
git pull origin develop

# 2. Create feature branch
git checkout -b feature/booking-flow

# 3. Start dev server
npm run dev

# 4. Make changes...

# 5. Commit
git add .
git commit -m "feat: add booking validation"

# 6. Push
git push origin feature/booking-flow

# 7. Create pull request
# GitHub: New PR → develop branch
# Merge after review

# 8. Deploy to staging
git checkout staging
git merge develop
git push origin staging

# 9. Test in staging
# Visit https://staging.saas-proj.dev

# 10. Deploy to production
git checkout main
git merge staging
git push origin main
```

---

## 🎯 Weekly Milestones

| Week | Milestone                         | Status |
| ---- | --------------------------------- | ------ |
| 1    | Env setup + DB creation           | ⏳     |
| 2    | Auth + Expedition listing         | ⏳     |
| 3    | Expedition details + Booking form | ⏳     |
| 4    | Payment integration + Webhooks    | ⏳     |
| 5    | Testing & bug fixes               | ⏳     |
| 6    | QA & staging deployment           | ⏳     |
| 7    | Production deployment             | ⏳     |
| 8+   | Analytics, reviews, admin         | ⏳     |

---

## 🆘 Troubleshooting

### Database Connection Fails

```bash
# Check env variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Test connection
node test-supabase.js

# Verify Supabase project is active
# Check dashboard: Projects → Status
```

### Auth Redirects to Signup

```bash
# Supabase session not persisted
# Clear cookies: DevTools → Application → Cookies → Clear

# Verify auth is configured:
# Supabase Dashboard → Authentication → Redirect URLs
# Should include: http://localhost:3000/auth/callback
```

### Payment Webhook Not Triggering

```bash
# Update webhook URL in PayMongo:
# https://app.saas-proj.dev/api/webhooks/paymongo

# Test webhook: PayMongo Dashboard → Webhooks → Send Test
```

---

## 📚 Quick Reference Links

| Resource      | Link                                |
| ------------- | ----------------------------------- |
| Next.js Docs  | https://nextjs.org/docs             |
| Supabase Docs | https://supabase.com/docs           |
| PayMongo Docs | https://developers.paymongo.com     |
| Tailwind CSS  | https://tailwindcss.com/docs        |
| TypeScript    | https://www.typescriptlang.org/docs |

---

**You're ready to start coding! Good luck! 🎉**
