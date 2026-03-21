import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import paintLargeIcon from 'assets/windowsIcons/680(32x32).png';
import {
  PaintCanvas,
  PaintPatternPalette,
  PaintStrokeSettings,
  PaintToolbar,
} from 'WinXP/apps/Paint/components';
import XpPanel from './xp-panel';

const MAX_CANVAS_WIDTH = 720;
const MAX_CANVAS_HEIGHT = 480;
const MIN_CANVAS_WIDTH = 240;
const MIN_CANVAS_HEIGHT = 180;
const CANVAS_ASPECT_RATIO = 2 / 3;
const MOBILE_PAINT_TOOLS = [
  { id: 'text', icon: '/icons/default/macpaint/text.png', label: 'Text' },
  { id: 'bucket', icon: '/icons/default/macpaint/bucket.png', label: 'Fill' },
  { id: 'brush', icon: '/icons/default/macpaint/brush.png', label: 'Brush' },
  { id: 'pencil', icon: '/icons/default/macpaint/pencil.png', label: 'Pencil' },
  { id: 'line', icon: '/icons/default/macpaint/line.png', label: 'Line' },
  { id: 'eraser', icon: '/icons/default/macpaint/eraser.png', label: 'Eraser' },
  {
    id: 'rectangle',
    icon: '/icons/default/macpaint/rectangle.png',
    label: 'Rectangle',
  },
  { id: 'oval', icon: '/icons/default/macpaint/oval.png', label: 'Oval' },
];
const SUBMISSION_RULES = [
  'draw whatever you want :)',
  'skip gore, swastikas, hate symbols, and the usual bad stuff',
];

function getResponsiveCanvasSize(viewportWidth) {
  const safeViewportWidth =
    typeof viewportWidth === 'number' && viewportWidth > 0
      ? viewportWidth
      : 390;
  const width = Math.max(
    MIN_CANVAS_WIDTH,
    Math.min(MAX_CANVAS_WIDTH, safeViewportWidth - 74),
  );
  const height = Math.max(
    MIN_CANVAS_HEIGHT,
    Math.min(MAX_CANVAS_HEIGHT, Math.round(width * CANVAS_ASPECT_RATIO)),
  );

  return { width, height };
}

