import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const IWBTG_BASE_URL = '/custom/games/iwbtg/';
const VIEWPORT_PADDING = 8;

const gameHtml = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <base href="${IWBTG_BASE_URL}">
      <link rel="stylesheet" type="text/css" href="style.css" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta
        name="viewport"
        content="initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, target-densitydpi=device-dpi"
      />
      <style>
        html,
        body {
          width: 100%;
          height: 100%;
          margin: 0;
          overflow: hidden;
          background: #000;
        }

        body {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #MMFCanvas {
          display: block;
        }

        #progress-container {
          display: none !important;
        }
      </style>
    </head>
    <body>
      <div
        style="display:flex;justify-content:center;align-items:center;height:100vh;"
      >
        <canvas id="MMFCanvas" width="${GAME_WIDTH}" height="${GAME_HEIGHT}">
          Your browser does not support Canvas, Please try again.
        </canvas>
      </div>
      <script>
        const hiddenContainer = document.createElement('div');
        hiddenContainer.id = 'progress-container';
        hiddenContainer.style.display = 'none';

        const downloadText = document.createElement('span');
        downloadText.id = 'download-text';
        downloadText.innerText = '0%';

        const downloadBar = document.createElement('div');
        downloadBar.id = 'download-bar';

        const extractText = document.createElement('span');
        extractText.id = 'extract-text';
        extractText.innerText = '0%';

        const extractBar = document.createElement('div');
        extractBar.id = 'extract-bar';

        hiddenContainer.appendChild(downloadText);
        hiddenContainer.appendChild(downloadBar);
        hiddenContainer.appendChild(extractText);
        hiddenContainer.appendChild(extractBar);
        document.body.appendChild(hiddenContainer);

        setInterval(() => {
          const download = parseInt(downloadText.innerText, 10) || 0;
          const extract = parseInt(extractText.innerText, 10) || 0;

          window.parent.postMessage(
            {
              type: 'IWBTG_PROGRESS',
              download,
              extract,
              complete: download === 100 && extract === 100,
            },
            '*',
          );
        }, 100);
      </script>
      <script src="jszip.min.js"></script>
      <script src="loader.js"></script>
    </body>
  </html>
`;

function IWBTG() {
  const viewportRef = useRef(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [extractProgress, setExtractProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [frameScale, setFrameScale] = useState(0.76);

  useEffect(() => {
    function handleMessage(event) {
      if (!event.data || event.data.type !== 'IWBTG_PROGRESS') return;

      setDownloadProgress(event.data.download || 0);
      setExtractProgress(event.data.extract || 0);
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (downloadProgress !== 100 || extractProgress !== 100) return;

    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [downloadProgress, extractProgress]);

  useLayoutEffect(() => {
    if (!viewportRef.current) return undefined;

    function updateScale() {
      const bounds = viewportRef.current.getBoundingClientRect();
      const availableWidth = Math.max(bounds.width - VIEWPORT_PADDING * 2, 1);
      const availableHeight = Math.max(bounds.height - VIEWPORT_PADDING * 2, 1);
      const nextScale = Math.min(
        availableWidth / GAME_WIDTH,
        availableHeight / GAME_HEIGHT,
      );

      setFrameScale(Math.max(nextScale, 0.1));
    }

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(viewportRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <Container>
      <ViewportArea ref={viewportRef}>
        <GameViewport
          style={{
            width: `${GAME_WIDTH * frameScale}px`,
            height: `${GAME_HEIGHT * frameScale}px`,
          }}
        >
          <GameFrame
            srcDoc={gameHtml}
            title="I Wanna Be The Guy"
            scale={frameScale}
          />
        </GameViewport>
      </ViewportArea>
      {isLoading && (
        <LoadingOverlay>
          <LoadingWindow>
            <LoadingTitleBar>
              <span>Loading Game Resources</span>
              <LoadingControls>
                <button aria-label="Minimize" type="button" />
                <button aria-label="Maximize" type="button" />
                <button aria-label="Close" type="button" />
              </LoadingControls>
            </LoadingTitleBar>
            <LoadingBody>
              {[
                { label: 'Downloading', value: downloadProgress },
                { label: 'Extracting', value: extractProgress },
              ].map(row => (
                <ProgressBlock key={row.label}>
                  <label>
                    {row.label}... {row.value}%
                  </label>
                  <ProgressTrack>
                    <ProgressFill style={{ width: `${row.value}%` }} />
                  </ProgressTrack>
                </ProgressBlock>
              ))}
              <ControlsBox>
                <legend>Controls</legend>
                <div>Shift - Jump</div>
                <div>Z - Shoot</div>
                <div>Q - Suicide</div>
                <div>R - Restart</div>
                <div>Arrows - Move</div>
              </ControlsBox>
            </LoadingBody>
          </LoadingWindow>
        </LoadingOverlay>
      )}
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
`;

