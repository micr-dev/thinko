import React, { Suspense, lazy, useEffect, useState } from 'react';

import { getBootExperience } from './app-mode';
import XPBootScreen from './XPBootScreen';

const DrawingsAdminPage = lazy(() => import('./admin/DrawingsAdminPage'));
const MobileSite = lazy(() => import('./mobile-site/index'));
const WinXP = lazy(() => import('WinXP'));

const BOOT_DURATION = 3000;

const App = () => {
  const isAdminRoute = window.location.pathname.startsWith('/admin/drawings');
  const isLayoutRoute = window.location.pathname.startsWith('/layout');
  const [bootExperience] = useState(() =>
    getBootExperience(window.location, window.innerWidth),
  );
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), BOOT_DURATION);
    return () => clearTimeout(timer);
  }, []);

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

  if (booting) {
    return <XPBootScreen />;
  }

  if (isAdminRoute) {
    return (
      <Suspense fallback={<XPBootScreen />}>
        <DrawingsAdminPage />
      </Suspense>
    );
  }

  if (bootExperience === 'mobile') {
    return (
      <Suspense fallback={<XPBootScreen />}>
        <MobileSite />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<XPBootScreen />}>
      <WinXP enableLayoutDebug={isLayoutRoute} />
    </Suspense>
  );
};

export default App;
