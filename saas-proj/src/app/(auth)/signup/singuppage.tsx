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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

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

      // Route directly to the sign in page
      router.push('/signin');
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