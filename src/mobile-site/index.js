import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import FormattedDocument from 'components/FormattedDocument';
import textFileIcon from 'assets/windowsIcons/character-txt-icon.png';
import pictureIcon from 'assets/windowsIcons/307(32x32).png';
import paintIcon from 'assets/windowsIcons/680(32x32).png';
import commissionIcon from 'assets/windowsIcons/heart.png';
import folderIcon from 'assets/windowsIcons/folder.png';
import userIcon from 'assets/windowsIcons/user.png';
import { XP_WALLPAPER } from 'WinXP/wallpaper-registry';
import { characterDocuments } from 'WinXP/apps/character-documents';
import MobilePaintStudio from './mobile-paint-studio';
import ViewerModal from './viewer-modal';
import XpPanel from './xp-panel';

const SECTIONS = [
  { id: 'about', label: 'About', icon: textFileIcon },
  { id: 'drawings', label: 'Drawings', icon: pictureIcon },
  { id: 'commissions', label: 'Commissions', icon: commissionIcon },
  { id: 'paint', label: 'Paint', icon: paintIcon },
];

function MobileSite() {
  const [activeSection, setActiveSection] = useState('about');
  const [activeDocumentId, setActiveDocumentId] = useState(
    characterDocuments[0]?.id || null,
  );
  const [viewerItem, setViewerItem] = useState(null);
  const drawingsState = useRemoteCollection('/api/drawings/public', 'drawings');
  const commissionsState = useRemoteCollection(
    '/api/commissions/public',
    'commissions',
  );
  const activeDocument =
    characterDocuments.find(document => document.id === activeDocumentId) ||
    characterDocuments[0];
  const sectionBadges = useMemo(
    () => ({
      drawings:
        drawingsState.status === 'ready'
          ? String(drawingsState.items.length)
          : '',
      commissions:
        commissionsState.status === 'ready'
          ? String(commissionsState.items.length)
          : '',
    }),
    [
      commissionsState.items.length,
      commissionsState.status,
      drawingsState.items.length,
      drawingsState.status,
    ],
  );

  return (
    <>
      <Screen>
        <Wallpaper />
        <ColorWash />
        <Shell>
          <HeroWindow title="thinko" icon={userIcon}>
            <HeroBody>
              <HeroText>
                <HeroTitle>thinko</HeroTitle>
                <HeroSubtitle>
                  A careless mistake made in thinking.
                </HeroSubtitle>
                <HeroCopy>
                  this website is made to be seen on desktop first.
                </HeroCopy>
              </HeroText>
            </HeroBody>
          </HeroWindow>

          <NavWindow title="navigation" icon={folderIcon}>
            <NavGrid>
              {SECTIONS.map(section => (
                <NavButton
                  key={section.id}
                  type="button"
                  $active={activeSection === section.id}
                  onClick={() => setActiveSection(section.id)}
                >
                  <img src={section.icon} alt="" />
                  <span>{section.label}</span>
                  {sectionBadges[section.id] ? (
                    <strong>{sectionBadges[section.id]}</strong>
                  ) : null}
                </NavButton>
              ))}
            </NavGrid>
          </NavWindow>

          {activeSection === 'about' ? (
            <ContentWindow title="about thinko" icon={textFileIcon}>
              <AboutWrap>
                <DocumentTabs>
                  {characterDocuments.map(document => (
                    <DocumentTab
                      key={document.id}
                      type="button"
                      $active={document.id === activeDocument.id}
                      onClick={() => setActiveDocumentId(document.id)}
                    >
                      <img src={textFileIcon} alt="" />
                      <span>{document.fileName}</span>
                    </DocumentTab>
                  ))}
                </DocumentTabs>
                <DocumentSurface>
                  <DocumentHeading>{activeDocument.fileName}</DocumentHeading>
                  <DocumentBody text={activeDocument.body} wordWrap={true} />
                </DocumentSurface>
              </AboutWrap>
            </ContentWindow>
          ) : null}

          {activeSection === 'drawings' ? (
            <ContentWindow title="drawings" icon={pictureIcon}>
              <SectionBody>
                <SectionIntro>
                  Approved Paint submissions from the same queue the desktop
                  uses.
                </SectionIntro>
                <CollectionState
                  state={drawingsState}
                  emptyMessage="No approved drawings yet."
                  renderItems={() => (
                    <ThumbGrid>
                      {drawingsState.items.map(drawing => (
                        <ThumbCard
                          key={drawing.id}
                          type="button"
                          onClick={() =>
                            setViewerItem({
                              title: drawing.title || drawing.fileName,
                              imageUrl: drawing.imageUrl,
                              icon: pictureIcon,
                              metadata: [
                                drawing.fileName,
                                formatDate(drawing.publishedAt),
                                `${drawing.width} x ${drawing.height}`,
                              ].filter(Boolean),
                            })
                          }
                        >
                          <ThumbFrame>
                            <img
                              src={drawing.imageUrl}
                              alt={drawing.title || drawing.fileName}
                              loading="lazy"
                            />
                          </ThumbFrame>
                          <ThumbText>
                            {drawing.title || drawing.fileName}
                          </ThumbText>
                        </ThumbCard>
                      ))}
                    </ThumbGrid>
                  )}
                />
              </SectionBody>
            </ContentWindow>
          ) : null}

          {activeSection === 'commissions' ? (
            <ContentWindow title="commissions" icon={commissionIcon}>
              <SectionBody>
                <SectionIntro>
                  Published commission work, with the same artist metadata
                  exposed on desktop.
                </SectionIntro>
                <CollectionState
                  state={commissionsState}
                  emptyMessage="No commissions published yet."
                  renderItems={() => (
                    <ThumbGrid>
                      {commissionsState.items.map(commission => (
                        <ThumbCard
                          key={commission.id}
                          type="button"
                          onClick={() =>
                            setViewerItem({
                              title: commission.artistName || 'unknown artist',
                              imageUrl: commission.imageUrl,
                              icon: commission.iconUrl || commissionIcon,
                              metadata: [
                                commission.date
                                  ? `date: ${commission.date}`
                                  : '',
                                `${commission.width} x ${commission.height}`,
                              ].filter(Boolean),
                              description: commission.description,
                              externalLink: commission.artistLink
                                ? {
                                    href: commission.artistLink,
                                    label: 'open artist link',
                                  }
                                : null,
                            })
                          }
                        >
                          <ThumbFrame>
                            <img
                              src={commission.imageUrl}
                              alt={commission.artistName || 'commission'}
                              loading="lazy"
                            />
                          </ThumbFrame>
                          <ThumbText>
                            {commission.artistName || 'unknown artist'}
                          </ThumbText>
                          <ThumbMeta>
                            {commission.date || 'date unknown'}
                          </ThumbMeta>
                        </ThumbCard>
                      ))}
                    </ThumbGrid>
                  )}
                />
              </SectionBody>
            </ContentWindow>
          ) : null}

          {activeSection === 'paint' ? (
            <ContentWindow title="paint studio" icon={paintIcon}>
              <MobilePaintStudio />
            </ContentWindow>
          ) : null}
        </Shell>
      </Screen>
      <ViewerModal item={viewerItem} onClose={() => setViewerItem(null)} />
    </>
  );
}

