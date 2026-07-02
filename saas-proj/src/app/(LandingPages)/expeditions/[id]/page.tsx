// app/(LandingPages)/expeditions/[id]/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ExpeditionTabPanel, GalleryCollage } from "@/components/ExpeditionTabs";
import BookNowButton from "@/components/BookNowButton";
// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string) {
  const d = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;
  return d === 1 ? "1 day" : `${d} days`;
}

const DIFF_PILL: Record<string, string> = {
  beginner:     "bg-green-100  text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced:     "bg-red-100    text-red-700",
};

// ─── Stat row ─────────────────────────────────────────────────────────────────

function StatRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-gray-400 shrink-0 w-32 pt-px">{label}</span>
      <span className="font-semibold text-gray-800 flex-1">{children}</span>
    </div>
  );
}

// ─── Section heading (right column) ──────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[15px] font-bold text-gray-900 mb-3">{children}</h3>
  );
}

const Divider = () => <div className="border-t border-gray-100 my-6" />;

// ─── List item variants ───────────────────────────────────────────────────────

const CheckItem = ({ text }: { text: string }) => (
  <li className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed py-0.5">
    <svg className="w-4 h-4 shrink-0 text-green-600 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    {text}
  </li>
);

const CrossItem = ({ text }: { text: string }) => (
  <li className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed py-0.5">
    <svg className="w-4 h-4 shrink-0 text-red-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
    {text}
  </li>
);

