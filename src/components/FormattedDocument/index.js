import React from 'react';
import styled from 'styled-components';

import { parseDocument } from 'utils/document-format';

function renderToken(token, key) {
  switch (token.type) {
    case 'swatch':
      return (
        <span
          key={key}
          className="formatted-document__swatch"
          style={{ background: token.color }}
          title={token.color}
        />
      );
    case 'link':
      return (
        <a key={key} href={token.href} target="_blank" rel="noreferrer">
          {token.label}
        </a>
      );
    case 'emphasis':
      return <em key={key}>{token.value}</em>;
    default:
      return <React.Fragment key={key}>{token.value}</React.Fragment>;
  }
}

function FormattedDocument({ text = '', wordWrap = false, className }) {
  const parsedLines = parseDocument(text);

  return (
    <Root className={className} $wordWrap={wordWrap}>
      {parsedLines.map((line, lineIndex) => (
        <div key={`line-${lineIndex}`} className="formatted-document__line">
          {line.length
            ? line.map((token, tokenIndex) =>
                renderToken(token, `line-${lineIndex}-token-${tokenIndex}`),
              )
            : '\u00a0'}
        </div>
      ))}
    </Root>
  );
}

const Root = styled.div`
  a {
    color: #003399;
    text-decoration: underline;
  }

  em {
    font-style: italic;
  }

  .formatted-document__line {
    min-height: 14px;
    white-space: ${({ $wordWrap }) => ($wordWrap ? 'pre-wrap' : 'pre')};
    overflow-wrap: anywhere;
  }

  .formatted-document__swatch {
    display: inline-block;
    width: 14px;
    height: 14px;
    margin: 0 3px;
    vertical-align: text-bottom;
    border-radius: 999px 999px 820px 920px;
    border: 1px solid rgba(0, 0, 0, 0.45);
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.3);
  }
`;

export default styled(FormattedDocument)``;
