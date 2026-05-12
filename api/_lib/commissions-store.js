const crypto = require('crypto');
const { del, get, put } = require('@vercel/blob');
const sharp = require('sharp');

const { COMMISSIONS_MANIFEST_PATH } = require('./config');
const defaultIconGridIndexes = require('../../src/WinXP/apps/default-icon-grid-indexes.json');
const commissionPlacement = require('../../src/WinXP/apps/commission-placement.json');

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
const ROWS_PER_COLUMN = Number(commissionPlacement.rowsPerColumn) || 11;
const RANDOM_AREA = commissionPlacement.randomArea || {};
const RANDOM_START_ROW = Number(RANDOM_AREA.startRow) || 1;
const RANDOM_END_ROW = Number(RANDOM_AREA.endRow) || 8;
const RANDOM_START_COLUMN = Number(RANDOM_AREA.startColumn) || 4;
const RANDOM_END_COLUMN = Number(RANDOM_AREA.endColumn) || 16;
const CATBOX_FILE_HOST = 'files.catbox.moe';
const COMMISSION_ICON_SIZE = 32;

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
  if (value === undefined || value === null || value === '') {
    return null;
  }

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

function normalizeRemoteImageUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return '';
  }

  const trimmed = value.trim();

  // Allow relative paths (self-hosted assets)
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
  } catch (error) {
    const invalidUrlError = new Error('Commission image URL is invalid');
    invalidUrlError.statusCode = 400;
    throw invalidUrlError;
  }

  if (
    parsedUrl.protocol !== 'https:' ||
    parsedUrl.hostname.toLowerCase() !== CATBOX_FILE_HOST
  ) {
    const invalidHostError = new Error(
      'Commission image must be a files.catbox.moe URL',
    );
    invalidHostError.statusCode = 400;
    throw invalidHostError;
  }

  return parsedUrl.toString();
}

