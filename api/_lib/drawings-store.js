const crypto = require('crypto');
const { copy, get, put } = require('@vercel/blob');

const {
  PUBLIC_MANIFEST_PATH,
  getSubmissionsManifestPath,
} = require('./config');

function requireBlobConfig() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const error = new Error('BLOB_READ_WRITE_TOKEN is not configured');
    error.statusCode = 500;
    throw error;
  }
}

function createDrawingId() {
  return `drawing_${Date.now().toString(36)}_${crypto
    .randomBytes(4)
    .toString('hex')}`;
}

function createIsoStamp() {
  return new Date().toISOString();
}

function sanitizeTitle(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  return raw.replace(/\s+/g, ' ').slice(0, 80);
}

function defaultTitle() {
  return `Drawing ${createIsoStamp()
    .slice(0, 16)
    .replace('T', ' ')}`;
}

function slugify(value) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'drawing';
}

function parsePngDimensions(buffer) {
  const pngSignature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== pngSignature) {
    throw new Error('Only PNG submissions are supported');
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function readBlobJson(pathname, access, fallbackValue) {
  requireBlobConfig();
  const result = await get(pathname, { access });
  if (!result) return fallbackValue;

  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

async function writeBlobJson(pathname, data, access) {
  requireBlobConfig();
  await put(pathname, JSON.stringify(data, null, 2), {
    access,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
    cacheControlMaxAge: access === 'public' ? 30 : 0,
  });
}

async function getSubmissionsManifest() {
  return readBlobJson(getSubmissionsManifestPath(), 'private', []);
}

async function saveSubmissionsManifest(entries) {
  return writeBlobJson(getSubmissionsManifestPath(), entries, 'private');
}

async function getPublicManifest() {
  return readBlobJson(PUBLIC_MANIFEST_PATH, 'private', []);
}

async function savePublicManifest(entries) {
  return writeBlobJson(PUBLIC_MANIFEST_PATH, entries, 'private');
}

async function getSubmissionAsset(id) {
  const submissions = await getSubmissionsManifest();
  return submissions.find(entry => entry.id === id) || null;
}

async function getPublishedDrawing(id) {
  const drawings = await getPublicManifest();
  return drawings.find(entry => entry.id === id) || null;
}

async function createSubmission({ title, imageBuffer }) {
  requireBlobConfig();

  const cleanedTitle = sanitizeTitle(title) || defaultTitle();
  const id = createDrawingId();
  const createdAt = createIsoStamp();
  const { width, height } = parsePngDimensions(imageBuffer);
  const submissionPath = `drawings/submissions/${id}.png`;

  await put(submissionPath, imageBuffer, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'image/png',
    cacheControlMaxAge: 0,
  });

  const submissions = await getSubmissionsManifest();
  const record = {
    id,
    title: cleanedTitle,
    status: 'pending',
    createdAt,
    updatedAt: createdAt,
    submissionPath,
    publicPath: null,
    reviewerLogin: null,
    reviewedAt: null,
    rejectionReason: '',
    width,
    height,
  };

  submissions.unshift(record);
  await saveSubmissionsManifest(submissions);

  return record;
}

function sortSubmissions(entries) {
  const statusWeight = {
    pending: 0,
    approved: 1,
    rejected: 2,
  };

  return [...entries].sort((left, right) => {
    const statusDelta =
      (statusWeight[left.status] || 99) - (statusWeight[right.status] || 99);
    if (statusDelta !== 0) return statusDelta;
    return right.createdAt.localeCompare(left.createdAt);
  });
}

async function approveSubmission(id, reviewerLogin) {
  const submissions = await getSubmissionsManifest();
  const record = submissions.find(entry => entry.id === id);
  if (!record) {
    const error = new Error('Submission not found');
    error.statusCode = 404;
    throw error;
  }

  const publicSlug = `${slugify(record.title)}-${record.id.slice(-6)}.png`;
  const publicPath = `drawings/public/${publicSlug}`;

  await copy(record.submissionPath, publicPath, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'image/png',
    cacheControlMaxAge: 0,
  });

  const updatedAt = createIsoStamp();
  record.status = 'approved';
  record.updatedAt = updatedAt;
  record.publicPath = publicPath;
  record.reviewedAt = updatedAt;
  record.reviewerLogin = reviewerLogin;
  record.rejectionReason = '';

  const publicEntries = await getPublicManifest();
  const publicRecord = {
    id: record.id,
    title: record.title,
    fileName: publicSlug,
    imageUrl: `/api/drawings/image?id=${encodeURIComponent(record.id)}`,
    publicPath,
    width: record.width,
    height: record.height,
    publishedAt: updatedAt,
  };

  const nextPublicEntries = [
    publicRecord,
    ...publicEntries.filter(entry => entry.id !== record.id),
  ];

  await Promise.all([
    saveSubmissionsManifest(submissions),
    savePublicManifest(nextPublicEntries),
  ]);

  return {
    record,
    publicRecord,
  };
}

async function rejectSubmission(id, reviewerLogin, reason = '') {
  const submissions = await getSubmissionsManifest();
  const record = submissions.find(entry => entry.id === id);
  if (!record) {
    const error = new Error('Submission not found');
    error.statusCode = 404;
    throw error;
  }

  const updatedAt = createIsoStamp();
  record.status = 'rejected';
  record.updatedAt = updatedAt;
  record.reviewedAt = updatedAt;
  record.reviewerLogin = reviewerLogin;
  record.rejectionReason = sanitizeTitle(reason).slice(0, 160);

  await saveSubmissionsManifest(submissions);
  return record;
}

module.exports = {
  approveSubmission,
  createSubmission,
  getPublishedDrawing,
  getPublicManifest,
  getSubmissionAsset,
  getSubmissionsManifest,
  rejectSubmission,
  sortSubmissions,
};
