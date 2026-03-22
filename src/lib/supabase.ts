import { createClient } from '@supabase/supabase-js'

// Connessione al database Supabase
// Le credenziali sono nel file .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)