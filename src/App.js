import React, { Suspense, lazy, useEffect, useState } from 'react';

import { getBootExperience } from './app-mode';

const DrawingsAdminPage = lazy(() => import('./admin/DrawingsAdminPage'));
const MobileSite = lazy(() => import('./mobile-site/index'));
const WinXP = lazy(() => import('WinXP'));

function RootLoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#245edb',
        color: '#fff',
        fontFamily: '"Trebuchet MS", sans-serif',
        fontSize: '14px',
      }}
    >
      Loading thinko...
    </div>
  );
}

const App = () => {
  const isAdminRoute = window.location.pathname.startsWith('/admin/drawings');
  const isLayoutRoute = window.location.pathname.startsWith('/layout');
  const [bootExperience] = useState(() =>
    getBootExperience(window.location, window.innerWidth),
  );

  useEffect(() => {
    if (isAdminRoute) {
      document.title = 'thinko admin';
      return;
    }

    if (isLayoutRoute) {
      document.title = 'thinko layout';
      return;
    }

    document.title = 'thinko';
  }, [isAdminRoute, isLayoutRoute]);

  if (isAdminRoute) {
    return (
      <Suspense fallback={<RootLoadingScreen />}>
        <DrawingsAdminPage />
      </Suspense>
    );
  }

  if (bootExperience === 'mobile') {
    return (
      <Suspense fallback={<RootLoadingScreen />}>
        <MobileSite />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<RootLoadingScreen />}>
      <WinXP enableLayoutDebug={isLayoutRoute} />
    </Suspense>
  );
};

export default App;
