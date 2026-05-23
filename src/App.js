import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';

import { getBootExperience } from './app-mode';
import XPBootScreen from './XPBootScreen';

/* WinXP is imported eagerly so it mounts and fetches commissions
   while the boot screen is still visible. */
import WinXP from 'WinXP';

const DrawingsAdminPage = lazy(() => import('./admin/DrawingsAdminPage'));
const MobileSite = lazy(() => import('./mobile-site/index'));

const App = () => {
  const isAdminRoute = window.location.pathname.startsWith('/admin/drawings');
  const isLayoutRoute = window.location.pathname.startsWith('/layout');
  const [bootExperience] = useState(() =>
    getBootExperience(window.location, window.innerWidth),
  );
  const [booting, setBooting] = useState(true);

  const handleBootComplete = useCallback(() => setBooting(false), []);

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

  /* Render desktop immediately behind the boot screen overlay so
     images and API data load during the preloader animation. */
  return (
    <>
      {booting && <XPBootScreen onComplete={handleBootComplete} />}
      <WinXP enableLayoutDebug={isLayoutRoute} />
    </>
  );
};

export default App;
