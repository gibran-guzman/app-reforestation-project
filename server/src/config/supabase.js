const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment');
}

if (!supabaseAnonKey) {
  throw new Error(
    'SUPABASE_ANON_KEY must be defined in environment — used for user-facing auth (login/signup) with RLS isolation',
  );
}

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws,
  },
};

const supabase = createClient(supabaseUrl, supabaseServiceKey, clientOptions);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

module.exports = { supabase, supabaseAnon };
