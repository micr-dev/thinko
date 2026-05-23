import { lazy } from 'react';
import { characterDocumentIcons } from './character-documents';
import defaultIconGridIndexes from './default-icon-grid-indexes.json';
import { games } from './virtual-pc/game-registry';
import mine from 'assets/minesweeper/mine-icon.png';
import error from 'assets/windowsIcons/897(16x16).png';
import computer from 'assets/windowsIcons/676(16x16).png';
import computerLarge from 'assets/windowsIcons/676(32x32).png';
import winamp from 'assets/windowsIcons/winamp.png';
import paintLarge from 'assets/windowsIcons/680(32x32).png';
import paint from 'assets/windowsIcons/680(16x16).png';
import picture from 'assets/windowsIcons/307(32x32).png';
import recycleBinIcon from 'assets/windowsIcons/360(32x32).png';

const Minesweeper = lazy(() => import('./Minesweeper'));
const ErrorBox = lazy(() => import('./ErrorBox'));
const MyComputer = lazy(() => import('./MyComputer'));
const Winamp = lazy(() => import('./Winamp'));
const Paint = lazy(() => import('./Paint'));
const DrawingsFolder = lazy(() => import('./drawings-folder'));
const VirtualPc = lazy(() => import('./virtual-pc'));
const IWBTG = lazy(() => import('./iwbtg'));
const NyanCat = lazy(() => import('./nyan-cat'));
const CommissionViewer = lazy(() => import('./commission-viewer'));

const nyanCatIcon = '/custom/nyan-cat/nyancat.png';
const iwbtgIcon = '/custom/games/iwbtg.png';
const GAME_WINDOW_CHROME = {
  width: 6,
  height: 31,
};

function toGameWindowSize(size = { width: 860, height: 620 }) {
  return {
    width: size.width + GAME_WINDOW_CHROME.width,
    height: size.height + GAME_WINDOW_CHROME.height,
  };
}

function hashCommissionId(value) {
  return (
    Array.from(value || '').reduce(
      (hash, character) => (hash * 31 + character.charCodeAt(0)) % 1000000,
      17,
    ) + 1000
  );
}

export function buildCommissionDesktopIcon(commission) {
  const sourceWidth = Math.max(Number(commission.width) || 560, 1);
  const sourceHeight = Math.max(Number(commission.height) || 360, 1);
  const maxPreviewWidth = 760;
  const maxPreviewHeight = 560;
  const minPreviewWidth = 280;
  const minPreviewHeight = 220;
  const previewScale = Math.min(
    maxPreviewWidth / sourceWidth,
    maxPreviewHeight / sourceHeight,
  );
  const previewWidth = Math.max(
    minPreviewWidth,
    Math.min(maxPreviewWidth, Math.round(sourceWidth * previewScale)),
  );
  const previewHeight = Math.max(
    minPreviewHeight,
    Math.min(maxPreviewHeight, Math.round(sourceHeight * previewScale)),
  );
  const windowWidth = Math.min(Math.max(previewWidth + 260, 620), 1080);
  const windowHeight = Math.min(Math.max(previewHeight + 190, 500), 940);

  let resolvedImageUrl = commission.imageUrl;
  if (
    Array.isArray(commission.imageVariants) &&
    commission.imageVariants.length
  ) {
    const pick =
      commission.imageVariants[
        Math.floor(Math.random() * commission.imageVariants.length)
      ];
    resolvedImageUrl = pick;
  }

  const resolvedCommission = {
    ...commission,
    imageUrl: resolvedImageUrl,
  };

  return {
    id: hashCommissionId(commission.id),
    icon: commission.iconUrl || picture,
    title: commission.artistName,
    appKey: commission.id,
    gridIndex: commission.gridIndex,
    isFocus: false,
    isCommission: true,
    appDescriptor: {
      header: {
        icon: commission.iconUrl || picture,
        title: commission.artistName,
      },
      component: CommissionViewer,
      injectProps: {
        commission: resolvedCommission,
      },
      defaultSize: {
        width: windowWidth,
        height: windowHeight,
      },
      defaultOffset: {
        x: 220,
        y: 70,
      },
      resizable: true,
      minimized: false,
      maximized: false,
      multiInstance: true,
    },
  };
}

const desktopGameIcons = games.map((game, index) => ({
  id: index + 6,
  icon: game.icon,
  title: game.shortName,
  component: VirtualPc,
  appKey: game.appKey,
  gridIndex: defaultIconGridIndexes[index + 6],
  isFocus: false,
}));
const firstExtraIconId = 6 + desktopGameIcons.length;

const gameAppSettings = games.reduce((settings, game, index) => {
  settings[game.appKey] = {
    header: {
      icon: game.icon,
      title: game.name,
    },
    component: VirtualPc,
    injectProps: {
      gameId: game.id,
    },
    defaultSize: toGameWindowSize(game.defaultSize),
    defaultOffset: game.defaultOffset || {
      x: 160 + (index % 3) * 30,
      y: 40 + (index % 3) * 24,
    },
    resizable: true,
    minimized: false,
    maximized: false,
    multiInstance: true,
  };

  return settings;
}, {});

export const defaultAppState = [];

