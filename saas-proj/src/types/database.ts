export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "hiker" | "organizer" | "admin";
  email_verified: boolean;
  created_at: string;
};

export type OrganizerProfile = {
  id: string;
  user_id: string;
  company_name: string;
  verification_status: "pending" | "verified" | "rejected";
  average_rating: number;
  total_reviews: number;
  bio?: string;
  created_at: string;
};

export type Expedition = {
  id: string;
  organizer_id: string;
  mountain_name: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  start_date: string;
  end_date: string;
  total_van_slots: number;
  booked_slots: number;
  price_per_person: number;
  title: string;
  description: string;
  is_published: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  hiker_id: string;
  expedition_id: string;
  booking_status: "pending" | "confirmed" | "cancelled";
  payment_status: "pending" | "completed" | "failed" | "refunded";
  final_price: number;
  participant_name: string;
  participant_phone?: string;
  date_of_birth?: string | null;
  age?: number | null;
  sex?: "Male" | "Female" | null;
  created_at: string;
};

export type Payment = {
  id: string;
  booking_id: string;
  paymongo_payment_id: string;
  amount: number;
  payment_status: "pending" | "succeeded" | "failed";
  created_at: string;
};