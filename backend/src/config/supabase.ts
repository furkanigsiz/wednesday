import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase yapılandırması eksik. SUPABASE_URL ve SUPABASE_KEY environment variable\'ları gerekli.');
}

export const supabase = createClient(supabaseUrl, supabaseKey); 