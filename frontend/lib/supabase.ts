import { createClient } from '@supabase/supabase-js';

// Lấy chìa khóa từ két sắt .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Tạo ra một đối tượng 'supabase' để đi giao tiếp với Database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);