export const defaultIconState = [
  {
    id: 0,
    icon: recycleBinIcon,
    title: 'Recycle Bin',
    appKey: 'Recycle Bin',
    gridIndex: defaultIconGridIndexes[0],
    isFocus: false,
  },
  {
    id: 1,
    icon: mine,
    title: 'Minesweeper',
    component: Minesweeper,
    gridIndex: defaultIconGridIndexes[1],
    isFocus: false,
  },
  {
    id: 2,
    icon: computerLarge,
    title: 'My Computer',
    component: MyComputer,
    gridIndex: defaultIconGridIndexes[2],
    isFocus: false,
  },
  {
    id: 3,
    icon: paintLarge,
    title: 'Paint',
    component: Paint,
    gridIndex: defaultIconGridIndexes[3],
    isFocus: false,
  },
  {
    id: 4,
    icon: picture,
    title: 'My Pictures',
    component: DrawingsFolder,
    appKey: 'My Pictures',
    gridIndex: defaultIconGridIndexes[4],
    isFocus: false,
  },
  {
    id: 5,
    icon: winamp,
    title: 'Winamp',
    component: Winamp,
    gridIndex: defaultIconGridIndexes[5],
    isFocus: false,
  },
  ...desktopGameIcons,
  {
    id: firstExtraIconId,
    icon: nyanCatIcon,
    title: 'Nyan Cat',
    component: NyanCat,
    appKey: 'Nyan Cat',
    gridIndex: defaultIconGridIndexes[firstExtraIconId],
    isFocus: false,
  },
  ...characterDocumentIcons,
];

export const appSettings = {
  Minesweeper: {
    header: {
      icon: mine,
      title: 'Minesweeper',
    },
    component: Minesweeper,
    defaultSize: {
      width: 0,
      height: 0,
    },
    defaultOffset: {
      x: 190,
      y: 180,
    },
    resizable: false,
    minimized: false,
    maximized: false,
    multiInstance: true,
  },
  Error: {
    header: {
      icon: error,
      title: 'C:\\',
      buttons: ['close'],
      noFooterWindow: true,
    },
    component: ErrorBox,
    defaultSize: {
      width: 380,
      height: 0,
    },
    defaultOffset: {
      x: window.innerWidth / 2 - 190,
      y: window.innerHeight / 2 - 60,
    },
    resizable: false,
    minimized: false,
    maximized: false,
    multiInstance: true,
  },
  'Recycle Bin': {
    header: {
      icon: recycleBinIcon,
      title: 'Recycle Bin',
      buttons: ['minimize', 'close'],
    },
    component: ErrorBox,
    injectProps: {
      message: 'Recycle Bin is empty.',
    },
    defaultSize: {
      width: 320,
      height: 0,
    },
    defaultOffset: {
      x: 220,
      y: 120,
    },
    resizable: false,
    minimized: false,
    maximized: false,
    multiInstance: true,
  },
  'My Computer': {
    header: {
      icon: computer,
      title: 'My Computer',
    },
    component: MyComputer,
    defaultSize: {
      width: 660,
      height: 500,
    },
    defaultOffset: {
      x: 260,
      y: 50,
    },
    resizable: true,
    minimized: false,
    maximized: window.innerWidth < 800,
    multiInstance: false,
  },
  Winamp: {
    header: {
      icon: winamp,
      title: 'Winamp',
      invisible: true,
    },
    component: Winamp,
    defaultSize: {
      width: 0,
      height: 0,
    },
    defaultOffset: {
      x: 0,
      y: 0,
    },
    resizable: false,
    minimized: false,
    maximized: false,
    multiInstance: false,
  },
  Paint: {
    header: {
      icon: paint,
      title: 'Untitled - Paint',
    },
    component: Paint,
    defaultSize: {
      width: 660,
      height: 500,
    },
    defaultOffset: {
      x: 280,
      y: 70,
    },
    resizable: true,
    minimized: false,
    maximized: window.innerWidth < 800,
    multiInstance: true,
  },
  'My Pictures': {
    header: {
      icon: picture,
      title: 'My Pictures',
    },
    component: DrawingsFolder,
    defaultSize: {
      width: 780,
      height: 560,
    },
    defaultOffset: {
      x: 240,
      y: 75,
    },
    resizable: true,
    minimized: false,
    maximized: false,
    multiInstance: false,
  },
  ...gameAppSettings,
  IWBTG: {
    header: {
      icon: iwbtgIcon,
      title: 'I Wanna Be The Guy',
    },
    component: IWBTG,
    defaultSize: {
      width: 820,
      height: 520,
    },
    defaultOffset: {
      x: 170,
      y: 55,
    },
    resizable: true,
    minimized: false,
    maximized: false,
    multiInstance: true,
  },
  'Nyan Cat': {
    header: {
      icon: nyanCatIcon,
      title: 'Nyan Cat',
    },
    component: NyanCat,
    defaultSize: {
      width: 400,
      height: 320,
    },
    defaultOffset: {
      x: 200,
      y: 80,
    },
    resizable: false,
    minimized: false,
    maximized: false,
    multiInstance: true,
  },
};

export { Minesweeper, ErrorBox, MyComputer, Winamp, VirtualPc, IWBTG, NyanCat };