function CollectionState({ state, emptyMessage, renderItems }) {
  if (state.status === 'loading') {
    return <StatusCard>loading...</StatusCard>;
  }

  if (state.status === 'error') {
    return <StatusCard>{state.error}</StatusCard>;
  }

  if (state.items.length === 0) {
    return <StatusCard>{emptyMessage}</StatusCard>;
  }

  return renderItems();
}

function useRemoteCollection(url, key) {
  const [state, setState] = useState({
    status: 'loading',
    items: [],
    error: '',
  });

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load mobile content');
        }

        const payload = await response.json();
        if (!isMounted) return;

        setState({
          status: 'ready',
          items: Array.isArray(payload[key]) ? payload[key] : [],
          error: '',
        });
      } catch (error) {
        if (!isMounted) return;

        setState({
          status: 'error',
          items: [],
          error: (error.message || 'Failed to load content').toLowerCase(),
        });
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [key, url]);

  return state;
}

function formatDate(value) {
  if (!value) return '';

  try {
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

const Screen = styled.div`
  position: relative;
  min-height: 100%;
  overflow-x: hidden;
  color: #10253f;
  font-family: Tahoma, 'Noto Sans TC', sans-serif;

  button,
  input,
  textarea,
  select {
    font: inherit;
  }
`;

const Wallpaper = styled.div`
  position: fixed;
  inset: 0;
  background: url(${XP_WALLPAPER.url}) center / cover no-repeat;
`;

const ColorWash = styled.div`
  position: fixed;
  inset: 0;
  background: linear-gradient(
      180deg,
      rgba(248, 252, 255, 0.2) 0%,
      rgba(11, 39, 88, 0.28) 100%
    ),
    radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.28) 0%,
      transparent 34%
    );
`;

const Shell = styled.main`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 16px;
  width: min(1120px, 100%);
  padding: max(16px, env(safe-area-inset-top, 0px) + 12px) 14px
    max(18px, env(safe-area-inset-bottom, 0px) + 12px);
  margin: 0 auto;
`;

const HeroWindow = styled(XpPanel)`
  .xp-panel__body {
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.92) 0%,
        rgba(231, 241, 255, 0.96) 100%
      ),
      url('/patterns/Property 1=7.svg') repeat;
  }
`;

const HeroBody = styled.div`
  display: grid;
  gap: 10px;
  padding: 18px;
`;

const HeroText = styled.div`
  display: grid;
  gap: 8px;
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-size: clamp(28px, 7vw, 44px);
  line-height: 0.95;
  letter-spacing: -0.04em;
  color: #0b2c68;
`;

const HeroSubtitle = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  text-transform: lowercase;
  color: #1f4277;
`;

const HeroCopy = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #355578;
`;

const NavWindow = styled(XpPanel)``;

const NavGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 12px;
`;

const NavButton = styled.button`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  min-height: 58px;
  padding: 10px 12px;
  border: 1px solid ${({ $active }) => ($active ? '#0a246a' : '#95acc8')};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, #0c47a6 0%, #1d72d8 100%)'
      : 'linear-gradient(180deg, #ffffff 0%, #e7effc 100%)'};
  color: ${({ $active }) => ($active ? '#fff' : '#21456f')};
  text-align: left;
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.82);

  img {
    width: 28px;
    height: 28px;
  }

  span {
    font-size: 13px;
    font-weight: 700;
  }

  strong {
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    line-height: 22px;
    font-size: 11px;
    text-align: center;
  }
