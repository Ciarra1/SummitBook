"use client";

// 1. UPDATED: Added 'use' to unwrap the params Promise
import { useState, useRef, useEffect, use } from "react"; 
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingFormData {
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_conditions: string;
  date_of_birth: string;
  age: number | null;
  sex: string;
  med_certificate: File | null;
  valid_id: File | null;
  signed_waiver: File | null;
  parent_consent: File | null;
  waiver_acknowledged: boolean;
}

interface Booking {
  id: string;
  participant_name: string;
  participant_email: string;
  participant_phone: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_conditions: string | null;
  date_of_birth: string | null;
  age: number | null;
  sex: string | null;
  booking_status: string;
  payment_status: string;
  final_price: number;
  booking_date: string;
  expedition_id: string;
}

// ─── Downloadable template PDFs ───────────────────────────────────────────────

const DOCUMENT_TEMPLATES = {
  signed_waiver: "/documents/waiver-template.pdf",
  parent_consent: "/documents/parent-consent-template.pdf",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHikerAge(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const today = new Date();
  const dob = new Date(birthdate);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    completed: "bg-sky-100 text-sky-800 border-sky-200",
    failed: "bg-red-100 text-red-800 border-red-200",
    refunded: "bg-purple-100 text-purple-800 border-purple-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${
        map[status] ?? "bg-stone-100 text-stone-700 border-stone-200"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-stone-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
      {hint && (
        <span className="block text-xs font-normal text-stone-400 mt-0.5">
          {hint}
        </span>
      )}
    </label>
  );
}

