"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Booking } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JoinedBooking {
  id: string;
  booking_status: string;
  payment_status: string;
  final_price: number;
  booking_date: string;
  requirements_completed: boolean;
  expeditions: {
    id: number;
    mountain_name: string;
    start_date: string;
    mountain_img_url: string | null;
  } | null;
}

interface BookingSectionProps {
  id?: string; // The '?' makes it optional. Remove it if it is required.
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    completed: "bg-sky-100 text-sky-800 border-sky-200",
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    "not paid": "bg-stone-100 text-stone-600 border-stone-200",
    "action required": "bg-red-50 text-red-700 border-red-200 animate-pulse",
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${map[status] ?? "bg-stone-100 text-stone-700 border-stone-200"}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookingSection({id}:BookingSectionProps) {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  const [bookings, setBookings] = useState<JoinedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Track which booking is currently being cancelled to show a loading state
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyBookings = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            booking_status,
            payment_status,
            final_price,
            booking_date,
            requirements_completed,
            expeditions (
              id,
              mountain_name,
              start_date,
              mountain_img_url
            )
          `)
          .eq("hiker_id", user.id)
          .neq("booking_status", "cancelled")
          .order("booking_date", { ascending: false }); 

        if (error) throw error;
        setBookings(data as unknown as JoinedBooking[]);

      } catch (err: any) {
        console.error("Error fetching bookings:", err);
        setErrorMsg("Failed to load your bookings. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyBookings();
  }, [router, supabase]);

  // ─── Cancel Function ────────────────────────────────────────────────────────

const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    setCancellingId(bookingId);
    setErrorMsg("");

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ booking_status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;

      // 👈 CHANGE THIS BLOCK
      // Instantly remove it from the screen without needing a refresh
      setBookings((prevBookings) =>
        prevBookings.filter((b) => b.id !== bookingId)
      );

    } catch (err: any) {
      console.error("Failed to cancel booking:", err);
      alert("Failed to cancel the booking. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  // ─── UI Rendering ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center text-stone-400 gap-3">
        <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-medium">Loading your adventures...</span>
      </div>
    );
  }

  return (
    <div id={id} className="min-h-screen bg-stone-50 scroll-mt-17">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-stone-800 tracking-tight">My Bookings</h1>
          <p className="text-stone-500 mt-2">Manage your upcoming climbs and view past expeditions.</p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Bookings List */}
        {!loading && bookings.length === 0 && !errorMsg ? (
          <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-stone-800 mb-1">No bookings yet</h3>
            <p className="text-stone-500 mb-6 max-w-sm">You haven't booked any expeditions yet. Ready for an adventure?</p>
            <Link 
              href="/" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors"
            >
              Discover Climbs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {bookings.map((booking) => {
              const mountainName = booking.expeditions?.mountain_name || "Unknown Mountain";
              const startDate = booking.expeditions?.start_date 
                ? new Date(booking.expeditions.start_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) 
                : "Date TBA";
                
              const isCancelled = booking.booking_status === "cancelled";

              return (
                <div key={booking.id} className={`bg-white rounded-2xl border border-stone-200 p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center hover:shadow-md transition-shadow ${isCancelled ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                  
                  {/* Thumbnail */}
                  <div className="w-full sm:w-32 h-32 sm:h-24 bg-stone-100 rounded-xl shrink-0 overflow-hidden relative">
                    {booking.expeditions?.mountain_img_url ? (
                      <img 
                        src={booking.expeditions.mountain_img_url} 
                        alt={mountainName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14 6l-4 5.5-2.5-3.5-5 7h19z"/></svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      
                      {/* 👈 4. ADD THE CONDITION HERE */}
                      <StatusPill status={booking.payment_status} />
                      
                      {!booking.requirements_completed && (
                        <StatusPill status="action required" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-stone-800 leading-tight">{mountainName}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {startDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                        ID: {booking.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="w-full sm:w-auto flex flex-col sm:items-end justify-between gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-stone-100 mt-2 sm:mt-0">
                    <div className="flex w-full justify-between sm:justify-end items-center sm:items-start gap-4">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-0.5">Total</p>
                        <p className={`text-lg font-black ${isCancelled ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                          ₱{Number(booking.final_price).toLocaleString("en-PH")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2 w-full sm:w-auto">
                      {booking.expeditions?.id && (
                        <Link 
                          href={`/expeditions/${booking.expeditions.id}`}
                          className="flex-1 sm:flex-none text-center bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                        >
                          View
                        </Link>
                      )}
                      <Link 
                        href={`/hiker/manage-booking/${booking.id}`}
                        className="flex-1 sm:flex-none text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        Manage
                      </Link>
                      
                      {/* Cancel Button - Only show if not already cancelled */}
                      {!isCancelled && (
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="flex-1 sm:flex-none text-center bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                        >
                          {cancellingId === booking.id ? "..." : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}