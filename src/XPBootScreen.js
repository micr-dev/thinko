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
  font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
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
  width: 200px;
  display: block;
  margin: 0 auto -12px;
`;

const MicrosoftText = styled.span`
  font-size: 18px;
  color: #fff;
`;

const Reg = styled.sup`
  font-size: 9px;
  font-weight: bold;
`;

const WindowsText = styled.span`
  font-size: 44px;
  font-weight: bold;
  color: #fff;
  display: inline;
`;

const XPText = styled.span`
  font-size: 44px;
  font-weight: bold;
  color: #ff3c00;
  display: inline;
  margin-left: 6px;
  letter-spacing: -1px;
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

const MicrosoftWatermark = styled.span`
  color: #d1d1d1;
  font-size: 10px;
  font-family: 'Franklin Gothic Medium', Arial, sans-serif;
  font-style: italic;
  font-weight: bold;
  opacity: 0.8;
`;

const FLAG_SVG = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    <linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FF5A5A"/><stop offset="100%" stop-color="#CC2222"/></linearGradient>
    <linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5ED64A"/><stop offset="100%" stop-color="#2D9A10"/></linearGradient>
    <linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5A9AFF"/><stop offset="100%" stop-color="#2244CC"/></linearGradient>
    <linearGradient id="d" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFB830"/><stop offset="100%" stop-color="#EE8800"/></linearGradient>
  </defs>
  <rect x="1" y="1" width="36" height="36" rx="3" fill="url(#a)"/>
  <rect x="43" y="1" width="36" height="36" rx="3" fill="url(#b)"/>
  <rect x="1" y="43" width="36" height="36" rx="3" fill="url(#c)"/>
  <rect x="43" y="43" width="36" height="36" rx="3" fill="url(#d)"/>
</svg>`,
)}`;

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
          <LogoImg src={FLAG_SVG} alt="" />
          <div>
            <MicrosoftText>
              Microsoft<Reg>&reg;</Reg>
            </MicrosoftText>
          </div>
          <div>
            <WindowsText>Windows</WindowsText>
            <XPText>xp</XPText>
          </div>
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
            Copyrights <CopyrightStrong>&copy;</CopyrightStrong> Microsoft Corporation
          </Copyright>
          <MicrosoftWatermark>Microsoft</MicrosoftWatermark>
        </CopyrightsWrapper>
      </ContentWrapper>
    </Wrapper>
  );
}

export default XPBootScreen;
