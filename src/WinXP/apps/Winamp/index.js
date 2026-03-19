import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Webamp from 'webamp';
import { initialTracks } from './config';

const CUSTOM_TRACKS_URL = '/custom/winamp/tracks.json';

function safeDispose(instance) {
  if (!instance) return;

  try {
    instance.dispose();
  } catch (error) {
    console.warn('Winamp dispose failed', error);
  }
}

function toTrackTitle(fileName) {
  return fileName.replace(/\.[^/.]+$/, '');
}

function pickLocalTracks() {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mp3,audio/*';
    input.multiple = true;
    input.style.display = 'none';

    function cleanup() {
      input.removeEventListener('change', onChange);
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    }

    function onChange(event) {
      const files = Array.from(event.target.files || []);
      cleanup();
      resolve(
        files.map(file => ({
          blob: file,
          defaultName: toTrackTitle(file.name),
          metaData: {
            title: toTrackTitle(file.name),
            artist: 'local file',
            album: 'custom songs',
          },
        })),
      );
    }

    input.addEventListener('change', onChange);
    document.body.appendChild(input);
    input.click();
  });
}

async function loadCustomTracks() {
  try {
    const response = await fetch(CUSTOM_TRACKS_URL, { cache: 'no-store' });
    if (!response.ok) return [];

    const payload = await response.json();
    if (!Array.isArray(payload)) return [];

    return payload
      .filter(track => track && typeof track.url === 'string')
      .map((track, index) => {
        const fileName = track.url.split('/').pop() || `track-${index + 1}`;
        const title =
          track.defaultName || track.title || toTrackTitle(fileName);

        return {
          url: track.url,
          duration:
            typeof track.duration === 'number' ? track.duration : undefined,
          defaultName: title,
          metaData: {
            title,
            artist: track.artist || 'custom track',
            album: track.album || 'custom songs',
          },
        };
      });
  } catch (error) {
    console.warn('Custom Winamp tracks failed to load', error);
    return [];
  }
}

function Winamp({ onClose, onMinimize }) {
  const ref = useRef(null);
  const webamp = useRef(null);
  const onCloseRef = useRef(onClose);
  const onMinimizeRef = useRef(onMinimize);

  useEffect(() => {
    onCloseRef.current = onClose;
    onMinimizeRef.current = onMinimize;
  }, [onClose, onMinimize]);

  useEffect(() => {
    let cancelled = false;

    async function mountWinamp() {
      const target = ref.current;
      if (!target || !Webamp.browserIsSupported()) return;

      const customTracks = await loadCustomTracks();
      if (cancelled || !ref.current) return;

      const instance = new Webamp({
        initialTracks: customTracks.length > 0 ? customTracks : initialTracks,
        filePickers: [
          {
            contextMenuName: 'add local files...',
            requiresNetwork: false,
            filePicker: pickLocalTracks,
          },
        ],
      });

      webamp.current = instance;
      instance.onClose(() => {
        if (onCloseRef.current) {
          onCloseRef.current();
        }
      });
      instance.onMinimize(() => {
        if (onMinimizeRef.current) {
          onMinimizeRef.current();
        }
      });

      try {
        await instance.renderWhenReady(target);
      } catch (error) {
        safeDispose(instance);
        throw error;
      }

      if (cancelled) {
        safeDispose(instance);
        return;
      }
    }

    mountWinamp();

    return () => {
      cancelled = true;
      safeDispose(webamp.current);
      webamp.current = null;
    };
  }, []);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
      }}
    />,
    document.body,
  );
}

export default Winamp;
