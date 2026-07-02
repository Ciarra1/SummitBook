'use client';

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface GenerateDummyExpeditionBtnProps {
  organizerProfileId: string;
}

export default function GenerateDummyExpeditionBtn({ organizerProfileId }: GenerateDummyExpeditionBtnProps) {
  
  const seedExpeditions = async () => {
    const supabase = createBrowserSupabaseClient();

    const dummyExpeditions = [
      {
        organizer_id: organizerProfileId,
        mountain_name: 'Tarak Ridge',
        // Must exactly match the check constraint: 'beginner', 'intermediate', or 'advanced'
        difficulty_level: 'advanced', 
        start_date: '2026-12-01',
        end_date: '2026-12-03',
        total_van_slots: 15,
        booked_slots: 0,
        price_per_person: 30000.00,
        title: 'Tarak Ridge Day Hike ',
        description: `Tarak Ridge is just one part of Mount Mariveles’ many peaks, but it is notable for its rocky terrain, steep cliffs, and jagged rocks. Locals in turn named the ridge Tarak, an amalgam of “Tabak” (hunting knife) and “Tarik” (steep). The climb is actually moderate to hard, in terms of difficulty. The dramatic landscape of the ridge continues to attract more mountaineers every year to Tarak Ridge. From here, hikers can see Bataan, the nearby islands of Corregidor, as well as Manila Bay and Cavite. This is definitely one of the most outstanding treks to be made.
 
Only the first part of the trail is easy, after which the trek is pure and steep ascents.. The plains are usually burned during the summer months in kaingin (slash and burn). For those who haven’t been to Tarak Ridge since 2006, the typhoons of that year have damaged some sections of the trail, that holding on to roots and branches are needed in some parts. One of the stops is at Papaya River, where hikers can take a breather before continuing on to Tarak Ridge. It takes 2-3 hours from the Papaya River to reach the summit

`,
        highlights: [
          'Hike up the highest mountain of the Bataan Province',
          'See an incredible view of the Manila Bay',
          'Pass through old growth forests and even swim in a river'
        ],

        itinerary: [
          'Roundtrip transportation via private vehicle: Manila-Bataan-Manila',
          'Registration fees, entrance fees and other applicable entrance fees',
          'Services of our Adventure Guides.',
          'Local Guide fees'
        ],
        included_amenities: [
          'Roundtrip Van Transfers', 
          'Local Guides', 
          'Porter for group gear', 
          'Climb Certificates',
          'Permit Fees'
        ],
        gear_requirements: [
          'A change of clothes', 
          'A good pair of trekking shoes', 
          'Things for sun and rain Protection (e.g. Sunblock, raincoat, shades, cap)', 
          'Water or other rehydration fluids(a minimum of 3liters/person is recommended)',
          'Trail Food',
          'Packed lunch',
          'Personal Medications',
          'Trekking pole',
          'Extra plastic bags or dry bags for your dirty clothes',
          'Slippers'
        ],
        
        mountain_img_url: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f', // A placeholder mountain image
        
        trail_steepness: 'Very Steep',
        trail_exposure: 'High sun exposure on the boulder face',
        mobile_signal: null, 
        transportation: 'Toyota Hiace Commuter Van',
        // NEW COLUMNS ADDED FROM UPDATED SCHEMA
            
        temperature: 'Can drop to 5°C at night',
        exclusions: 'Personal porter, meals, travel insurance',
        water_source: 'present',
        restroom: 'none',
        river_crossing: 'present',
        meals: 'Not Provided',
        special_equipment: 'none',

        pickup_location: 'McDonalds Bajada, Davao City',
        // FIX: Schema expects text[]
        gallery_img_urls: [
          'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
          'https://images.unsplash.com/photo-1519681393784-d120267933ba'
        ], 
      }
    ];

    try {
      const { data, error } = await supabase
        .from('expeditions')
        .insert(dummyExpeditions)
        .select();

      if (error) {
        // We throw the actual Supabase PostgREST error object
        throw error; 
      }
      
      alert('Dummy data inserted successfully! Check console and database.');
      console.log('Inserted:', data);
      
    } catch (err: any) {
      console.error('Failed to insert dummy data:', err);
      // This will alert the specific SQL or API error preventing the insert
      alert(`Insert Failed: ${err.message || 'Unknown Error'}\nDetails: ${err.details || err.hint || 'Check console'}`);
    }
  };

  return (
    <div className="p-4 border-2 border-dashed border-red-500 rounded-lg inline-block">
      <p className="text-sm text-red-500 mb-2 font-bold">Dev Only:</p>
      <button 
        onClick={seedExpeditions}
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm"
      >
        Seed Mt. Tarak Expedition
      </button>
    </div>
  );
}