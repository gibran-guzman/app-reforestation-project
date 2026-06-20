const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const logger = require('../utils/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws,
  },
});

if (!supabaseAnonKey) {
  logger.warn('SUPABASE_ANON_KEY no definida — supabaseAnon usará la service role key. Configúrala para un correcto aislamiento de permisos.');
}

const supabaseAnon = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        transport: ws,
      },
    })
  : supabase;

module.exports = { supabase, supabaseAnon };
