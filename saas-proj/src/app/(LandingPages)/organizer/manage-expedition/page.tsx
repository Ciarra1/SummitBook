"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Expedition, ExpeditionStatus, StatusFilter, SortKey } from "@/types/expedition";

// Imported Components
import PageHeader from "@/components/organizerExpedition/PageHeader";
import Toolbar from "@/components/organizerExpedition/Toolbar";
import ExpeditionCard from "@/components/organizerExpedition/ExpeditionCard";
import EmptyState from "@/components/organizerExpedition/EmptyState";
import LoadingGrid from "@/components/organizerExpedition/LoadingGrid";

export default function ManageExpeditionPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  // State Management
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated");

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  // Data Fetching
  useEffect(() => {
    let isMounted = true;

    async function loadExpeditions() {
      setIsLoading(true);
      setErrorMessage(null);

      // 1. Get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (authError || !user) {
        setErrorMessage("You must be logged in to view your expeditions.");
        setIsLoading(false);
        return;
      }

      // 2. Fetch the user's organizer profile to get their specific organizer ID
      const { data: profile, error: profileError } = await supabase
        .from("organizer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        setErrorMessage("We couldn't find an organizer profile associated with this account.");
        setIsLoading(false);
        return;
      }

      // 3. Fetch expeditions that ONLY belong to this organizer
      const { data, error } = await supabase
        .from("expeditions")
        .select(
          "id, title, mountain_name, mountain_img_url, status, price_per_person, start_date, end_date, total_van_slots, booked_slots, updated_at"
        )
        .eq("organizer_id", profile.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Supabase fetch error:", error.message, error.details);
        setErrorMessage("We couldn't load your expeditions. Try refreshing the page.");
        setIsLoading(false);
        return;
      }

      setExpeditions((data ?? []) as Expedition[]);
      setIsLoading(false);
    }

    loadExpeditions();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Actions
  async function togglePublish(expedition: Expedition) {
    const nextStatus: ExpeditionStatus =
      expedition.status === "published" ? "draft" : "published";

    setPendingId(expedition.id);
    const previous = expeditions;
    setExpeditions((curr) =>
      curr.map((e) => (e.id === expedition.id ? { ...e, status: nextStatus } : e))
    );

    const { error } = await supabase
      .from("expeditions")
      .update({ status: nextStatus })
      .eq("id", expedition.id);

    if (error) {
      setExpeditions(previous);
      setErrorMessage(
        `We couldn't ${nextStatus === "published" ? "publish" : "unpublish"} "${expedition.title || expedition.mountain_name}". Try again.`
      );
    }
    setPendingId(null);
  }

// Replace your deleteExpedition function with this:
async function cancelExpedition(id: string) {
    setPendingId(id);
    const previous = expeditions;
    
    // Optimistic UI update
    setExpeditions((curr) =>
      curr.map((e) => (e.id === id ? { ...e, status: "cancelled" } : e))
    );
    setConfirmCancelId(null); 

    // Database Update
    const { data, error } = await supabase
      .from("expeditions")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select(); // <--- ADD THIS

    // Debugging check: If RLS blocks it, 'data' will be an empty array []
    if (error || !data || data.length === 0) {
      console.error("Failed to update DB:", error || "Blocked by RLS (0 rows updated)");
      
      // Revert the optimistic update since it failed
      setExpeditions(previous);
      setErrorMessage("We couldn't cancel that expedition. Check your database permissions.");
    }
    
    setPendingId(null);
  }

  // Derived State (Filtering & Sorting)
  const filteredExpeditions = useMemo(() => {
    let result = expeditions;

    if (statusFilter !== "all") {
      result = result.filter((e) => e.status === statusFilter);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (e) =>
          // safely check title (since it can be null) or search mountain_name instead of destination
          (e.title || "").toLowerCase().includes(q) || 
          e.mountain_name.toLowerCase().includes(q)
      );
    }

    const sorted = [...result];
    if (sortKey === "updated") {
      sorted.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    } else if (sortKey === "start_date") {
      sorted.sort((a, b) => {
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      });
    } else {
      sorted.sort((a, b) => {
        // safely fallback to mountain_name if title is null during A-Z sorting
        const titleA = a.title || a.mountain_name;
        const titleB = b.title || b.mountain_name;
        return titleA.localeCompare(titleB);
      });
    }

    return sorted;
  }, [expeditions, statusFilter, query, sortKey]);

  const counts = useMemo(() => {
    return {
      all: expeditions.length,
      draft: expeditions.filter((e) => e.status === "draft").length,
      published: expeditions.filter((e) => e.status === "published").length,
      completed: expeditions.filter((e) => e.status === "completed").length,
      cancelled: expeditions.filter((e) => e.status === "cancelled").length,
    };
  }, [expeditions]);

  // Render
  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        {errorMessage && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-800">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="shrink-0 text-sm font-medium text-red-700 hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        )}

        <Toolbar
          query={query}
          onQueryChange={setQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          counts={counts}
        />

        <div className="mt-6">
          {isLoading ? (
            <LoadingGrid />
          ) : filteredExpeditions.length === 0 ? (
            <EmptyState 
              hasAnyExpeditions={expeditions.length > 0} 
              onClearFilters={() => {
                setQuery("");
                setStatusFilter("all");
              }} 
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredExpeditions.map((expedition) => (
    <ExpeditionCard
      key={expedition.id}
      expedition={expedition}
      isPending={pendingId === expedition.id}
      confirmingCancel={confirmCancelId === expedition.id}
      onTogglePublish={() => togglePublish(expedition)}
      onRequestCancel={() => setConfirmCancelId(expedition.id)}
      onDismissCancel={() => setConfirmCancelId(null)}
      onConfirmCancel={() => cancelExpedition(expedition.id)}
    />
  ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}