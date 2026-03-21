import React, {
  useReducer,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import styled, { keyframes } from 'styled-components';
import useMouse from 'react-use/lib/useMouse';
import pictureIcon from 'assets/windowsIcons/307(32x32).png';

import {
  ADD_APP,
  DEL_APP,
  FOCUS_APP,
  MINIMIZE_APP,
  TOGGLE_MAXIMIZE_APP,
  FOCUS_ICON,
  SELECT_ICONS,
  FOCUS_DESKTOP,
  START_SELECT,
  END_SELECT,
  SET_ICON_LAYOUT,
  POWER_OFF,
  CANCEL_POWER_OFF,
} from './constants/actions';
import { FOCUSING, POWER_STATE } from './constants';
import { XP_WALLPAPER, ROTATING_WALLPAPERS } from './wallpaper-registry';
import {
  buildCommissionDesktopIcon,
  defaultIconState,
  defaultAppState,
  appSettings,
} from './apps';
import Modal from './Modal';
import Footer from './Footer';
import Windows from './Windows';
import Icons from './Icons';
import { playStartupSoundOnce, playXpSound } from './xp-sounds';
import { DashedBox } from 'components';

const ICON_COLUMN_WIDTH = 96;
const ICON_COLUMN_GAP = 1;
const ICON_GRID_LEFT = 4;
const ICON_GRID_RIGHT = 20;
const ICON_ROW_HEIGHT = 83;
const ICON_ROW_GAP = 8;
const ICON_GRID_TOP_WEB = 8;
const ICON_GRID_TOP_TAURI = 36;
const FOOTER_HEIGHT = 30;
const ICON_GRID_BOTTOM = 36;
const ROWS_PER_COLUMN = 11;
const WALLPAPER_ROTATION_MIN_MS = 180000;
const WALLPAPER_ROTATION_MAX_MS = 300000;
const WALLPAPER_FADE_MS = 650;
const DESKTOP_CONTEXT_MENU_WIDTH = 180;
const DESKTOP_CONTEXT_MENU_HEIGHT = 58;

function getRandomRotationDelay() {
  return (
    WALLPAPER_ROTATION_MIN_MS +
    Math.floor(
      Math.random() *
        (WALLPAPER_ROTATION_MAX_MS - WALLPAPER_ROTATION_MIN_MS + 1),
    )
  );
}

function createWallpaperQueue(currentId) {
  const queue = [...ROTATING_WALLPAPERS];

  for (let index = queue.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [queue[index], queue[swapIndex]] = [queue[swapIndex], queue[index]];
  }

  if (queue.length > 1 && queue[0].id === currentId) {
    [queue[0], queue[queue.length - 1]] = [queue[queue.length - 1], queue[0]];
  }

  return queue;
}

function clampDesktopContextMenuPosition(clientX, clientY) {
  return {
    x: Math.max(
      4,
      Math.min(clientX, window.innerWidth - DESKTOP_CONTEXT_MENU_WIDTH - 8),
    ),
    y: Math.max(
      4,
      Math.min(
        clientY,
        window.innerHeight - FOOTER_HEIGHT - DESKTOP_CONTEXT_MENU_HEIGHT - 8,
      ),
    ),
  };
}

function normalizeIcons(icons) {
  const usedGridIndexes = new Set(
    icons
      .filter(icon => Number.isFinite(icon.gridIndex))
      .map(icon => icon.gridIndex),
  );
  let nextGridIndex = 0;

  const normalized = icons.map(icon => {
    if (Number.isFinite(icon.gridIndex)) return { ...icon };
    while (usedGridIndexes.has(nextGridIndex)) {
      nextGridIndex += 1;
    }
    const gridIndex = nextGridIndex;
    usedGridIndexes.add(gridIndex);
    nextGridIndex += 1;
    return {
      ...icon,
      gridIndex,
    };
  });

  return normalized.sort(
    (left, right) => left.gridIndex - right.gridIndex || left.id - right.id,
  );
}

function moveIconToGridIndex(icons, sourceId, targetIndex) {
  const normalized = normalizeIcons(icons);
  const sourceIcon = normalized.find(icon => icon.id === sourceId);
  if (!sourceIcon) return normalized;

  const boundedIndex = Math.max(0, targetIndex);
  if (sourceIcon.gridIndex === boundedIndex) return normalized;

  const occupantIcon = normalized.find(
    icon => icon.id !== sourceId && icon.gridIndex === boundedIndex,
  );

  return normalized
    .map(icon => {
      if (icon.id === sourceId) {
        return {
          ...icon,
          gridIndex: boundedIndex,
        };
      }
      if (occupantIcon && icon.id === occupantIcon.id) {
        return {
          ...icon,
          gridIndex: sourceIcon.gridIndex,
        };
      }
      return icon;
    })
    .sort(
      (left, right) => left.gridIndex - right.gridIndex || left.id - right.id,
    );
}

function buildLayoutExport(icons, rowsPerColumn) {
  return JSON.stringify(
    normalizeIcons(icons).map(icon => ({
      id: icon.id,
      title: icon.title,
      appKey: icon.appKey || null,
      gridIndex: icon.gridIndex,
      row: (icon.gridIndex % rowsPerColumn) + 1,
      column: Math.floor(icon.gridIndex / rowsPerColumn) + 1,
    })),
    null,
    2,
  );
}

function mergeCommissionIcons(icons, commissionIcons) {
  const staticIcons = icons.filter(icon => !icon.isCommission);
  return normalizeIcons([...staticIcons, ...commissionIcons]);
}

function getResponsiveDesktopMetrics(width, height) {
  const isTauri =
    typeof window !== 'undefined' &&
    (window.__TAURI__ || window.__TAURI_INTERNALS__);
  const gridTop = isTauri ? ICON_GRID_TOP_TAURI : ICON_GRID_TOP_WEB;
  const usableWidth = Math.max(ICON_COLUMN_WIDTH, width - ICON_GRID_LEFT);
  const usableHeight = Math.max(
    ICON_ROW_HEIGHT,
    height - FOOTER_HEIGHT - gridTop,
  );
  const safeWidth = Math.max(ICON_COLUMN_WIDTH, usableWidth - ICON_GRID_RIGHT);
  const safeHeight = Math.max(ICON_ROW_HEIGHT, usableHeight - ICON_GRID_BOTTOM);

  return {
    columns: Math.max(
      1,
      Math.floor(
        (safeWidth + ICON_COLUMN_GAP) / (ICON_COLUMN_WIDTH + ICON_COLUMN_GAP),
      ),
    ),
    rows: Math.max(
      1,
      Math.floor(
        (safeHeight + ICON_ROW_GAP) / (ICON_ROW_HEIGHT + ICON_ROW_GAP),
      ),
    ),
  };
}

function getGridPosition(gridIndex, rowsPerColumn) {
  return {
    row: gridIndex % rowsPerColumn,
    column: Math.floor(gridIndex / rowsPerColumn),
  };
}

function findNearestFreeRow(preferredRow, rows, occupiedRows) {
  for (let row = preferredRow; row < rows; row += 1) {
    if (!occupiedRows.has(row)) {
      return row;
    }
  }

  for (let row = preferredRow - 1; row >= 0; row -= 1) {
    if (!occupiedRows.has(row)) {
      return row;
    }
  }

  return Math.max(0, rows - 1);
}

function createResponsiveIconLayout(icons, rows) {
  const normalizedIcons = normalizeIcons(icons);
  const iconsByColumn = normalizedIcons.reduce((map, icon) => {
    const { column } = getGridPosition(icon.gridIndex, ROWS_PER_COLUMN);
    const columnIcons = map.get(column) || [];
    columnIcons.push(icon);
    map.set(column, columnIcons);
    return map;
  }, new Map());
  const responsiveIcons = [];

  [...iconsByColumn.entries()]
    .sort((left, right) => left[0] - right[0])
    .forEach(([column, columnIcons]) => {
      const occupiedRows = new Set();

      columnIcons
        .sort((left, right) => left.gridIndex - right.gridIndex)
        .forEach(icon => {
          const { row } = getGridPosition(icon.gridIndex, ROWS_PER_COLUMN);
          const projectedRow =
            ROWS_PER_COLUMN > 1 && rows > 1
              ? Math.round((row * (rows - 1)) / (ROWS_PER_COLUMN - 1))
              : 0;
          const responsiveRow = findNearestFreeRow(
            projectedRow,
            rows,
            occupiedRows,
          );

          occupiedRows.add(responsiveRow);
          responsiveIcons.push({
            ...icon,
            gridIndex: column * rows + responsiveRow,
          });
        });
    });

  return responsiveIcons.sort(
    (left, right) => left.gridIndex - right.gridIndex || left.id - right.id,
  );
}

const initState = {
  apps: defaultAppState,
  nextAppID: defaultAppState.length,
  nextZIndex: defaultAppState.length,
  focusing: FOCUSING.WINDOW,
  icons: normalizeIcons(defaultIconState),
  selecting: false,
  powerState: POWER_STATE.START,
};
const reducer = (state, action = { type: '' }) => {
  switch (action.type) {
    case ADD_APP:
      const app = state.apps.find(
        _app => _app.component === action.payload.component,
      );
      if (action.payload.multiInstance || !app) {
        return {
          ...state,
          apps: [
            ...state.apps,
            {
              ...action.payload,
              id: state.nextAppID,
              zIndex: state.nextZIndex,
            },
          ],
          nextAppID: state.nextAppID + 1,
          nextZIndex: state.nextZIndex + 1,
          focusing: FOCUSING.WINDOW,
        };
      }
      const apps = state.apps.map(app =>
        app.component === action.payload.component
          ? { ...app, zIndex: state.nextZIndex, minimized: false }
          : app,
      );
      return {
        ...state,
        apps,
        nextZIndex: state.nextZIndex + 1,
        focusing: FOCUSING.WINDOW,
      };
    case DEL_APP:
      if (state.focusing !== FOCUSING.WINDOW) return state;
      return {
        ...state,
        apps: state.apps.filter(app => app.id !== action.payload),
        focusing:
          state.apps.length > 1
            ? FOCUSING.WINDOW
            : state.icons.find(icon => icon.isFocus)
            ? FOCUSING.ICON
            : FOCUSING.DESKTOP,
      };
    case FOCUS_APP: {
      const apps = state.apps.map(app =>
        app.id === action.payload
          ? { ...app, zIndex: state.nextZIndex, minimized: false }
          : app,
      );
      return {
        ...state,
        apps,
        nextZIndex: state.nextZIndex + 1,
        focusing: FOCUSING.WINDOW,
      };
    }
    case MINIMIZE_APP: {
      if (state.focusing !== FOCUSING.WINDOW) return state;
      const apps = state.apps.map(app =>
        app.id === action.payload ? { ...app, minimized: true } : app,
      );
      return {
        ...state,
        apps,
        focusing: FOCUSING.WINDOW,
      };
    }
    case TOGGLE_MAXIMIZE_APP: {
      if (state.focusing !== FOCUSING.WINDOW) return state;
      const apps = state.apps.map(app =>
        app.id === action.payload ? { ...app, maximized: !app.maximized } : app,
      );
      return {
        ...state,
        apps,
        focusing: FOCUSING.WINDOW,
      };
    }
    case FOCUS_ICON: {
      const icons = state.icons.map(icon => ({
        ...icon,
        isFocus: icon.id === action.payload,
      }));
      return {
        ...state,
        focusing: FOCUSING.ICON,
        icons,
      };
    }
    case SELECT_ICONS: {
      const icons = state.icons.map(icon => ({
        ...icon,
        isFocus: action.payload.includes(icon.id),
      }));
      return {
        ...state,
        icons,
        focusing: FOCUSING.ICON,
      };
    }
    case FOCUS_DESKTOP:
      return {
        ...state,
        focusing: FOCUSING.DESKTOP,
        icons: state.icons.map(icon => ({
          ...icon,
          isFocus: false,
        })),
      };
    case START_SELECT:
      return {
        ...state,
        focusing: FOCUSING.DESKTOP,
        icons: state.icons.map(icon => ({
          ...icon,
          isFocus: false,
        })),
        selecting: action.payload,
      };
    case END_SELECT:
      return {
        ...state,
        selecting: null,
      };
    case SET_ICON_LAYOUT:
      return {
        ...state,
        icons: normalizeIcons(action.payload),
      };
    case POWER_OFF:
      return {
        ...state,
        powerState: action.payload,
      };
    case CANCEL_POWER_OFF:
      return {
        ...state,
        powerState: POWER_STATE.START,
      };
    default:
      return state;
  }
};
function WinXP({ enableLayoutDebug = false }) {
  const [state, dispatch] = useReducer(reducer, initState);
  const [commissionIcons, setCommissionIcons] = useState([]);
  const [copyStatus, setCopyStatus] = useState('');
  const [desktopWidth, setDesktopWidth] = useState(window.innerWidth);
  const [desktopHeight, setDesktopHeight] = useState(window.innerHeight);
  const [currentWallpaper, setCurrentWallpaper] = useState(XP_WALLPAPER);
  const [transitionWallpaper, setTransitionWallpaper] = useState(null);
  const [isWallpaperFadingIn, setIsWallpaperFadingIn] = useState(false);
  const [isTransitionWallpaperReady, setIsTransitionWallpaperReady] = useState(
    false,
  );
  const [desktopContextMenu, setDesktopContextMenu] = useState(null);
  const ref = useRef(null);
  const wallpaperRotationTimeoutRef = useRef(null);
  const wallpaperTransitionTimeoutRef = useRef(null);
  const wallpaperFadeFrameRef = useRef(null);
  const wallpaperPreloadTokenRef = useRef(0);
  const scheduleNextWallpaperChangeRef = useRef(() => {});
  const advanceWallpaperRef = useRef(() => {});
  const currentWallpaperIdRef = useRef(XP_WALLPAPER.id);
  const transitionWallpaperIdRef = useRef(null);
  const wallpaperQueueRef = useRef(createWallpaperQueue(XP_WALLPAPER.id));
  const mouse = useMouse(ref);
  const focusedAppId = getFocusedAppId();
  const responsiveMetrics = useMemo(
    () => getResponsiveDesktopMetrics(desktopWidth, desktopHeight),
    [desktopHeight, desktopWidth],
  );
  const renderedIcons = useMemo(() => {
    if (enableLayoutDebug) {
      return normalizeIcons(state.icons);
    }

    return createResponsiveIconLayout(state.icons, responsiveMetrics.rows);
  }, [enableLayoutDebug, responsiveMetrics.rows, state.icons]);
  const sortedIcons = useMemo(() => normalizeIcons(renderedIcons), [
    renderedIcons,
  ]);
  const selectedIcons = sortedIcons.filter(icon => icon.isFocus);
  const activeDebugIcon = selectedIcons.length === 1 ? selectedIcons[0] : null;
  const maxDesktopGridIndex = useMemo(() => {
    const usableWidth = Math.max(
      ICON_COLUMN_WIDTH,
      desktopWidth - ICON_GRID_LEFT,
    );
    const columns = Math.max(
      1,
      Math.floor(
        (usableWidth + ICON_COLUMN_GAP) / (ICON_COLUMN_WIDTH + ICON_COLUMN_GAP),
      ),
    );
    return columns * ROWS_PER_COLUMN - 1;
  }, [desktopWidth]);
  const exportedLayout = useMemo(
    () => buildLayoutExport(state.icons, ROWS_PER_COLUMN),
    [state.icons],
  );

  useEffect(() => {
    playStartupSoundOnce();
  }, []);
  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);
  useEffect(() => {
    let isMounted = true;

    async function loadCommissions() {
      try {
        const response = await fetch('/api/commissions/public', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to load commissions');
        }

        const payload = await response.json();
        if (!isMounted) return;

        const nextCommissionIcons = (payload.commissions || []).map(
          buildCommissionDesktopIcon,
        );
        setCommissionIcons(nextCommissionIcons);
        dispatch({
          type: SET_ICON_LAYOUT,
          payload: mergeCommissionIcons(defaultIconState, nextCommissionIcons),
        });
      } catch (error) {
        if (!isMounted) return;
        setCommissionIcons([]);
      }
    }

    loadCommissions();
    return () => {
      isMounted = false;
    };
  }, []);
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setDesktopContextMenu(null);
      }
    }

    if (!desktopContextMenu) return undefined;

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [desktopContextMenu]);
  useEffect(() => {
    function updateDesktopSize() {
      setDesktopWidth(ref.current?.clientWidth || window.innerWidth);
      setDesktopHeight(ref.current?.clientHeight || window.innerHeight);
    }

    updateDesktopSize();
    window.addEventListener('resize', updateDesktopSize);
    return () => {
      window.removeEventListener('resize', updateDesktopSize);
    };
  }, []);
  useEffect(() => {
    scheduleNextWallpaperChangeRef.current();

    return () => {
      if (wallpaperRotationTimeoutRef.current) {
        window.clearTimeout(wallpaperRotationTimeoutRef.current);
      }
      if (wallpaperTransitionTimeoutRef.current) {
        window.clearTimeout(wallpaperTransitionTimeoutRef.current);
      }
      if (wallpaperFadeFrameRef.current) {
        window.cancelAnimationFrame(wallpaperFadeFrameRef.current);
      }
    };
  }, []);

  const launchApp = useCallback(
    descriptor => {
      setDesktopContextMenu(null);
      dispatch({ type: ADD_APP, payload: descriptor });
    },
    [dispatch],
  );
  const onFocusApp = useCallback(id => {
    setDesktopContextMenu(null);
    dispatch({ type: FOCUS_APP, payload: id });
  }, []);
  const onMaximizeWindow = useCallback(
    id => {
      if (focusedAppId === id) {
        dispatch({ type: TOGGLE_MAXIMIZE_APP, payload: id });
      }
    },
    [focusedAppId],
  );
  const onMinimizeWindow = useCallback(
    id => {
      if (focusedAppId === id) {
        dispatch({ type: MINIMIZE_APP, payload: id });
      }
    },
    [focusedAppId],
  );
  const onCloseApp = useCallback(
    id => {
      if (focusedAppId === id) {
        dispatch({ type: DEL_APP, payload: id });
      }
    },
    [focusedAppId],
  );
  function onMouseDownFooterApp(id) {
    setDesktopContextMenu(null);
    if (focusedAppId === id) {
      dispatch({ type: MINIMIZE_APP, payload: id });
    } else {
      dispatch({ type: FOCUS_APP, payload: id });
    }
  }
  function onMouseDownIcon(id) {
    setDesktopContextMenu(null);
    dispatch({ type: FOCUS_ICON, payload: id });
  }
  function onDoubleClickIcon(icon) {
    if (icon.appDescriptor) {
      launchApp(icon.appDescriptor);
      return;
    }

    const appSetting = icon.appKey
      ? appSettings[icon.appKey]
      : Object.values(appSettings).find(
          setting => setting.component === icon.component,
        );
    if (!appSetting) return;
    launchApp(appSetting);
  }
  function getFocusedAppId() {
    if (state.focusing !== FOCUSING.WINDOW) return -1;
    const focusedApp = [...state.apps]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find(app => !app.minimized);
    return focusedApp ? focusedApp.id : -1;
  }
  function onMouseDownFooter() {
    setDesktopContextMenu(null);
    dispatch({ type: FOCUS_DESKTOP });
  }
  function onClickMenuItem(o) {
    if (o === 'Log Off') {
      dispatch({ type: POWER_OFF, payload: POWER_STATE.LOG_OFF });
    } else if (o === 'Turn Off Computer') {
      dispatch({ type: POWER_OFF, payload: POWER_STATE.TURN_OFF });
    } else if (appSettings[o]) {
      launchApp(appSettings[o]);
    } else {
      launchApp({
        ...appSettings.Error,
        injectProps: { message: 'C:\\\nApplication not found' },
      });
    }
  }
  function onMouseDownDesktop(e) {
    if (e.button !== 0) return;
    setDesktopContextMenu(null);
    if (e.target === e.currentTarget)
      dispatch({
        type: START_SELECT,
        payload: { x: mouse.docX, y: mouse.docY },
      });
  }
  function onMouseUpDesktop(e) {
    dispatch({ type: END_SELECT });
  }
  const onIconsSelected = useCallback(
    iconIds => {
      dispatch({ type: SELECT_ICONS, payload: iconIds });
    },
    [dispatch],
  );
  const onReorderIcon = useCallback(
    (sourceId, targetIndex) => {
      dispatch({
        type: SET_ICON_LAYOUT,
        payload: moveIconToGridIndex(state.icons, sourceId, targetIndex),
      });
      dispatch({ type: FOCUS_ICON, payload: sourceId });
    },
    [state.icons],
  );
  const onMoveSelectedIcon = useCallback(
    delta => {
      if (!activeDebugIcon) return;
      onReorderIcon(
        activeDebugIcon.id,
        Math.max(
          0,
          Math.min(maxDesktopGridIndex, activeDebugIcon.gridIndex + delta),
        ),
      );
    },
    [activeDebugIcon, maxDesktopGridIndex, onReorderIcon],
  );
  function onClickModalButton(text) {
    if (text === 'Log Off') {
      playXpSound('logoff');
    } else if (text === 'Turn Off') {
      playXpSound('shutdown');
    }

    dispatch({ type: CANCEL_POWER_OFF });
    dispatch({
      type: ADD_APP,
      payload: appSettings.Error,
    });
  }
  function onModalClose() {
    dispatch({ type: CANCEL_POWER_OFF });
  }
  async function onCopyLayout() {
    try {
      await navigator.clipboard.writeText(exportedLayout);
      setCopyStatus('copied');
      window.setTimeout(() => {
        setCopyStatus('');
      }, 1200);
    } catch (error) {
      setCopyStatus('copy failed');
      window.setTimeout(() => {
        setCopyStatus('');
      }, 1200);
    }
  }
  function onResetLayout() {
    dispatch({
      type: SET_ICON_LAYOUT,
      payload: mergeCommissionIcons(defaultIconState, commissionIcons),
    });
    dispatch({ type: FOCUS_DESKTOP });
  }

  function clearWallpaperRotationTimer() {
    if (wallpaperRotationTimeoutRef.current) {
      window.clearTimeout(wallpaperRotationTimeoutRef.current);
      wallpaperRotationTimeoutRef.current = null;
    }
  }

  function clearWallpaperTransition() {
    wallpaperPreloadTokenRef.current += 1;
    if (wallpaperTransitionTimeoutRef.current) {
      window.clearTimeout(wallpaperTransitionTimeoutRef.current);
      wallpaperTransitionTimeoutRef.current = null;
    }
    if (wallpaperFadeFrameRef.current) {
      window.cancelAnimationFrame(wallpaperFadeFrameRef.current);
      wallpaperFadeFrameRef.current = null;
    }
    transitionWallpaperIdRef.current = null;
    setTransitionWallpaper(null);
    setIsTransitionWallpaperReady(false);
    setIsWallpaperFadingIn(false);
  }

  function scheduleNextWallpaperChange() {
    clearWallpaperRotationTimer();
    wallpaperRotationTimeoutRef.current = window.setTimeout(() => {
      advanceWallpaperRef.current();
    }, getRandomRotationDelay());
  }

  function getNextWallpaperFromQueue() {
    if (!wallpaperQueueRef.current.length) {
      wallpaperQueueRef.current = createWallpaperQueue(
        currentWallpaperIdRef.current,
      );
    }

    const [nextWallpaper, ...remainingWallpapers] = wallpaperQueueRef.current;
    wallpaperQueueRef.current = remainingWallpapers;
    return nextWallpaper || null;
  }

  function finalizeWallpaperTransition(nextWallpaper) {
    currentWallpaperIdRef.current = nextWallpaper.id;
    transitionWallpaperIdRef.current = null;
    wallpaperTransitionTimeoutRef.current = null;
    wallpaperFadeFrameRef.current = null;
    setCurrentWallpaper(nextWallpaper);
    setTransitionWallpaper(null);
    setIsTransitionWallpaperReady(false);
    setIsWallpaperFadingIn(false);
    scheduleNextWallpaperChangeRef.current();
  }

  function startWallpaperFade(nextWallpaper, preloadToken) {
    if (preloadToken !== wallpaperPreloadTokenRef.current) return;

    transitionWallpaperIdRef.current = nextWallpaper.id;
    setTransitionWallpaper(nextWallpaper);
    setIsTransitionWallpaperReady(true);
    wallpaperFadeFrameRef.current = window.requestAnimationFrame(() => {
      if (preloadToken !== wallpaperPreloadTokenRef.current) return;
      setIsWallpaperFadingIn(true);
    });

    wallpaperTransitionTimeoutRef.current = window.setTimeout(() => {
      if (preloadToken !== wallpaperPreloadTokenRef.current) return;
      finalizeWallpaperTransition(nextWallpaper);
    }, WALLPAPER_FADE_MS);
  }

  async function preloadWallpaper(nextWallpaper, preloadToken) {
    const image = new Image();
    image.decoding = 'async';
    image.src = nextWallpaper.url;

    if (image.decode) {
      try {
        await image.decode();
      } catch (error) {
        if (preloadToken !== wallpaperPreloadTokenRef.current) return;
        finalizeWallpaperTransition(nextWallpaper);
        return;
      }
      startWallpaperFade(nextWallpaper, preloadToken);
      return;
    }

    if (image.complete) {
      startWallpaperFade(nextWallpaper, preloadToken);
      return;
    }

    image.onload = () => {
      startWallpaperFade(nextWallpaper, preloadToken);
    };
    image.onerror = () => {
      if (preloadToken !== wallpaperPreloadTokenRef.current) return;
      finalizeWallpaperTransition(nextWallpaper);
    };
  }

  function changeWallpaper(nextWallpaper) {
    if (!nextWallpaper) return;
    if (
      nextWallpaper.id === currentWallpaperIdRef.current ||
      nextWallpaper.id === transitionWallpaperIdRef.current
    ) {
      scheduleNextWallpaperChange();
      return;
    }

    setDesktopContextMenu(null);
    clearWallpaperRotationTimer();
    clearWallpaperTransition();
    const preloadToken = wallpaperPreloadTokenRef.current;
    setIsTransitionWallpaperReady(false);
    setIsWallpaperFadingIn(false);
    preloadWallpaper(nextWallpaper, preloadToken);
  }

  function advanceWallpaper() {
    changeWallpaper(getNextWallpaperFromQueue());
  }

  function setBlissWallpaper() {
    setDesktopContextMenu(null);
    clearWallpaperRotationTimer();
    clearWallpaperTransition();
    wallpaperQueueRef.current = createWallpaperQueue(XP_WALLPAPER.id);

    if (currentWallpaperIdRef.current === XP_WALLPAPER.id) {
      setCurrentWallpaper(XP_WALLPAPER);
      scheduleNextWallpaperChangeRef.current();
      return;
    }

    const preloadToken = wallpaperPreloadTokenRef.current;
    setIsTransitionWallpaperReady(false);
    setIsWallpaperFadingIn(false);
    preloadWallpaper(XP_WALLPAPER, preloadToken);
  }

  function onDesktopContextMenu(event) {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    setDesktopContextMenu(
      clampDesktopContextMenuPosition(event.clientX, event.clientY),
    );
    dispatch({ type: END_SELECT });
    dispatch({ type: FOCUS_DESKTOP });
  }

  scheduleNextWallpaperChangeRef.current = scheduleNextWallpaperChange;
  advanceWallpaperRef.current = advanceWallpaper;

  return (
    <Container
      ref={ref}
      onMouseUp={onMouseUpDesktop}
      onMouseDown={onMouseDownDesktop}
      onContextMenu={onDesktopContextMenu}
      state={state.powerState}
    >
      <WallpaperImage alt="" draggable={false} src={currentWallpaper.url} />
      {transitionWallpaper && (
        <WallpaperFadeImage
          alt=""
          draggable={false}
          key={transitionWallpaper.id}
          src={transitionWallpaper.url}
          visible={isTransitionWallpaperReady && isWallpaperFadingIn}
        />
      )}
      <Icons
        icons={renderedIcons}
        onMouseDown={onMouseDownIcon}
        onBackgroundMouseDown={onMouseDownDesktop}
        onBackgroundContextMenu={onDesktopContextMenu}
        onDoubleClick={onDoubleClickIcon}
        displayFocus={state.focusing === FOCUSING.ICON}
        mouse={mouse}
        selecting={state.selecting}
        setSelectedIcons={onIconsSelected}
        debugMode={enableLayoutDebug}
        onReorderIcon={onReorderIcon}
        maxGridIndex={maxDesktopGridIndex}
        rowsPerColumn={
          enableLayoutDebug ? ROWS_PER_COLUMN : responsiveMetrics.rows
        }
      />
      {enableLayoutDebug && (
        <LayoutDebugPanel>
          <div className="layout-debug__window">
            <div className="layout-debug__titlebar">
              <span>desktop layout debug</span>
            </div>
            <div className="layout-debug__body">
              <div className="layout-debug__hint">
                drag icons anywhere on the desktop grid, or select one and nudge
                it.
              </div>
              <div className="layout-debug__selected">
                {activeDebugIcon
                  ? `${
                      activeDebugIcon.title
                    } - row ${(activeDebugIcon.gridIndex % ROWS_PER_COLUMN) +
                      1}, column ${Math.floor(
                      activeDebugIcon.gridIndex / ROWS_PER_COLUMN,
                    ) + 1}`
                  : 'select one icon to nudge it'}
              </div>
              <div className="layout-debug__controls">
                <button
                  type="button"
                  onClick={() => onMoveSelectedIcon(-ROWS_PER_COLUMN)}
                  disabled={!activeDebugIcon}
                >
                  left
                </button>
                <button
                  type="button"
                  onClick={() => onMoveSelectedIcon(-1)}
                  disabled={!activeDebugIcon}
                >
                  up
                </button>
                <button
                  type="button"
                  onClick={() => onMoveSelectedIcon(1)}
                  disabled={!activeDebugIcon}
                >
                  down
                </button>
                <button
                  type="button"
                  onClick={() => onMoveSelectedIcon(ROWS_PER_COLUMN)}
                  disabled={!activeDebugIcon}
                >
                  right
                </button>
              </div>
              <textarea
                className="layout-debug__export"
                value={exportedLayout}
                readOnly
              />
              <div className="layout-debug__actions">
                <button type="button" onClick={onCopyLayout}>
                  copy layout
                </button>
                <button type="button" onClick={onResetLayout}>
                  reset
                </button>
                <span>{copyStatus}</span>
              </div>
            </div>
          </div>
        </LayoutDebugPanel>
      )}
      {desktopContextMenu && (
        <DesktopContextMenu
          onMouseDown={event => event.stopPropagation()}
          onContextMenu={event => event.preventDefault()}
          x={desktopContextMenu.x}
          y={desktopContextMenu.y}
        >
          <DesktopContextMenuItem type="button" onClick={advanceWallpaper}>
            <img src={pictureIcon} alt="" />
            <span>Change wallpaper...</span>
          </DesktopContextMenuItem>
          <DesktopContextMenuItem type="button" onClick={setBlissWallpaper}>
            <img src={pictureIcon} alt="" />
            <span>Set Bliss</span>
          </DesktopContextMenuItem>
        </DesktopContextMenu>
      )}
      <DashedBox startPos={state.selecting} mouse={mouse} />
      <Windows
        apps={state.apps}
        onMouseDown={onFocusApp}
        onClose={onCloseApp}
        onMinimize={onMinimizeWindow}
        onMaximize={onMaximizeWindow}
        focusedAppId={focusedAppId}
        launchApp={launchApp}
      />
      <Footer
        apps={state.apps}
        onMouseDownApp={onMouseDownFooterApp}
        focusedAppId={focusedAppId}
        onMouseDown={onMouseDownFooter}
        onClickMenuItem={onClickMenuItem}
      />
      {state.powerState !== POWER_STATE.START && (
        <Modal
          onClose={onModalClose}
          onClickButton={onClickModalButton}
          mode={state.powerState}
        />
      )}
    </Container>
  );
}

