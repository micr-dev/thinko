const crypto = require('crypto');

const {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  getSessionSecret,
} = require('./config');
const { getHeader, sendError, setHeader } = require('./http');

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function createSignature(payload) {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
}

function getSecureFlag() {
  // Explicitly control Secure flag through environment variable
  // Default to true in production, can be overridden
  const value = process.env.COOKIE_SECURE;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return process.env.NODE_ENV === 'production';
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${value}`];
  parts.push(`Path=${options.path || '/'}`);
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  if (options.httpOnly !== false) {
    parts.push('HttpOnly');
  }
  parts.push(`SameSite=${options.sameSite || 'Strict'}`);
  if (options.secure ?? getSecureFlag()) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

function appendSetCookie(res, cookieValue) {
  const existing = res.getHeader ? res.getHeader('Set-Cookie') : undefined;
  if (!existing) {
    setHeader(res, 'Set-Cookie', cookieValue);
    return;
  }

  const nextValue = Array.isArray(existing)
    ? [...existing, cookieValue]
    : [existing, cookieValue];
  setHeader(res, 'Set-Cookie', nextValue);
}

function parseCookies(req) {
  const cookieHeader = getHeader(req, 'cookie');
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce((acc, chunk) => {
    const [name, ...rest] = chunk.trim().split('=');
    if (!name) return acc;
    acc[name] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

function createSignedValue(payload) {
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = createSignature(encoded);
  return `${encoded}.${signature}`;
}

function verifySignedValue(value) {
  if (!value || !value.includes('.')) return null;

  const [encoded, providedSignature] = value.split('.');
  const expectedSignature = createSignature(encoded);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  return JSON.parse(base64UrlDecode(encoded));
}

function setAdminSession(res, login) {
  const now = Date.now();
  const payload = {
    login,
    exp: now + 1000 * 60 * 60 * 24 * 7,
  };

  appendSetCookie(
    res,
    serializeCookie(SESSION_COOKIE, createSignedValue(payload), {
      maxAge: 60 * 60 * 24 * 7,
    }),
  );
}

function clearAdminSession(res) {
  appendSetCookie(
    res,
    serializeCookie(SESSION_COOKIE, '', {
      maxAge: 0,
    }),
  );
}

function setOauthState(res, state) {
  appendSetCookie(
    res,
    serializeCookie(OAUTH_STATE_COOKIE, createSignedValue({ state }), {
      maxAge: 60 * 10,
    }),
  );
}

function clearOauthState(res) {
  appendSetCookie(
    res,
    serializeCookie(OAUTH_STATE_COOKIE, '', {
      maxAge: 0,
    }),
  );
}

function getAdminSession(req) {
  const cookies = parseCookies(req);
  const payload = verifySignedValue(cookies[SESSION_COOKIE]);
  if (!payload || !payload.exp || payload.exp < Date.now()) {
    return null;
  }
  return payload;
}

function getOauthState(req) {
  const cookies = parseCookies(req);
  const payload = verifySignedValue(cookies[OAUTH_STATE_COOKIE]);
  return payload && payload.state ? payload.state : null;
}

function requireAdmin(req, res) {
  const session = getAdminSession(req);
  if (!session) {
    sendError(res, 401, 'Authentication required');
    return null;
  }
  return session;
}

module.exports = {
  clearAdminSession,
  clearOauthState,
  getAdminSession,
  getOauthState,
  requireAdmin,
  setAdminSession,
  setOauthState,
};
