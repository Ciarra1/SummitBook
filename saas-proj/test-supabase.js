import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const { data, error } = await supabase.from("users").select("*").limit(1);

if (error) {
  console.error("❌ Connection failed:", error);
  process.exit(1);
} else {
  console.log("✅ Supabase connected!");
  console.log("Users table accessible");
}