import React from 'react';
import styled, { keyframes } from 'styled-components';

const blockSlide = keyframes`
  0%   { transform: translateX(0); }
  100% { transform: translateX(240px); }
`;

const fadeIn = keyframes`
  0%   { opacity: 0; }
  100% { opacity: 1; }
`;

const Wrapper = styled.div`
  width: 100%;
  height: 100dvh;
  background-color: #000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 0.3s ease;
  user-select: none;
  overflow: hidden;
`;

const ContentWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 28vh 0 10vh;
  box-sizing: border-box;
`;

const LogoArea = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 28px;
`;

const XPLogo = styled.img`
  width: 220px;
  height: auto;
`;

const ProgressBarTrack = styled.div`
  width: 200px;
  height: 18px;
  border: 1px solid #b1b1b3;
  border-radius: 5px;
  display: flex;
  align-items: center;
  padding: 2px 4px;
  overflow: hidden;
`;

const BlockContainer = styled.div`
  display: flex;
  gap: 4px;
  animation: ${blockSlide} 2s ease-in-out infinite;
`;

const ProgressBlock = styled.div`
  width: 12px;
  height: 12px;
  background-color: #2c38b9;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
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
  display: flex;
  justify-content: center;
  padding: 32px 8%;
  box-sizing: border-box;
`;

const CopyrightText = styled.span`
  color: #d1d1d1;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11px;
  letter-spacing: -0.3px;
`;

const XP_LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 90" width="300" height="90">
  <defs>
    <linearGradient id="gR" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#EE3B3B"/><stop offset="100%" stop-color="#CA1414"/></linearGradient>
    <linearGradient id="gG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4BC332"/><stop offset="100%" stop-color="#299A0D"/></linearGradient>
    <linearGradient id="gB" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#55A1EE"/><stop offset="100%" stop-color="#2268D3"/></linearGradient>
    <linearGradient id="gY" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFB816"/><stop offset="100%" stop-color="#F08A00"/></linearGradient>
  </defs>
  <!-- Flag -->
  <g transform="translate(110, 2)">
    <rect width="22" height="22" rx="3" fill="url(#gR)"/>
    <rect x="26" width="22" height="22" rx="3" fill="url(#gG)"/>
    <rect y="26" width="22" height="22" rx="3" fill="url(#gB)"/>
    <rect x="26" y="26" width="22" height="22" rx="3" fill="url(#gY)"/>
  </g>
  <!-- Microsoft text -->
  <text x="150" y="70" text-anchor="middle" font-family="Frutiger, 'Segoe UI', Arial, Helvetica, sans-serif" font-size="15" fill="white">Microsoft</text>
  <!-- Windows XP text -->
  <text x="150" y="88" text-anchor="middle" font-family="Frutiger, 'Segoe UI', Arial, Helvetica, sans-serif" fill="#8AAAD4">
    <tspan font-size="12">Windows</tspan>
    <tspan font-weight="bold" font-size="15" dx="4" fill="white">XP</tspan>
  </text>
</svg>`)}`;

function XPBootScreen() {
  return (
    <Wrapper>
      <ContentWrapper>
        <LogoArea>
          <XPLogo src={XP_LOGO_SVG} alt="" />
          <ProgressBarTrack>
            <BlockContainer>
              {[0, 1, 2].map(i => (
                <ProgressBlock key={i}>
                  <BlockHighlight />
                </ProgressBlock>
              ))}
            </BlockContainer>
          </ProgressBarTrack>
        </LogoArea>
        <CopyrightsWrapper>
          <CopyrightText>Copyrights &copy; Microsoft Corporation</CopyrightText>
        </CopyrightsWrapper>
      </ContentWrapper>
    </Wrapper>
  );
}

export default XPBootScreen;
