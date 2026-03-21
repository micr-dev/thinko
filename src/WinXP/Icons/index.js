import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const ICON_COLUMN_WIDTH = 96;
const ICON_COLUMN_GAP = 1;
const ICON_ROW_HEIGHT = 83;
const ICON_ROW_GAP = 8;
const ICON_GRID_LEFT = 4;
const ICON_GRID_RIGHT = 20;
const ICON_GRID_TOP_WEB = 8;
const ICON_GRID_TOP_TAURI = 36;

function Icons({
  icons,
  onMouseDown,
  onBackgroundMouseDown,
  onBackgroundContextMenu,
  onDoubleClick,
  displayFocus,
  mouse,
  selecting,
  setSelectedIcons,
  debugMode,
  onReorderIcon,
  maxGridIndex,
  rowsPerColumn,
}) {
  const [iconsRect, setIconsRect] = useState([]);
  const [pointerDragIconId, setPointerDragIconId] = useState(null);
  const containerRef = useRef(null);
  const isTauri =
    typeof window !== 'undefined' &&
    (window.__TAURI__ || window.__TAURI_INTERNALS__);
  function measure(rect) {
    setIconsRect(currentRects => [
      ...currentRects.filter(existingRect => existingRect.id !== rect.id),
      rect,
    ]);
  }
  useEffect(() => {
    if (!selecting) return;
    const sx = Math.min(selecting.x, mouse.docX);
    const sy = Math.min(selecting.y, mouse.docY);
    const sw = Math.abs(selecting.x - mouse.docX);
    const sh = Math.abs(selecting.y - mouse.docY);
    const selectedIds = iconsRect
      .filter(rect => {
        const { x, y, w, h } = rect;
        return x - sx < sw && sx - x < w && y - sy < sh && sy - y < h;
      })
      .map(icon => icon.id);
    setSelectedIcons(selectedIds);
  }, [iconsRect, setSelectedIcons, selecting, mouse.docX, mouse.docY]);
  useEffect(() => {
    function stopPointerDrag() {
      setPointerDragIconId(null);
    }
    window.addEventListener('mouseup', stopPointerDrag);
    return () => {
      window.removeEventListener('mouseup', stopPointerDrag);
    };
  }, []);
  useEffect(() => {
    if (!debugMode) {
      setPointerDragIconId(null);
    }
  }, [debugMode]);

  function getGridIndexFromMouse(clientX, clientY) {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const originX = rect.left + ICON_GRID_LEFT;
    const originY =
      rect.top + (isTauri ? ICON_GRID_TOP_TAURI : ICON_GRID_TOP_WEB);
    const relativeX = clientX - originX;
    const relativeY = clientY - originY;

    if (relativeX < 0 || relativeY < 0) return 0;

    const column = Math.floor(
      relativeX / (ICON_COLUMN_WIDTH + ICON_COLUMN_GAP),
    );
    const row = Math.floor(relativeY / (ICON_ROW_HEIGHT + ICON_ROW_GAP));

    const boundedColumn = Math.max(
      0,
      Math.min(Math.floor(maxGridIndex / rowsPerColumn), column),
    );
    const boundedRow = Math.max(0, Math.min(rowsPerColumn - 1, row));

    return boundedColumn * rowsPerColumn + boundedRow;
  }

  function onPointerMove(event) {
    if (!debugMode || pointerDragIconId == null) return;
    const targetGridIndex = getGridIndexFromMouse(event.clientX, event.clientY);
    if (targetGridIndex == null) return;
    onReorderIcon(pointerDragIconId, targetGridIndex);
  }

  function onContainerMouseDown(event) {
    if (event.target !== event.currentTarget) return;
    if (onBackgroundMouseDown) {
      onBackgroundMouseDown(event);
    }
  }

  function onContainerContextMenu(event) {
    if (event.target !== event.currentTarget) return;
    if (onBackgroundContextMenu) {
      onBackgroundContextMenu(event);
    }
  }

  const sortedIcons = [...icons].sort(
    (left, right) =>
      (left.gridIndex ?? left.id) - (right.gridIndex ?? right.id),
  );

  return (
    <IconsContainer
      ref={containerRef}
      isTauri={Boolean(isTauri)}
      onMouseDown={onContainerMouseDown}
      onContextMenu={onContainerContextMenu}
      onMouseMove={onPointerMove}
    >
      {sortedIcons.map(icon => (
        <StyledIcon
          key={icon.id}
          {...icon}
          isTauri={Boolean(isTauri)}
          displayFocus={displayFocus}
          onMouseDown={onMouseDown}
          onDoubleClick={onDoubleClick}
          measure={measure}
          debugMode={debugMode}
          onReorderIcon={onReorderIcon}
          pointerDragIconId={pointerDragIconId}
          setPointerDragIconId={setPointerDragIconId}
          rowsPerColumn={rowsPerColumn}
        />
      ))}
    </IconsContainer>
  );
}

