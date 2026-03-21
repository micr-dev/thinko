import { parseDocument, parseDocumentLine } from './document-format';

describe('document format parser', () => {
  test('parses links, emphasis, swatches, and text in one line', () => {
    expect(
      parseDocumentLine(
        'hello [site](https://example.com) "quoted" [[swatch:#BB1E10]] done',
      ),
    ).toEqual([
      { type: 'text', value: 'hello ' },
      {
        type: 'link',
        label: 'site',
        href: 'https://example.com',
      },
      { type: 'text', value: ' ' },
      { type: 'emphasis', value: 'quoted' },
      { type: 'text', value: ' ' },
      { type: 'swatch', color: '#BB1E10' },
      { type: 'text', value: ' done' },
    ]);
  });

  test('parses a multiline document', () => {
    expect(parseDocument('first line\nsecond line')).toEqual([
      [{ type: 'text', value: 'first line' }],
      [{ type: 'text', value: 'second line' }],
    ]);
  });
});
