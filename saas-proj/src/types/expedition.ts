// Updated to match your database constraint: 'draft', 'published', 'completed', 'cancelled'
export type ExpeditionStatus = "draft" | "published" | "completed" | "cancelled";

export interface Expedition {
  id: string;
  title: string | null; // Schema says it can be null
  mountain_name: string; 
  mountain_img_url: string | null;
  status: ExpeditionStatus;
  price_per_person: number;
  start_date: string;
  end_date: string;
  total_van_slots: number;
  booked_slots: number;
  updated_at: string;
}

export type StatusFilter = "all" | ExpeditionStatus;
export type SortKey = "updated" | "start_date" | "title";