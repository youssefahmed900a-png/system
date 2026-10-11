//const supabaseUrl = "https://qhckkhonmmkqlibtvopx.supabase.co";
//const supabaseKey = "sb_publishable_I3m1QG_iZL01abbODbY3sw_itf29ApA";

//const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

//last code
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// const SUPABASE_URL = 'https://qhckkhonmmkqlibtvopx.supabase.co';
// const SUPABASE_ANON_KEY = 'sb_publishable_I3m1QG_iZL01abbODbY3sw_itf29ApA';

//export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

//end last code 


//new code 

import { createClient } from '@supabase/supabase-js'

// تقرأ القيم تلقائياً من المكتوب في Vercel بدلاً من كتابتها هنا
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL 
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY 

export const supabase = createClient(supabaseUrl, supabaseKey)
//end new code