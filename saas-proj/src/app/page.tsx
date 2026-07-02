import Link from 'next/link';
import type { Metadata } from 'next';
import NavActions from "@/components/NavActions";
import LogoutButton from '@/components/LogoutButton';
export const metadata: Metadata = {
  title: 'SummitBook — Modernizing Philippine Mountaineering',
  description:
    'A centralized booking and roster platform for Filipino hikers and eco-tour organizers. Replace scattered Facebook threads with one streamlined system.',
};

const features = [
  {
    icon: '🗺️',
    title: 'Discovery Hub',
    description:
      'Search available climbs by mountain, difficulty, date, or organizer. Transparent pricing and full itinerary details — no DM required.',
  },
  {
    icon: '🚐',
    title: 'Real-Time Slot Tracking',
    description:
      'Organizers see van capacity and roster status live. No more "is there still a slot?" — availability is always up to date.',
  },
  {
    icon: '💳',
    title: 'Integrated Payments',
    description:
      'GCash, Maya, InstaPay, and QR Ph — all verified automatically via PayMongo. No screenshots, no manual confirmation, no uncollected downpayments.',
  },
  {
    icon: '📋',
    title: 'One-Click LGU Manifest',
    description:
      'Participant data compiled automatically into a compliant, print-ready PDF for submission to local tourism offices and barangay outposts.',
  },
  {
    icon: '✅',
    title: 'Verified Organizer Profiles',
    description:
      'Credentialed organizer profiles, user reviews, and secure escrow — so hikers never wonder if their deposit is going to a fly-by-night account.',
  },
  {
    icon: '📊',
    title: 'Organizer Analytics',
    description:
      'Track booking conversion rates, popular destinations, and seasonal trends. Data to grow a guiding business, not just manage it.',
  },
];

