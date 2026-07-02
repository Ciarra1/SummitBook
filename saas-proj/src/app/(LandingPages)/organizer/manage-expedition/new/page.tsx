"use client";

import { useState, useRef, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// ─── Default Values ───────────────────────────────────────────────────────────

const DEFAULT_INCLUSIONS = [
  "Roundtrip Van Transfer",
  "Local Guide Fee",
  "Environmental & Registration Fees",
  "Tour Coordinator",
];

const DEFAULT_EXCLUSIONS = [
  "Meals (Breakfast/Lunch/Dinner)",
  "Personal Porter",
  "Trail Food",
  "Shower Fees",
];

const DEFAULT_GEAR = [
  "Headlamp with extra batteries",
  "Trekking pole",
  "Hydration pack or 2-3L Water",
  "Trail food / Energy bars",
  "Personal First Aid Kit",
  "Sun protection (Cap/Arm sleeves)",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExpeditionFormData {
  mountain_name: string;
  title: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  start_date: string;
  end_date: string;
  total_van_slots: number | "";
  price_per_person: number | "";
  description: string;
  mountain_img: File | null;
  gallery_imgs: File[]; // New: Array of files for the gallery
  itinerary: string[];
  highlights: string[];
  included_amenities: string[];
  exclusions: string[];
  gear_requirements: string[];
  
  // Logistical FAQ Fields
  trail_steepness: string;
  trail_exposure: string;
  mobile_signal: string;
  transportation: string;
  water_source: string;
  restroom: string;
  river_crossing: string;
  temperature: string;
  special_equipment: string;
  pickup_location: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function ArrayInputGroup({
  label,
  hint,
  items,
  onChange,
  placeholder = "Add item...",
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const handleAdd = () => onChange([...items, ""]);
  const handleUpdate = (index: number, val: string) => {
    const newItems = [...items];
    newItems[index] = val;
    onChange(newItems);
  };
  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => handleUpdate(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="p-2 text-stone-400 hover:text-red-500 transition-colors bg-white border border-stone-200 rounded-xl shrink-0"
              aria-label="Remove item"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAdd}
          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 mt-2 py-1 px-2 rounded-lg hover:bg-emerald-50 transition-colors w-fit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add {label}
        </button>
      </div>
    </div>
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
}: {
  id: string;
  label: string;
  accept: string;
  required?: boolean;
  hint?: string;
  value: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <FieldLabel required={required} hint={hint}>
        {label}
      </FieldLabel>

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-stone-500">
              <span className="font-semibold text-stone-700">Click to upload image</span> or drag & drop
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

// ─── New: Multi-File Upload Component ─────────────────────────────────────────

function MultiFileUploadField({
  id,
  label,
  accept,
  hint,
  values,
  onChange,
}: {
  id: string;
  label: string;
  accept: string;
  hint?: string;
  values: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onChange([...values, ...newFiles]);
    }
    // Reset input so the same files can be re-selected if needed
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (indexToRemove: number) => {
    onChange(values.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>

      <div
        onClick={() => inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 hover:border-amber-400 hover:bg-amber-50/40 cursor-pointer transition-all mb-3"
      >
        <svg className="w-7 h-7 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm text-stone-500">
          <span className="font-semibold text-stone-700">Click to add multiple images</span>
        </p>
        <p className="text-xs text-stone-400">{accept.replace(/,/g, " ·")}</p>
        
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>

      {/* Preview List */}
      {values.length > 0 && (
        <ul className="space-y-2">
          {values.map((file, i) => (
            <li key={i} className="flex items-center justify-between p-2.5 bg-white border border-stone-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 truncate pr-4">
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium text-stone-700 truncate">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Collapsible Section Wrapper ──────────────────────────────────────────────

function CollapsibleSection({
  title,
  icon,
  iconBgColor,
  iconTextColor,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconTextColor: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="bg-white rounded-2xl border border-stone-200 overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-stone-50 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${iconBgColor} flex items-center justify-center shrink-0`}>
            <div className={`w-4 h-4 ${iconTextColor}`}>
              {icon}
            </div>
          </div>
          <h2 className="text-base font-bold text-stone-800">{title}</h2>
        </div>
        <svg
          className={`w-5 h-5 text-stone-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-stone-100">
          {children}
        </div>
      )}
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewExpedition() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [organizerId, setOrganizerId] = useState<string | null>(null);

  const [useDefaults, setUseDefaults] = useState(true);

  const [form, setForm] = useState<ExpeditionFormData>({
    mountain_name: "",
    title: "",
    difficulty_level: "beginner",
    start_date: "",
    end_date: "",
    total_van_slots: "",
    price_per_person: "",
    description: "",
    mountain_img: null,
    gallery_imgs: [], // Initialize empty array for gallery
    itinerary: [""],
    highlights: [""],
    included_amenities: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    gear_requirements: [...DEFAULT_GEAR],
    trail_steepness: "",
    trail_exposure: "",
    mobile_signal: "",
    transportation: "",
    water_source: "",
    restroom: "",
    river_crossing: "",
    temperature: "",
    special_equipment: "",
    pickup_location: "",
  });

useEffect(() => {
  (async () => {
    setLoadingUser(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Look up the organizer_profiles row for this user
      const { data: profile, error: profileErr } = await supabase
        .from("organizer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileErr || !profile) {
        setErrorMsg("No organizer profile found for this account.");
        return;
      }

      setOrganizerId(profile.id); // <-- use organizer_profiles.id, not auth user id
    } catch (err) {
      setErrorMsg("Failed to verify user session.");
    } finally {
      setLoadingUser(false);
    }
  })();
}, [router, supabase]);

  const handleToggleDefaults = (checked: boolean) => {
    setUseDefaults(checked);
    if (checked) {
      setForm((f) => ({
        ...f,
        included_amenities: [...DEFAULT_INCLUSIONS],
        exclusions: [...DEFAULT_EXCLUSIONS],
        gear_requirements: [...DEFAULT_GEAR],
      }));
    } else {
      setForm((f) => ({
        ...f,
        included_amenities: [""],
        exclusions: [""],
        gear_requirements: [""],
      }));
    }
  };

 async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string | null> {
  const { data: { session }, error: sessErr } = await supabase.auth.getSession();
  console.log("DEBUG upload:", {
    path,
    bucket,
    sessionUserId: session?.user?.id,
    hasAccessToken: !!session?.access_token,
    sessErr,
  });

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

  if (error) {
    console.error("Full Supabase upload error:", JSON.stringify(error, null, 2));
    console.error("Raw error object:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organizerId) return;

    if (!form.mountain_name.trim()) return setErrorMsg("Mountain name is required.");
    if (!form.start_date || !form.end_date) return setErrorMsg("Start and end dates are required.");
    if (new Date(form.start_date) > new Date(form.end_date)) return setErrorMsg("End date cannot be before start date.");
    if (form.total_van_slots === "" || form.total_van_slots <= 0) return setErrorMsg("Valid total van slots are required.");
    if (form.price_per_person === "" || form.price_per_person < 0) return setErrorMsg("Valid price per person is required.");

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let coverImgUrl = null;
      let finalGalleryUrls: string[] = [];

      // 1. Upload Cover Image
      if (form.mountain_img) {
        const fileExt = form.mountain_img.name.split('.').pop();
        const fileName = `cover-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const path = `${organizerId}/${fileName}`;
        coverImgUrl = await uploadFile("expedition_media", path, form.mountain_img);
      }

      // 2. Upload Gallery Images in Parallel
      if (form.gallery_imgs.length > 0) {
        const uploadPromises = form.gallery_imgs.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const path = `${organizerId}/${fileName}`;
          return await uploadFile("expedition_media", path, file);
        });
        
        // Wait for all gallery images to finish uploading
        const results = await Promise.all(uploadPromises);
        
        // Filter out any potential nulls just in case
        finalGalleryUrls = results.filter((url): url is string => url !== null);
      }

      const filterEmpty = (arr: string[]) => arr.filter((item) => item.trim() !== "");
      const toNullIfEmpty = (str: string) => str.trim() === "" ? null : str.trim();

      // 3. Save to Database
      console.log("DEBUG: organizerId state used for insert →", organizerId);
      const { data, error: insertErr } = await supabase
        .from("expeditions")
        .insert({
          organizer_id: organizerId,
          mountain_name: form.mountain_name.trim(),
          title: toNullIfEmpty(form.title),
          difficulty_level: form.difficulty_level,
          start_date: form.start_date,
          end_date: form.end_date,
          total_van_slots: Number(form.total_van_slots),
          price_per_person: Number(form.price_per_person),
          description: toNullIfEmpty(form.description),
          
          mountain_img_url: coverImgUrl,
          gallery_img_urls: finalGalleryUrls.length > 0 ? finalGalleryUrls : null,
          
          itinerary: filterEmpty(form.itinerary),
          highlights: filterEmpty(form.highlights),
          included_amenities: filterEmpty(form.included_amenities),
          exclusions: filterEmpty(form.exclusions),
          gear_requirements: filterEmpty(form.gear_requirements),

          // Optional Logistical Information
          trail_steepness: toNullIfEmpty(form.trail_steepness),
          trail_exposure: toNullIfEmpty(form.trail_exposure),
          transportation: toNullIfEmpty(form.transportation),
          temperature: toNullIfEmpty(form.temperature),
          special_equipment: toNullIfEmpty(form.special_equipment),
          pickup_location: toNullIfEmpty(form.pickup_location),
          
          mobile_signal: form.mobile_signal || null,
          water_source: form.water_source || null,
          restroom: form.restroom || null,
          river_crossing: form.river_crossing || null,

          status: "draft"
        })
        .select()
        .single();

      if (insertErr) {
  console.error("Full insert error:", JSON.stringify(insertErr, null, 2));
  console.error("Raw insert error:", insertErr);
  throw insertErr;
}

      setSuccessMsg("Expedition successfully created!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Failed to save expedition. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-stone-400">
          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Preparing form...</span>
        </div>
      </div>
    );
  }

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
          <span className="text-sm font-semibold text-stone-700">Create New Expedition</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {successMsg && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            <svg className="w-5 h-5 mt-0.5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{successMsg}</p>
          </div>
        )}
        
        {errorMsg && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            <svg className="w-5 h-5 mt-0.5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Collapsible: Core Details */}
          <CollapsibleSection
            title="Expedition Details"
            iconBgColor="bg-emerald-100"
            iconTextColor="text-emerald-700"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Mountain Name</FieldLabel>
                  <input
                    type="text"
                    value={form.mountain_name}
                    onChange={(e) => setForm((f) => ({ ...f, mountain_name: e.target.value }))}
                    placeholder="e.g. Mt. Irid"
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <FieldLabel>Event Title</FieldLabel>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Weekend Traverse"
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <FieldLabel required>Difficulty Level</FieldLabel>
                <select
                  value={form.difficulty_level}
                  onChange={(e) => setForm((f) => ({ ...f, difficulty_level: e.target.value as any }))}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Start Date</FieldLabel>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <FieldLabel required>End Date</FieldLabel>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <FieldLabel hint="Include expectations, meetup details, and a general summary.">
                  Description
                </FieldLabel>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Share what makes this hike special..."
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Collapsible: Itinerary & Trip Details */}
          <CollapsibleSection
            title="Itinerary & Trip Details"
            iconBgColor="bg-indigo-100"
            iconTextColor="text-indigo-600"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
          >
            <div className="space-y-6 pt-2">
              <ArrayInputGroup
                label="Itinerary"
                hint="List the step-by-step schedule. e.g. '04:00 AM - ETA Jump-off'"
                placeholder="e.g. 05:00 AM - Start Trek"
                items={form.itinerary}
                onChange={(val) => setForm((f) => ({ ...f, itinerary: val }))}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ArrayInputGroup
                  label="Highlights"
                  hint="Key attractions or views."
                  placeholder="e.g. Sea of clouds"
                  items={form.highlights}
                  onChange={(val) => setForm((f) => ({ ...f, highlights: val }))}
                />
              </div>

              <hr className="border-stone-200" />

              <div className="flex items-center justify-between bg-stone-50/50 p-4 rounded-xl border border-stone-200">
                <div>
                  <h3 className="text-sm font-semibold text-stone-800">Use Standard Defaults</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Prefill common gears, inclusions, and exclusions.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleDefaults(!useDefaults)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    useDefaults ? "bg-emerald-500" : "bg-stone-300"
                  }`}
                  role="switch"
                  aria-checked={useDefaults}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useDefaults ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-6">
                  <ArrayInputGroup
                    label="Included Amenities"
                    hint="What the fee covers."
                    placeholder="e.g. RT Van Transfer, Guide Fee"
                    items={form.included_amenities}
                    onChange={(val) => setForm((f) => ({ ...f, included_amenities: val }))}
                  />
                  <ArrayInputGroup
                    label="Exclusions"
                    hint="What is NOT included."
                    placeholder="e.g. Trail Food, Personal Porter"
                    items={form.exclusions}
                    onChange={(val) => setForm((f) => ({ ...f, exclusions: val }))}
                  />
                </div>

                <ArrayInputGroup
                  label="Gear Requirements"
                  hint="Mandatory items for hikers to bring."
                  placeholder="e.g. Headlamp with extra batteries"
                  items={form.gear_requirements}
                  onChange={(val) => setForm((f) => ({ ...f, gear_requirements: val }))}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Collapsible: Trail Conditions & Logistics FAQ */}
          <CollapsibleSection
            title="Trail Conditions & Logistics (FAQ)"
            iconBgColor="bg-rose-100"
            iconTextColor="text-rose-600"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel hint="e.g. Greenfield District, Mandaluyong">Pickup Location</FieldLabel>
                  <input
                    type="text"
                    value={form.pickup_location}
                    onChange={(e) => setForm((f) => ({ ...f, pickup_location: e.target.value }))}
                    placeholder="Where do participants meet?"
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <FieldLabel hint="e.g. Rented Van, Commute">Transportation</FieldLabel>
                  <input
                    type="text"
                    value={form.transportation}
                    onChange={(e) => setForm((f) => ({ ...f, transportation: e.target.value }))}
                    placeholder="How will they get there?"
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel hint="e.g. 60-70 degree assault">Trail Steepness</FieldLabel>
                  <input
                    type="text"
                    value={form.trail_steepness}
                    onChange={(e) => setForm((f) => ({ ...f, trail_steepness: e.target.value }))}
                    placeholder="Describe the incline..."
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <FieldLabel hint="e.g. Mostly shaded, Open ridge">Trail Exposure</FieldLabel>
                  <input
                    type="text"
                    value={form.trail_exposure}
                    onChange={(e) => setForm((f) => ({ ...f, trail_exposure: e.target.value }))}
                    placeholder="Sun exposure on the trail..."
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel hint="e.g. Drops to 10°C at night">Temperature</FieldLabel>
                  <input
                    type="text"
                    value={form.temperature}
                    onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value }))}
                    placeholder="Expected weather/temp..."
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <FieldLabel hint="e.g. Helmets required">Special Equipment</FieldLabel>
                  <input
                    type="text"
                    value={form.special_equipment}
                    onChange={(e) => setForm((f) => ({ ...f, special_equipment: e.target.value }))}
                    placeholder="Any non-standard gear?"
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <hr className="border-stone-200 my-4" />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <FieldLabel>Mobile Signal</FieldLabel>
                  <select
                    value={form.mobile_signal}
                    onChange={(e) => setForm((f) => ({ ...f, mobile_signal: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                    <option value="">Select...</option>
                    <option value="present">Present</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Water Source</FieldLabel>
                  <select
                    value={form.water_source}
                    onChange={(e) => setForm((f) => ({ ...f, water_source: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                     <option value="">Select...</option>
                    <option value="present">Present</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Restrooms</FieldLabel>
                  <select
                    value={form.restroom}
                    onChange={(e) => setForm((f) => ({ ...f, restroom: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                     <option value="">Select...</option>
                    <option value="present">Present</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>River Crossing</FieldLabel>
                  <select
                    value={form.river_crossing}
                    onChange={(e) => setForm((f) => ({ ...f, river_crossing: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                     <option value="">Select...</option>
                    <option value="present">Present</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Collapsible: Capacity & Pricing */}
          <CollapsibleSection
            title="Capacity & Pricing"
            iconBgColor="bg-sky-100"
            iconTextColor="text-sky-600"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          >
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Total Van Slots</FieldLabel>
                  <input
                    type="number"
                    min="1"
                    value={form.total_van_slots}
                    onChange={(e) => setForm((f) => ({ ...f, total_van_slots: e.target.value === "" ? "" : Number(e.target.value) }))}
                    placeholder="e.g. 14"
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <FieldLabel required>Price per Person (₱)</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price_per_person}
                    onChange={(e) => setForm((f) => ({ ...f, price_per_person: e.target.value === "" ? "" : Number(e.target.value) }))}
                    placeholder="e.g. 2500"
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Collapsible: Media */}
          <CollapsibleSection
            title="Media"
            iconBgColor="bg-amber-100"
            iconTextColor="text-amber-700"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          >
            <div className="pt-2 space-y-6">
              <FileUploadField
                id="mountain_img"
                label="Mountain Image Cover (Main Display)"
                accept=".jpg,.jpeg,.png,.webp"
                hint="An appealing hero image to showcase the destination."
                value={form.mountain_img}
                onChange={(f) => setForm((s) => ({ ...s, mountain_img: f }))}
              />

              <hr className="border-stone-200" />

              <MultiFileUploadField
                id="gallery_imgs"
                label="Photo Gallery"
                accept=".jpg,.jpeg,.png,.webp"
                hint="Add scenic shots, trail condition previews, or camp photos."
                values={form.gallery_imgs}
                onChange={(files) => setForm((s) => ({ ...s, gallery_imgs: files }))}
              />
            </div>
          </CollapsibleSection>

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
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Publishing Expedition…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Publish Expedition
              </>
            )}
          </button>
        </form>

        <div className="h-8" />
      </div>
    </div>
  );
}