`;

const ContentWindow = styled(XpPanel)``;

const AboutWrap = styled.div`
  display: grid;
`;

const DocumentTabs = styled.div`
  display: grid;
  gap: 8px;
  padding: 14px;
  border-bottom: 1px solid #c2d0e2;

  @media (min-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const DocumentTab = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid ${({ $active }) => ($active ? '#0a246a' : '#95acc8')};
  background: ${({ $active }) => ($active ? '#dbe8fb' : '#fff')};
  color: #24466f;
  text-align: left;

  img {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  span {
    min-width: 0;
    font-size: 12px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const DocumentSurface = styled.div`
  padding: 16px;
`;

const DocumentHeading = styled.div`
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #193d71;
`;

const DocumentBody = styled(FormattedDocument)`
  font-size: 15px;
  line-height: 1.8;
  color: #1e314d;

  .formatted-document__line {
    min-height: 20px;
  }
`;

const SectionBody = styled.div`
  padding: 16px;
`;

const SectionIntro = styled.p`
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.6;
  color: #304f72;
`;

const StatusCard = styled.div`
  padding: 18px;
  border: 1px solid #a7bdd7;
  background: #f5f8fd;
  font-size: 13px;
  color: #325170;
`;

const ThumbGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
`;

const ThumbCard = styled.button`
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 1px solid #93abc8;
  background: linear-gradient(180deg, #ffffff 0%, #edf3fb 100%);
  text-align: left;
  color: #1d385a;
`;

const ThumbFrame = styled.div`
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  border: 1px solid #7f9db9;
  background: #fff;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
`;

const ThumbText = styled.div`
  font-size: 12px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ThumbMeta = styled.div`
  font-size: 11px;
  color: #4d6b8f;
`;

export default MobileSite;
