// Supabase client setup
// NOTE: Replace these with your Supabase project values
const SUPABASE_URL = window.SUPABASE_URL || 'https://bwuatptnstdfdqkmrxlx.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3dWF0cHRuc3RkZmRxa21yeGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDc2NDgsImV4cCI6MjA4NTcyMzY0OH0.7gfR5p24zYffhtGtTDQNPktazxHuRcqT0Ryx_RuM1L4';

let supabaseClient = null;

function isSupabaseConfigured() {
  return !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (!window.supabase) {
    throw new Error('Supabase SDK not loaded. Make sure supabase-js is included.');
  }
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not configured. Update SUPABASE_URL and SUPABASE_ANON_KEY.');
  }
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}
