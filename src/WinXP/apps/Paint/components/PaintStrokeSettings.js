import React from 'react';
import styled from 'styled-components';

const STROKE_OPTIONS = [1, 2, 4, 6, 8, 12, 16, 20];

function PaintStrokeSettings({ strokeWidth, onStrokeWidthChange }) {
  const currentIndex = STROKE_OPTIONS.indexOf(strokeWidth);

  function stepStroke(direction) {
    if (currentIndex === -1) {
      const fallback = direction > 0 ? 2 : 1;
      onStrokeWidthChange(fallback);
      return;
    }

    const nextIndex = Math.max(
      0,
      Math.min(STROKE_OPTIONS.length - 1, currentIndex + direction),
    );
    onStrokeWidthChange(STROKE_OPTIONS[nextIndex]);
  }

  return (
    <Wrap>
      <Header>Size</Header>
      <TopRow>
        <ValueBox>{strokeWidth}px</ValueBox>
        <Stepper>
          <StepButton
            type="button"
            onClick={() => stepStroke(1)}
            aria-label="Increase stroke size"
          >
            ▲
          </StepButton>
          <StepButton
            type="button"
            onClick={() => stepStroke(-1)}
            aria-label="Decrease stroke size"
          >
            ▼
          </StepButton>
        </Stepper>
      </TopRow>
      <PreviewPanel>
        <PreviewRail />
        <PreviewStroke $strokeWidth={strokeWidth} />
      </PreviewPanel>
    </Wrap>
  );
}

const Wrap = styled.div`
  display: grid;
  gap: 5px;
  padding: 6px;
  background: #ece9d8;
`;

const Header = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #1f1f1f;
`;

const TopRow = styled.div`
  display: flex;
  gap: 4px;
`;

const ValueBox = styled.div`
  flex: 1;
  min-width: 0;
  height: 22px;
  padding: 0 6px;
  border: 1px solid #7f9db9;
  background: #fff;
  box-shadow: inset 1px 1px 0 #fff, inset -1px -1px 0 #c6c3b8;
  text-align: right;
  line-height: 20px;
  font-size: 11px;
  font-weight: 700;
`;

const Stepper = styled.div`
  display: grid;
  grid-template-rows: repeat(2, 1fr);
  width: 18px;
`;

const StepButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #7f9db9;
  background: #ece9d8;
  font-size: 8px;
  line-height: 1;

  &:first-child {
    border-bottom: 0;
  }

  &:active {
    background: #d8d2bd;
  }
`;

const PreviewPanel = styled.div`
  position: relative;
  height: 28px;
  padding: 0 6px;
  border: 1px solid #7f9db9;
  background: #fff;
  box-shadow: inset 1px 1px 0 #fff, inset -1px -1px 0 #c6c3b8;
`;

const PreviewRail = styled.div`
  position: relative;
  top: 50%;
  height: 1px;
  background: #b7b1a0;
  transform: translateY(-50%);
`;

const PreviewStroke = styled.div`
  position: absolute;
  top: 50%;
  left: 8px;
  right: 8px;
  height: ${({ $strokeWidth }) => Math.max(1, Math.min($strokeWidth, 10))}px;
  background: #000;
  transform: translateY(-50%);
`;

export default PaintStrokeSettings;
