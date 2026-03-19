const crypto = require('crypto');

const PUBLIC_MANIFEST_PATH = 'drawings/manifests/public.json';
const COMMISSIONS_MANIFEST_PATH = 'commissions/manifest.json';
const ADMIN_PATH = '/admin/drawings';
const SESSION_COOKIE = 'xp_admin_session';
const OAUTH_STATE_COOKIE = 'xp_admin_oauth_state';

function getEnv(name, fallback = '') {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function getSessionSecret() {
  return getEnv('SESSION_SECRET', 'xp-drawings-dev-secret');
}

function getSubmissionsManifestPath() {
  return `drawings/manifests/submissions-${crypto
    .createHash('sha256')
    .update(getSessionSecret())
    .digest('hex')
    .slice(0, 16)}.json`;
}

function getBaseUrl(req) {
  const configured = getEnv('APP_BASE_URL');
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const protocol =
    req.headers['x-forwarded-proto'] ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host;

  return `${protocol}://${host}`;
}

function getGitHubConfig(req) {
  return {
    clientId: getEnv('GITHUB_CLIENT_ID'),
    clientSecret: getEnv('GITHUB_CLIENT_SECRET'),
    adminLogin: getEnv('GITHUB_ADMIN_LOGIN'),
    callbackUrl: `${getBaseUrl(req)}/api/admin/oauth/github/callback`,
  };
}

function getNtfyConfig() {
  return {
    topic: getEnv('NTFY_TOPIC'),
    baseUrl: getEnv('NTFY_BASE_URL', 'https://ntfy.sh').replace(/\/$/, ''),
  };
}

module.exports = {
  ADMIN_PATH,
  COMMISSIONS_MANIFEST_PATH,
  OAUTH_STATE_COOKIE,
  PUBLIC_MANIFEST_PATH,
  SESSION_COOKIE,
  getBaseUrl,
  getGitHubConfig,
  getNtfyConfig,
  getSessionSecret,
  getSubmissionsManifestPath,
};
