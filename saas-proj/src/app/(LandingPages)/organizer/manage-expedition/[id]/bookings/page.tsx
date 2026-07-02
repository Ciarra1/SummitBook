"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

// Types based on your schema
type ExpeditionOverview = {
  id: string;
  title: string | null;
  mountain_name: string;
  start_date: string;
  end_date: string;
  total_van_slots: number;
  booked_slots: number;
  price_per_person: number;
  status: string;
};

type Booking = {
  id: string;
  participant_name: string;
  participant_email: string | null;
  participant_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_conditions: string | null;
  booking_status: "pending" | "confirmed" | "cancelled";
  payment_status: "paid" | "not paid";
  payment_method: string | null;
  paymongo_payment_id: string | null;
  final_price: number;
  requirements_completed: boolean;
  valid_id_url: string | null;
  medical_certificate_url: string | null;
  signed_waiver_url: string | null;
  parent_consent_url: string | null;
  booking_date: string;
  payment_completed_at: string | null;
  date_of_birth: string | null;
  age: number | null;
  sex: string | null;
  // Joined from public.users via bookings_hiker_id_fkey
  users?: {
    first_name: string;
    last_name: string;
  } | null;
};

// Resolve the participant's display name: prefer the linked user account
// (public.users.first_name / last_name), fall back to the name captured
// on the booking itself for guest/legacy bookings.
function getParticipantName(booking: Booking): string {
  const first = booking.users?.first_name?.trim();
  const last = booking.users?.last_name?.trim();
  const joined = [first, last].filter(Boolean).join(" ");
  return joined || booking.participant_name || "Unnamed participant";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<Booking["booking_status"], string> = {
  confirmed: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  cancelled: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
};

const STATUS_DOT: Record<Booking["booking_status"], string> = {
  confirmed: "bg-emerald-500",
  pending: "bg-amber-500",
  cancelled: "bg-red-500",
};

function DocumentPill({
  label,
  url,
}: {
  label: string;
  url: string | null;
}) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        {label}
      </a>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400">
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      {label}
    </span>
  );
}

