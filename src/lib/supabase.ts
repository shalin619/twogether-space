import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? "https://twlecxefwtqidukbzedl.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3bGVjeGVmd3RxaWR1a2J6ZWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0ODgyMTQsImV4cCI6MjA5OTA2NDIxNH0.XjsoS9A1e7puNk2G7MYpRuWTGu3chwZTzD3f4XJb17A";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