const powerOffAnimation = keyframes`
  0% {
    filter: brightness(1) grayscale(0);
  }
  30% {
    filter: brightness(1) grayscale(0);
  }
  100% {
    filter: brightness(0.6) grayscale(1);
  }
`;
const animation = {
  [POWER_STATE.START]: '',
  [POWER_STATE.TURN_OFF]: powerOffAnimation,
  [POWER_STATE.LOG_OFF]: powerOffAnimation,
};

const Container = styled.div`
  @import url('https://fonts.googleapis.com/css?family=Noto+Sans');
  font-family: Tahoma, 'Noto Sans', sans-serif;
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #3d6ba5;
  animation: ${({ state }) => animation[state]} 5s forwards;
  *:not(input):not(textarea) {
    user-select: none;
  }
`;

const WallpaperImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
`;

const WallpaperFadeImage = styled(WallpaperImage)`
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transition: opacity ${WALLPAPER_FADE_MS}ms ease-in-out;
`;

const DesktopContextMenu = styled.div`
  position: absolute;
  left: ${({ x }) => `${x}px`};
  top: ${({ y }) => `${y}px`};
  min-width: ${DESKTOP_CONTEXT_MENU_WIDTH}px;
  padding: 1px;
  background: #fff;
  box-shadow: inset 0 0 0 1px #72ade9, 2px 3px 3px rgba(0, 0, 0, 0.5);
  z-index: 10000;
