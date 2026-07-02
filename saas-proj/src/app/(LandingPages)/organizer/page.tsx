'use client'

import GenerateDummyExpeditionBtn from "@/components/GenerateDummyExpeditionBtn"
import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import RecentlyUpdated from "@/components/sections/RecentlyUpdated";
import { useRouter } from "next/navigation";

// import RecentlyUpdated from './RecentlyUpdated'; // Uncomment if you are using this component here

export default function Page() {
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]); // 👈 1. Added state for updates
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

useEffect(() => {
    const fetchDashboardData = async () => { 
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch 1: Get Profile
        const { data: profile, error: profileError } = await supabase
          .from('organizer_profiles')
          .select('id, company_name')
          .eq('user_id', user.id)
          .single(); 
          
        if (profile) {
          setOrganizerId(profile.id);
          setCompanyName(profile.company_name); 

          // 👇 Fetch 2: MOVED INSIDE `if (profile)` block
          // Fetch 2: Get Recent Updates
          const { data: updates, error: updatesError } = await supabase
            .from('bookings')
            .select(`
              id,
              updated_at,
              booking_status,
              payment_status,
              participant_name, 
              expeditions!inner (
                mountain_name,
                organizer_id
              )
            `)
            // (Keep the rest of your query the same)
            .eq('expeditions.organizer_id', profile.id) 
            .order('updated_at', { ascending: false })
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
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Homepage</h1>
      
      {loading ? (
        <p className="text-gray-500">Loading dashboard...</p>
      ) : organizerId ? (
        <div className="space-y-8">
          <div>
            <p className="text-sm text-green-600 mb-4">
              ✓ Logged in as: {companyName || organizerId}
            </p>
            <GenerateDummyExpeditionBtn 
              organizerProfileId={organizerId}
            />
          </div>
        <button onClick={() => router.push('organizer/manage-expedition')}
        >Manage Expeditions</button>

          {/* 👈 4. Now you can use your recentUpdates data! */}
          {/* <RecentlyUpdated updates={recentUpdates} /> */}
          <div className="text-sm text-gray-500">
            <p>Recent updates found: {recentUpdates.length}</p>
          </div>

        </div>
      ) : (
        <p className="text-red-500 font-medium">
          You must be logged in as an Organizer to view this dashboard.
        </p>
      )}  
      <RecentlyUpdated updates={recentUpdates} />
    </div>
  );
}