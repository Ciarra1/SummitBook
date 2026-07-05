  'use client';

  import { createBrowserClient } from "@supabase/ssr";
  import { useState, useMemo, useEffect } from "react";
  // Moved import to the top
  import { createBrowserSupabaseClient } from "@/lib/supabase/client";
  import LogoutButton from "@/components/LogoutButton";
  import Link from "next/link";
  import BookingModal from "@/components/BookingModal";
  import BookingSection from "@/components/sections/BookingSection";
  // ─── Icons ────────────────────────────────────────────────────────────────────
  const IconSearch = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
    </svg>
  );

  const IconCalendar = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );

  const IconPin = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );

  const IconChevron = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );

  const IconFilter = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 10h10M11 16h2" />
    </svg>
  );

  const IconX = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
  );

  const IconSliders = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" />
    </svg>
  );

  const LogoMark = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <polygon points="14,2 26,26 2,26" fill="none" stroke="#E8A020" strokeWidth="2.2" strokeLinejoin="round" />
      <polygon points="14,10 20,26 8,26" fill="#E8A020" opacity="0.25" />
      <line x1="14" y1="2" x2="14" y2="26" stroke="#E8A020" strokeWidth="1" opacity="0.4" />
    </svg>
  );

  // ─── Types ────────────────────────────────────────────────────────────────────

  type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";
  type SortOption = "price_asc" | "price_desc" | "slots_asc" | "slots_desc";

  interface Expedition {
    id: number;
    mountain: string;
    location: string;
    difficulty: DifficultyLevel;
    price_per_person: number;
    available_van_slots: number;
    total_van_slots: number;
    organizer_name: string;
    variant: "dawn" | "sunset" | "night";
    mountain_img_url: string;
  }

  interface FilterState {
    search: string;
    difficulty: DifficultyLevel | "All";
    maxPrice: number;
    slotsAvailable: boolean;
    sort: SortOption;
  }

  // ─── Data (replace with Supabase fetch later) ─────────────────────────────────

  

  const MAX_PRICE = 6000;
  const POPULAR_TAGS = ["Mt. Pulag", "Mt. Apo", "Mt. Batulao", "Mt. Ulap", "Mt. Daraitan"];
  const STATS = [
    { value: "2,400+", label: "Climbs Booked" },
    { value: "140+", label: "Verified Organizers" },
    { value: "38", label: "Mountains & Trails" },
    { value: "0", label: "Scam Reports" },
  ];

  const DIFFICULTY_LEVELS: (DifficultyLevel | "All")[] = ["All", "Beginner", "Intermediate", "Advanced"];
  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "slots_asc", label: "Slots: Fewest First" },
    { value: "slots_desc", label: "Slots: Most First" },
  ];

  const DIFFICULTY_STYLES: Record<DifficultyLevel, string> = {
    Beginner: "bg-amber-400 text-green-950",
    Intermediate: "bg-blue-500 text-white",
    Advanced: "bg-red-500 text-white",
  };

  const DIFFICULTY_PILL: Record<DifficultyLevel | "All", string> = {
    All: "bg-green-800 text-white",
    Beginner: "bg-amber-400 text-green-950",
    Intermediate: "bg-blue-500 text-white",
    Advanced: "bg-red-500 text-white",
  };

  const DIFFICULTY_PILL_INACTIVE: Record<DifficultyLevel | "All", string> = {
    All: "bg-white text-green-800 border border-green-200 hover:bg-green-50",
    Beginner: "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50",
    Intermediate: "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50",
    Advanced: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
  };
  //HELPER


  // ─── Mountain SVG Illustrations ───────────────────────────────────────────────

  const MountainDawn = () => (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F2318" /><stop offset="100%" stopColor="#2E6B44" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#dawn)" />
      <path d="M0,160 L80,90 L160,130 L240,60 L320,110 L400,70 L400,200 L0,200Z" fill="#1A3D2B" opacity="0.8" />
      <path d="M0,180 L60,140 L140,165 L220,110 L300,150 L400,120 L400,200 L0,200Z" fill="#0F2318" />
      <path d="M240,60 L252,82 L228,82Z" fill="white" opacity="0.8" />
    </svg>
  );

  const MountainSunset = () => (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0a00" /><stop offset="60%" stopColor="#b04010" /><stop offset="100%" stopColor="#E8A020" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#sunset)" />
      <circle cx="200" cy="90" r="30" fill="#E8A020" opacity="0.5" />
      <path d="M0,140 L100,70 L180,110 L260,40 L360,100 L400,80 L400,200 L0,200Z" fill="#1A3D2B" opacity="0.9" />
      <path d="M0,175 L80,145 L180,170 L280,130 L380,165 L400,150 L400,200 L0,200Z" fill="#0F2318" />
      <path d="M260,40 L278,72 L242,72Z" fill="white" opacity="0.85" />
    </svg>
  );

  const MountainNight = () => (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1a2e" /><stop offset="100%" stopColor="#1e4060" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#night)" />
      <circle cx="320" cy="40" r="18" fill="#F5C842" opacity="0.7" />
      <circle cx="328" cy="36" r="16" fill="#0a1a2e" opacity="0.8" />
      <path d="M0,150 L60,100 L120,125 L200,75 L280,110 L360,85 L400,100 L400,200 L0,200Z" fill="#1A3D2B" opacity="0.85" />
      <path d="M0,180 L70,155 L160,175 L240,145 L340,170 L400,155 L400,200 L0,200Z" fill="#0F2318" />
    </svg>
  );

  const MOUNTAIN_VARIANTS = { dawn: MountainDawn, sunset: MountainSunset, night: MountainNight };

  // ─── Slot Bar ─────────────────────────────────────────────────────────────────

  const SlotBar = ({ available, total }: { available: number; total: number }) => {
    const pct = Math.round(((total - available) / total) * 100);
    const isAlmostFull = available <= 3;
    return (
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-500 font-medium">Van Slots</span>
          <span className={`font-semibold ${isAlmostFull ? "text-red-500" : "text-slate-600"}`}>
            {available} / {total} available
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${isAlmostFull ? "bg-red-400" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  // ─── Expedition Card ──────────────────────────────────────────────────────────

  // ─── Expedition Card ──────────────────────────────────────────────────────────

  const ExpeditionCard = ({ expedition, hiker }: { expedition: any, hiker: any}) => {
    const idStr = String(expedition.id || '1');
    const variant = expedition.id ? (idStr.length % 3 === 0 ? 'dawn' : idStr.length % 2 === 0 ? 'sunset' : 'night') : 'dawn';
    const MountainIllustration = MOUNTAIN_VARIANTS[variant as keyof typeof MOUNTAIN_VARIANTS];
    
    const availableSlots = expedition.total_van_slots - (expedition.booked_slots || 0);
    const isAlmostFull = availableSlots <= 3 && availableSlots > 0;
    const organizerName = expedition.organizer_profiles?.company_name || 'Verified Organizer';
    
    const [isModalOpen, setIsModalOpen] = useState(false);
  
    return (
      <>
        <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-
        
        duration-300 cursor-pointer flex flex-col border border-slate-100">
          <div className="relative h-36 overflow-hidden shrink-0 bg-slate-200">
            {expedition.mountain_img_url ? (
              <img 
                src={expedition.mountain_img_url} 
                alt={expedition.mountain_name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <MountainIllustration />
            )}
            
            <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm ${DIFFICULTY_STYLES[expedition.difficulty_level as DifficultyLevel] || 'bg-slate-200 text-slate-800'}`}>
              {expedition.difficulty_level || 'Unrated'}
            </span>
            {isAlmostFull && (
              <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg animate-pulse shadow-sm">
                Almost Full
              </span>
            )}
          </div>
          
          <div className="p-5 flex flex-col flex-1 gap-3">
            <div>
              <h3 className="font-black text-green-950 text-lg leading-tight">{expedition.mountain_name}</h3>
              <p className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                <IconPin className="w-3.5 h-3.5 shrink-0" />
                {expedition.title || "Philippines"}
              </p>
            </div>
            
            <SlotBar available={availableSlots} total={expedition.total_van_slots} />
            <div className="border-t border-slate-100" />
            
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-green-800 flex items-center justify-center text-white text-xs font-black shrink-0">
                {organizerName.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-slate-400 leading-none">Organizer</p>
                <p className="text-sm font-semibold text-green-900 leading-tight mt-0.5">{organizerName}</p>
              </div>
            </div>
  
            <div className="flex items-center justify-between mt-auto pt-1">
              <div>
                <p className="text-xs text-slate-400 leading-none mb-0.5">per person</p>
                <p className="font-black text-green-800 text-2xl leading-none">
                  ₱{Number(expedition.price_per_person || 0).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Link
                  href={`/expeditions/${expedition.id}`}
                  className="text-green-700 hover:text-green-900 text-xs font-semibold underline underline-offset-2 transition-colors"
                >
                  Learn More
                </Link>     
                <button 
                  type="button"
                  disabled={availableSlots <= 0} // <--- 1. Disable if 0 or less
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!hiker) {
                      alert("Please log in to book an expedition.");
                      return;
                    }
                    setIsModalOpen(true);
                  }}
                  className={`text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${
                    availableSlots <= 0 
                      ? 'bg-slate-400 cursor-not-allowed' // <--- 2. Grey it out if full
                      : 'bg-green-800 hover:bg-green-700 active:scale-95'
                  }`}
                >
                  {availableSlots <= 0 ? 'Fully Booked' : 'Book Now'}
                </button>
              </div>
            </div>
          </div> 
        </div>   
  
        {/* ✅ FIXED: Passing the real IDs and fixing pickup_location */}
        <BookingModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          expedition={{
            id: expedition.id, // The REAL Expedition ID from the database
            mountain_name: expedition.mountain_name,
            date: expedition.start_date || 'TBA', // Using the real start date
            price: Number(expedition.price_per_person || 0),
            pickup_location: expedition.pickup_location,// Fixed undefined error
            booked_slots: expedition.booked_slots
          }}
          hiker={{
            id: hiker?.id || '', // The REAL Hiker ID from Supabase Auth
            name: hiker?.name || 'Jaycee Dela Rosa', 
            email: hiker?.email || 'user@example.com',
            phone: hiker?.phone || ''
          }}
        />
      </>
    );
  };

  // ─── Active Filter Chip ───────────────────────────────────────────────────────

  const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-green-950 transition-colors">
        <IconX className="w-3 h-3" />
      </button>
    </span>
  );

  // ─── Section: Navbar ──────────────────────────────────────────────────────────

  const Navbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-green-950/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#hero" className="flex items-center gap-2">
          <LogoMark />
          <span className="font-black text-white text-xl tracking-tight">Summit<span className="text-amber-400">Book</span></span>
        </a>
        <div className="flex items-center gap-1">
          <a href="#hero" className="text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium px-4 py-2 rounded-lg transition-all">Discover Climbs</a>
          <a href="#booking-section" className="text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium px-4 py-2 rounded-lg transition-all">Manage Bookings</a>
          <a href="#discover" className="text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium px-4 py-2 rounded-lg transition-all">Expeditions</a>
        </div>
          <LogoutButton/>
      </div>
    </nav>
  );

  // ─── Section: Hero ────────────────────────────────────────────────────────────

  const Hero = ({ onSearch }: { onSearch: (q: string) => void }) => {
    const [input, setInput] = useState("");
    const handleSearch = () => { if (input.trim()) onSearch(input.trim()); };

    return (
      <section id="hero" className="relative min-h-screen bg-green-950 flex flex-col items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 35% at 50% 100%, rgba(232,160,32,0.28) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {[{ top: "16%", left: "12%" }, { top: "28%", left: "28%" }, { top: "12%", right: "18%" }, { top: "20%", left: "55%" }].map((dot, i) => (
            <div key={i} className="absolute w-1 h-1 bg-white opacity-30 rounded-full" style={dot as React.CSSProperties} />
          ))}
        </div>
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <span className="inline-block text-amber-400 text-xs font-semibold tracking-[0.2em] uppercase mb-6 border border-amber-400/30 px-4 py-1.5 rounded-full bg-amber-400/10">
            Built for the Philippine Mountaineering Community
          </span>
          <h1 className="font-black text-white text-5xl sm:text-6xl md:text-7xl leading-none tracking-tight mb-6">
            Book Your Next<br /><span className="text-amber-400">Summit</span> with<br />Confidence.
          </h1>
          <p className="text-white/60 text-lg md:text-xl font-light max-w-xl mx-auto mb-10 leading-relaxed">
            No more DMs, no more screenshot receipts. Find verified organizers, book your slot, and climb.
          </p>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
            <div className="flex-1 flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <IconSearch className="w-5 h-5 text-amber-400 shrink-0" />
              <input
                type="text" placeholder="Search mountain, destination..."
                value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="bg-transparent text-white placeholder-white/40 text-sm w-full outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-amber-400 hover:bg-yellow-300 text-green-950 font-bold text-sm px-8 py-3.5 rounded-xl transition-colors shrink-0"
            >
              Find Climbs
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <span className="text-white/40 text-xs">Popular:</span>
            {POPULAR_TAGS.map((tag) => (
              <button key={tag} onClick={() => onSearch(tag)} className="text-white/60 hover:text-amber-400 text-xs border border-white/20 hover:border-amber-400/50 px-3 py-1.5 rounded-full transition-colors">
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full pointer-events-none" aria-hidden>
          <svg viewBox="0 0 1440 260" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,200 L80,140 L160,170 L280,90 L400,150 L500,110 L600,160 L700,80 L820,130 L940,70 L1060,120 L1160,60 L1280,130 L1380,100 L1440,130 L1440,260 L0,260Z" fill="#1A3D2B" opacity="0.5" />
            <path d="M0,230 L100,170 L200,200 L340,120 L460,175 L560,140 L680,190 L780,110 L900,160 L1000,100 L1120,150 L1220,90 L1340,155 L1440,120 L1440,260 L0,260Z" fill="#1A3D2B" opacity="0.75" />
            <path d="M0,255 L60,210 L140,240 L240,185 L360,230 L460,195 L560,240 L660,180 L760,220 L860,170 L980,215 L1080,165 L1180,220 L1300,180 L1380,210 L1440,195 L1440,260 L0,260Z" fill="#0F2318" />
          </svg>
        </div>
      </section>
    );
  };

  // ─── Section: Trust Strip ─────────────────────────────────────────────────────


const TrustStrip = () => {
  // 1. Initialize state with a loading placeholder
  const [stats, setStats] = useState([
    { value: "...", label: "Climbs Booked" },
    { value: "...", label: "Verified Organizers" },
    { value: "...", label: "Expeditions" },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createBrowserSupabaseClient();

      try {
        // 2. Fetch only the counts using { count: 'exact', head: true }
        // The 'head: true' parameter tells Supabase NOT to return the actual rows, just the metadata (the count)
        const [
          { count: bookingsCount },
          { count: organizersCount },
          { count: expeditionsCount }
        ] = await Promise.all([
          supabase.from("bookings").select("*", { count: "exact", head: true }),
          supabase.from("organizer_profiles").select("*", { count: "exact", head: true }),
          supabase.from("expeditions").select("*", { count: "exact", head: true })
        ]);

        // 3. Update the state with the live numbers
        setStats([
          { value: bookingsCount ? bookingsCount.toLocaleString() : "0", label: "Climbs Booked" },
          { value: organizersCount ? organizersCount.toLocaleString() : "0", label: "Verified Organizers" },
          { value: expeditionsCount ? expeditionsCount.toLocaleString() : "0", label: "Expeditions" },
        ]);
      } catch (error) {
        console.error("Failed to fetch platform stats:", error);
        // Fallback to zeros or placeholders if the network fails
      }
    };

    fetchStats();
  }, []);

 return (
    <section className="bg-green-800 py-5 border-y border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Changed md:grid-cols-4 to md:grid-cols-3 to center the 3 items */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="font-black text-amber-400 text-3xl">{value}</p>
              <p className="text-white/50 text-xs mt-1 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


 // ─── Section: Expeditions (with filters) ─────────────────────────────────────

  const Expeditions = ({ initialSearch = "" }: { initialSearch?: string }) => {
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [expeditions, setExpeditions] = useState<any[]>([]); 
    
    // ✅ ADDED: State to hold the currently logged in hiker
    const [currentHiker, setCurrentHiker] = useState<any>(null); 
    
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState(initialSearch);

    useEffect(() => {
      setSearchQuery(initialSearch);
    }, [initialSearch]);

    const fetchExpeditionsAndUser = async () => {
        setLoading(true);
        
        try {
          const supabase = createBrowserSupabaseClient()
          
          // ✅ ADDED: Fetch the currently logged-in user
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setCurrentHiker({
              id: user.id,
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Hiker",
              email: user.email,
              phone: user.phone || ""
            });
          }

          const rightNow = new Date().toISOString();

          // Fetch Expeditions
          let query = supabase
            .from('expeditions')
            .select(`
              *,
              organizer_profiles (
                company_name
              )
            `)
            .eq('status', 'published')       // <-- ONLY fetch published climbs
            .gt('start_date', rightNow);     // <-- ONLY fetch future climbs
          
          if (searchQuery) {
            query = query.ilike('mountain_name', `%${searchQuery}%`);
          }

          const { data, error } = await query;
          
          if (error) {
              setFetchError('Failed to fetch expeditions');
              setExpeditions([]);
              console.error(error);
          }

          if (data) {
              setExpeditions(data);
              setFetchError(null);
          }
          
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };
    useEffect(() => {
      fetchExpeditionsAndUser();
    }, [searchQuery]);

    return (
      <section id="discover" className="py-20 bg-stone-100">
        <div className="max-w-7xl mx-auto px-6">

          {/* Header */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-black text-green-950 text-4xl leading-tight">
                Find Your Next Climb
              </h2>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all ${
                showFilters ? "bg-green-800 text-white border-green-800" : "bg-white text-green-800 border-green-200 hover:border-green-400"
              }`}
            >
              <IconSliders className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Simple Search/Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
              <div className="lg:w-1/3">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Search</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-green-400 transition-colors bg-slate-50">
                  <IconSearch className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text" 
                    placeholder="Mountain name..."
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-sm text-slate-700 placeholder-slate-400 w-full outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Grid / Empty State */}
          {loading ? (
            <div className="text-center py-20 text-slate-500 font-medium">
              Loading expeditions...
            </div>
          ) : fetchError ? (
            <div className="text-center py-20 text-red-500 font-medium">
              {fetchError}
            </div>
          ) : expeditions && expeditions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {expeditions.map((expedition) => (
                <ExpeditionCard 
                key={expedition.id} 
                expedition={expedition} 
                hiker={currentHiker} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconFilter className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-black text-slate-400 text-xl mb-2">No expeditions found</p>
              <p className="text-slate-400 text-sm mb-5">Try adjusting your search.</p>
              <button 
                onClick={() => setSearchQuery("")} 
                className="bg-green-800 hover:bg-green-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}
          
        </div>
      </section>
    );
  }
  // ─── Section: Footer ──────────────────────────────────────────────────────────

  const Footer = () => (
    <footer className="bg-green-950 border-t border-white/10 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="font-black text-white text-lg">Summit<span className="text-amber-400">Book</span></span>
          </div>
          <div className="flex items-center gap-6 text-white/50 text-xs">
            {["About", "Privacy Policy", "Terms of Use", "Contact"].map((item) => (
              <a key={item} href="#" className="hover:text-white transition-colors">{item}</a>
            ))}
          </div>
          <p className="text-white/30 text-xs text-center md:text-right">© 2025 SummitBook. Made for the mountains of the Philippines.</p>
        </div>
      </div>
    </footer>
  );

  // ─── Page ─────────────────────────────────────────────────────────────────────

  export default function Page() {
    const [heroSearch, setHeroSearch] = useState("");

    return (
      <div className="font-sans antialiased">
        <Navbar />
        
        <Hero onSearch={(q) => {
          setHeroSearch(q);
          document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" });
        }} />
        <TrustStrip />
        <BookingSection id="booking-section"/>
        <Expeditions initialSearch={heroSearch} />
        <Footer />
      </div>
    );
  }