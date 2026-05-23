import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { games } from './game-registry';

function VirtualPc({ isFocus, gameId }) {
  const initialGame = games.find(game => game.id === gameId) || games[0];
  const [selectedId, setSelectedId] = useState(initialGame.id);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(8);
  const [loadLabel, setLoadLabel] = useState('Preparing game window...');
  const selectedGame =
    games.find(game => game.id === selectedId) || initialGame || games[0];
  const showSidebar = !gameId;
  const usesRuntimeLoading = selectedGame.loadingMode === 'message';

  useEffect(() => {
    setIsFrameLoading(true);
    setLoadProgress(usesRuntimeLoading ? 6 : 8);
    setLoadLabel('Preparing game window...');

    if (usesRuntimeLoading) return undefined;

    const interval = window.setInterval(() => {
      setLoadProgress(progress => {
        if (progress >= 92) return progress;
        return Math.min(
          progress + Math.max(3, Math.round((100 - progress) / 6)),
          92,
        );
      });
    }, 180);

    return () => window.clearInterval(interval);
  }, [selectedGame.id, usesRuntimeLoading]);

  useEffect(() => {
    if (!usesRuntimeLoading) return undefined;

    function handleGameMessage(event) {
      if (event.origin !== window.location.origin) return;

      const data = event.data;

      if (
        !data ||
        data.type !== 'XP_GAME_LOADING' ||
        data.gameId !== selectedGame.id
      ) {
        return;
      }

      if (typeof data.label === 'string' && data.label.trim()) {
        setLoadLabel(data.label);
      }

      if (typeof data.progress === 'number') {
        setLoadProgress(Math.max(0, Math.min(100, Math.round(data.progress))));
      }

      if (data.ready) {
        setLoadProgress(100);
        window.setTimeout(() => {
          setIsFrameLoading(false);
        }, 180);
      }
    }

    window.addEventListener('message', handleGameMessage);

    return () => {
      window.removeEventListener('message', handleGameMessage);
    };
  }, [selectedGame.id, usesRuntimeLoading]);

  function handleFrameLoad() {
    if (usesRuntimeLoading) {
      setLoadProgress(progress => Math.max(progress, 18));
      setLoadLabel('Loading game files...');
      return;
    }

    setLoadProgress(100);
    window.setTimeout(() => {
      setIsFrameLoading(false);
    }, 180);
  }

  return (
    <Container>
      {showSidebar && (
        <aside className="sidebar">
          <div className="sidebar__title">Installed Games</div>
          <div className="sidebar__hint">
            Launch Touhou 1-5, Quake 3, Syobon Action, ULTRAKILL, Super Monkey
            Ball Jr., Portal 2D, and Vampire Survivors inside the embedded
            browser.
          </div>
          <div className="sidebar__list">
            {games.map(game => (
              <button
                key={game.id}
                type="button"
                className={`sidebar__item ${
                  selectedGame.id === game.id ? 'active' : ''
                }`}
                onClick={() => setSelectedId(game.id)}
              >
                <img src={game.icon} alt="" className="sidebar__item__icon" />
                <span>{game.shortName}</span>
              </button>
            ))}
          </div>
        </aside>
      )}
      <section className="viewer">
        <div className="viewer__frame">
          <iframe
            key={selectedGame.id}
            src={selectedGame.url}
            frameBorder="0"
            title={selectedGame.name}
            onLoad={handleFrameLoad}
            allow="autoplay; fullscreen; gamepad; pointer-lock"
            allowFullScreen
            className="viewer__frame__iframe"
          />
          {isFrameLoading && (
            <div className="viewer__loading">
              <div className="viewer__loading__window">
                <div className="viewer__loading__titlebar">
                  <div className="viewer__loading__titlebar__label">
                    <img
                      src={selectedGame.icon}
                      alt=""
                      className="viewer__loading__titlebar__icon"
                    />
                    <span>Loading {selectedGame.shortName}</span>
                  </div>
                  <div className="viewer__loading__controls">
                    <button aria-label="Minimize" type="button" />
                    <button aria-label="Maximize" type="button" />
                    <button aria-label="Close" type="button" />
                  </div>
                </div>
                <div className="viewer__loading__body">
                  <div className="viewer__loading__label">
                    {loadLabel} {loadProgress}%
                  </div>
                  <div className="viewer__loading__track">
                    <div
                      className="viewer__loading__fill"
                      style={{ width: `${loadProgress}%` }}
                    />
                  </div>
                  <div className="viewer__loading__hint">
                    Please wait while the game initializes.
                  </div>
                </div>
              </div>
            </div>
          )}
          {!isFocus && <div className="viewer__frame__overlay" />}
        </div>
      </section>
    </Container>
  );
}

