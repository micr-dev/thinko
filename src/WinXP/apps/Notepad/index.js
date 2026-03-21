import React, { useState } from 'react';
import styled, { css } from 'styled-components';

import { WindowDropDowns } from 'components';
import dropDownData from './dropDownData';

export default function Notepad({
  onClose,
  initialText = '',
  readOnly = false,
  defaultWordWrap = false,
}) {
  const [docText, setDocText] = useState(initialText);
  const [wordWrap, setWordWrap] = useState(defaultWordWrap);

  function onClickOptionItem(item) {
    switch (item) {
      case 'Exit':
        onClose();
        break;
      case 'Word Wrap':
        setWordWrap(!wordWrap);
        break;
      case 'Time/Date':
        if (readOnly) break;
        const date = new Date();
        setDocText(
          `${docText}${date.toLocaleTimeString()} ${date.toLocaleDateString()}`,
        );
        break;
      default:
    }
  }
  function onTextAreaKeyDown(e) {
    if (readOnly) return;
    // handle tabs in text area
    if (e.which === 9) {
      e.preventDefault();
      e.persist();
      var start = e.target.selectionStart;
      var end = e.target.selectionEnd;
      setDocText(`${docText.substring(0, start)}\t${docText.substring(end)}`);

      // asynchronously update textarea selection to include tab
      // workaround due to https://github.com/facebook/react/issues/14174
      requestAnimationFrame(() => {
        e.target.selectionStart = start + 1;
        e.target.selectionEnd = start + 1;
      });
    }
  }

  function renderFormattedLine(line, lineIndex) {
    const segments = line.split(
      /(\[\[swatch:#[0-9A-Fa-f]{6}\]\]|\[[^\]]+\]\([^)]+\)|"[^"]+")/g,
    );

    return segments.filter(Boolean).map((segment, segmentIndex) => {
      const swatchMatch = segment.match(/^\[\[swatch:(#[0-9A-Fa-f]{6})\]\]$/);
      if (swatchMatch) {
        return (
          <ColorSwatch
            key={`line-${lineIndex}-segment-${segmentIndex}`}
            color={swatchMatch[1]}
            title={swatchMatch[1]}
          />
        );
      }

      const linkMatch = segment.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={`line-${lineIndex}-segment-${segmentIndex}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
          >
            {linkMatch[1]}
          </a>
        );
      }

      if (/^"[^"]+"$/.test(segment)) {
        return (
          <em key={`line-${lineIndex}-segment-${segmentIndex}`}>
            {segment.slice(1, -1)}
          </em>
        );
      }

      return (
        <React.Fragment key={`line-${lineIndex}-segment-${segmentIndex}`}>
          {segment}
        </React.Fragment>
      );
    });
  }

  return (
    <Div>
      <section className="np__toolbar">
        <WindowDropDowns items={dropDownData} onClickItem={onClickOptionItem} />
      </section>
      {readOnly ? (
        <StyledDocument wordWrap={wordWrap}>
          {docText.split('\n').map((line, lineIndex) => (
            <DocumentLine key={`line-${lineIndex}`} wordWrap={wordWrap}>
              {line ? renderFormattedLine(line, lineIndex) : '\u00a0'}
            </DocumentLine>
          ))}
        </StyledDocument>
      ) : (
        <StyledTextarea
          wordWrap={wordWrap}
          value={docText}
          onChange={e => {
            if (!readOnly) {
              setDocText(e.target.value);
            }
          }}
          onKeyDown={onTextAreaKeyDown}
          spellCheck={false}
          readOnly={readOnly}
        />
      )}
    </Div>
  );
}

const Div = styled.div`
  height: 100%;
  background: linear-gradient(to right, #edede5 0%, #ede8cd 100%);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  .np__toolbar {
    position: relative;
    height: 21px;
    flex-shrink: 0;
    border-bottom: 1px solid white;
  }
`;

const textContentStyles = css`
  flex: auto;
  outline: none;
  font-family: 'Lucida Console', monospace;
  font-size: 13px;
  line-height: 14px;
  padding: 2px;
  border: 1px solid #96abff;
`;

const StyledTextarea = styled.textarea`
  ${textContentStyles}
  resize: none;
  ${props => (props.wordWrap ? '' : 'white-space: nowrap; overflow-x: scroll;')}
  overflow-y: scroll;
`;

const StyledDocument = styled.div`
  ${textContentStyles}
  overflow: auto;
  background: #fff;
  user-select: text;
  cursor: text;

  a {
    color: #003399;
    text-decoration: underline;
  }
`;

const DocumentLine = styled.div`
  min-height: 14px;
  white-space: ${props => (props.wordWrap ? 'pre-wrap' : 'pre')};
  overflow-wrap: anywhere;

  em {
    font-style: italic;
  }
`;

const ColorSwatch = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  margin: 0 3px;
  vertical-align: text-bottom;
  border-radius: 999px 999px 820px 920px;
  border: 1px solid rgba(0, 0, 0, 0.45);
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.3);
  background: ${({ color }) => color};
`;
