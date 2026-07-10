# Modernizing the Philippine Mountaineering Booking Ecosystem

## 1. Introduction & Background
To legally climb a mountain in the Philippines, hikers must navigate a strict regulatory framework that involves securing permits from local tourism offices and coordinating with local guides. Because this bureaucratic friction is complex and intimidating for individuals, third-party travel agencies and independent organizers have become the essential mediators of local eco-tourism. These organizers act as the backbone of the industry: they manage compliance, coordinate logistics, and provide round-trip transportation, allowing hikers to focus entirely on the climb.

## 2. The Current Status Quo
Despite the rapid growth of the local eco-tourism sector, the operational workflow for these organizers remains heavily reliant on fragmented social media channels rather than dedicated booking systems. The standard procedure is highly manual and deeply inefficient:

*   **Discovery:** Organizers publish upcoming schedules, itineraries, and package inclusions on massive community Facebook groups (e.g., "Akyat Bundok").
*   **Inquiry & Booking:** Interested individuals must send direct messages to verify slot availability, forcing organizers to field repetitive inquiries across multiple chat threads.
*   **The Screenshot Hunt (Payment):** Transactions are predominantly cashless via local e-wallets (GCash, Maya) or bank transfers (InstaPay). To secure a seat, hikers must manually send a down payment and reply with a screenshot of the transaction receipt.
*   **Pre-Climb Coordination:** A few days prior to the hike, organizers create temporary Facebook Messenger Group Chats to drop final itineraries, share gear checklists, and manually collect participant details for the official manifest.

## 3. Problem Statement
This reliance on unstructured messaging for roster management is the definitive bottleneck in the modern Philippine mountaineering ecosystem. The current system creates a chaotic, high-friction environment for both sides of the market:

### For the Hikers:
*   **Vulnerability to Scams:** Booking through unstructured Facebook groups and transferring downpayments to unverified personal e-wallet accounts leaves hikers highly susceptible to fraudulent, "fly-by-night" organizers.
*   **Friction in Discovery:** Finding available van slots for specific dates requires sifting through hundreds of disorganized social media posts and waiting hours for chat replies.

### For the Agencies and Organizers:
*   **Administrative Overload:** Collecting data from Messenger or Google Forms and manually transcribing it into a database is tedious and highly prone to human error.
*   **Lack of Real-Time Tracking:** Organizers lack a centralized dashboard to track onboard hikers, pending downpayments, and available van slots.
*   **Inefficient Roster Management:** If a hiker bails out or cancels, manually updating individual manifests, recalculating shared finances, and re-advertising the vacant slot becomes an operational nightmare.

## 4. The "Why" (Rationale & Significance)
This problem requires an immediate solution because the local eco-tourism industry is scaling faster than the digital infrastructure supporting it. By replacing scattered social media workflows with a centralized Software-as-a-Service (SaaS) platform, we can drastically reduce administrative overhead for organizers while providing a secure, seamless booking experience for hikers.

| Operational Area | The Status Quo (Facebook / Manual) | The SaaS Solution (Proposed Platform) |
| :--- | :--- | :--- |
| **Administration** | 4+ hours/day answering "Is this available?" via chat. | 0 hours. Automated, real-time slot tracking. |
| **Finance** | Manually checking and verifying GCash screenshots. | Automated payment verification and tracking. |
| **Safety & Logistics** | Sending a raw list of names via Messenger text. | One-click PDF export of a professional Hiker Manifest. |
| **Trust & Security** | "Hope I don't get scammed by a fake organizer." | Escrow systems, verified profiles, and rating systems. |

## 5. Project Description and Objectives
This project proposes the development of a B2B2C Software-as-a-Service (SaaS) platform designed specifically for the Philippine mountaineering and eco-tourism sector. It functions as a centralized marketplace for hikers and a comprehensive management dashboard for organizers.

### Core Platform Modules:
*   **Centralized Discovery Hub:** A dynamic marketplace where hikers can search for climbs by mountain, difficulty, date, or organizer, complete with transparent pricing and itinerary details.
*   **Real-Time Inventory & Roster Management:** An automated dashboard for organizers to track van slots in real-time, eliminating the need to manually answer availability inquiries.
*   **Integrated Payment & Verification:** A standardized gateway supporting local e-wallets (GCash, Maya) and bank transfers, replacing the inefficient "screenshot hunt" with automated payment tracking and receipt generation.
*   **Automated Compliance & Logistics:** A single-click document generation tool that compiles participant data into a professional, standardized Hiker Manifest ready for submission to local tourism offices and barangay outposts.
*   **Trust & Verification System:** A credentialing system featuring verified organizer profiles, user reviews, and secure transaction handling to eliminate "fly-by-night" scams and build community trust.

## 6. Tech Stack

| Category | Recommended Technology | Why You Need It |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js (React) | Provides fast page loads and excellent SEO, crucial for hikers searching for climbs on Google. |
| **Styling** | Tailwind CSS | Allows for rapid, mobile-first design, ensuring the platform looks great on hikers' phones. |
| **Database & Auth** | Supabase (PostgreSQL) | Handles user logins securely, stores relational data reliably, and provides instant APIs without writing backend boilerplate. |
| **Payment Gateway** | PayMongo | The best API in the Philippines for handling GCash, Maya, QR Ph, and InstaPay without manual screenshot verification. |
| **Serverless Logic** | Supabase Edge Functions | Required to securely receive automated payment alerts (webhooks) from PayMongo and update your database. |
| **PDF Generation** | pdf-lib | A lightweight JavaScript library to automatically populate and export standardized LGU hiker manifests. |
| **Hosting** | Vercel | Seamlessly hosts your Next.js frontend with zero-configuration deployments. |
