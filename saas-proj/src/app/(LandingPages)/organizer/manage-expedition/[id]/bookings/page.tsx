"use client";

import { useState, useEffect, use } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booking {
  id: string;
  hiker_id: string; // <-- From your schema
  participant_name: string;
  participant_email: string | null;
  participant_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_conditions: string | null;
  booking_status: string;
  payment_status: string;
  final_price: number;
  booking_date: string;
  expedition_id: string;
  valid_id_url: string | null;
  medical_certificate_url: string | null;
  signed_waiver_url: string | null;
  parent_consent_url: string | null;
  requirements_completed: boolean | null;
  // The joined data will land here
  users?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface Expedition {
  id: string;
  organizer_id: string;
  mountain_name: string;
  title: string | null;
  difficulty_level: string;
  start_date: string;
  end_date: string;
  status: string;
}

// ─── Small UI helpers ───────────────────────────────────────────────────────

// Helper to strictly use the users table for the full name
function getFullName(booking: Booking): string {
  if (booking.users && booking.users.first_name && booking.users.last_name) {
    return `${booking.users.first_name} ${booking.users.last_name}`;
  }
  return "Unknown Participant";
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    "not paid": "bg-red-100 text-red-800 border-red-200",
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
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

function DocBadge({ ok, label, required }: { ok: boolean; label: string; required: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
        ok
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : required
          ? "bg-red-50 text-red-500 border-red-200"
          : "bg-stone-50 text-stone-400 border-stone-200"
      }`}
    >
      {ok ? "✓" : "—"} {label}
    </span>
  );
}

// ─── Export logic ───────────────────────────────────────────────────────────

function exportPersonalInfoCSV(bookings: Booking[], expeditionTitle: string, isSingle: boolean = false) {
  const headers = [
    "Full Name",
    "Phone Number",
    "Email Address",
    "Emergency Contact Name",
    "Emergency Contact Phone",
    "Medical Conditions",
  ];

  const escapeCSV = (str: string | null) => {
    if (!str) return '""';
    return `"${str.replace(/"/g, '""')}"`; 
  };

  const rows = bookings.map((b) => [
    escapeCSV(getFullName(b)),
    escapeCSV(b.participant_phone),
    escapeCSV(b.participant_email),
    escapeCSV(b.emergency_contact_name),
    escapeCSV(b.emergency_contact_phone),
    escapeCSV(b.medical_conditions),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  
  const fileNamePrefix = isSingle ? getFullName(bookings[0]).replace(/[^\w-]+/g, "_") : expeditionTitle.replace(/[^\w-]+/g, "_");
  link.setAttribute("download", `${fileNamePrefix}_Info.csv`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function exportDocumentsPDF(bookings: Booking[], expeditionTitle: string) {
  const masterPdf = await PDFDocument.create();
  const fontBold = await masterPdf.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await masterPdf.embedFont(StandardFonts.Helvetica);

  for (const booking of bookings) {
    const fullName = getFullName(booking);

    // 1. Create a cover sheet for the participant
    const coverPage = masterPdf.addPage([595.28, 841.89]); 
    coverPage.drawText(`Participant Documents`, { x: 50, y: 760, size: 16, font: fontNormal, color: rgb(0.4, 0.4, 0.4) });
    coverPage.drawText(fullName, { x: 50, y: 730, size: 26, font: fontBold });
    coverPage.drawText(`Booking ID: ${booking.id}`, { x: 50, y: 700, size: 12, font: fontNormal });

    const docs = [
      { label: "Valid ID", url: booking.valid_id_url },
      { label: "Medical Certificate", url: booking.medical_certificate_url },
      { label: "Signed Waiver", url: booking.signed_waiver_url },
      { label: "Parent/Guardian Consent", url: booking.parent_consent_url },
    ];

    let yOffset = 640;

    // 2. Fetch and embed each document
    for (const doc of docs) {
      if (!doc.url) {
        coverPage.drawText(`- ${doc.label}: Not provided`, { x: 50, y: yOffset, size: 12, font: fontNormal, color: rgb(0.5, 0.5, 0.5) });
        yOffset -= 25;
        continue;
      }

      coverPage.drawText(`- ${doc.label}: Embedded below`, { x: 50, y: yOffset, size: 12, font: fontBold, color: rgb(0, 0.5, 0) });
      yOffset -= 25;

      try {
        const res = await fetch(doc.url);
        const arrayBuffer = await res.arrayBuffer();
        const contentType = res.headers.get("content-type") || "";
        const urlLower = doc.url.toLowerCase();

        // Check if the uploaded file is a PDF
        if (contentType.includes("pdf") || urlLower.endsWith(".pdf")) {
          const separatorPage = masterPdf.addPage([595.28, 841.89]);
          separatorPage.drawText(`Document:`, { x: 50, y: 450, size: 16, font: fontNormal, color: rgb(0.4, 0.4, 0.4) });
          separatorPage.drawText(doc.label, { x: 50, y: 410, size: 32, font: fontBold });
          separatorPage.drawText(`Participant: ${fullName}`, { x: 50, y: 380, size: 14, font: fontNormal });

          const docToMerge = await PDFDocument.load(arrayBuffer);
          const copiedPages = await masterPdf.copyPages(docToMerge, docToMerge.getPageIndices());
          copiedPages.forEach((p) => masterPdf.addPage(p));
        } 
        // Check if the uploaded file is an Image
        else if (contentType.includes("image") || /\.(jpe?g|png|webp)/i.test(urlLower)) {
          let embeddedImage;
          if (contentType.includes("png") || urlLower.endsWith(".png")) {
            embeddedImage = await masterPdf.embedPng(arrayBuffer);
          } else {
            embeddedImage = await masterPdf.embedJpg(arrayBuffer);
          }

          const imgPage = masterPdf.addPage([595.28, 841.89]);
          
          imgPage.drawText(`${doc.label}`, { x: 50, y: 800, size: 18, font: fontBold });
          imgPage.drawText(`Participant: ${fullName}`, { x: 50, y: 780, size: 12, font: fontNormal, color: rgb(0.4, 0.4, 0.4) });
          imgPage.drawLine({ start: { x: 50, y: 765 }, end: { x: 545.28, y: 765 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

          const { width, height } = embeddedImage.scaleToFit(495.28, 700); 
          
          imgPage.drawImage(embeddedImage, {
            x: 50 + (495.28 - width) / 2, 
            y: 750 - height,      
            width,
            height,
          });
        }
      } catch (err) {
        console.error(`Failed to process ${doc.label}`, err);
        coverPage.drawText(`  (Error loading file: URL unreachable or CORS blocked)`, { x: 70, y: yOffset, size: 10, font: fontNormal, color: rgb(0.8, 0, 0) });
        yOffset -= 20;
      }
    }
  }

  const pdfBytes = await masterPdf.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);
  
  window.open(blobUrl, "_blank"); 
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: expeditionId } = use(params);
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  const [expedition, setExpedition] = useState<Expedition | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [exportingDocsId, setExportingDocsId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: expeditionData, error: expeditionErr } = await supabase
          .from("expeditions")
          .select("id, organizer_id, mountain_name, title, difficulty_level, start_date, end_date, status")
          .eq("id", expeditionId)
          .single();

        if (expeditionErr) {
          setErrorMsg("Expedition not found or you don't have access to it.");
          setLoading(false);
          return;
        }
        setExpedition(expeditionData);

        // Fetch bookings and natively join the users table using the explicit foreign key
        const { data: bookingsData, error: bookingsErr } = await supabase
          .from("bookings")
          .select(`
            *,
            users!bookings_hiker_id_fkey (
              first_name,
              last_name
            )
          `)
          .eq("expedition_id", expeditionId)
          .order("booking_date", { ascending: false });

        if (bookingsErr) {
          console.error("Supabase error:", bookingsErr);
          setErrorMsg("Failed to load bookings for this expedition.");
          setLoading(false);
          return;
        }

        setBookings((bookingsData as Booking[]) ?? []);
      } catch (err) {
        console.error(err);
        setErrorMsg("Something went wrong loading this expedition's bookings.");
      } finally {
        setLoading(false);
      }
    })();
  }, [expeditionId, router, supabase]);

  const expeditionTitle: string = expedition?.title || expedition?.mountain_name || "Expedition";

  async function handleExportAllPersonalInfo() {
    if (bookings.length === 0) return;
    setIsExportingCSV(true);
    try {
      exportPersonalInfoCSV(bookings, expeditionTitle, false);
    } finally {
      setIsExportingCSV(false);
    }
  }

  async function handleExportOneParticipantInfo(booking: Booking) {
    setIsExportingCSV(true);
    try {
      exportPersonalInfoCSV([booking], expeditionTitle, true);
    } finally {
      setIsExportingCSV(false);
    }
  }

  async function handleExportAllDocuments() {
    if (bookings.length === 0) return;
    setExportingDocsId("all");
    try {
      await exportDocumentsPDF(bookings, expeditionTitle);
    } finally {
      setExportingDocsId(null);
    }
  }

  async function handleExportOneParticipantDocuments(booking: Booking) {
    setExportingDocsId(booking.id);
    try {
      await exportDocumentsPDF([booking], expeditionTitle);
    } finally {
      setExportingDocsId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-stone-400">
          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading bookings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-stone-400 hover:text-stone-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-stone-400">/</span>
          <span className="text-sm font-semibold text-stone-700">{expeditionTitle} — Bookings</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {errorMsg && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            <svg className="w-5 h-5 mt-0.5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{errorMsg}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-stone-800">{expeditionTitle}</h1>
            <p className="text-sm text-stone-500 capitalize">
              {bookings.length} booking{bookings.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportAllPersonalInfo}
              disabled={bookings.length === 0 || isExportingCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 disabled:opacity-50 transition-all shadow-sm"
            >
              Export All Info (CSV)
            </button>
            <button
              onClick={handleExportAllDocuments}
              disabled={bookings.length === 0 || exportingDocsId !== null}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
                bookings.length === 0 || exportingDocsId !== null
                  ? "bg-emerald-300 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 active:scale-[.99] shadow-md shadow-emerald-200"
              }`}
            >
              {exportingDocsId === "all" ? "Generating..." : "Export All Documents (PDF)"}
            </button>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-sm text-stone-500">
            No bookings yet for this expedition.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Booking ID</p>
                    <p className="text-sm font-mono text-stone-600">{booking.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusPill status={booking.booking_status} />
                    <StatusPill status={booking.payment_status} />
                    
                    <button
                      type="button"
                      onClick={() => handleExportOneParticipantInfo(booking)}
                      disabled={isExportingCSV}
                      className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                    >
                      Export Info
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleExportOneParticipantDocuments(booking)}
                      disabled={exportingDocsId !== null}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      {exportingDocsId === booking.id ? "Opening..." : "View Documents"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
                  <div>
                    <p className="text-xs text-stone-400 mb-0.5">Participant</p>
                    {/* Render the full name pulled from the users table */}
                    <p className="text-sm font-semibold text-stone-800">{getFullName(booking)}</p>
                    <p className="text-xs text-stone-400">{booking.participant_email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 mb-0.5">Amount</p>
                    <p className="text-sm font-semibold text-stone-800">
                      ₱{Number(booking.final_price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-100">
                  <DocBadge ok={!!booking.valid_id_url} label="Valid ID" required />
                  <DocBadge ok={!!booking.medical_certificate_url} label="Medical Cert" required />
                  <DocBadge ok={!!booking.signed_waiver_url} label="Signed Waiver" required />
                  <DocBadge ok={!!booking.parent_consent_url} label="Parent Consent" required={false} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}