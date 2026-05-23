import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';

const fadeIn = keyframes`
  0%   { opacity: 0; }
  100% { opacity: 1; }
`;

const fadeOut = keyframes`
  0%   { opacity: 1; }
  100% { opacity: 0; }
`;

const Wrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  background-color: #000;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  user-select: none;
  overflow: hidden;
  cursor: default;
  pointer-events: ${p => (p.$fading ? 'none' : 'auto')};

  ${p =>
    p.$fading
      ? css`
          animation: ${fadeOut} 0.4s ease forwards;
        `
      : css`
          animation: ${fadeIn} 0.2s ease;
        `}
`;

const ContentWrapper = styled.div`
  width: 100%;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  padding-top: 229px;
  padding-bottom: 69px;
  display: flex;
`;

const LogoProgressbar = styled.div`
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-top: 50px;
  padding-bottom: 50px;
  display: flex;
`;

const LogoImg = styled.img`
  width: 245px;
  display: block;
  margin: 0 auto;
`;

const LoaderTrack = styled.div`
  width: 220px;
  height: 20px;
  border: 1px solid #b1b1b3;
  border-radius: 5px;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding: 2px 4px;
  display: flex;
  overflow: hidden;
  margin-top: 50px;
`;

const BlockContainer = styled.div`
  display: flex;
  gap: 4px;
`;

const Block = styled.div`
  width: 12px;
  height: 12px;
  background-color: #2c38b9;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
`;

const BlockHighlight = styled.div`
  height: 4px;
  background-color: #7f9ffe;
  position: absolute;
  top: 18%;
  left: 0;
  right: 0;
`;

const CopyrightsWrapper = styled.div`
  width: 100%;
  height: auto;
  justify-content: space-between;
  align-items: center;
  padding: 32px 8%;
  display: flex;
  box-sizing: border-box;
`;

const Copyright = styled.span`
  color: #d1d1d1;
  letter-spacing: -0.5px;
  font-size: 10px;
  font-family: 'Franklin Gothic Medium', Arial, sans-serif;
`;

const CopyrightStrong = styled.strong`
  font-weight: bold;
`;

const MicrosoftLogo = styled.img`
  height: 13px;
  opacity: 0.8;
`;

function XPBootScreen({ onComplete }) {
  const loaderRef = useRef(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!loaderRef.current) return;
    const track = loaderRef.current;
    const trackWidth = track.offsetWidth;
    const blockGroupWidth = 3 * 12 + 2 * 4; /* 3 blocks + 2 gaps */
    const minX = -blockGroupWidth;
    const maxX = trackWidth;
    let pos = minX;
    let dir = 1;

    const interval = setInterval(() => {
      pos += dir * 1;
      if (pos >= maxX) {
        pos = maxX;
        dir = -1;
      }
      if (pos <= minX) {
        pos = minX;
        dir = 1;
      }
      if (track.firstElementChild) {
        track.firstElementChild.style.transform = `translateX(${pos}px)`;
      }
    }, 10);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!onComplete) return;
    const timer = setTimeout(() => {
      setFading(true);
      /* Wait for fade-out animation to finish, then signal ready */
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 400);
    }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Wrapper $fading={fading}>
      <ContentWrapper>
        <LogoProgressbar>
          <LogoImg src="/boot/xp-logo.jpg" alt="" />
          <LoaderTrack ref={loaderRef}>
            <BlockContainer>
              <Block>
                <BlockHighlight />
              </Block>
              <Block>
                <BlockHighlight />
              </Block>
              <Block>
                <BlockHighlight />
              </Block>
            </BlockContainer>
          </LoaderTrack>
        </LogoProgressbar>
        <CopyrightsWrapper>
          <Copyright>
            Copyrights <CopyrightStrong>&copy;</CopyrightStrong> Microsoft
            Corporation
          </Copyright>
          <MicrosoftLogo src="/boot/microsoft-logo.webp" alt="Microsoft" />
        </CopyrightsWrapper>
      </ContentWrapper>
    </Wrapper>
  );
}

export default XPBootScreen;
