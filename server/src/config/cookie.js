const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
};

function setSessionCookies(res, session) {
  const maxAge = session.expires_at
    ? Math.max(0, (session.expires_at * 1000) - Date.now())
    : 7 * 24 * 60 * 60 * 1000;

  res.cookie('access_token', session.access_token, {
    ...COOKIE_OPTIONS,
    maxAge,
  });

  res.cookie('refresh_token', session.refresh_token, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearSessionCookies(res) {
  res.clearCookie('access_token', { ...COOKIE_OPTIONS, maxAge: undefined });
  res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, maxAge: undefined });
}

module.exports = { setSessionCookies, clearSessionCookies };
