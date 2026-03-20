import React from 'react';
import styled from 'styled-components';

import pictureIcon from 'assets/windowsIcons/307(32x32).png';
import folderOpen from 'assets/windowsIcons/337(32x32).png';
import back from 'assets/windowsIcons/back.png';
import forward from 'assets/windowsIcons/forward.png';
import up from 'assets/windowsIcons/up.png';
import search from 'assets/windowsIcons/299(32x32).png';
import computer from 'assets/windowsIcons/676(16x16).png';
import dropdown from 'assets/windowsIcons/dropdown.png';
import go from 'assets/windowsIcons/290.png';

function CommissionViewer({ commission }) {
  if (!commission) {
    return <EmptyState>Commission details are unavailable.</EmptyState>;
  }

  const artistLabel = commission.artistName || 'unknown artist';

  return (
    <Shell>
      <Toolbar>
        <div className="toolbar__button toolbar__button--disabled">
          <img src={back} alt="" />
          <span>Back</span>
        </div>
        <div className="toolbar__button toolbar__button--disabled">
          <img src={forward} alt="" />
        </div>
        <div className="toolbar__button">
          <img src={up} alt="" />
        </div>
        <div className="toolbar__divider" />
        <div className="toolbar__button">
          <img src={search} alt="" />
          <span>Search</span>
        </div>
        <div className="toolbar__button">
          <img src={folderOpen} alt="" />
          <span>Folders</span>
        </div>
      </Toolbar>
      <AddressBar>
        <div className="address__label">Address</div>
        <div className="address__field">
          <img src={computer} alt="" />
          <span>{`My Computer\\Commissions\\${artistLabel}`}</span>
          <img src={dropdown} alt="" />
        </div>
        <div className="address__go">
          <img src={go} alt="" />
          <span>Go</span>
        </div>
      </AddressBar>
      <MainPanel>
        <Heading>
          <img src={pictureIcon} alt="" />
          <div>
            <Title>{artistLabel}</Title>
            <Subtitle>commission details</Subtitle>
          </div>
        </Heading>
        <Body>
          <PreviewArea>
            <div className="preview__viewport">
              <img
                src={commission.imageUrl || pictureIcon}
                alt={artistLabel}
                draggable={false}
              />
            </div>
          </PreviewArea>
          <DetailsPanel>
            <DetailMeta>
              <span>{commission.date || 'date not provided'}</span>
              <span>
                {' - by '}
                {commission.artistLink ? (
                  <a
                    href={commission.artistLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {artistLabel}
                  </a>
                ) : (
                  artistLabel
                )}
              </span>
            </DetailMeta>
            {commission.description && (
              <DetailBlock>
                <p>{commission.description}</p>
              </DetailBlock>
            )}
          </DetailsPanel>
        </Body>
      </MainPanel>
    </Shell>
  );
}

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(to right, #edede5 0%, #ede8cd 100%);
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  background: #f3f0e2;

  .toolbar__button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0 8px;
    border: 1px solid transparent;
    font-size: 11px;
    background: transparent;
  }

  .toolbar__button img {
    width: 22px;
    height: 22px;
  }

  .toolbar__button--disabled {
    opacity: 0.45;
  }

  .toolbar__divider {
    width: 1px;
    height: 22px;
    background: rgba(0, 0, 0, 0.14);
    margin: 0 4px;
  }
`;

const AddressBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #efede1;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  font-size: 11px;

  .address__label {
    color: #444;
  }

  .address__field {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 0 6px;
    border: 1px solid #7f9db9;
    background: #fff;
    position: relative;
  }

  .address__field span {
    position: absolute;
    left: 22px;
    right: 20px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .address__field img:first-child {
    width: 14px;
    height: 14px;
  }

  .address__field img:last-child {
    width: 15px;
    height: 15px;
    position: absolute;
    right: 1px;
  }

  .address__go {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #234167;
    height: 100%;
    padding: 0 10px 0 5px;
  }

  .address__go img {
    height: 95%;
    width: auto;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
`;

const MainPanel = styled.div`
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 18px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Heading = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;

  img {
    width: 48px;
    height: 48px;
  }
`;

const Title = styled.div`
  font-size: 20px;
  color: #003399;
`;

const Subtitle = styled.div`
  font-size: 12px;
  color: #566f8e;
  text-transform: lowercase;
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
`;

const PreviewArea = styled.div`
  flex: 1;
  max-height: 100%;
  min-height: 0;
  min-width: 0;
  border: 1px solid #7f9db9;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: hidden;

  .preview__viewport {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    min-width: 0;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    object-position: center;
    display: block;
  }
`;

const DetailsPanel = styled.aside`
  flex-shrink: 0;
  padding: 8px 10px 0;
  color: #1d385d;
  font-size: 12px;
`;

const DetailMeta = styled.div`
  font-size: 12px;
  color: #35506d;
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: anywhere;

  a {
    color: inherit;
    text-decoration: underline;
  }
`;

const DetailBlock = styled.div`
  margin-top: 6px;

  p {
    margin: 0;
    line-height: 1.5;
    white-space: pre-wrap;
    color: #35506d;
  }
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