const loadingStripe = keyframes`
  from {
    background-position: 0 0;
  }

  to {
    background-position: 14px 0;
  }
`;

const Container = styled.div`
  display: flex;
  height: 100%;
  background: #ece9d8;
  border: 1px solid #7f9db9;
  border-top: 0;

  .sidebar {
    width: 180px;
    flex-shrink: 0;
    background: linear-gradient(to bottom, #f7f4e8 0%, #e2dcc8 100%);
    border-right: 1px solid #b8b09a;
    padding: 10px;
    display: flex;
    flex-direction: column;
  }

  .sidebar__title {
    font-size: 11px;
    font-weight: 700;
    color: #1f3b78;
    margin-bottom: 6px;
  }

  .sidebar__hint {
    font-size: 10px;
    line-height: 1.35;
    color: #4f4f4f;
    margin-bottom: 10px;
  }

  .sidebar__list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sidebar__item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    border: 1px solid transparent;
    background: transparent;
    padding: 5px 6px;
    font-size: 11px;
    text-align: left;
  }

  .sidebar__item:hover {
    border-color: #7da2ce;
    background: rgba(255, 255, 255, 0.65);
  }

  .sidebar__item.active {
    border-color: #6c8ebf;
    background: linear-gradient(to bottom, #dceafd 0%, #bfd6f6 100%);
  }

  .sidebar__item__icon {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }

  .viewer {
    min-width: 0;
    flex: 1;
    background: #fff;
  }

  .viewer__frame {
    position: relative;
    height: 100%;
    background: #fff;
  }

  .viewer__loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(236, 233, 216, 0.72);
    z-index: 1;
  }

  .viewer__loading__window {
    width: 350px;
    padding: 0 0 3px;
    border-radius: 8px 8px 0 0;
    background: #ece9d8;
    box-shadow: inset -1px -1px #00138c, inset 1px 1px #0831d9,
      inset -2px -2px #001ea0, inset 2px 2px #166aee, inset -3px -3px #003bda,
      inset 3px 3px #0855dd, 2px 4px 12px rgba(0, 0, 0, 0.28);
  }

  .viewer__loading__titlebar {
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 5px 3px 3px;
    border-top: 1px solid #0831d9;
    border-left: 1px solid #0831d9;
    border-right: 1px solid #001ea0;
    border-radius: 8px 8px 0 0;
    color: #fff;
    font-family: 'Trebuchet MS', sans-serif;
    font-size: 13px;
    font-weight: 700;
    text-shadow: 1px 1px #0f1089;
    background: linear-gradient(
      180deg,
      #0997ff,
      #0053ee 8%,
      #0050ee 40%,
      #06f 88%,
      #06f 93%,
      #005bff 95%,
      #003dd7 100%
    );
  }

  .viewer__loading__titlebar__label {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .viewer__loading__titlebar__icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .viewer__loading__controls {
    display: flex;
    gap: 2px;
  }

  .viewer__loading__controls button {
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

  .viewer__loading__controls button[aria-label='Minimize']::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 13px;
    width: 8px;
    height: 3px;
    background: #fff;
  }

  .viewer__loading__controls button[aria-label='Maximize']::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 4px;
    width: 12px;
    height: 12px;
    box-shadow: inset 0 3px #fff, inset 0 0 0 1px #fff;
  }

  .viewer__loading__controls button[aria-label='Close'] {
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

  .viewer__loading__controls button[aria-label='Close']::before,
  .viewer__loading__controls button[aria-label='Close']::after {
    content: '';
    position: absolute;
    left: 9px;
    top: 2px;
    width: 2px;
    height: 16px;
    background: #fff;
  }

  .viewer__loading__controls button[aria-label='Close']::before {
    transform: rotate(45deg);
  }

  .viewer__loading__controls button[aria-label='Close']::after {
    transform: rotate(-45deg);
  }

  .viewer__loading__body {
    margin: 8px;
    font-size: 11px;
    color: #222;
  }

  .viewer__loading__label {
    margin-bottom: 4px;
  }

  .viewer__loading__track {
    height: 14px;
    padding: 1px 2px 1px 0;
    overflow: hidden;
    background: #fff;
    border: 1px solid #686868;
    box-shadow: inset 0 0 1px 0 #686868;
  }

  .viewer__loading__fill {
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
    background-size: 14px 100%, 100% 100%;
    animation: ${loadingStripe} 0.8s linear infinite;
    transition: width 0.18s ease-out;
  }

  .viewer__loading__hint {
    margin-top: 8px;
    color: #4c4c4c;
  }

  .viewer__frame__iframe {
    display: block;
    width: 100%;
    height: 100%;
    background: #fff;
  }

  .viewer__frame__overlay {
    position: absolute;
    inset: 0;
  }
`;

export default VirtualPc;
