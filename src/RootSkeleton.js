import React from 'react';

const XP_WALLPAPER = '/custom/wallpapers/wallpaper-xp-bliss.png';

// Grid constants matching WinXP/Icons
const ICON_COL_W = 96;
const ICON_COL_GAP = 1;
const ICON_ROW_H = 83;
const ICON_ROW_GAP = 8;
const ICON_PAD_LEFT = 4;
const ICON_PAD_TOP = 8;
const ROWS = 8;
const COLS = 3;
const FOOTER_H = 30;

const shimmerKeyframes = `
  @keyframes xp-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

const boneStyle = {
  borderRadius: 3,
  background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.06) 75%)',
  backgroundSize: '200% 100%',
  animation: 'xp-shimmer 1.8s ease-in-out infinite',
};

const footerGradient =
  'linear-gradient(to bottom, #1f2f86 0%, #3165c4 3%, #3682e5 6%, #4490e6 10%, #3883e5 12%, #2b71e0 15%, #2663da 18%, #235bd6 20%, #2258d5 23%, #2157d6 38%, #245ddb 54%, #2562df 86%, #245fdc 89%, #2158d4 92%, #1d4ec0 95%, #1941a5 98%)';

const trayGradient =
  'linear-gradient(to bottom, #0c59b9 1%, #139ee9 6%, #18b5f2 10%, #139beb 14%, #1290e8 19%, #0d8dea 63%, #0d9ff1 81%, #0f9eed 88%, #119be9 91%, #1392e2 94%, #137ed7 97%, #095bc9 100%)';

function DesktopIconBone({ row, col }) {
  const left = ICON_PAD_LEFT + col * (ICON_COL_W + ICON_COL_GAP);
  const top = ICON_PAD_TOP + row * (ICON_ROW_H + ICON_ROW_GAP);

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: ICON_COL_W,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div style={{ ...boneStyle, width: 40, height: 40 }} />
      <div style={{ ...boneStyle, width: 64, height: 8, animationDelay: '0.15s' }} />
    </div>
  );
}

function RootSkeleton() {
  const icons = [];
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      icons.push(<DesktopIconBone key={`${row}-${col}`} row={row} col={col} />);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        fontFamily: 'Tahoma, "Noto Sans", sans-serif',
      }}
    >
      <style>{shimmerKeyframes}</style>

      {/* Wallpaper */}
      <img
        alt=""
        src={XP_WALLPAPER}
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Skeleton desktop icons */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {icons}
      </div>

      {/* Skeleton taskbar */}
      <footer
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: FOOTER_H,
          background: footerGradient,
          display: 'flex',
          zIndex: 10,
        }}
      >
        {/* Start button bone */}
        <div
          style={{
            height: '100%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 2,
          }}
        >
          <div
            style={{
              width: 99,
              height: 22,
              borderRadius: 2,
              background: 'linear-gradient(to bottom, #3c9738 0%, #3c9738 50%, #37922e 100%)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 6px',
              gap: 4,
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ width: 50, height: 9, borderRadius: 2, background: 'rgba(255,255,255,0.25)' }} />
          </div>
        </div>

        {/* Quick launch divider */}
        <div
          style={{
            width: 1,
            height: 20,
            background: 'rgba(255,255,255,0.15)',
            alignSelf: 'center',
            margin: '0 6px',
          }}
        />

        {/* Task area bones */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                height: 22,
                maxWidth: 140,
                flex: '0 1 140px',
                borderRadius: 2,
                marginTop: 2,
                padding: '0 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(60, 129, 243, 0.5)',
                boxShadow: 'inset -1px 0 rgba(0,0,0,0.3), inset 1px 1px 1px rgba(255,255,255,0.2)',
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 2, ...boneStyle, animationDelay: `${i * 0.2}s` }} />
              <div style={{ width: 60, height: 7, borderRadius: 2, ...boneStyle, animationDelay: `${i * 0.2 + 0.1}s` }} />
            </div>
          ))}
        </div>

        {/* System tray */}
        <div
          style={{
            background: trayGradient,
            borderLeft: '1px solid #1042af',
            boxShadow: 'inset 1px 0 1px #18bbff',
            padding: '0 10px',
            marginLeft: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
          <div
            style={{
              width: 46,
              height: 12,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.2)',
              marginLeft: 4,
            }}
          />
        </div>
      </footer>
    </div>
  );
}

export default RootSkeleton;
