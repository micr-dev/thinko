const crypto = require('crypto');
const { del, get, put } = require('@vercel/blob');

const { COMMISSIONS_MANIFEST_PATH } = require('./config');
const defaultIconGridIndexes = require('../../src/WinXP/apps/default-icon-grid-indexes.json');

const JPEG_START_OF_FRAME_MARKERS = new Set([
  0xc0,
  0xc1,
  0xc2,
  0xc3,
  0xc5,
  0xc6,
  0xc7,
  0xc9,
  0xca,
  0xcb,
  0xcd,
  0xce,
  0xcf,
]);
const JPEG_STANDALONE_MARKERS = new Set([
  0x01,
  0xd0,
  0xd1,
  0xd2,
  0xd3,
  0xd4,
  0xd5,
  0xd6,
  0xd7,
  0xd8,
  0xd9,
]);
const RESERVED_GRID_INDEXES = new Set(
  Object.values(defaultIconGridIndexes).map(value => Number(value)),
);

function requireBlobConfig() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const error = new Error('BLOB_READ_WRITE_TOKEN is not configured');
    error.statusCode = 500;
    throw error;
  }
}

function createCommissionId() {
  return `commission_${Date.now().toString(36)}_${crypto
    .randomBytes(4)
    .toString('hex')}`;
}

function createIsoStamp() {
  return new Date().toISOString();
}

function sanitizeLine(value, limit = 120) {
  const raw = typeof value === 'string' ? value.trim() : '';
  return raw.replace(/\s+/g, ' ').slice(0, limit);
}

function sanitizeDescription(value, limit = 280) {
  const raw = typeof value === 'string' ? value.trim() : '';
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, limit);
}

