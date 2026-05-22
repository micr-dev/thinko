import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

/* Progress bar blocks slide from left to right, wrapping around */
const blockSlide = keyframes`
  0%   { transform: translateX(0); }
  100% { transform: translateX(calc(100% + 40px)); }
`;

/* Subtle fade-in on mount */
const fadeIn = keyframes`
  0%   { opacity: 0; }
  100% { opacity: 1; }
`;

const Wrapper = styled.div`
  width: 100vw;
  height: 100dvh;
  background-color: #000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 0.2s ease;
  user-select: none;
  overflow: hidden;
  cursor: default;
  font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
`;

const Center = styled.div`
  width: 50%;
  max-width: 380px;
  text-align: center;
  line-height: 1;
`;

const LogoImg = styled.img`
  width: 70%;
  display: block;
  margin: 0 auto -28px;
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
  position: relative;
  width: 70%;
  max-height: 20px;
  height: 3vh;
  padding: 3px 2px;
  margin: 10% auto 5%;
  border: 1px solid #999;
  border-radius: 4px;
  overflow: hidden;
`;

const BlockContainer = styled.div`
  display: flex;
  gap: 2px;
  animation: ${blockSlide} 1.6s ease-in-out infinite;
`;

const Block = styled.div`
  width: 8px;
  height: calc(3vh - 6px);
  max-height: 12px;
  background: linear-gradient(
    #7b9cf1 0%,
    #708cf1 40%,
    #3355cc 70%,
    #2838c7 100%
  );
  flex-shrink: 0;
`;

const BottomRow = styled.div`
  position: absolute;
  bottom: 12.5%;
  left: 0;
  right: 0;
  padding: 0 7.5%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
`;

const Copyright = styled.span`
  color: #bbb;
  font-size: 11px;
  font-family: Arial, sans-serif;
`;

const MicrosoftWatermark = styled.span`
  color: #bbb;
  font-size: 11px;
  font-family: Arial, sans-serif;
  font-weight: bold;
  font-style: italic;
`;

/* Minimal inline SVG of the Windows XP flag — just the 4 color squares */
const FLAG_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="200">
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
</svg>`)}`;

function XPBootScreen() {
  const loaderRef = useRef(null);

  useEffect(() => {
    if (!loaderRef.current) return;
    const container = loaderRef.current;
    const width = container.offsetWidth;

    let pos = 0;
    const speed = 1;
    const interval = setInterval(() => {
      pos += speed;
      if (pos >= width) pos = 0;
      if (container.firstElementChild) {
        container.firstElementChild.style.transform = `translateX(${pos}px)`;
      }
    }, 10);

    return () => clearInterval(interval);
  }, []);

  return (
    <Wrapper>
      <Center>
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
            <Block />
            <Block />
            <Block />
          </BlockContainer>
        </LoaderTrack>
      </Center>
      <BottomRow>
        <Copyright>Copyright &copy; Microsoft Corporation</Copyright>
        <MicrosoftWatermark>Microsoft</MicrosoftWatermark>
      </BottomRow>
    </Wrapper>
  );
}

export default XPBootScreen;