function MobilePaintStudio() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [responsiveCanvasSize, setResponsiveCanvasSize] = useState(() =>
    getResponsiveCanvasSize(window.innerWidth),
  );
  const [selectedTool, setSelectedTool] = useState('pencil');
  const [selectedPattern, setSelectedPattern] = useState('pattern-1');
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('Untitled.png');
  const [canvasWidth, setCanvasWidth] = useState(responsiveCanvasSize.width);
  const [canvasHeight, setCanvasHeight] = useState(responsiveCanvasSize.height);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submissionTitle, setSubmissionTitle] = useState('Untitled');
  const [submissionStatus, setSubmissionStatus] = useState({
    state: 'idle',
    message: '',
  });

  useEffect(() => {
    if (!showSubmitDialog) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showSubmitDialog]);

  useEffect(() => {
    function syncResponsiveCanvas() {
      setResponsiveCanvasSize(getResponsiveCanvasSize(window.innerWidth));
    }

    syncResponsiveCanvas();
    window.addEventListener('resize', syncResponsiveCanvas);
    return () => {
      window.removeEventListener('resize', syncResponsiveCanvas);
    };
  }, []);

  useEffect(() => {
    setCanvasWidth(currentWidth =>
      Math.min(currentWidth, responsiveCanvasSize.width),
    );
    setCanvasHeight(currentHeight =>
      Math.min(currentHeight, responsiveCanvasSize.height),
    );
  }, [responsiveCanvasSize.height, responsiveCanvasSize.width]);

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
    setCanvasWidth(responsiveCanvasSize.width);
    setCanvasHeight(responsiveCanvasSize.height);
    setHasUnsavedChanges(false);
    setSubmissionStatus({ state: 'idle', message: '' });
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
        let nextWidth = img.width;
        let nextHeight = img.height;
        const maxWidth = responsiveCanvasSize.width;
        const maxHeight = responsiveCanvasSize.height;

        if (nextWidth > maxWidth) {
          const ratio = maxWidth / nextWidth;
          nextWidth = maxWidth;
          nextHeight = Math.round(img.height * ratio);
        }
        if (nextHeight > maxHeight) {
          const ratio = maxHeight / nextHeight;
          nextHeight = maxHeight;
          nextWidth = Math.round(nextWidth * ratio);
        }

        setCanvasWidth(nextWidth);
        setCanvasHeight(nextHeight);
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
    <>
      <StudioShell>
        <StudioLead>
          mobile paint uses the same review queue as desktop thinko.
        </StudioLead>
        <RuleList>
          {SUBMISSION_RULES.map(rule => (
            <li key={rule}>{rule}</li>
          ))}
        </RuleList>
        <CommandBar>
          <CommandButton type="button" onClick={resetCanvas}>
            new
          </CommandButton>
          <CommandButton
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            open
          </CommandButton>
          <CommandButton type="button" onClick={() => handleSaveLikeDownload()}>
            save
          </CommandButton>
          <CommandButton
            type="button"
            onClick={() => {
              setSubmissionTitle(
                currentFileName.replace(/\.png$/i, '') || 'Untitled',
              );
              setSubmissionStatus({ state: 'idle', message: '' });
              setShowSubmitDialog(true);
            }}
          >
            submit
          </CommandButton>
          <CommandButton
            type="button"
            disabled={!canUndo}
            onClick={() => canvasRef.current?.undo()}
          >
            undo
          </CommandButton>
          <CommandButton
            type="button"
            disabled={!canRedo}
            onClick={() => canvasRef.current?.redo()}
          >
            redo
          </CommandButton>
          <CommandButton
            type="button"
            onClick={() => {
              if (canvasRef.current) {
                canvasRef.current.clear();
              }
              setHasUnsavedChanges(true);
            }}
          >
            clear
          </CommandButton>
        </CommandBar>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={handleImportFile}
          hidden
        />
        <ControlGrid>
          <Card>
            <CardTitle>tools</CardTitle>
            <PaintToolbar
              selectedTool={selectedTool}
              onToolSelect={handleToolSelect}
              tools={MOBILE_PAINT_TOOLS}
            />
          </Card>
          <Card>
            <CardTitle>size</CardTitle>
            <PaintStrokeSettings
              strokeWidth={strokeWidth}
              onStrokeWidthChange={setStrokeWidth}
            />
          </Card>
        </ControlGrid>
        <CanvasCard>
          <CanvasViewport>
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
              isForeground={true}
            />
          </CanvasViewport>
        </CanvasCard>
        <Card>
          <CardTitle>pattern</CardTitle>
          <PatternRow>
            <PatternPreview src={selectedPatternPreview} alt="" />
            <PatternPaletteWrap>
              <PaintPatternPalette
                selectedPattern={selectedPattern}
                onPatternSelect={setSelectedPattern}
              />
            </PatternPaletteWrap>
          </PatternRow>
        </Card>
        <StatusBar>
          <span>
            {hasUnsavedChanges ? `${currentFileName} *` : currentFileName}
          </span>
          <span>
            {canvasWidth} x {canvasHeight}
          </span>
        </StatusBar>
      </StudioShell>
      {showSubmitDialog ? (
        <DialogOverlay>
          <DialogWindow
            title="submit drawing"
            icon={paintLargeIcon}
            onClose={() => {
              setShowSubmitDialog(false);
              setSubmissionStatus({ state: 'idle', message: '' });
            }}
          >
            <DialogBody>
              <DialogText>
                this sends your current mobile paint drawing to the review
                queue.
              </DialogText>
              <FieldLabel htmlFor="mobile-paint-submit-title">title</FieldLabel>
              <FieldInput
                id="mobile-paint-submit-title"
                type="text"
                value={submissionTitle}
                onChange={event => setSubmissionTitle(event.target.value)}
              />
              {submissionStatus.message ? (
                <DialogStatus data-state={submissionStatus.state}>
                  {submissionStatus.message}
                </DialogStatus>
              ) : null}
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
                {submissionStatus.state !== 'success' ? (
                  <PrimaryDialogButton
                    type="button"
                    disabled={submissionStatus.state === 'submitting'}
                    onClick={handleSubmitDrawing}
                  >
                    {submissionStatus.state === 'submitting'
                      ? 'sending...'
                      : 'submit'}
                  </PrimaryDialogButton>
                ) : null}
              </DialogActions>
            </DialogBody>
          </DialogWindow>
        </DialogOverlay>
      ) : null}
    </>
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

