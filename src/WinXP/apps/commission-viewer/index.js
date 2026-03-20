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
      <Content>
        <Sidebar>
          <SidebarTitle>Picture Details</SidebarTitle>
          <SidebarText>{commission.date || 'date not provided'}</SidebarText>
          {commission.description && (
            <>
              <SidebarTitle>Description</SidebarTitle>
              <SidebarText>{commission.description}</SidebarText>
            </>
          )}
        </Sidebar>
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
              <DetailRow>
                <span className="detail__label">Artist</span>
                {commission.artistLink ? (
                  <a
                    href={commission.artistLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {artistLabel}
                  </a>
                ) : (
                  <span>{artistLabel}</span>
                )}
              </DetailRow>
              <DetailRow>
                <span className="detail__label">Date</span>
                <span>{commission.date || 'not provided'}</span>
              </DetailRow>
              {commission.description && (
                <DetailBlock>
                  <span className="detail__label">Description</span>
                  <p>{commission.description}</p>
                </DetailBlock>
              )}
            </DetailsPanel>
          </Body>
        </MainPanel>
      </Content>
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
    width: 16px;
    height: 16px;
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
    padding: 4px 6px;
    border: 1px solid #7f9db9;
    background: #fff;
  }

  .address__field span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .address__field img:first-child {
    width: 16px;
    height: 16px;
  }

  .address__field img:last-child {
    width: 9px;
    height: 5px;
    margin-left: auto;
  }

  .address__go {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #234167;
  }

  .address__go img {
    width: 16px;
    height: 16px;
  }
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
`;

const Sidebar = styled.aside`
  width: 200px;
  flex-shrink: 0;
  padding: 16px 14px;
  border-right: 1px solid rgba(0, 0, 0, 0.14);
  background: linear-gradient(180deg, #7ea5e7 0%, #c7dbff 8%, #d8e5fb 100%);
`;

const SidebarTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #0f3b87;
  margin-bottom: 6px;
`;

const SidebarText = styled.div`
  font-size: 11px;
  line-height: 1.45;
  color: #1d385d;
  margin-bottom: 14px;
  word-break: break-word;
`;

const MainPanel = styled.div`
  flex: 1;
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 220px);
  gap: 18px;
  overflow: hidden;

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
  }
`;

const PreviewArea = styled.div`
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
    min-width: 0;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  img {
    max-width: 100%;
    max-height: 100%;
    width: 100%;
    height: auto;
    object-fit: contain;
    object-position: center;
    display: block;
  }
`;

const DetailsPanel = styled.aside`
  min-height: 0;
  min-width: 0;
  padding: 14px;
  border: 1px solid #c6d5e8;
  background: #f8fbff;
  color: #1d385d;
  font-size: 12px;
  overflow: auto;

  @media (max-width: 760px) {
    max-height: 180px;
  }
`;

const DetailRow = styled.div`
  display: grid;
  gap: 4px;
  margin-bottom: 14px;

  .detail__label {
    font-size: 11px;
    font-weight: 700;
    color: #476685;
    text-transform: uppercase;
  }

  a {
    color: #124db5;
    text-decoration: underline;
    word-break: break-word;
  }
`;

const DetailBlock = styled.div`
  display: grid;
  gap: 4px;

  .detail__label {
    font-size: 11px;
    font-weight: 700;
    color: #476685;
    text-transform: uppercase;
  }

  p {
    margin: 0;
    line-height: 1.45;
    white-space: pre-wrap;
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
