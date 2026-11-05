import { createClient } from '@supabase/supabase-js';

// Giá trị mặc định dự phòng từ dự án Supabase đã khởi tạo
const DEFAULT_SUPABASE_URL = 'https://jfyufgondwbavdkakzzp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_Ap1sLry0LrFPTw9cVby7iw_EVOOsZ4K';

const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const supabaseUrl = envUrl && !envUrl.includes('your-project-id') ? envUrl : DEFAULT_SUPABASE_URL;
const supabaseAnonKey = envKey && !envKey.includes('your-anon-public-key') ? envKey : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-public-key')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const supabaseConfig = {
  url: supabaseUrl,
  isConfigured: isSupabaseConfigured,
};
