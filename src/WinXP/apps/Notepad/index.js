import React, { useState } from 'react';
import styled, { css } from 'styled-components';

import FormattedDocument from 'components/FormattedDocument';
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

  return (
    <Div>
      <section className="np__toolbar">
        <WindowDropDowns items={dropDownData} onClickItem={onClickOptionItem} />
      </section>
      {readOnly ? (
        <StyledDocument text={docText} wordWrap={wordWrap} />
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

const StyledDocument = styled(FormattedDocument)`
  ${textContentStyles}
  overflow: auto;
  background: #fff;
  user-select: text;
  cursor: text;
`;