const BulletItem = ({ text }: { text: string }) => (
  <li className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed py-0.5">
    <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
    {text}
  </li>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ExpeditionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: exp, error } = await supabase
    .from("expeditions")
    .select(`*, organizer_profiles(company_name)`)
    .eq("id", id)
    .single();

  if (!exp || error) notFound();

  // 4. Fetch the currently logged-in user (hiker)
  const { data: { user } } = await supabase.auth.getUser();
  const hiker = user ? {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Hiker",
    email: user.email || "",
    phone: user.phone || ""
  } : null;

  // ── Derived values ──────────────────────────────────────────────────────────
  const slots    = exp.total_van_slots - (exp.booked_slots || 0);
  const organizer = exp.organizer_profiles?.company_name || "Verified Organizer";
  const duration  = exp.start_date && exp.end_date ? daysBetween(exp.start_date, exp.end_date) : null;

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
  const startDate = exp.start_date ? fmt(exp.start_date) : null;
  const endDate   = exp.end_date   ? fmt(exp.end_date)   : null;
  const dateStr   = startDate
    ? endDate && endDate !== startDate ? `${startDate} – ${endDate}` : startDate
    : null;

  // Arrays
  const highlights: string[] = exp.highlights         || [];
  const inclusions: string[] = exp.included_amenities || [];
  // exclusions is text (not text[]) — normalise
  const exclusions: string[] = exp.exclusions
    ? (Array.isArray(exp.exclusions) ? exp.exclusions : [exp.exclusions])
    : [];
  const itinerary: string[]  = exp.itinerary          || [];
  const gear: string[]       = exp.gear_requirements  || [];
  const gallery: string[]    = exp.gallery_img_urls   || [];

  const trailInfo = {
    trail_steepness: exp.trail_steepness,
    trail_exposure:  exp.trail_exposure,
    mobile_signal:   exp.mobile_signal,
    water_source:    exp.water_source,
    restroom:        exp.restroom,
    river_crossing:  exp.river_crossing,
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans antialiased">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-64 md:h-[420px] bg-green-950 overflow-hidden">

        {/* Image or SVG fallback */}
        {exp.mountain_img_url ? (
          <img
            src={exp.mountain_img_url}
            alt={exp.mountain_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg className="w-full h-full" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#071410" />
                <stop offset="100%" stopColor="#1A3D2B" />
              </linearGradient>
            </defs>
            <rect width="1200" height="420" fill="url(#hg)" />
            <path d="M0,300 L160,180 L300,250 L440,130 L580,215 L700,95 L840,175 L960,72 L1100,155 L1200,108 L1200,420 L0,420Z" fill="#1A3D2B" opacity="0.6" />
            <path d="M0,360 L120,275 L260,328 L400,238 L540,298 L660,192 L800,265 L920,182 L1060,242 L1200,200 L1200,420 L0,420Z" fill="#0F2318" opacity="0.92" />
            <path d="M700,95 L728,148 L672,148Z" fill="white" opacity="0.55" />
            <path d="M960,72 L986,118 L934,118Z" fill="white" opacity="0.4" />
          </svg>
        )}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Back link */}
        <div className="absolute top-5 left-6 md:left-10">
          <a
            href="/hiker"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Expeditions
          </a>
        </div>

        {/* Mountain name */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-xl">
            {exp.mountain_name}
          </h1>
          {exp.title && (
            <p className="text-white/55 text-base mt-1">{exp.title}</p>
          )}
        </div>
      </div>

      {/* ── TWO-COLUMN LAYOUT ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ════════════════════════════════════════════════════════════════
              LEFT — sticky info card
          ════════════════════════════════════════════════════════════════ */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0 lg:sticky lg:top-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Name + price header */}
              <div className="bg-green-800 px-5 py-5">
                <p className="font-extrabold text-white text-xl leading-tight">{exp.mountain_name}</p>
                {exp.title && <p className="text-green-300 text-xs mt-0.5">{exp.title}</p>}
                <p className="text-green-200 text-xs mt-3 uppercase tracking-wider">Package Rate</p>
                <p className="text-white font-black text-3xl leading-none">
                  ₱{Number(exp.price_per_person).toLocaleString()}
                </p>
              </div>

              {/* Stat rows */}
              <div className="px-5 py-5 space-y-3 border-b border-gray-100">
                <StatRow label="Difficulty">
                  <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${DIFF_PILL[exp.difficulty_level] || "bg-gray-100 text-gray-700"}`}>
                    {exp.difficulty_level.charAt(0).toUpperCase() + exp.difficulty_level.slice(1)}
                  </span>
                </StatRow>

                {duration && (
                  <StatRow label="Hike Duration">{duration}</StatRow>
                )}

                {dateStr && (
                  <StatRow label="Date">{dateStr}</StatRow>
                )}

                {exp.pickup_location && (
                  <StatRow label="Pickup">{exp.pickup_location}</StatRow>
                )}

                <StatRow label="Organizer">{organizer}</StatRow>
              </div>

              {/* Slots */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400">Available slots</span>
                  <span className={`font-semibold ${slots <= 3 ? "text-red-500" : "text-gray-600"}`}>
                    {slots} / {exp.total_van_slots}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${slots <= 3 ? "bg-red-400" : "bg-green-500"}`}
                    style={{ width: `${Math.round(((exp.total_van_slots - slots) / exp.total_van_slots) * 100)}%` }}
                  />
                </div>
                {slots <= 3 && slots > 0 && (
                  <p className="text-xs text-red-500 font-medium mt-1.5">Filling up fast!</p>
                )}
              </div>

              {/* Book now */}
              <div className="p-5 border-t border-gray-100">
                <BookNowButton 
                  availableSlots={slots}
                  expedition={{
                    id: exp.id,
                    mountain_name: exp.mountain_name,
                    date: dateStr || 'TBA',
                    price: Number(exp.price_per_person),
                    pickup_location: exp.pickup_location,
                    booked_slots: exp.booked_slots || 0
                  }}
                  hiker={hiker}
                />
              </div>

            </div>
          </aside>

          {/* ════════════════════════════════════════════════════════════════
              RIGHT — scrollable content
          ════════════════════════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 space-y-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">

              {/* Overview */}
              {exp.description && (
                <div className="px-6 md:px-8 py-7">
                  <SectionTitle>Overview</SectionTitle>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {exp.description}
                  </p>
                </div>
              )}

              {/* Highlights */}
              {highlights.length > 0 && (
                <div className="px-6 md:px-8 py-7">
                  <SectionTitle>Highlights</SectionTitle>
                  <ul className="space-y-1">
                    {highlights.map((h, i) => <BulletItem key={i} text={h} />)}
                  </ul>
                </div>
              )}

              {/* Inclusions */}
              {inclusions.length > 0 && (
                <div className="px-6 md:px-8 py-7">
                  <SectionTitle>Inclusions</SectionTitle>
                  <ul className="space-y-1">
                    {inclusions.map((item, i) => <CheckItem key={i} text={item} />)}
                  </ul>
                </div>
              )}

              {/* Exclusions */}
              {exclusions.length > 0 && (
                <div className="px-6 md:px-8 py-7">
                  <SectionTitle>Exclusions</SectionTitle>
                  <ul className="space-y-1">
                    {exclusions.map((item, i) => <CrossItem key={i} text={item} />)}
                  </ul>
                </div>
              )}

              {/* Tab-switched sections */}
              <div className="px-6 md:px-8 py-7">
                <ExpeditionTabPanel
                  itinerary={itinerary}
                  gear={gear}
                  trailInfo={trailInfo}
                />
              </div>

            </div>

            {/* Gallery — sits below the white card */}
            {gallery.length > 0 && (
              <div className="mt-8">
                <h3 className="text-[15px] font-bold text-gray-900 mb-4">Gallery</h3>
                <GalleryCollage gallery={gallery} name={exp.mountain_name} />
              </div>
            )}

          </div>
          {/* end RIGHT */}

        </div>
      </div>
    </div>
  );
}