const compareRows = [
  {
    area: 'Availability Inquiries',
    old: '4+ hours/day answering "may slot pa ba?" on chat',
    new: 'Automated real-time slot display — zero chat needed',
  },
  {
    area: 'Payment Collection',
    old: 'Manual GCash screenshot verification, often missed',
    new: 'Auto-verified via PayMongo webhooks, instant confirmation',
  },
  {
    area: 'Safety Manifest',
    old: 'Raw name list copy-pasted in Messenger at midnight',
    new: 'Professional PDF export, one click, LGU-ready',
  },
  {
    area: 'Hiker Trust',
    old: '"Hope this organizer isn\'t a scam account"',
    new: 'Verified profiles, reviews, escrow-protected deposits',
  },
  {
    area: 'Cancellation Handling',
    old: 'Manual manifest edits, re-advertising, finance recalculation',
    new: 'Automatic roster updates, slot re-opens immediately',
  },
];

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;500;600&display=swap');

        :root {
          --forest: #1A3C2E;
          --forest-mid: #244D3A;
          --forest-light: #2E6048;
          --orange: #E8612A;
          --orange-light: #F07A45;
          --offwhite: #F7F4EE;
          --stone: #8A8070;
          --ink: #0E1C15;
          --border: #DDD9D0;
        }

        html { scroll-behavior: smooth; }

        .sb-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.1rem 5%;
          background: rgba(26,60,46,0.96);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .sb-nav-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.35rem; font-weight: 700;
          color: #F7F4EE; letter-spacing: -0.01em;
          text-decoration: none;
        }
        .sb-nav-logo span { color: var(--orange); }
        .sb-nav-links { display: flex; gap: 2rem; list-style: none; }
        .sb-nav-links a {
          color: rgba(247,244,238,0.75);
          text-decoration: none; font-size: 0.875rem; font-weight: 500;
          transition: color 0.2s;
        }
        .sb-nav-links a:hover { color: #F7F4EE; }
        .sb-nav-cta {
          background: var(--orange); color: #fff;
          padding: 0.55rem 1.3rem; border-radius: 6px;
          font-size: 0.875rem; font-weight: 600;
          text-decoration: none; transition: background 0.2s;
        }
        .sb-nav-cta:hover { background: var(--orange-light); }

        .sb-hero {
          min-height: 100vh;
          background: var(--forest);
          display: flex; flex-direction: column;
          justify-content: flex-end;
          position: relative; overflow: hidden;
          padding-top: 80px;
        }
        .sb-stars {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background:
            radial-gradient(1px 1px at 15% 12%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 42% 8%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 67% 15%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 83% 6%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 28% 22%, rgba(255,255,255,0.35) 0%, transparent 100%),
            radial-gradient(1px 1px at 55% 28%, rgba(255,255,255,0.45) 0%, transparent 100%),
            radial-gradient(1px 1px at 72% 20%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 25%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 8% 35%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 35% 18%, rgba(255,255,255,0.55) 0%, transparent 100%);
        }
        .sb-glow {
          position: absolute; bottom: 28%;
          left: 50%; transform: translateX(-50%);
          width: 70%; height: 200px;
          background: radial-gradient(ellipse at center, rgba(232,97,42,0.35) 0%, rgba(232,97,42,0.1) 40%, transparent 70%);
          pointer-events: none;
        }
        .sb-hero-content {
          position: relative; z-index: 10;
          padding: 0 5% 60px;
          max-width: 780px;
          margin: auto auto 0;
          text-align: center;
        }
        .sb-eyebrow {
          display: inline-block;
          font-size: 0.75rem; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--orange);
          background: rgba(232,97,42,0.12);
          border: 1px solid rgba(232,97,42,0.3);
          padding: 0.35rem 0.9rem; border-radius: 99px;
          margin-bottom: 1.5rem;
        }
        .sb-hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.4rem, 6vw, 4.2rem);
          font-weight: 900; color: #F7F4EE;
          line-height: 1.1; letter-spacing: -0.02em;
          margin-bottom: 1.25rem;
        }
        .sb-hero h1 em { font-style: normal; color: var(--orange); }
        .sb-hero-sub {
          font-size: clamp(1rem, 2vw, 1.15rem);
          color: rgba(247,244,238,0.7);
          line-height: 1.65; max-width: 580px;
          margin: 0 auto 2.2rem;
        }
        .sb-hero-actions {
          display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;
        }
        .sb-btn-primary {
          background: var(--orange); color: #fff;
          padding: 0.85rem 2rem; border-radius: 8px;
          font-size: 1rem; font-weight: 600;
          text-decoration: none; transition: all 0.2s; display: inline-block;
        }
        .sb-btn-primary:hover { background: var(--orange-light); transform: translateY(-1px); }
        .sb-btn-ghost {
          background: transparent; color: #F7F4EE;
          padding: 0.85rem 2rem; border-radius: 8px;
          font-size: 1rem; font-weight: 500;
          text-decoration: none; transition: all 0.2s; display: inline-block;
          border: 1px solid rgba(247,244,238,0.25);
        }
        .sb-btn-ghost:hover { border-color: rgba(247,244,238,0.6); background: rgba(247,244,238,0.05); }

        .sb-ridge { position: relative; z-index: 5; width: 100%; line-height: 0; margin-top: -2px; }
        .sb-ridge svg { width: 100%; display: block; }

        .sb-stats {
          background: var(--forest-mid);
          display: flex; justify-content: center; flex-wrap: wrap;
        }
        .sb-stat {
          padding: 2rem 3.5rem; text-align: center;
          border-right: 1px solid rgba(255,255,255,0.08);
        }
        .sb-stat:last-child { border-right: none; }
        .sb-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem; font-weight: 900;
          color: var(--orange); display: block; line-height: 1;
        }
        .sb-stat-label {
          font-size: 0.78rem; color: rgba(247,244,238,0.55);
          margin-top: 0.4rem; display: block; letter-spacing: 0.03em;
        }

        .sb-section { padding: 5rem 5%; }
        .sb-section-label {
          font-size: 0.72rem; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--orange); margin-bottom: 0.75rem;
        }
        .sb-section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          font-weight: 700; line-height: 1.2;
          color: var(--forest); margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }
        .sb-section-body {
          font-size: 1rem; line-height: 1.7;
          color: var(--stone); max-width: 560px;
        }

        .sb-problem {
          background: var(--offwhite);
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 5rem; align-items: center;
        }
        .sb-problem-visual {
          background: var(--forest); border-radius: 16px;
          padding: 2rem; display: flex; flex-direction: column; gap: 1rem;
        }
        .sb-chat-bubble {
          background: rgba(255,255,255,0.08); border-radius: 10px;
          padding: 0.9rem 1.1rem; border-left: 3px solid var(--orange);
        }
        .sb-chat-meta {
          font-size: 0.72rem; color: var(--orange);
          font-weight: 600; letter-spacing: 0.05em;
          margin-bottom: 0.35rem; text-transform: uppercase;
        }
        .sb-chat-text {
          font-size: 0.875rem; color: rgba(247,244,238,0.85); line-height: 1.5;
        }
        .sb-chaos-label {
          font-size: 0.75rem; color: rgba(247,244,238,0.4);
          text-align: center; font-style: italic; padding-top: 0.5rem;
        }

        .sb-features { background: white; }
        .sb-features-inner { max-width: 1100px; margin: 0 auto; }
        .sb-features-header { text-align: center; margin-bottom: 3.5rem; }
        .sb-features-header .sb-section-body { margin: 0 auto; }
        .sb-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.5rem;
        }
        .sb-feature-card {
          border: 1px solid var(--border); border-radius: 14px;
          padding: 1.75rem; transition: all 0.25s; background: white;
        }
        .sb-feature-card:hover {
          border-color: var(--forest-light); transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(26,60,46,0.1);
        }
        .sb-feature-icon {
          width: 44px; height: 44px;
          background: rgba(26,60,46,0.08); border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1rem; font-size: 1.3rem;
        }
        .sb-feature-card h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem; font-weight: 700;
          color: var(--forest); margin-bottom: 0.5rem;
        }
        .sb-feature-card p {
          font-size: 0.875rem; color: var(--stone); line-height: 1.65;
        }

        .sb-compare { background: var(--offwhite); }
        .sb-compare-inner { max-width: 900px; margin: 0 auto; }
        .sb-compare-header { text-align: center; margin-bottom: 3rem; }
        .sb-compare-header .sb-section-body { margin: 0 auto; }
        .sb-table {
          width: 100%; border-collapse: collapse; background: white;
          border-radius: 14px; overflow: hidden;
          box-shadow: 0 2px 20px rgba(26,60,46,0.07);
        }
        .sb-table thead tr { background: var(--forest); }
        .sb-table thead th {
          padding: 1rem 1.25rem; text-align: left;
          font-size: 0.8rem; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: rgba(247,244,238,0.7);
        }
        .sb-table thead th:first-child { color: #F7F4EE; }
        .sb-table thead th.sb-highlight { color: var(--orange); }
        .sb-table tbody tr { border-bottom: 1px solid var(--border); }
        .sb-table tbody tr:last-child { border-bottom: none; }
        .sb-table tbody td {
          padding: 1rem 1.25rem; font-size: 0.9rem;
          color: var(--ink); vertical-align: top;
        }
        .sb-table tbody td:first-child { font-weight: 500; color: var(--forest); }
        .sb-td-old { color: var(--stone) !important; font-style: italic; }
        .sb-td-new { color: var(--forest-light) !important; font-weight: 500 !important; }
        .sb-check { color: var(--orange); margin-right: 0.4rem; }

        .sb-dual-cta {
          background: var(--forest);
          display: grid; grid-template-columns: 1fr 1fr;
        }
        .sb-cta-panel {
          padding: 4rem 5%;
          border-right: 1px solid rgba(255,255,255,0.08);
        }
        .sb-cta-panel:last-child { border-right: none; }
        .sb-cta-tag {
          font-size: 0.72rem; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--orange); margin-bottom: 1rem; display: block;
        }
        .sb-cta-panel h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          color: #F7F4EE; font-weight: 700;
          line-height: 1.25; margin-bottom: 1rem; letter-spacing: -0.02em;
        }
        .sb-cta-panel p {
          font-size: 0.9rem; color: rgba(247,244,238,0.6);
          line-height: 1.7; margin-bottom: 1.75rem;
        }
        .sb-btn-white {
          background: white; color: var(--forest);
          padding: 0.85rem 2rem; border-radius: 8px;
          font-size: 1rem; font-weight: 600;
          text-decoration: none; transition: all 0.2s; display: inline-block;
        }
        .sb-btn-white:hover { background: #F7F4EE; transform: translateY(-1px); }

        .sb-footer {
          background: var(--ink);
          padding: 2.5rem 5%;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
        }
        .sb-footer-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem; color: #F7F4EE; font-weight: 700;
        }
        .sb-footer-logo span { color: var(--orange); }
        .sb-footer p { font-size: 0.8rem; color: rgba(247,244,238,0.35); }

        @media (max-width: 768px) {
          .sb-problem { grid-template-columns: 1fr; gap: 2.5rem; }
          .sb-dual-cta { grid-template-columns: 1fr; }
          .sb-cta-panel { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); }
          .sb-nav-links { display: none; }
          .sb-stat { padding: 1.5rem 2rem; }
        }
        
      `}</style>

      {/* NAV */}
      <nav className="sb-nav">
        <Link href="/" className="sb-nav-logo">
          Summit<span>Book</span>
        </Link>
        <ul className="sb-nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#compare">Why Us</a></li>
          <li><a href="#organizers">For Organizers</a></li>
        </ul>
        <NavActions />
        <LogoutButton/>
      </nav>

      {/* HERO */}
      <section className="sb-hero">
        <div className="sb-stars" />
        <div className="sb-glow" />
        <div className="sb-hero-content">
          <div className="sb-eyebrow">🇵🇭 Built for Philippine Mountaineering</div>
          <h1>
            Stop chasing<br />
            <em>GCash screenshots.</em><br />
            Start managing climbs.
          </h1>
          <p className="sb-hero-sub">
            SummitBook is a centralized booking and roster platform for Filipino hikers and
            eco-tour organizers — replacing scattered Facebook threads, manual manifests,
            and unverified payments with one streamlined system.
          </p>
          <div className="sb-hero-actions">
            <Link href="/signup?role=hiker" className="sb-btn-primary">Find a Climb</Link>
            <Link href="/signup?role=organizer" className="sb-btn-ghost">I&apos;m an Organizer →</Link>
          </div>
        </div>

        {/* Mountain ridge — signature element */}
        <div className="sb-ridge">
          <svg viewBox="0 0 1440 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="sunriseGlow" cx="50%" cy="0%" r="60%">
                <stop offset="0%" stopColor="#E8612A" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#E8612A" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path
              d="M0,180 L60,155 L130,130 L200,145 L280,100 L360,125 L430,90 L520,110 L600,75 L680,95 L760,60 L840,85 L920,65 L1000,90 L1080,70 L1160,100 L1240,80 L1320,110 L1380,95 L1440,115 L1440,220 L0,220 Z"
              fill="rgba(46,96,72,0.4)"
            />
            <path
              d="M0,180 L60,155 L130,130 L200,145 L280,100 L360,125 L430,90 L520,110 L600,75 L680,95 L760,60 L840,85 L920,65 L1000,90 L1080,70 L1160,100 L1240,80 L1320,110 L1380,95 L1440,115 L1440,220 L0,220 Z"
              fill="url(#sunriseGlow)"
            />
            <path
              d="M0,220 L0,195 L80,175 L160,185 L240,155 L330,165 L420,140 L500,158 L580,130 L660,150 L740,120 L820,138 L900,115 L980,135 L1060,118 L1150,140 L1240,125 L1320,148 L1390,138 L1440,155 L1440,220 Z"
              fill="#0E1C15"
            />
            <path d="M580,130 L600,128 L620,131 L635,138 L640,142" stroke="#E8612A" strokeWidth="1.5" fill="none" opacity="0.6" />
            <path d="M740,120 L760,117 L780,121 L795,128" stroke="#E8612A" strokeWidth="1.5" fill="none" opacity="0.5" />
            <path d="M900,115 L918,112 L935,116 L948,122" stroke="#E8612A" strokeWidth="1.5" fill="none" opacity="0.4" />
            <rect x="0" y="219" width="1440" height="2" fill="#F7F4EE" />
          </svg>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="sb-stats">
        {[
          { num: '4+ hrs', label: 'Saved per climb for organizers' },
          { num: '0', label: 'GCash screenshots needed' },
          { num: '1-click', label: 'LGU manifest export' },
          { num: 'Real-time', label: 'Van slot tracking' },
        ].map((s) => (
          <div key={s.label} className="sb-stat">
            <span className="sb-stat-num">{s.num}</span>
            <span className="sb-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* PROBLEM */}
      <section className="sb-section sb-problem">
        <div className="sb-problem-visual">
          <div className="sb-chat-bubble">
            <div className="sb-chat-meta">Akyat Bundok Facebook Group · 11:42 PM</div>
            <div className="sb-chat-text">&ldquo;Hi! May slot pa ba sa Sept 14 Mt. Pulag? Penge naman ng details at price 🙏&rdquo;</div>
          </div>
          <div className="sb-chat-bubble">
            <div className="sb-chat-meta">Organizer DM · 11:58 PM</div>
            <div className="sb-chat-text">&ldquo;Uy, pabayad na ng ₱500 downpayment sa GCash 09xx-xxx-xxxx. Send screenshot after 😅&rdquo;</div>
          </div>
          <div className="sb-chat-bubble">
            <div className="sb-chat-meta">Group Chat · Sept 11 · 9:03 AM</div>
            <div className="sb-chat-text">&ldquo;Nasa aling folder ba yung manifest? Paki-check kung kumpleto na yung pangalan ng lahat bago mag-LGU&rdquo;</div>
          </div>
          <div className="sb-chaos-label">The current reality for every Philippine climb organizer.</div>
        </div>
        <div>
          <div className="sb-section-label">The Problem</div>
          <h2 className="sb-section-title">The Philippine mountaineering industry runs on Facebook DMs.</h2>
          <p className="sb-section-body">
            Hikers sift through hundreds of posts to find a climb. Organizers field the same
            &ldquo;available pa ba?&rdquo; question dozens of times a day. Payments are collected via
            unverified GCash transfers. Manifests are compiled manually the night before the climb.
          </p>
          <p className="sb-section-body" style={{ marginTop: '1rem' }}>
            This is how a multi-billion peso eco-tourism industry still operates. SummitBook is built to fix it.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="sb-section sb-features" id="features">
        <div className="sb-features-inner">
          <div className="sb-features-header">
            <div className="sb-section-label">Platform Features</div>
            <h2 className="sb-section-title">Everything a climb needs, in one place.</h2>
            <p className="sb-section-body">
              From discovery to descent — SummitBook handles the logistics so organizers can
              focus on the climb and hikers can focus on the summit.
            </p>
          </div>
          <div className="sb-features-grid">
            {features.map((f) => (
              <div key={f.title} className="sb-feature-card">
                <div className="sb-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="sb-section sb-compare" id="compare">
        <div className="sb-compare-inner">
          <div className="sb-compare-header">
            <div className="sb-section-label">Why SummitBook</div>
            <h2 className="sb-section-title">From manual chaos to managed clarity.</h2>
            <p className="sb-section-body">
              A side-by-side look at how the status quo compares to what SummitBook enables.
            </p>
          </div>
          <table className="sb-table">
            <thead>
              <tr>
                <th>Operational Area</th>
                <th>Facebook / Manual</th>
                <th className="sb-highlight">SummitBook</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr key={row.area}>
                  <td>{row.area}</td>
                  <td className="sb-td-old">{row.old}</td>
                  <td className="sb-td-new"><span className="sb-check">✦</span>{row.new}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* DUAL CTA */}
      <section className="sb-dual-cta" id="organizers">
        <div className="sb-cta-panel">
          <span className="sb-cta-tag">For Hikers</span>
          <h2>Find your next summit in minutes, not hours.</h2>
          <p>
            Browse verified climbs, book your slot, pay securely — all without a single
            Facebook DM. Your adventure starts here.
          </p>
          <Link href="/signup?role=hiker" className="sb-btn-primary">Browse Climbs</Link>
        </div>
        <div className="sb-cta-panel">
          <span className="sb-cta-tag">For Organizers</span>
          <h2>Run your climbs like a business, not a side hustle.</h2>
          <p>
            Automate availability, payments, manifests, and roster management. Spend your
            energy on the mountains, not the admin.
          </p>
          <Link href="/signup?role=organizer" className="sb-btn-white">Start Managing Climbs</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="sb-footer">
        <div className="sb-footer-logo">Summit<span>Book</span></div>
        <p>Modernizing Philippine eco-tourism, one climb at a time.</p>
        <p style={{ color: 'rgba(247,244,238,0.2)' }}>© 2026 SummitBook</p>
      </footer>
    </>
  );
}
