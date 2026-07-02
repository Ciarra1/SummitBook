'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function NavActions() {
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    setHasSession(!!data.user);
    setLoading(false);
  });

  // Listen for auth changes (catches signOut immediately)
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setHasSession(!!session);
    setLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);

  // Avoid flash of wrong buttons while checking
  if (loading) return <div style={{ width: '160px' }} />;

  if (hasSession) {
    return
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <Link href="/signin" className="sb-nav-cta">Sign in</Link>    
    </div>
  );
}