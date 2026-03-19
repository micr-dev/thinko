import React, { useRef } from 'react';
import styled from 'styled-components';
import PaintFiltersMenu from './PaintFiltersMenu';

function PaintMenuBar({
  canUndo,
  canRedo,
  currentFileName,
  onUndo,
  onRedo,
  onNewFile,
  onSave,
  onImportFile,
  onExportFile,
  onClear,
  onCut,
  onCopy,
  onPaste,
  onApplyFilter,
  onSubmit,
}) {
  const fileInputRef = useRef(null);

  return (
    <Bar>
      <ActionButton type="button" onClick={onNewFile}>
        New
      </ActionButton>
      <ActionButton type="button" onClick={() => fileInputRef.current?.click()}>
        Open
      </ActionButton>
      <ActionButton type="button" onClick={onSave}>
        Save
      </ActionButton>
      <ActionButton type="button" onClick={onExportFile}>
        Export
      </ActionButton>
      <ActionButton type="button" onClick={onSubmit}>
        Submit
      </ActionButton>
      <Separator />
      <ActionButton type="button" onClick={onUndo} disabled={!canUndo}>
        Undo
      </ActionButton>
      <ActionButton type="button" onClick={onRedo} disabled={!canRedo}>
        Redo
      </ActionButton>
      <ActionButton type="button" onClick={onCut}>
        Cut
      </ActionButton>
      <ActionButton type="button" onClick={onCopy}>
        Copy
      </ActionButton>
      <ActionButton type="button" onClick={onPaste}>
        Paste
      </ActionButton>
      <ActionButton type="button" onClick={onClear}>
        Clear
      </ActionButton>
      <PaintFiltersMenu onApplyFilter={onApplyFilter} />
      <FileName title={currentFileName}>{currentFileName}</FileName>
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        onChange={onImportFile}
        hidden
      />
    </Bar>
  );
}

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  border-bottom: 1px solid #7f9db9;
  background: #ece9d8;
  font-size: 11px;
`;

const ActionButton = styled.button`
  height: 20px;
  padding: 0 6px;
  border: 0;
  background: transparent;
  font-size: 11px;
  color: #000;

  &:hover:not(:disabled) {
    background: #d8d2bd;
  }

  &:active:not(:disabled) {
    background: #0a246a;
    color: #fff;
  }

  &:disabled {
    color: #7a7a7a;
  }
`;

const Separator = styled.div`
  width: 1px;
  height: 18px;
  margin: 0 2px;
  background: #aca899;
`;

const FileName = styled.div`
  min-width: 0;
  margin-left: auto;
  padding-left: 10px;
  border-left: 1px solid #b8b1a0;
  color: #404040;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export default PaintMenuBar;