function FileUploadField({
  id,
  label,
  accept,
  required,
  hint,
  value,
  onChange,
  downloadTemplate,
  downloadLabel,
}: {
  id: string;
  label: string;
  accept: string;
  required?: boolean;
  hint?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  downloadTemplate?: string;
  downloadLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <FieldLabel required={required} hint={hint}>
        {label}
      </FieldLabel>

      {downloadTemplate && (
        <a
          href={downloadTemplate}
          download
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900 underline underline-offset-2 mb-2 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {downloadLabel ?? "Download template PDF"}
        </a>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all
          ${
            value
              ? "border-emerald-400 bg-emerald-50"
              : "border-stone-300 bg-stone-50 hover:border-emerald-400 hover:bg-emerald-50/40"
          }
        `}
      >
        {value ? (
          <>
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-emerald-800 text-center break-all px-2">
              {value.name}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <svg className="w-7 h-7 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-stone-500">
              <span className="font-semibold text-stone-700">Click to upload</span> or drag & drop
            </p>
            <p className="text-xs text-stone-400">{accept.replace(/,/g, " ·")}</p>
          </>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function page({
  params,
}: {
  // 2. UPDATED: Explicitly type params as a Promise for Next.js consistency
  params: Promise<{ bookingId: string }>;
}) {
  // 3. UPDATED: Safely unwrap the bookingId out of the params Promise using React.use()
  const { bookingId } = use(params);

  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [hikerAge, setHikerAge] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState<BookingFormData>({
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_conditions: "",
    date_of_birth: "",
    age: null,
    sex: "",
    med_certificate: null,
    valid_id: null,
    signed_waiver: null,
    parent_consent: null,
    waiver_acknowledged: false,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        // 4. UPDATED: Replaced params.bookingId with the unwrapped bookingId
        const { data: bookingData, error: bookingErr } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .eq("hiker_id", user.id)
          .single();

        if (bookingErr || !bookingData) {
          setErrorMsg("Booking not found or you don't have access to it.");
          setLoading(false);
          return;
        }

        setBooking(bookingData);

        setForm((f) => ({
          ...f,
          emergency_contact_name: bookingData.emergency_contact_name ?? "",
          emergency_contact_phone: bookingData.emergency_contact_phone ?? "",
          medical_conditions: bookingData.medical_conditions ?? "",
          date_of_birth: bookingData.date_of_birth ?? "",
          age: bookingData.age ?? null,
          sex: bookingData.sex ?? "",
        }));

        const { data: userData } = await supabase
          .from("users")
          .select("birthdate")
          .eq("id", user.id)
          .single();

        const initialDob = bookingData.date_of_birth ?? userData?.birthdate ?? null;
        if (initialDob) {
          setHikerAge(getHikerAge(initialDob));
        }
      } catch (err) {
        setErrorMsg("Something went wrong loading your booking.");
      } finally {
        setLoading(false);
      }
    })();
    // 5. UPDATED: Used bookingId directly in the dependencies array
  }, [bookingId, router, supabase]);

  async function uploadFile(
    bucket: string,
    path: string,
    file: File
  ): Promise<string | null> {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;

    if (!form.emergency_contact_name.trim()) {
      setErrorMsg("Emergency contact name is required.");
      return;
    }
    if (!form.emergency_contact_phone.trim()) {
      setErrorMsg("Emergency contact phone is required.");
      return;
    }
    if (!form.med_certificate) {
      setErrorMsg("Medical certificate is required.");
      return;
    }
    if (!form.valid_id) {
      setErrorMsg("Valid ID is required.");
      return;
    }
    if (!form.signed_waiver) {
      setErrorMsg("Signed waiver is required.");
      return;
    }
    if (hikerAge !== null && hikerAge < 18 && !form.parent_consent) {
      setErrorMsg("Parent/guardian consent form is required for hikers under 18.");
      return;
    }
    if (!form.waiver_acknowledged) {
      setErrorMsg("Please acknowledge the waiver before submitting.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const basePath = `bookings/${booking.id}`;

      const [medCertUrl, validIdUrl, waiverUrl, parentConsentUrl] =
        await Promise.all([
          uploadFile("booking_documents", `${basePath}/med-certificate`, form.med_certificate!),
          uploadFile("booking_documents", `${basePath}/valid-id`, form.valid_id!),
          uploadFile("booking_documents", `${basePath}/signed-waiver`, form.signed_waiver!),
          form.parent_consent
            ? uploadFile("booking_documents", `${basePath}/parent-consent`, form.parent_consent)
            : Promise.resolve(null),
        ]);

      const { error: updateErr } = await supabase
        .from("bookings")
        .update({
          emergency_contact_name: form.emergency_contact_name.trim(),
          emergency_contact_phone: form.emergency_contact_phone.trim(),
          medical_conditions: form.medical_conditions.trim() || null,
          date_of_birth: form.date_of_birth || null,
          age: form.age ?? null,
          sex: form.sex || null,
          medical_certificate_url: medCertUrl,
          valid_id_url: validIdUrl,
          signed_waiver_url: waiverUrl,
          parent_consent_url: parentConsentUrl,
          requirements_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (updateErr) throw updateErr;

      setSuccessMsg("Your booking details have been saved successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-stone-400">
          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading your booking…</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-stone-800">Booking not found</h2>
          <p className="text-sm text-stone-500">{errorMsg}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const isMinor = hikerAge !== null && hikerAge < 18;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-stone-400 hover:text-stone-700 transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-stone-400">/</span>
          <span className="text-sm font-semibold text-stone-700">Manage Booking</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {successMsg && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            <svg className="w-5 h-5 mt-0.5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            <svg className="w-5 h-5 mt-0.5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{errorMsg}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
                Booking ID
              </p>
              <p className="text-sm font-mono text-stone-600">{booking.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <StatusPill status={booking.booking_status} />
              <StatusPill status={booking.payment_status} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Participant</p>
              <p className="text-sm font-semibold text-stone-800">{booking.participant_name}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Amount</p>
              <p className="text-sm font-semibold text-stone-800">
                ₱{Number(booking.final_price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Booked on</p>
              <p className="text-sm font-semibold text-stone-800">
                {new Date(booking.booking_date).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {isMinor && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hiker is under 18 — parent/guardian consent is required.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-stone-800">Hiker Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Date of birth</FieldLabel>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      date_of_birth: e.target.value,
                      age: getHikerAge(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <FieldLabel>Age</FieldLabel>
                <input
                  type="number"
                  value={form.age ?? ''}
                  readOnly
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Sex</FieldLabel>
              <select
                value={form.sex}
                onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              >
                <option value="">Select sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-stone-800">Emergency Contact</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Full name</FieldLabel>
                <input
                  type="text"
                  value={form.emergency_contact_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, emergency_contact_name: e.target.value }))
                  }
                  placeholder="Juan dela Cruz"
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <FieldLabel required>
                  Phone number
                </FieldLabel>
                <input
                  type="tel"
                  value={form.emergency_contact_phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, emergency_contact_phone: e.target.value }))
                  }
                  placeholder="+63 9XX XXX XXXX"
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <FieldLabel hint="List any allergies, conditions, or medications we should know about. Leave blank if none.">
                Medical conditions or notes
              </FieldLabel>
              <textarea
                value={form.medical_conditions}
                onChange={(e) =>
                  setForm((f) => ({ ...f, medical_conditions: e.target.value }))
                }
                rows={3}
                placeholder="e.g. Asthma — carries inhaler. No known allergies."
                className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-stone-800">Required Documents</h2>
            </div>

            <FileUploadField
              id="med_certificate"
              label="Medical certificate"
              accept=".jpg,.jpeg,.png,.pdf"
              required
              hint="Must be issued within the last 6 months."
              value={form.med_certificate}
              onChange={(f) => setForm((s) => ({ ...s, med_certificate: f }))}
            />

            <FileUploadField
              id="valid_id"
              label="Valid government-issued ID"
              accept=".jpg,.jpeg,.png,.pdf"
              required
              hint="Passport, PhilSys, driver's license, or any UMID."
              value={form.valid_id}
              onChange={(f) => setForm((s) => ({ ...s, valid_id: f }))}
            />

            <FileUploadField
              id="signed_waiver"
              label="Signed liability waiver"
              accept=".pdf"
              required
              hint="Download the template, sign it, then upload the signed copy."
              value={form.signed_waiver}
              onChange={(f) => setForm((s) => ({ ...s, signed_waiver: f }))}
              downloadTemplate={DOCUMENT_TEMPLATES.signed_waiver}
              downloadLabel="Download waiver template (PDF)"
            />

            {isMinor && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                  Under-18 requirement
                </p>
                <FileUploadField
                  id="parent_consent"
                  label="Parent / guardian consent form"
                  accept=".pdf"
                  required
                  hint="Download the form, have a parent or guardian sign it, then upload the signed copy."
                  value={form.parent_consent}
                  onChange={(f) => setForm((s) => ({ ...s, parent_consent: f }))}
                  downloadTemplate={DOCUMENT_TEMPLATES.parent_consent}
                  downloadLabel="Download consent form (PDF)"
                />
              </div>
            )}
          </section>

          <div className="flex items-start gap-3 px-1">
            <input
              id="waiver_ack"
              type="checkbox"
              checked={form.waiver_acknowledged}
              onChange={(e) =>
                setForm((f) => ({ ...f, waiver_acknowledged: e.target.checked }))
              }
              className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="waiver_ack" className="text-sm text-stone-600 cursor-pointer leading-relaxed">
              I have read, understood, and accept the terms of the liability waiver. I confirm
              that all information and documents provided are accurate and complete.
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`
              w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl text-sm font-bold text-white transition-all
              ${
                saving
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 active:scale-[.99] shadow-md shadow-emerald-200"
              }
            `}
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M5 13l4 4L19 7" />
                </svg>
                Save booking details
              </>
            )}
          </button>
        </form>

        <div className="h-8" />
      </div>
    </div>
  );
}