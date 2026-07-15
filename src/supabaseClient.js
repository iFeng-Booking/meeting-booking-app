import { createClient } from "@supabase/supabase-js";

// These are the project's public URL and "anon" key. The anon key is safe
// to ship in client-side code by design — it only grants what your Row
// Level Security policies allow (see project README for how to lock this
// down before wider rollout).
const SUPABASE_URL = "https://joqfkglqezzyostmtzsk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcWZrZ2xxZXp6eW9zdG10enNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNzg0OTksImV4cCI6MjA5OTY1NDQ5OX0.fOkPt2VFan4dJ-WnM_mvYRPfQQIIrR0jPM3rn3q9-jA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