function normalizeArtistLink(value) {
  const link = sanitizeLine(value, 200);
  if (!link) return '';
  if (/^https?:\/\//i.test(link)) return link;
  return `https://${link}`;
}

function parseGridIndex(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    const error = new Error('A valid desktop position is required');
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

function parseImageDataUrl(imageDataUrl) {
  if (typeof imageDataUrl !== 'string') {
    const error = new Error('Commission image is required');
    error.statusCode = 400;
    throw error;
  }

  const match = imageDataUrl.match(
    /^data:(image\/png|image\/jpeg);base64,(.+)$/,
  );
  if (!match) {
    const error = new Error('Commission image must be a PNG or JPG');
    error.statusCode = 400;
    throw error;
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function parseImageDimensions(buffer, mimeType) {
  if (mimeType === 'image/png') {
    const pngSignature = '89504e470d0a1a0a';
    if (buffer.subarray(0, 8).toString('hex') !== pngSignature) {
      const error = new Error('Invalid PNG image');
      error.statusCode = 400;
      throw error;
    }

    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (mimeType !== 'image/jpeg') {
    const error = new Error('Unsupported image type');
    error.statusCode = 400;
    throw error;
  }

  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    const error = new Error('Invalid JPG image');
    error.statusCode = 400;
    throw error;
  }

  let offset = 2;
  while (offset + 1 < buffer.length) {
    while (offset < buffer.length && buffer[offset] !== 0xff) {
      offset += 1;
    }

    if (offset + 1 >= buffer.length) break;

    let markerOffset = offset + 1;
    while (markerOffset < buffer.length && buffer[markerOffset] === 0xff) {
      markerOffset += 1;
    }

    if (markerOffset >= buffer.length) break;

    const marker = buffer[markerOffset];
    offset = markerOffset + 1;

    if (JPEG_STANDALONE_MARKERS.has(marker)) {
      continue;
    }

    if (offset + 1 >= buffer.length) break;
    const size = buffer.readUInt16BE(offset);
    if (size < 2 || offset + size > buffer.length) break;

    if (JPEG_START_OF_FRAME_MARKERS.has(marker)) {
      if (size < 7) break;
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += size;
  }

  const error = new Error('Invalid JPG image');
  error.statusCode = 400;
  throw error;
}

async function readBlobJson(pathname, fallbackValue) {
  requireBlobConfig();
  const result = await get(pathname, { access: 'private' });
  if (!result) return fallbackValue;

  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

async function writeBlobJson(pathname, data) {
  requireBlobConfig();
  await put(pathname, JSON.stringify(data, null, 2), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
    cacheControlMaxAge: 0,
  });
}

async function getCommissionsManifest() {
  return readBlobJson(COMMISSIONS_MANIFEST_PATH, []);
}

async function saveCommissionsManifest(entries) {
  return writeBlobJson(COMMISSIONS_MANIFEST_PATH, entries);
}

function sortCommissions(entries) {
  return [...entries].sort((left, right) => left.gridIndex - right.gridIndex);
}

function validateGridIndex(gridIndex, entries, currentId = '') {
  if (RESERVED_GRID_INDEXES.has(gridIndex)) {
    const error = new Error('That desktop slot is already reserved');
    error.statusCode = 400;
    throw error;
  }

  const occupied = entries.find(
    entry => entry.id !== currentId && entry.gridIndex === gridIndex,
  );
  if (occupied) {
    const error = new Error('That desktop slot is already occupied');
    error.statusCode = 400;
    throw error;
  }
}

function buildPublicCommission(record) {
  return {
    id: record.id,
    artistName: record.artistName,
    artistLink: record.artistLink,
    date: record.date,
    description: record.description,
    gridIndex: record.gridIndex,
    imageUrl: `/api/commissions/image?id=${encodeURIComponent(record.id)}`,
    iconUrl: `/api/commissions/image?id=${encodeURIComponent(record.id)}`,
    mimeType: record.mimeType,
    width: record.width,
    height: record.height,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function getPublicCommissions() {
  return sortCommissions(await getCommissionsManifest()).map(
    buildPublicCommission,
  );
}

async function getCommission(id) {
  const entries = await getCommissionsManifest();
  return entries.find(entry => entry.id === id) || null;
}

async function upsertCommission(input) {
  const artistName = sanitizeLine(input.artistName, 80);
  const artistLink = normalizeArtistLink(input.artistLink);
  const date = sanitizeLine(input.date, 60);
  const description = sanitizeDescription(input.description, 280);
  const gridIndex = parseGridIndex(input.gridIndex);

  if (!artistName) {
    const error = new Error('Artist name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!date) {
    const error = new Error('Date is required');
    error.statusCode = 400;
    throw error;
  }

  const entries = await getCommissionsManifest();
  const existing = input.id
    ? entries.find(entry => entry.id === input.id) || null
    : null;

  validateGridIndex(gridIndex, entries, existing ? existing.id : '');

  let imageInfo = null;
  if (input.imageDataUrl) {
    imageInfo = parseImageDataUrl(input.imageDataUrl);
  } else if (!existing) {
    const error = new Error('Commission image is required');
    error.statusCode = 400;
    throw error;
  }

  const updatedAt = createIsoStamp();

  if (!existing) {
    const id = createCommissionId();
    const fileExtension = imageInfo.mimeType === 'image/png' ? 'png' : 'jpg';
    const assetPath = `commissions/assets/${id}.${fileExtension}`;
    const { width, height } = parseImageDimensions(
      imageInfo.buffer,
      imageInfo.mimeType,
    );

    await put(assetPath, imageInfo.buffer, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: imageInfo.mimeType,
      cacheControlMaxAge: 0,
    });

    const record = {
      id,
      artistName,
      artistLink,
      date,
      description,
      gridIndex,
      assetPath,
      mimeType: imageInfo.mimeType,
      width,
      height,
      createdAt: updatedAt,
      updatedAt,
    };

    await saveCommissionsManifest(sortCommissions([record, ...entries]));
    return record;
  }

  existing.artistName = artistName;
  existing.artistLink = artistLink;
  existing.date = date;
  existing.description = description;
  existing.gridIndex = gridIndex;
  existing.updatedAt = updatedAt;

  if (imageInfo) {
    const { width, height } = parseImageDimensions(
      imageInfo.buffer,
      imageInfo.mimeType,
    );
    const fileExtension = imageInfo.mimeType === 'image/png' ? 'png' : 'jpg';
    const assetPath = `commissions/assets/${existing.id}.${fileExtension}`;

    await put(assetPath, imageInfo.buffer, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: imageInfo.mimeType,
      cacheControlMaxAge: 0,
    });

    if (existing.assetPath && existing.assetPath !== assetPath) {
      await del(existing.assetPath).catch(() => undefined);
    }

    existing.assetPath = assetPath;
    existing.mimeType = imageInfo.mimeType;
    existing.width = width;
    existing.height = height;
  }

  await saveCommissionsManifest(sortCommissions(entries));
  return existing;
}

async function deleteCommission(id) {
  const entries = await getCommissionsManifest();
  const record = entries.find(entry => entry.id === id);
  if (!record) {
    const error = new Error('Commission not found');
    error.statusCode = 404;
    throw error;
  }

  await Promise.all([
    saveCommissionsManifest(entries.filter(entry => entry.id !== id)),
    del(record.assetPath).catch(() => undefined),
  ]);

  return record;
}

module.exports = {
  RESERVED_GRID_INDEXES,
  buildPublicCommission,
  deleteCommission,
  getCommission,
  getCommissionsManifest,
  getPublicCommissions,
  upsertCommission,
};
