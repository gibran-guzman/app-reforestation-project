// La librería `pg`/`pg-connection-string` sobreescribe la opción `ssl` explícita
// cuando la URL trae `?sslmode=require` (la trata como `verify-full`), lo que
// produce `SELF_SIGNED_CERT_IN_CHAIN` contra bases con certificado autofirmado
// (p. ej. Supabase en despliegues). Para evitarlo, se quita el `sslmode` de la
// URL y se pasa la opción `ssl` de forma explícita.

const SSL_MODES = ['require', 'verify-ca', 'verify-full', 'prefer'];

function stripSslMode(url) {
  return (url || '').replace(/[?&]sslmode=[^&#]+/g, '').replace(/[?&]$/, '');
}

function buildPoolConfig(databaseUrl, overrides = {}) {
  const raw = databaseUrl || process.env.DATABASE_URL || '';
  const sslMode = /[?&]sslmode=([^&#]+)/.exec(raw)?.[1];

  let ssl;
  if (overrides.ssl !== undefined) {
    ssl = overrides.ssl;
  } else if (SSL_MODES.includes(sslMode)) {
    ssl = { rejectUnauthorized: false };
  } else {
    ssl = undefined;
  }

  const connectionString = raw ? stripSslMode(raw) : undefined;

  return {
    connectionString,
    ...overrides,
    ssl,
  };
}

module.exports = { buildPoolConfig, stripSslMode };