function normalizeRemoteMimeType(contentType, imageUrl) {
  const mimeType = String(contentType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  if (
    mimeType === 'image/png' ||
    mimeType === 'image/jpeg' ||
    mimeType === 'image/webp'
  ) {
    return mimeType;
  }

  if (/\.png(?:$|\?)/i.test(imageUrl)) {
    return 'image/png';
  }

  if (/\.(jpe?g|jfif)(?:$|\?)/i.test(imageUrl)) {
    return 'image/jpeg';
  }

  if (/\.webp(?:$|\?)/i.test(imageUrl)) {
    return 'image/webp';
  }

  const error = new Error('Commission image must be a PNG, JPG, or WEBP');
  error.statusCode = 400;
  throw error;
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

  if (mimeType === 'image/webp') {
    const riffHeader = buffer.subarray(0, 4).toString('ascii');
    const webpHeader = buffer.subarray(8, 12).toString('ascii');
    if (riffHeader !== 'RIFF' || webpHeader !== 'WEBP') {
      const error = new Error('Invalid WEBP image');
      error.statusCode = 400;
      throw error;
    }

    const chunkHeader = buffer.subarray(12, 16).toString('ascii');
    if (chunkHeader === 'VP8X' && buffer.length >= 30) {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }

    if (chunkHeader === 'VP8 ' && buffer.length >= 30) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }

    if (chunkHeader === 'VP8L' && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }

    const error = new Error('Invalid WEBP image');
    error.statusCode = 400;
    throw error;
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

function shuffle(values) {
  const nextValues = [...values];
  for (let index = nextValues.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextValues[index], nextValues[swapIndex]] = [
      nextValues[swapIndex],
      nextValues[index],
    ];
  }
  return nextValues;
}

function buildRandomAreaGridIndexes() {
  const indexes = [];

  for (let column = RANDOM_START_COLUMN; column <= RANDOM_END_COLUMN; column += 1) {
    for (let row = RANDOM_START_ROW; row <= RANDOM_END_ROW; row += 1) {
      indexes.push((column - 1) * ROWS_PER_COLUMN + (row - 1));
    }
  }

  return indexes;
}

function chooseRandomGridIndex(entries, currentId = '') {
  const occupiedIndexes = new Set(
    entries
      .filter(entry => entry.id !== currentId)
      .map(entry => Number(entry.gridIndex)),
  );
  const availableIndexes = shuffle(buildRandomAreaGridIndexes()).filter(
    gridIndex =>
      !RESERVED_GRID_INDEXES.has(gridIndex) && !occupiedIndexes.has(gridIndex),
  );

  if (!availableIndexes.length) {
    const error = new Error('No free commission slots are available');
    error.statusCode = 400;
    throw error;
  }

  return availableIndexes[0];
}

function buildPublicCommission(record) {
  const publicImageUrl =
    record.imageUrl ||
    `/api/commissions/image?id=${encodeURIComponent(record.id)}`;
  const result = {
    id: record.id,
    artistName: record.artistName,
    artistLink: record.artistLink,
    date: record.date,
    description: record.description,
    gridIndex: record.gridIndex,
    imageUrl: publicImageUrl,
    iconUrl: `/api/commissions/icon?id=${encodeURIComponent(record.id)}`,
    mimeType: record.mimeType,
    width: record.width,
    height: record.height,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
  if (Array.isArray(record.imageVariants) && record.imageVariants.length) {
    result.imageVariants = record.imageVariants;
  }
  return result;
}

async function getPublicCommissions() {
  const entries = await getCommissionsManifest();
  const nextEntries = await ensureCommissionIcons(entries);
  return sortCommissions(nextEntries).map(buildPublicCommission);
}

async function getCommission(id) {
  const entries = await getCommissionsManifest();
  return entries.find(entry => entry.id === id) || null;
}

function getCommissionIconPath(id) {
  return `commissions/icons/${id}.png`;
}

function getCommissionAssetPath(id, mimeType) {
  if (mimeType === 'image/png') {
    return `commissions/assets/${id}.png`;
  }

  if (mimeType === 'image/webp') {
    return `commissions/assets/${id}.webp`;
  }

  return `commissions/assets/${id}.jpg`;
}

async function createCommissionIconBuffer(buffer) {
  return sharp(buffer)
    .resize(COMMISSION_ICON_SIZE, COMMISSION_ICON_SIZE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();
}

async function writeCommissionIconAsset(id, buffer) {
  const iconPath = getCommissionIconPath(id);
  const iconBuffer = await createCommissionIconBuffer(buffer);

  await put(iconPath, iconBuffer, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'image/png',
    cacheControlMaxAge: 0,
  });

  return iconPath;
}

async function loadCommissionSourceBuffer(record) {
  if (record.imageUrl) {
    let fetchUrl = record.imageUrl;
    if (fetchUrl.startsWith('/')) {
      const baseUrl =
        process.env.APP_BASE_URL || `https://${process.env.VERCEL_URL}`;
      fetchUrl = `${baseUrl.replace(/\/$/, '')}${fetchUrl}`;
    }
    const response = await fetch(fetchUrl, { cache: 'no-store' });

    if (!response.ok) {
      const error = new Error('Failed to fetch commission image');
      error.statusCode = 400;
      throw error;
    }

    return Buffer.from(await response.arrayBuffer());
  }

  if (!record.assetPath) {
    const error = new Error('Commission image not found');
    error.statusCode = 404;
    throw error;
  }

  const asset = await get(record.assetPath, { access: 'private' });
  if (!asset) {
    const error = new Error('Commission image not found');
    error.statusCode = 404;
    throw error;
  }

  return Buffer.from(await new Response(asset.stream).arrayBuffer());
}

async function ensureCommissionIcon(record) {
  if (record.iconPath) {
    return record;
  }

  const sourceBuffer = await loadCommissionSourceBuffer(record);
  record.iconPath = await writeCommissionIconAsset(record.id, sourceBuffer);
  return record;
}

async function ensureCommissionIcons(entries) {
  let changed = false;

  for (const entry of entries) {
    if (entry.iconPath) continue;
    await ensureCommissionIcon(entry);
    changed = true;
  }

  if (changed) {
    await saveCommissionsManifest(sortCommissions(entries));
  }

  return entries;
}

async function loadCommissionImage(input, existing) {
  if (input.imageUrl) {
    const imageUrl = normalizeRemoteImageUrl(input.imageUrl);
    let fetchUrl = imageUrl;
    if (fetchUrl.startsWith('/')) {
      const baseUrl =
        process.env.APP_BASE_URL || `https://${process.env.VERCEL_URL}`;
      fetchUrl = `${baseUrl.replace(/\/$/, '')}${fetchUrl}`;
    }
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      const error = new Error('Failed to fetch commission image');
      error.statusCode = 400;
      throw error;
    }

    const mimeType = normalizeRemoteMimeType(
      response.headers.get('content-type'),
      imageUrl,
    );
    const buffer = Buffer.from(await response.arrayBuffer());

    return {
      imageUrl,
      mimeType,
      buffer,
      source: 'catbox',
    };
  }

  if (input.imageDataUrl) {
    const imageInfo = parseImageDataUrl(input.imageDataUrl);
    return {
      ...imageInfo,
      imageUrl: '',
      source: 'blob',
    };
  }

  if (!existing) {
    const error = new Error('Commission image is required');
    error.statusCode = 400;
    throw error;
  }

  return null;
}

async function upsertCommission(input) {
  const artistName = sanitizeLine(input.artistName, 80);
  const artistLink = normalizeArtistLink(input.artistLink);
  const date = sanitizeLine(input.date, 60);
  const description = sanitizeDescription(input.description, 280);
  const requestedGridIndex = parseGridIndex(input.gridIndex);

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
  const gridIndex =
    requestedGridIndex === null
      ? chooseRandomGridIndex(entries, existing ? existing.id : '')
      : requestedGridIndex;

  validateGridIndex(gridIndex, entries, existing ? existing.id : '');

  const imageInfo = await loadCommissionImage(input, existing);

  const updatedAt = createIsoStamp();

  if (!existing) {
    const id = createCommissionId();
    const { width, height } = parseImageDimensions(
      imageInfo.buffer,
      imageInfo.mimeType,
    );

    const record = {
      id,
      artistName,
      artistLink,
      date,
      description,
      gridIndex,
      imageUrl: imageInfo.imageUrl || '',
      assetPath: '',
      iconPath: '',
      mimeType: imageInfo.mimeType,
      width,
      height,
      createdAt: updatedAt,
      updatedAt,
    };

    if (imageInfo.source === 'blob') {
      const assetPath = getCommissionAssetPath(id, imageInfo.mimeType);

      await put(assetPath, imageInfo.buffer, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: imageInfo.mimeType,
        cacheControlMaxAge: 0,
      });

      record.assetPath = assetPath;
    }

    record.iconPath = await writeCommissionIconAsset(id, imageInfo.buffer);

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
    let assetPath = '';

    if (imageInfo.source === 'blob') {
      assetPath = getCommissionAssetPath(existing.id, imageInfo.mimeType);

      await put(assetPath, imageInfo.buffer, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: imageInfo.mimeType,
        cacheControlMaxAge: 0,
      });
    }

    if (existing.assetPath && existing.assetPath !== assetPath) {
      await del(existing.assetPath).catch(() => undefined);
    }

    existing.imageUrl = imageInfo.imageUrl || '';
    existing.assetPath = assetPath;
    existing.iconPath = await writeCommissionIconAsset(
      existing.id,
      imageInfo.buffer,
    );
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
    del(record.iconPath).catch(() => undefined),
  ]);

  return record;
}

module.exports = {
  RESERVED_GRID_INDEXES,
  buildPublicCommission,
  deleteCommission,
  getCommission,
  ensureCommissionIcon,
  getCommissionsManifest,
  getPublicCommissions,
  upsertCommission,
};
