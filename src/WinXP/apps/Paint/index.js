import React, { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import HeaderButtons from 'WinXP/Windows/HeaderButtons';
import paintIcon from 'assets/windowsIcons/680(16x16).png';
import {
  PaintCanvas,
  PaintMenuBar,
  PaintPatternPalette,
  PaintStrokeSettings,
  PaintToolbar,
} from './components';

const DEFAULT_CANVAS_WIDTH = 589;
const DEFAULT_CANVAS_HEIGHT = 418;
const SUBMISSION_RULES = [
  'draw whatever you want :)',
  'just skip gore, swastikas, hate symbols, and the usual bad stuff',
];

function Paint({ isFocus }) {
  const canvasRef = useRef(null);
  const [selectedTool, setSelectedTool] = useState('pencil');
  const [selectedPattern, setSelectedPattern] = useState('pattern-1');
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('Untitled.png');
  const [canvasWidth, setCanvasWidth] = useState(DEFAULT_CANVAS_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(DEFAULT_CANVAS_HEIGHT);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showIntroDialog, setShowIntroDialog] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submissionTitle, setSubmissionTitle] = useState('Untitled');
  const [submissionStatus, setSubmissionStatus] = useState({
    state: 'idle',
    message: '',
  });

  function handleToolSelect(tool) {
    if (tool === 'spray' && strokeWidth < 10) {
      setStrokeWidth(10);
    } else if (tool === 'brush' && strokeWidth < 4) {
      setStrokeWidth(4);
    } else if (tool === 'pencil' && strokeWidth > 1) {
      setStrokeWidth(1);
    }
    setSelectedTool(tool);
  }

  function resetCanvas() {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
    setCurrentFileName('Untitled.png');
    setCanvasWidth(DEFAULT_CANVAS_WIDTH);
    setCanvasHeight(DEFAULT_CANVAS_HEIGHT);
    setHasUnsavedChanges(false);
  }

  async function handleSaveLikeDownload(fileName = currentFileName) {
    if (!canvasRef.current) return;

    const blob = await canvasRef.current.exportCanvas();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    setHasUnsavedChanges(false);
  }

  async function handleSubmitDrawing() {
    if (!canvasRef.current) return;

    try {
      setSubmissionStatus({
        state: 'submitting',
        message: 'sending it over... (^-^)',
      });

      const blob = await canvasRef.current.exportCanvas();
      const imageDataUrl = await blobToDataUrl(blob);
      const response = await fetch('/api/drawings/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title:
            submissionTitle.trim() || currentFileName.replace(/\.png$/i, ''),
          imageDataUrl,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Submission failed');
      }

      setSubmissionStatus({
        state: 'success',
        message:
          "sent for review! if it's approved, it'll show up in drawings :)",
      });
    } catch (error) {
      setSubmissionStatus({
        state: 'error',
        message: (error.message || 'submission failed').toLowerCase(),
      });
    }
  }

  function handleImportFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = loadEvent => {
      const dataUrl = loadEvent.target && loadEvent.target.result;
      if (typeof dataUrl !== 'string') return;

      const img = new Image();
      img.onload = () => {
        let newWidth = img.width;
        let newHeight = img.height;

        if (newWidth > DEFAULT_CANVAS_WIDTH) {
          const ratio = DEFAULT_CANVAS_WIDTH / newWidth;
          newWidth = DEFAULT_CANVAS_WIDTH;
          newHeight = Math.round(img.height * ratio);
        }

        setCanvasWidth(newWidth);
        setCanvasHeight(newHeight);
        if (canvasRef.current) {
          canvasRef.current.importImage(dataUrl);
        }
        setCurrentFileName(file.name);
        setHasUnsavedChanges(false);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  const selectedPatternPreview = useMemo(
    () => `/patterns/Property 1=${selectedPattern.split('-')[1]}.svg`,
    [selectedPattern],
  );

  return (
    <Shell>
      <PaintMenuBar
        canUndo={canUndo}
        canRedo={canRedo}
        currentFileName={
          hasUnsavedChanges ? `${currentFileName} *` : currentFileName
        }
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        onNewFile={resetCanvas}
        onSave={() => handleSaveLikeDownload()}
        onImportFile={handleImportFile}
        onExportFile={() => handleSaveLikeDownload(currentFileName)}
        onClear={() => canvasRef.current?.clear()}
        onCut={() => canvasRef.current?.cut()}
        onCopy={() => canvasRef.current?.copy()}
        onPaste={() => canvasRef.current?.paste()}
        onApplyFilter={filter => canvasRef.current?.applyFilter(filter)}
        onSubmit={() => {
          setSubmissionTitle(
            currentFileName.replace(/\.png$/i, '') || 'Untitled',
          );
          setSubmissionStatus({ state: 'idle', message: '' });
          setShowSubmitDialog(true);
        }}
      />
      <Workspace>
        <Sidebar>
          <Panel>
            <PaintToolbar
              selectedTool={selectedTool}
              onToolSelect={handleToolSelect}
            />
          </Panel>
          <Panel>
            <PaintStrokeSettings
              strokeWidth={strokeWidth}
              onStrokeWidthChange={setStrokeWidth}
            />
          </Panel>
        </Sidebar>
        <CanvasArea>
          <CanvasFrame>
            <PaintCanvas
              ref={canvasRef}
              selectedTool={selectedTool}
              selectedPattern={selectedPattern}
              strokeWidth={strokeWidth}
              onCanUndoChange={setCanUndo}
              onCanRedoChange={setCanRedo}
              onContentChange={() => setHasUnsavedChanges(true)}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              isForeground={isFocus}
            />
          </CanvasFrame>
        </CanvasArea>
      </Workspace>
      <StatusBar>
        <PreviewWrap>
          <Preview src={selectedPatternPreview} alt="" />
        </PreviewWrap>
        <PaletteWrap>
          <PaintPatternPalette
            selectedPattern={selectedPattern}
            onPatternSelect={setSelectedPattern}
          />
        </PaletteWrap>
      </StatusBar>
      {showIntroDialog && (
        <ModalOverlay>
          <DialogWindow>
            <DialogHeaderBg />
            <DialogHeader>
              <DialogTitleWrap>
                <DialogTitleIcon src={paintIcon} alt="" />
                <span>paint note (^_^)</span>
              </DialogTitleWrap>
              <DialogHeaderButtons
                buttons={['close']}
                onClose={() => setShowIntroDialog(false)}
                onMinimize={() => {}}
                onMaximize={() => {}}
                maximized={false}
                resizable={false}
                isFocus={true}
              />
            </DialogHeader>
            <DialogContent>
              <DialogText>
                you can submit drawings from paint.
                <br />
                after review, the approved ones show up in my pictures on the
                desktop.
              </DialogText>
              <RuleList>
                {SUBMISSION_RULES.map(rule => (
                  <li key={rule}>{rule}</li>
                ))}
              </RuleList>
              <DialogActions>
                <DialogButton
                  type="button"
                  onClick={() => setShowIntroDialog(false)}
                >
                  ok
                </DialogButton>
              </DialogActions>
            </DialogContent>
          </DialogWindow>
        </ModalOverlay>
      )}
      {showSubmitDialog && (
        <ModalOverlay>
          <DialogWindow>
            <DialogHeaderBg />
            <DialogHeader>
              <DialogTitleWrap>
                <DialogTitleIcon src={paintIcon} alt="" />
                <span>send to my pictures? (o^-^o)</span>
              </DialogTitleWrap>
              <DialogHeaderButtons
                buttons={['close']}
                onClose={() => {
                  setShowSubmitDialog(false);
                  setSubmissionStatus({ state: 'idle', message: '' });
                }}
                onMinimize={() => {}}
                onMaximize={() => {}}
                maximized={false}
                resizable={false}
                isFocus={true}
              />
            </DialogHeader>
            <DialogContent>
              <DialogText>
                this sends your current paint drawing to the review queue.
              </DialogText>
              <FieldLabel htmlFor="paint-submit-title">title</FieldLabel>
              <FieldInput
                id="paint-submit-title"
                type="text"
                value={submissionTitle}
                onChange={event => setSubmissionTitle(event.target.value)}
              />
              {submissionStatus.message && (
                <DialogStatus data-state={submissionStatus.state}>
                  {submissionStatus.message}
                </DialogStatus>
              )}
              <DialogActions>
                <DialogButton
                  type="button"
                  onClick={() => {
                    setShowSubmitDialog(false);
                    setSubmissionStatus({ state: 'idle', message: '' });
                  }}
                >
                  {submissionStatus.state === 'success' ? 'close' : 'cancel'}
                </DialogButton>
                {submissionStatus.state !== 'success' && (
                  <PrimaryDialogButton
                    type="button"
                    disabled={submissionStatus.state === 'submitting'}
                    onClick={handleSubmitDrawing}
                  >
                    {submissionStatus.state === 'submitting'
                      ? 'sending...'
                      : 'submit'}
                  </PrimaryDialogButton>
                )}
              </DialogActions>
            </DialogContent>
          </DialogWindow>
        </ModalOverlay>
      )}
      {!isFocus && <InactiveOverlay />}
    </Shell>
  );
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const Shell = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #c0c0c0 url('/patterns/Property 1=7.svg') repeat;
`;

const Workspace = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 8px;
  padding: 8px;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 84px;
  flex-shrink: 0;
`;

const Panel = styled.div`
  background: #fff;
  border: 2px solid #000;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
`;

const CanvasArea = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
`;

const CanvasFrame = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #fff;
  border: 2px solid #000;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
`;

const StatusBar = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0;
  height: 58px;
  margin: 0 8px 8px;
  background: #d4d0c8;
  border: 2px solid #000;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
`;

const PreviewWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 82px;
  padding: 0 8px;
  border-right: 1px solid #000;
  background: #ece9d8;
`;

const Preview = styled.img`
  width: 36px;
  height: 32px;
  border: 1px solid #000;
  object-fit: cover;
`;

const PaletteWrap = styled.div`
  flex: 1;
  min-width: 0;
`;

const InactiveOverlay = styled.div`
  position: absolute;
  inset: 0;
`;

const ModalOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(17, 31, 53, 0.22);
  z-index: 3;
`;

const DialogWindow = styled.div`
  width: min(372px, 100%);
  padding: 3px;
  border-radius: 8px 8px 0 0;
  background: #0831d9;
  box-shadow: 0 18px 34px rgba(11, 29, 60, 0.28);
  position: relative;
  font-size: 12px;
  color: #1b2f4c;
`;

const DialogHeaderBg = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  height: 28px;
  overflow: hidden;
  pointer-events: none;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  background: linear-gradient(
    to bottom,
    #0058ee 0%,
    #3593ff 4%,
    #288eff 6%,
    #127dff 8%,
    #036ffc 10%,
    #0262ee 14%,
    #0057e5 20%,
    #0054e3 24%,
    #0055eb 56%,
    #005bf5 66%,
    #026afe 76%,
    #0062ef 86%,
    #0052d6 92%,
    #0040ab 94%,
    #003092 100%
  );

  &:before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 15px;
    background: linear-gradient(to right, #1638e6 0%, transparent 100%);
  }

  &:after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 15px;
    background: linear-gradient(to left, #1638e6 0%, transparent 100%);
  }
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  height: 25px;
  padding-left: 2px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-shadow: 1px 1px #000;
`;

const DialogTitleWrap = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

const DialogTitleIcon = styled.img`
  width: 15px;
  height: 15px;
  margin: 0 4px 0 1px;
`;

const DialogHeaderButtons = styled(HeaderButtons)`
  margin-top: -1px;
  margin-right: 1px;
`;

const DialogContent = styled.div`
  position: relative;
  padding: 14px;
  background: #ece9d8;
  border: 1px solid #0a246a;
  border-top: 0;
`;

const DialogText = styled.div`
  line-height: 1.45;
`;

const RuleList = styled.ul`
  margin: 10px 0 0;
  padding-left: 18px;
  line-height: 1.45;
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
`;

const DialogButton = styled.button`
  min-width: 78px;
  height: 23px;
  padding: 0 12px;
  border: none;
  border-radius: 2px;
  background: rgb(240, 240, 240);
  box-shadow: 1px 1px 0 #000, 0 0 0 1px #fff, inset 0 0 0 1px #fdfdfd,
    inset -1px -1px 0 #b7b7b7, inset 1px 1px 0 #ffffff;
  cursor: pointer;
  font-size: 11px;
  line-height: 11px;
  color: #222;
  text-transform: lowercase;

  &:hover {
    box-shadow: 1px 1px 0 #000, 0 0 0 1px #fff, inset 0 0 0 1px #fdfdfd,
      inset -1px -1px 0 #b7b7b7, inset 1px 1px 0 #ffffff, 0 0 0 2px #f1c15c;
  }

  &:active {
    background: rgb(222, 222, 222);
    box-shadow: 1px 1px 0 #000, 0 0 0 1px #fff, inset 1px 1px 0 #9c9c9c,
      inset -1px -1px 0 #f8f8f8;
  }

  &:focus-visible {
    outline: 1px dotted #000;
    outline-offset: -4px;
  }

  &:disabled {
    cursor: default;
    color: #7d7d7d;
    box-shadow: 1px 1px 0 #8f8f8f, 0 0 0 1px #f2f2f2, inset 0 0 0 1px #efefef,
      inset -1px -1px 0 #d1d1d1, inset 1px 1px 0 #ffffff;
  }
`;

const PrimaryDialogButton = styled(DialogButton)`
  font-weight: 700;
`;

const FieldLabel = styled.label`
  display: block;
  margin-top: 12px;
  margin-bottom: 4px;
  color: #284161;
  text-transform: lowercase;
`;

const FieldInput = styled.input`
  width: 100%;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #7f9db9;
  background: #fff;
`;

const DialogStatus = styled.div`
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid #7f9db9;
  background: #f4f7fb;

  &[data-state='success'] {
    border-color: #4a7e34;
    background: #eef9df;
  }

  &[data-state='error'] {
    border-color: #9a3b3b;
    background: #ffe9e9;
  }
`;

export default Paint;
