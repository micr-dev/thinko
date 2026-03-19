import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

function NyanCat() {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    audio.volume = 0.5;
    const playPromise = audio.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return (
    <Container>
      <audio ref={audioRef} src="/custom/nyan-cat/Nyancat.mp3" loop />
      <img
        src="/custom/nyan-cat/nyancat.gif"
        alt="Nyan Cat"
        draggable={false}
      />
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #003366;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
  }
`;

export default NyanCat;
