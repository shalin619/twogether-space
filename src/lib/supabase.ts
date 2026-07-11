// Re-export the Lovable Cloud Supabase client so existing `@/lib/supabase`
// imports continue to work. Do not create a second client here — it would
// not share auth state with the integration client.
export { supabase } from "@/integrations/supabase/client";
