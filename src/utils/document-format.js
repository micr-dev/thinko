const DOCUMENT_SEGMENT_PATTERN = /(\[\[swatch:#[0-9A-Fa-f]{6}\]\]|\[[^\]]+\]\([^)]+\)|"[^"]+")/g;

function parseDocumentSegment(segment) {
  const swatchMatch = segment.match(/^\[\[swatch:(#[0-9A-Fa-f]{6})\]\]$/);
  if (swatchMatch) {
    return {
      type: 'swatch',
      color: swatchMatch[1],
    };
  }

  const linkMatch = segment.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (linkMatch) {
    return {
      type: 'link',
      label: linkMatch[1],
      href: linkMatch[2],
    };
  }

  if (/^"[^"]+"$/.test(segment)) {
    return {
      type: 'emphasis',
      value: segment.slice(1, -1),
    };
  }

  return {
    type: 'text',
    value: segment,
  };
}

export function parseDocumentLine(line = '') {
  return String(line)
    .split(DOCUMENT_SEGMENT_PATTERN)
    .filter(Boolean)
    .map(parseDocumentSegment);
}

export function parseDocument(text = '') {
  return String(text)
    .split('\n')
    .map(parseDocumentLine);
}