`;

const DesktopContextMenuItem = styled.button`
  width: 100%;
  height: 28px;
  padding: 0 10px 0 8px;
  border: 0;
  background: transparent;
  color: #000;
  font-size: 11px;
  font-family: Tahoma, 'Noto Sans', sans-serif;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #1b65cc;
    color: #fff;
  }

  img {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

const LayoutDebugPanel = styled.div`
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;

  .layout-debug__controls button,
  .layout-debug__actions button {
    min-height: 24px;
    padding: 0 10px;
    border: 1px solid #0f3a74;
    border-right-color: #001f4d;
    border-bottom-color: #001f4d;
    background: linear-gradient(to bottom, #fefefe 0%, #d6e4f8 100%);
    color: #183455;
    font-size: 11px;
    font-family: Tahoma, 'Noto Sans', sans-serif;
  }

  .layout-debug__window {
    width: 320px;
    border: 1px solid #0f3a74;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
    background: #ece9d8;
  }

  .layout-debug__titlebar {
    height: 26px;
    display: flex;
    align-items: center;
    padding: 0 8px;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    text-shadow: 1px 1px #001a57;
    background: linear-gradient(
      180deg,
      #0997ff,
      #0053ee 8%,
      #0050ee 40%,
      #06f 88%,
      #005bff 95%,
      #003dd7 100%
    );
  }

  .layout-debug__body {
    padding: 10px;
    background: #ece9d8;
    border-top: 1px solid #7f9db9;
  }

  .layout-debug__hint,
  .layout-debug__selected,
  .layout-debug__actions span {
    font-size: 11px;
    color: #1f2f48;
  }

  .layout-debug__hint {
    margin-bottom: 6px;
  }

  .layout-debug__selected {
    min-height: 28px;
    margin-bottom: 8px;
  }

  .layout-debug__controls,
  .layout-debug__actions {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }

  .layout-debug__controls {
    margin-bottom: 8px;
  }

  .layout-debug__export {
    width: 100%;
    height: 220px;
    resize: vertical;
    margin-bottom: 8px;
    padding: 8px;
    border: 1px solid #7f9db9;
    background: #fff;
    color: #1a1a1a;
    font-size: 11px;
    font-family: 'Courier New', monospace;
    box-sizing: border-box;
  }

  .layout-debug__controls button:disabled {
    opacity: 0.5;
  }
`;

export default WinXP;