function Icon({
  title,
  onMouseDown,
  onDoubleClick,
  icon,
  className,
  id,
  appKey,
  component,
  appDescriptor,
  measure,
  debugMode,
  gridIndex,
  desktopAnchor,
  isTauri,
  pointerDragIconId,
  setPointerDragIconId,
  rowsPerColumn,
}) {
  const ref = useRef(null);
  function _onMouseDown(event) {
    onMouseDown(id);
    if (debugMode && event.button === 0 && !desktopAnchor) {
      setPointerDragIconId(id);
    }
  }
  function _onDoubleClick() {
    if (debugMode) return;
    onDoubleClick({ id, title, component, appKey, appDescriptor });
  }
  function onMouseUp() {
    if (!debugMode) return;
    setPointerDragIconId(null);
  }
  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    const { left, top, width, height } = target.getBoundingClientRect();
    const posX = left + window.scrollX;
    const posY = top + window.scrollY;
    measure({ id, x: posX, y: posY, w: width, h: height });
  }, [gridIndex, id, measure]);
  return (
    <div
      className={className}
      onMouseDown={_onMouseDown}
      onDoubleClick={_onDoubleClick}
      onMouseUp={onMouseUp}
      ref={ref}
      style={
        desktopAnchor?.corner === 'top-right'
          ? {
              position: 'absolute',
              right: `calc(env(safe-area-inset-right, 0px) + ${ICON_GRID_RIGHT}px)`,
              top: `${(isTauri ? ICON_GRID_TOP_TAURI : ICON_GRID_TOP_WEB) +
                desktopAnchor.rowOffset * (ICON_ROW_HEIGHT + ICON_ROW_GAP)}px`,
            }
          : {
              gridColumnStart: Math.floor(gridIndex / rowsPerColumn) + 1,
              gridRowStart: (gridIndex % rowsPerColumn) + 1,
            }
      }
      title={
        debugMode
          ? `${title} - row ${(gridIndex % rowsPerColumn) +
              1}, column ${Math.floor(gridIndex / rowsPerColumn) + 1}`
          : undefined
      }
    >
      <div className={`${className}__img__container`}>
        <img
          src={icon}
          alt={title}
          className={`${className}__img`}
          draggable={false}
        />
      </div>
      <div className={`${className}__text__container`}>
        <div className={`${className}__text`}>{title}</div>
      </div>
    </div>
  );
}

const IconsContainer = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  grid-auto-rows: ${ICON_ROW_HEIGHT}px;
  grid-auto-columns: 96px;
  align-content: start;
  grid-column-gap: 1px;
  grid-row-gap: 8px;
  padding-left: calc(env(safe-area-inset-left, 0px) + 4px);
  padding-top: ${({ isTauri }) => (isTauri ? '36px' : '8px')};
`;

const StyledIcon = styled(Icon)`
  width: 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  cursor: ${({ debugMode, desktopAnchor }) =>
    debugMode && !desktopAnchor ? 'grab' : 'default'};
  &:active {
    cursor: ${({ debugMode, desktopAnchor }) =>
      debugMode && !desktopAnchor ? 'grabbing' : 'default'};
  }
  &__text__container {
    width: 96px;
    max-width: 96px;
    font-size: 12px;
    color: white;
    text-shadow: 0 1px 1px black;
    display: flex;
    justify-content: center;

    &:before {
      content: '';
      display: block;
      flex-grow: 1;
    }
    &:after {
      content: '';
      display: block;
      flex-grow: 1;
    }
  }
  &__text {
    max-width: 96px;
    padding: 0 4px 2px;
    background-color: ${({ isFocus, displayFocus }) =>
      isFocus && displayFocus ? '#0b61ff' : 'transparent'};
    text-align: center;
    flex-shrink: 1;
  }
  &__img__container {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: ${({ isFocus, displayFocus }) =>
      isFocus && displayFocus ? 'drop-shadow(0 0 blue)' : ''};
  }
  &__img {
    display: block;
    width: 48px;
    height: 48px;
    object-fit: contain;
    opacity: ${({ isFocus, displayFocus }) =>
      isFocus && displayFocus ? 0.5 : 1};
  }
  opacity: ${({ pointerDragIconId, id }) =>
    pointerDragIconId === id ? 0.55 : 1};
  ${({ debugMode }) =>
    debugMode
      ? `
    outline: 1px dashed rgba(255, 255, 255, 0.18);
    outline-offset: -2px;
  `
      : ''}
`;

export default Icons;
