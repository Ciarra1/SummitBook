'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };

    checkSession();

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isLoggedIn) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-orange-500 hover:bg-orange-400 text-white px-5 py-2 rounded-md text-sm font-semibold no-underline transition-colors duration-200"
    >
      Sign Out
    </button>
  );
}