const ViewportArea = styled.div`
  width: 100%;
  height: 100%;
  padding: ${VIEWPORT_PADDING}px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GameViewport = styled.div`
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
`;

const GameFrame = styled.iframe`
  width: ${GAME_WIDTH}px;
  height: ${GAME_HEIGHT}px;
  border: none;
  display: block;
  position: absolute;
  inset: 0 auto auto 0;
  transform: scale(${props => props.scale});
  transform-origin: top left;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
`;

const LoadingWindow = styled.div`
  width: 350px;
  padding: 0 0 3px;
  border-radius: 8px 8px 0 0;
  background: #ece9d8;
  box-shadow: inset -1px -1px #00138c, inset 1px 1px #0831d9,
    inset -2px -2px #001ea0, inset 2px 2px #166aee, inset -3px -3px #003bda,
    inset 3px 3px #0855dd;
`;

const LoadingTitleBar = styled.div`
  height: 26px;
  padding: 3px 5px 3px 3px;
  border-top: 1px solid #0831d9;
  border-left: 1px solid #0831d9;
  border-right: 1px solid #001ea0;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: 'Trebuchet MS', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  text-shadow: 1px 1px #0f1089;
  background: linear-gradient(
    180deg,
    #0997ff,
    #0053ee 8%,
    #0050ee 40%,
    #06f 88%,
    #06f 93%,
    #005bff 95%,
    #003dd7 96%,
    #003dd7
  );
`;

const LoadingControls = styled.div`
  display: flex;
  gap: 2px;

  button {
    position: relative;
    width: 21px;
    height: 21px;
    padding: 0;
    border: 1px solid #fff;
    border-radius: 3px;
    cursor: default;
    box-shadow: inset 0 -1px 2px 1px #4646ff;
    background-image: radial-gradient(
      circle at 90% 90%,
      #0054e9 0%,
      #2263d5 55%,
      #4479e4 70%,
      #a3bbec 90%,
      #fff 100%
    );
  }

  button[aria-label='Minimize']::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 13px;
    width: 8px;
    height: 3px;
    background: #fff;
  }

  button[aria-label='Maximize']::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 4px;
    width: 12px;
    height: 12px;
    box-shadow: inset 0 3px #fff, inset 0 0 0 1px #fff;
  }

  button[aria-label='Close'] {
    box-shadow: inset 0 -1px 2px 1px #da4600;
    background-image: radial-gradient(
      circle at 90% 90%,
      #cc4600 0%,
      #dc6527 55%,
      #cd7546 70%,
      #ffccb2 90%,
      #fff 100%
    );
  }

  button[aria-label='Close']::before,
  button[aria-label='Close']::after {
    content: '';
    position: absolute;
    left: 9px;
    top: 2px;
    width: 2px;
    height: 16px;
    background: #fff;
  }

  button[aria-label='Close']::before {
    transform: rotate(45deg);
  }

  button[aria-label='Close']::after {
    transform: rotate(-45deg);
  }
`;

const LoadingBody = styled.div`
  margin: 8px;
  font-size: 11px;
  color: #222;
`;

const ProgressBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  &:not(:first-child) {
    margin-top: 8px;
  }
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 14px;
  padding: 1px 2px 1px 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #686868;
  box-shadow: inset 0 0 1px 0 #686868;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: repeating-linear-gradient(
      90deg,
      #fff 0,
      #fff 2px,
      transparent 2px,
      transparent 10px
    ),
    linear-gradient(
      180deg,
      #acedad 0,
      #7be47d 14%,
      #4cda50 28%,
      #2ed330 42%,
      #42d845 57%,
      #76e275 71%,
      #8fe791 85%,
      #fff
    );
`;

const ControlsBox = styled.fieldset`
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #d0d0bf;
  border-radius: 4px;

  legend {
    padding: 0 4px;
    color: #0046d5;
  }

  div + div {
    margin-top: 2px;
  }
`;

export default IWBTG;
