import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gdlnehrgfaaloiuexraa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkbG5laHJnZmFhbG9pdWV4cmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NTUwMTEsImV4cCI6MjA5MjQzMTAxMX0.nPLXcjPpBNKNNhWFcSBqjBn2DKBfU7dgQucXXFNYv9U';

export const supabase = createClient(supabaseUrl, supabaseKey);