export default function ManageBookingsPage() {
  const params = useParams();
  const router = useRouter();
  const expeditionId = params.id as string;
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [expedition, setExpedition] = useState<ExpeditionOverview | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/signin");

      const { data: profile } = await supabase
        .from("organizer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      // 1. Fetch expedition
      const { data: expData, error: expError } = await supabase
        .from("expeditions")
        .select(
          "id, title, mountain_name, start_date, end_date, total_van_slots, booked_slots, price_per_person, status"
        )
        .eq("id", expeditionId)
        .eq("organizer_id", profile.id)
        .single();

      if (expError || !expData) {
        if (isMounted) {
          setErrorMessage("Expedition not found or unauthorized.");
          setIsLoading(false);
        }
        return;
      }

      // 2. Fetch bookings, joined with the hiker's user profile
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(
          `
          *,
          users!bookings_hiker_id_fkey(first_name, last_name)
        `
        )
        .eq("expedition_id", expeditionId)
        .order("booking_date", { ascending: false });

      if (!isMounted) return;

      if (bookingsError) {
        setErrorMessage("Could not load the participant roster. Please refresh and try again.");
        setIsLoading(false);
        return;
      }

      setExpedition(expData);
      setBookings(bookingsData || []);
      setIsLoading(false);
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [supabase, expeditionId, router]);

  // Lock background scroll while the details modal is open
  useEffect(() => {
    document.body.style.overflow = selectedBooking ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedBooking]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="bg-white border-b border-stone-200 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl animate-pulse">
            <div className="h-4 w-32 rounded bg-stone-200" />
            <div className="mt-6 h-7 w-72 rounded bg-stone-200" />
            <div className="mt-3 h-4 w-48 rounded bg-stone-200" />
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg border border-stone-100 bg-stone-100" />
              ))}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-96 animate-pulse rounded-xl border border-stone-200 bg-white" />
        </div>
      </div>
    );
  }

  if (errorMessage || !expedition) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-stone-700">{errorMessage || "Something went wrong."}</p>
          <Link href="/organizer" className="mt-4 inline-block text-sm font-medium text-stone-900 underline underline-offset-2">
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalRevenue = bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + Number(b.final_price), 0);
  const confirmedCount = bookings.filter((b) => b.booking_status === "confirmed").length;

  const stats = [
    {
      label: "Confirmed Slots",
      value: (
        <>
          {confirmedCount}
          <span className="text-sm font-normal text-stone-400"> / {expedition.total_van_slots}</span>
        </>
      ),
      valueClass: "text-stone-900",
    },
    {
      label: "Total Bookings",
      value: bookings.length,
      valueClass: "text-stone-900",
    },
    {
      label: "Collected Revenue",
      value: <>₱{totalRevenue.toLocaleString()}</>,
      valueClass: "text-emerald-600",
    },
    {
      label: "Expedition Status",
      value: expedition.status,
      valueClass: "text-stone-900 capitalize",
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* --- HEADER & OVERVIEW --- */}
      <div className="bg-white border-b border-stone-200 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/organizer"
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to expeditions
          </Link>

          <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                {expedition.title || expedition.mountain_name}
              </h1>
              <p className="mt-1 text-stone-500">
                {formatDate(expedition.start_date)} – {formatDate(expedition.end_date)}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-stone-100 bg-stone-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{stat.label}</p>
                <p className={`mt-1 text-2xl font-semibold ${stat.valueClass}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- BOOKINGS TABLE --- */}
      <main className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-5">
            <h2 className="text-lg font-semibold text-stone-900">Participant Roster ({bookings.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="border-b border-stone-200 bg-white text-stone-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Participant</th>
                  <th className="px-6 py-4 font-medium">Contact & Emergency</th>
                  <th className="px-6 py-4 font-medium">Requirements</th>
                  <th className="px-6 py-4 font-medium">Payment</th>
                  <th className="px-6 py-4 font-medium">Booking Status</th>
                  <th className="px-6 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <p className="text-stone-500">No bookings yet for this expedition.</p>
                      <p className="mt-1 text-sm text-stone-400">New bookings will appear here as hikers sign up.</p>
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => {
                    const fullName = getParticipantName(booking);

                    return (
                      <tr key={booking.id} className="transition-colors hover:bg-stone-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
                              {getInitials(fullName)}
                            </div>
                            <div>
                              <p className="font-semibold text-stone-900">{fullName}</p>
                              <p className="mt-0.5 text-xs text-stone-400">Booked {formatDate(booking.booking_date)}</p>
                              {(booking.sex || booking.age != null || booking.date_of_birth) && (
                                <p className="mt-0.5 text-xs text-stone-400">
                                  {booking.sex ? `${booking.sex}` : "Sex not set"}
                                  {booking.age != null ? ` • ${booking.age} yrs` : ""}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-stone-900">{booking.participant_phone || "N/A"}</p>
                          {booking.emergency_contact_name && (
                            <p className="mt-0.5 text-xs text-stone-500">ICE: {booking.emergency_contact_name}</p>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {booking.requirements_completed ? (
                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                              Pending Docs
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              booking.payment_status === "paid"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {booking.payment_status === "paid" ? "✓ Paid" : "Not Paid"}
                          </span>
                          <p className="mt-1 text-xs text-stone-500">₱{Number(booking.final_price).toLocaleString()}</p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                              STATUS_STYLES[booking.booking_status]
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[booking.booking_status]}`} />
                            {booking.booking_status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- PARTICIPANT BOOKING DETAILS MODAL --- */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-6 py-4">
              <h3 className="text-lg font-bold text-stone-900">Participant Booking Details</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                aria-label="Close"
                className="rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[calc(90vh-136px)] overflow-y-auto px-6 py-6">
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">
                    {getInitials(getParticipantName(selectedBooking))}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-stone-900">{getParticipantName(selectedBooking)}</p>
                    <p className="text-sm text-stone-500">Booked on {formatDate(selectedBooking.booking_date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                      STATUS_STYLES[selectedBooking.booking_status]
                    }`}
                  >
                    {selectedBooking.booking_status}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                      selectedBooking.payment_status === "paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {selectedBooking.payment_status === "paid" ? "Paid" : "Unpaid"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-stone-400">Contact Info</h4>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="mb-0.5 text-stone-500">Full Name</p>
                      <p className="font-medium text-stone-900">{getParticipantName(selectedBooking)}</p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-stone-500">Phone Number</p>
                      <p className="font-medium text-stone-900">{selectedBooking.participant_phone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-stone-500">Email Address</p>
                      <p className="font-medium text-stone-900">{selectedBooking.participant_email || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-stone-500">Date of Birth</p>
                      <p className="font-medium text-stone-900">
                        {selectedBooking.date_of_birth
                          ? new Date(selectedBooking.date_of_birth).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-stone-500">Age / Sex</p>
                      <p className="font-medium text-stone-900">
                        {selectedBooking.age != null ? `${selectedBooking.age} yrs` : "Age not provided"}
                        {selectedBooking.sex ? ` • ${selectedBooking.sex}` : ""}
                      </p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-stone-500">Payment Amount</p>
                      <p className="font-medium text-stone-900">
                        ₱{Number(selectedBooking.final_price).toLocaleString()}
                        {selectedBooking.payment_method ? ` (via ${selectedBooking.payment_method.toUpperCase()})` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-stone-400">Safety & Emergency</h4>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="mb-0.5 text-stone-500">In Case of Emergency (ICE)</p>
                      <p className="font-medium text-stone-900">
                        {selectedBooking.emergency_contact_name || "N/A"}
                        <br />
                        {selectedBooking.emergency_contact_phone || ""}
                      </p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-stone-500">Medical Conditions</p>
                      <p className={`font-medium ${selectedBooking.medical_conditions ? "text-red-600" : "text-stone-900"}`}>
                        {selectedBooking.medical_conditions || "None reported"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 md:col-span-2">
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-stone-400">Required Documents</h4>
                  <div className="flex flex-wrap gap-3">
                    <DocumentPill label="Valid ID" url={selectedBooking.valid_id_url} />
                    <DocumentPill label="Signed Waiver" url={selectedBooking.signed_waiver_url} />
                    <DocumentPill label="Medical Cert" url={selectedBooking.medical_certificate_url} />
                    {selectedBooking.parent_consent_url !== undefined && (
                      <DocumentPill label="Parent Consent" url={selectedBooking.parent_consent_url} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-stone-100 bg-stone-50 px-6 py-4">
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg bg-stone-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
