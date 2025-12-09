import { createClient } from '@supabase/supabase-js';

// Using the credentials directly to avoid environment variable issues
const supabaseUrl = "https://qqlkuamchjczcggoggwz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbGt1YW1jaGpjemNnZ29nZ3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDk0MjksImV4cCI6MjA4MDgyNTQyOX0.VW24QdWJ9WBxcNrLa0NEM9qKmJf1p5MvpTvwx3eC-SI";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);