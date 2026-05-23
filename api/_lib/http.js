function setHeader(res, name, value) {
  if (typeof res.setHeader === 'function') {
    res.setHeader(name, value);
    return;
  }

  res.set(name, value);
}

function getHeader(req, name) {
  if (!req.headers) return '';

  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value || '';
}

const { getTrustProxy } = require('./config');

function getClientIp(req) {
  // Only trust X-Forwarded-For when explicitly configured to do so
  // Otherwise, use the direct socket IP to prevent spoofing
  if (getTrustProxy()) {
    const forwardedFor = getHeader(req, 'x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    'unknown'
  );
}

async function readRawBody(req) {
  if (req.body && typeof req.body === 'string') {
    return req.body;
  }

  if (req.body && Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }

  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body);
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  const raw = await readRawBody(req);
  if (!raw) return {};
  return JSON.parse(raw);
}

function sendJson(res, statusCode, body) {
  setHeader(res, 'Content-Type', 'application/json; charset=utf-8');
  res.statusCode = statusCode;
  res.end(JSON.stringify(body));
}

function sendError(res, statusCode, message, extra = {}) {
  sendJson(res, statusCode, { error: message, ...extra });
}

function redirect(res, location) {
  res.statusCode = 302;
  setHeader(res, 'Location', location);
  res.end();
}

function methodNotAllowed(res, methods) {
  setHeader(res, 'Allow', methods.join(', '));
  sendError(res, 405, 'Method not allowed');
}

function noStore(res) {
  setHeader(res, 'Cache-Control', 'no-store');
}

module.exports = {
  getClientIp,
  getHeader,
  methodNotAllowed,
  noStore,
  readJsonBody,
  redirect,
  sendError,
  sendJson,
  setHeader,
};
