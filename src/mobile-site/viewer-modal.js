import React, { useEffect } from 'react';
import styled from 'styled-components';

import pictureIcon from 'assets/windowsIcons/307(32x32).png';
import XpPanel from './xp-panel';

function ViewerModal({ item, onClose }) {
  useEffect(() => {
    if (!item) return undefined;

    const previousOverflow = document.body.style.overflow;
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <Overlay
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <ViewerWindow
        title={item.title || 'Preview'}
        icon={item.icon || pictureIcon}
        onClose={onClose}
      >
        <ViewerBody>
          <Figure>
            <img src={item.imageUrl} alt={item.title || 'Preview'} />
          </Figure>
          {item.metadata?.length ? (
            <MetaList>
              {item.metadata.map(entry => (
                <span key={entry}>{entry}</span>
              ))}
            </MetaList>
          ) : null}
          {item.description ? (
            <Description>{item.description}</Description>
          ) : null}
          {item.externalLink ? (
            <ViewerLink
              href={item.externalLink.href}
              target="_blank"
              rel="noreferrer"
            >
              {item.externalLink.label}
            </ViewerLink>
          ) : null}
        </ViewerBody>
      </ViewerWindow>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(6, 17, 35, 0.68);
  backdrop-filter: blur(6px);
`;

const ViewerWindow = styled(XpPanel)`
  width: min(960px, 100%);
  max-height: min(92vh, 860px);

  .xp-panel__body {
    overflow: auto;
  }
`;

const ViewerBody = styled.div`
  padding: 14px;
`;

const Figure = styled.figure`
  margin: 0;
  display: grid;
  place-items: center;
  min-height: 220px;
  background: linear-gradient(180deg, #fbfdff 0%, #dce8f8 100%);
  border: 1px solid #7f9db9;

  img {
    display: block;
    max-width: 100%;
    max-height: 65vh;
    object-fit: contain;
  }
`;

const MetaList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  font-size: 12px;
  color: #325170;

  span {
    padding: 4px 8px;
    border: 1px solid #b5c7de;
    background: #f2f7fc;
  }
`;

const Description = styled.p`
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: #22364f;
  white-space: pre-wrap;
`;

const ViewerLink = styled.a`
  display: inline-flex;
  margin-top: 12px;
  color: #0047b2;
  text-decoration: underline;
  font-size: 13px;
`;

export default ViewerModal;