const StudioShell = styled.div`
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 16px;
  overflow: hidden;
`;

const StudioLead = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: #29425d;
  overflow-wrap: anywhere;
`;

const RuleList = styled.ul`
  margin: -4px 0 0;
  padding-left: 18px;
  color: #3a5473;
  font-size: 12px;
  line-height: 1.5;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const CommandBar = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;

  @media (min-width: 560px) {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
`;

const CommandButton = styled.button`
  min-width: 0;
  width: 100%;
  height: 36px;
  padding: 0 8px;
  border: 1px solid #7f9db9;
  background: linear-gradient(180deg, #ffffff 0%, #dfe8f6 100%);
  box-shadow: inset 1px 1px 0 #fff, inset -1px -1px 0 #aebdd3;
  text-transform: lowercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:active:not(:disabled) {
    background: #d5def0;
  }

  &:disabled {
    color: #7f7f7f;
    background: #e4e4e4;
  }
`;

const ControlGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) 110px;
  align-items: start;

  @media (min-width: 720px) {
    grid-template-columns: 1.2fr 1fr;
  }
`;

const Card = styled.div`
  min-width: 0;
  padding: 10px;
  border: 1px solid #8aa2bf;
  background: #f6f2e5;
`;

const CardTitle = styled.div`
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #375473;
`;

const CanvasCard = styled(Card)`
  padding: 10px;
`;

const CanvasViewport = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: clamp(210px, 34vh, 320px);
  overflow: auto hidden;
  border: 1px solid #7f9db9;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #fff;
`;

const PatternRow = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: start;
`;

const PatternPreview = styled.img`
  width: 52px;
  height: 52px;
  border: 1px solid #7f9db9;
  background: #fff;
`;

const PatternPaletteWrap = styled.div`
  min-width: 0;
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #325170;

  span:last-child {
    white-space: nowrap;
  }
`;

const DialogOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(8, 17, 32, 0.56);
`;

const DialogWindow = styled(XpPanel)`
  width: min(430px, calc(100vw - 28px));
`;

const DialogBody = styled.div`
  padding: 14px;
`;

const DialogText = styled.div`
  line-height: 1.5;
  color: #24405d;
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
  height: 34px;
  padding: 0 10px;
  border: 1px solid #7f9db9;
  background: #fff;
`;

const DialogStatus = styled.div`
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid #7f9db9;
  background: #f4f7fb;
  font-size: 12px;

  &[data-state='success'] {
    border-color: #4a7e34;
    background: #eef9df;
  }

  &[data-state='error'] {
    border-color: #9a3b3b;
    background: #ffe9e9;
  }
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
`;

const DialogButton = styled.button`
  min-width: 84px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #7f9db9;
  background: linear-gradient(180deg, #ffffff 0%, #d9e2f2 100%);
  text-transform: lowercase;
`;

const PrimaryDialogButton = styled(DialogButton)`
  font-weight: 700;
`;

export default MobilePaintStudio;
