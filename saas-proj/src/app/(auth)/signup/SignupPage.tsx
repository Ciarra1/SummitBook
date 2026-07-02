'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import LogoutButton from '@/components/LogoutButton'; 

export default function SignupPage() {
  console.log('SignupPage rendered');
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'organizer' ? 'organizer' : 'hiker';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'hiker' | 'organizer'>(initialRole);
  const [companyName, setCompanyName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [sex, setSex] = useState<'Male' | 'Female' | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const getAgeFromDate = (value: string) => {
    if (!value) return null;

    const today = new Date();
    const dob = new Date(value);

    if (Number.isNaN(dob.getTime())) return null;

    let calculatedAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      calculatedAge -= 1;
    }

    return calculatedAge;
  };

  const handleDateOfBirthChange = (value: string) => {
    setDateOfBirth(value);
    setAge(getAgeFromDate(value));
  };

  const handleSignup = async (e: React.FormEvent) => {
    console.log('handleSignup fired');
    e.preventDefault();
    setError(null);

    // Password confirmation check
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role,
            date_of_birth: dateOfBirth || null,
            age: age ?? null,
            sex: sex || null,
            ...(role === 'organizer' && { company_name: companyName }),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;

      if (authData.user && authData.user.identities?.length === 0) {
        setError('An account with this email already exists. Try signing in instead.');
        return;
      }
      await supabase.auth.signOut();

      fetch('/api/email-handler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName }),
      }).catch((err) => console.error('Welcome email failed:', err));

      router.push('/verify-email');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Create Account</h1>
        
        {/* Role toggle UI */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setRole('hiker')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              role === 'hiker' 
                ? 'bg-white shadow text-gray-900' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Hiker
          </button>
          <button
            type="button"
            onClick={() => setRole('organizer')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              role === 'organizer' 
                ? 'bg-white shadow text-gray-900' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Organizer
          </button>
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
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
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Date of birth
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => handleDateOfBirthChange(e.target.value)}
              className="w-full px-4 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Age
            </label>
            <input
              type="number"
              value={age ?? ''}
              readOnly
              className="w-full px-4 py-2 border rounded bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Sex
          </label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value as 'Male' | 'Female' | '')}
            className="w-full px-4 py-2 border rounded"
          >
            <option value="">Select sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />

        {/* Only shows when organizer is selected */}
        {role === 'organizer' && (
          <div className="border-t pt-3 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Organizer Details
            </p>
            <input
              type="text"
              placeholder="Company / Group Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2 border rounded"
              required={role === 'organizer'} 
            />
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50 font-medium mt-4"
        >
          {loading
            ? 'Creating account...'
            : role === 'organizer'
            ? 'Create Organizer Account'
            : 'Create Hiker Account'}
        </button>

        <p className="text-sm text-center text-gray-500 pt-2">
          Already have an account?{' '}
          <Link href="/signin" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}