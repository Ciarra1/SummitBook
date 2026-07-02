"use client";
// components/ExpeditionTabs.tsx

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "itinerary" | "gear" | "faqs" | "terms" | "cancellation";

interface TrailInfo {
  trail_steepness?: string | null;
  trail_exposure?:  string | null;
  mobile_signal?:   string | null;
  water_source?:    string | null;
  restroom?:        string | null;
  river_crossing?:  string | null;
}

interface TabPanelProps {
  itinerary: string[];
  gear:      string[];
  trailInfo: TrailInfo;
}

// ─── Shared small pieces ──────────────────────────────────────────────────────

const Bullet = ({ text }: { text: string }) => (
  <li className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed py-1">
    <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
    {text}
  </li>
);

const FaqRow = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 pr-6 text-sm font-medium text-gray-500 whitespace-nowrap align-top w-52">{label}</td>
      <td className="py-3 text-sm text-gray-800 capitalize">{value}</td>
    </tr>
  );
};

const DocButton = ({ label }: { label: string }) => (
  <button className="inline-flex items-center gap-2 border border-green-700 text-green-700 hover:bg-green-50 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    {label}
  </button>
);

// ─── Tab panel ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: "itinerary",    label: "Detailed Itinerary"   },
  { id: "gear",         label: "Things to Bring"       },
  { id: "faqs",         label: "FAQs"                  },
  { id: "terms",        label: "Terms & Conditions"    },
  { id: "cancellation", label: "Cancellation Policy"   },
];

export function ExpeditionTabPanel({ itinerary, gear, trailInfo }: TabPanelProps) {
  const [active, setActive] = useState<TabId>("itinerary");

  return (
    <div>
      {/* ── Tab bar ── */}
      <div className="flex overflow-x-auto scrollbar-none border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`shrink-0 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              active === t.id
                ? "border-green-700 text-green-800"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Panels ── */}
      <div className="pt-6 min-h-[160px]">

        {/* Detailed Itinerary */}
        {active === "itinerary" && (
          itinerary.length > 0 ? (
            <ul className="space-y-1">
              {itinerary.map((line, i) => <Bullet key={i} text={line} />)}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 italic">No itinerary added yet.</p>
          )
        )}

        {/* Things to Bring */}
        {active === "gear" && (
          gear.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              {gear.map((item, i) => <Bullet key={i} text={item} />)}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 italic">No gear list added yet.</p>
          )
        )}

        {/* FAQs */}
        {active === "faqs" && (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full">
              <tbody className="bg-white divide-y divide-gray-100">
                <FaqRow label="Trail Steepness"         value={trailInfo.trail_steepness} />
                <FaqRow label="Trail Exposure"           value={trailInfo.trail_exposure}  />
                <FaqRow label="Mobile Signal"            value={trailInfo.mobile_signal}   />
                <FaqRow label="Water Source"             value={trailInfo.water_source}    />
                <FaqRow label="Restroom / Toilet"        value={trailInfo.restroom}        />
                <FaqRow label="River / Water Crossing"   value={trailInfo.river_crossing}  />
              </tbody>
            </table>
            {!Object.values(trailInfo).some(Boolean) && (
              <p className="text-sm text-gray-400 italic px-5 py-4">No trail info added yet.</p>
            )}
          </div>
        )}

        {/* Terms and Conditions */}
        {active === "terms" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 leading-relaxed">
              Please read and acknowledge the full terms and conditions before proceeding with your booking.
            </p>
            <DocButton label="View Terms and Conditions" />
          </div>
        )}

        {/* Cancellation Policy */}
        {active === "cancellation" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 leading-relaxed">
              Review our cancellation and refund policy before confirming your slot.
            </p>
            <DocButton label="View Cancellation Policy" />
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Gallery collage + lightbox ───────────────────────────────────────────────

export function GalleryCollage({ gallery, name }: { gallery: string[]; name: string }) {
  const [open, setOpen]       = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const MAX     = 7;
  const visible = showAll ? gallery : gallery.slice(0, MAX);
  const [hero, ...thumbs] = visible;

  const prev = () => setOpen((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length));
  const next = () => setOpen((i) => (i === null ? null : (i + 1) % gallery.length));

  useEffect(() => {
    if (open === null) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     setOpen(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!gallery.length) return <p className="text-sm text-gray-400 italic">No photos yet.</p>;

  return (
    <>
      <div className="space-y-2">
        {/* Hero image */}
        <div
          onClick={() => setOpen(0)}
          className="relative w-full h-64 overflow-hidden rounded-xl cursor-pointer group bg-gray-100"
        >
          <img src={hero} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors rounded-xl" />
        </div>

        {/* Thumbnail grid */}
        {thumbs.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {thumbs.map((url, i) => {
              const realIdx = i + 1;
              const isLast  = !showAll && gallery.length > MAX && i === thumbs.length - 1;
              return (
                <div
                  key={i}
                  onClick={() => isLast ? setShowAll(true) : setOpen(realIdx)}
                  className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group bg-gray-100"
                >
                  <img src={url} alt={`${name} ${realIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                  {isLast && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                      <span className="text-white font-black text-xl">+{gallery.length - MAX}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAll && gallery.length > MAX && (
        <button onClick={() => setShowAll(false)} className="mt-3 text-sm text-green-700 font-semibold hover:underline">
          Show less
        </button>
      )}

      {/* Lightbox */}
      {open !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center"
          onClick={() => setOpen(null)}
        >
          <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
            {open + 1} / {gallery.length}
          </p>
          <button onClick={() => setOpen(null)} className="absolute top-4 right-5 text-white/60 hover:text-white text-2xl font-light leading-none">✕</button>

          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="px-20 max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={gallery[open]}
              alt={`${name} ${open + 1}`}
              className="w-full object-contain rounded-xl"
              style={{ maxHeight: "80vh" }}
            />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Thumbnail strip */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-xs overflow-x-auto px-2">
            {gallery.map((url, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setOpen(i); }}
                className={`shrink-0 w-10 h-10 rounded overflow-hidden border-2 transition-all ${
                  i === open ? "border-white opacity-100" : "border-transparent opacity-40 hover:opacity-70"
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
