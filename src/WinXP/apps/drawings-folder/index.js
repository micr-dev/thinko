import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import imageIcon from 'assets/windowsIcons/307(32x32).png';
import folderOpen from 'assets/windowsIcons/337(32x32).png';
import back from 'assets/windowsIcons/back.png';
import forward from 'assets/windowsIcons/forward.png';
import up from 'assets/windowsIcons/up.png';
import search from 'assets/windowsIcons/299(32x32).png';
import dropdown from 'assets/windowsIcons/dropdown.png';
import go from 'assets/windowsIcons/290.png';
import computer from 'assets/windowsIcons/676(16x16).png';
import ImageViewer from 'WinXP/apps/image-viewer';

function DrawingsFolder({ launchApp }) {
  const [status, setStatus] = useState('loading');
  const [drawings, setDrawings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDrawings() {
      try {
        const response = await fetch('/api/drawings/public', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to load drawings folder');
        }

        const data = await response.json();
        if (!isMounted) return;
        setDrawings(data.drawings || []);
        setStatus('ready');
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.message);
        setStatus('error');
      }
    }

    loadDrawings();
    return () => {
      isMounted = false;
    };
  }, []);

  function openDrawing(drawing) {
    launchApp({
      header: {
        icon: drawing.imageUrl || imageIcon,
        title: drawing.fileName,
      },
      component: ImageViewer,
      injectProps: {
        src: drawing.imageUrl,
        title: drawing.title,
      },
      defaultSize: {
        width: Math.min(Math.max(drawing.width + 76, 420), 900),
        height: Math.min(Math.max(drawing.height + 110, 320), 760),
      },
      defaultOffset: {
        x: 220,
        y: 80,
      },
      resizable: true,
      minimized: false,
      maximized: false,
      multiInstance: true,
    });
  }

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
          <span>My Computer\\My Pictures</span>
          <img src={dropdown} alt="" />
        </div>
        <div className="address__go">
          <img src={go} alt="" />
          <span>Go</span>
        </div>
      </AddressBar>
      <Content>
        <Sidebar>
          <SidebarTitle>Picture Tasks</SidebarTitle>
          <SidebarText>
            Approved Paint submissions appear here after moderation.
          </SidebarText>
          <SidebarTitle>Folder Details</SidebarTitle>
          <SidebarText>
            {status === 'ready'
              ? `${drawings.length} published drawing${
                  drawings.length === 1 ? '' : 's'
                }`
              : 'Loading folder details...'}
          </SidebarText>
        </Sidebar>
        <MainPanel>
          <FolderHeading>
            <img src={imageIcon} alt="" />
            <div>
              <FolderTitle>My Pictures</FolderTitle>
              <FolderSubtitle>
                Approved artwork from the Paint submission queue
              </FolderSubtitle>
            </div>
          </FolderHeading>
          {status === 'loading' && <StatusText>Loading drawings...</StatusText>}
          {status === 'error' && <StatusText>{error}</StatusText>}
          {status === 'ready' && drawings.length === 0 && (
            <StatusText>No approved drawings yet.</StatusText>
          )}
          {status === 'ready' && drawings.length > 0 && (
            <Grid>
              {drawings.map(drawing => (
                <FileTile
                  key={drawing.id}
                  type="button"
                  onDoubleClick={() => openDrawing(drawing)}
                  onClick={() => undefined}
                >
                  <img
                    className="file-tile__thumb"
                    src={drawing.imageUrl || imageIcon}
                    alt=""
                  />
                  <span>{drawing.fileName}</span>
                </FileTile>
              ))}
            </Grid>
          )}
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
`;

const MainPanel = styled.div`
  flex: 1;
  min-width: 0;
  padding: 18px;
  background: #fff;
`;

const FolderHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;

  img {
    width: 48px;
    height: 48px;
  }
`;

const FolderTitle = styled.div`
  font-size: 20px;
  color: #003399;
`;

const FolderSubtitle = styled.div`
  font-size: 12px;
  color: #566f8e;
`;

const StatusText = styled.div`
  font-size: 12px;
  color: #4f6481;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px 14px;
`;

const FileTile = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  border: 1px solid transparent;
  background: transparent;
  cursor: default;
  color: #183455;
  font-size: 11px;
  text-align: center;

  &:hover {
    border-color: #b8d1f0;
    background: #eef5ff;
  }

  img {
    width: 40px;
    height: 40px;
  }

  .file-tile__thumb {
    object-fit: contain;
    padding: 2px;
    border: 1px solid #7f9db9;
    background: #fff;
    box-shadow: 1px 1px 0 rgba(255, 255, 255, 0.8) inset;
  }
`;

export default DrawingsFolder;
