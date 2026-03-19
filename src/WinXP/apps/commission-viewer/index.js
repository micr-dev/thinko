import React from 'react';
import styled from 'styled-components';

import pictureIcon from 'assets/windowsIcons/307(32x32).png';

function CommissionViewer({ commission }) {
  if (!commission) {
    return <EmptyState>Commission details are unavailable.</EmptyState>;
  }

  return (
    <Shell>
      <PreviewPanel>
        <img
          src={commission.imageUrl || pictureIcon}
          alt={commission.artistName}
          draggable={false}
        />
      </PreviewPanel>
      <MetaPanel>
        <MetaTitle>{commission.artistName}</MetaTitle>
        <MetaRow>
          <span className="meta__label">date</span>
          <span>{commission.date}</span>
        </MetaRow>
        <MetaRow>
          <span className="meta__label">artist</span>
          {commission.artistLink ? (
            <a href={commission.artistLink} target="_blank" rel="noreferrer">
              {commission.artistLink}
            </a>
          ) : (
            <span>no link provided</span>
          )}
        </MetaRow>
        {commission.description && (
          <Description>{commission.description}</Description>
        )}
      </MetaPanel>
    </Shell>
  );
}

const Shell = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  background: linear-gradient(180deg, #f6fbff 0%, #dbe6f4 100%);
`;

const PreviewPanel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border: 1px solid #7f9db9;
    background: #fff;
    box-shadow: 0 12px 22px rgba(17, 33, 56, 0.16);
  }
`;

const MetaPanel = styled.aside`
  padding: 18px 16px;
  border-left: 1px solid #b6c6da;
  background: linear-gradient(180deg, #eef5ff 0%, #d4e0ef 100%);
  color: #1d3552;
  font-size: 12px;
`;

const MetaTitle = styled.div`
  margin-bottom: 14px;
  font-size: 18px;
  color: #0c3f86;
`;

const MetaRow = styled.div`
  display: grid;
  gap: 4px;
  margin-bottom: 12px;

  .meta__label {
    font-size: 11px;
    font-weight: 700;
    color: #476685;
    text-transform: uppercase;
  }

  a {
    color: #124db5;
    word-break: break-word;
  }
`;

const Description = styled.div`
  white-space: pre-wrap;
  line-height: 1.45;
  color: #304f70;
`;

const EmptyState = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f6fbff 0%, #dbe6f4 100%);
  color: #35506d;
  font-size: 12px;
`;

export default CommissionViewer;
