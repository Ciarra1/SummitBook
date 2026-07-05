"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GenerateDummyExpeditionBtn from "@/components/GenerateDummyExpeditionBtn";
import RecentlyUpdated from "@/components/sections/RecentlyUpdated";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton"; // Adjust the import path if necessary

export default function Page() {
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch 1: organizer profile
        const { data: profile, error: profileError } = await supabase
          .from("organizer_profiles")
          .select("id, company_name")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setOrganizerId(profile.id);
          setCompanyName(profile.company_name);

          // Fetch 2: recent activity across this organizer's expeditions
          const { data: updates, error: updatesError } = await supabase
            .from("bookings")
            .select(
              `
              id,
              updated_at,
              booking_status,
              payment_status,
              participant_name,
              expeditions!inner (
                mountain_name,
                organizer_id
              )
            `
            )
            .eq("expeditions.organizer_id", profile.id)
            .order("updated_at", { ascending: false })
            .limit(5);

          if (updatesError) {
            console.error("Error fetching recent updates:", updatesError);
          } else if (updates) {
            setRecentUpdates(updates);
          }
        } else if (profileError) {
          console.error("Could not find organizer profile:", profileError);
        }
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* --- HEADER --- */}
      <div className="border-b border-stone-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">Dashboard</h1>
            <p className="mt-1 text-stone-500">Manage your expeditions, bookings, and roster.</p>
          </div>
          
          {/* Target the child button directly with Tailwind to override the orange theme */}
          <div className="[&>button]:!bg-white [&>button]:!text-stone-700 [&>button]:!border [&>button]:!border-stone-300 [&>button]:!shadow-sm [&>button]:hover:!bg-stone-50 [&>button]:!rounded-lg [&>button]:!px-4 [&>button]:!py-2 [&>button]:!font-medium [&>button]:!transition-colors">
            <LogoutButton />
          </div>
        </div>
      </div>

      <main className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-56 rounded-full bg-stone-200" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="h-32 rounded-xl border border-stone-100 bg-white" />
              <div className="h-32 rounded-xl border border-stone-100 bg-white" />
            </div>
            <div className="h-48 rounded-xl border border-stone-100 bg-white" />
          </div>
        ) : organizerId ? (
          <div className="space-y-8">
            {/* Status chip */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Logged in as {companyName || "Organizer"}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100">
                  <svg className="h-5 w-5 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-stone-900">Manage Expeditions</h3>
                <p className="mt-1 text-sm text-stone-500">
                  View expeditions, track bookings, and manage your participant roster.
                </p>
                <button
                  onClick={() => router.push("/organizer/manage-expedition")}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
                >
                  Manage Expeditions
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Recent activity */}
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-5">
                <h2 className="text-lg font-semibold text-stone-900">Recent Activity</h2>
                <span className="text-xs text-stone-400">
                  {recentUpdates.length} update{recentUpdates.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="p-6">
                {recentUpdates.length === 0 ? (
                  <p className="py-6 text-center text-sm text-stone-400">
                    No recent booking activity yet.
                  </p>
                ) : (
                  <RecentlyUpdated updates={recentUpdates} />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-white py-16 text-center shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <p className="text-stone-700">You must be logged in as an organizer to view this dashboard.</p>
            <Link href="/signin" className="mt-4 text-sm font-medium text-stone-900 underline underline-offset-2">
              Sign in
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}