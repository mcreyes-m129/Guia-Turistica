import { createClient } from '@supabase/supabase-js';

// Reemplaza con tus claves de Supabase
const SUPABASE_URL = 'https://qflwkrucnupxjfxtyyby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbHdrcnVjbnVweGpmeHR5eWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MjAyMjMsImV4cCI6MjA5MjI5NjIyM30.Xzxs5tbNVD_dWA-L1A7QHL8CQz7T8i4PsSVCWi5jF5E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
