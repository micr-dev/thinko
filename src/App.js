import React, { Suspense, lazy, useEffect, useState } from 'react';

import { getBootExperience } from './app-mode';
import RootSkeleton from './RootSkeleton';

const DrawingsAdminPage = lazy(() => import('./admin/DrawingsAdminPage'));
const MobileSite = lazy(() => import('./mobile-site/index'));
const WinXP = lazy(() => import('WinXP'));

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
      <Suspense fallback={<RootSkeleton />}>
        <DrawingsAdminPage />
      </Suspense>
    );
  }

  if (bootExperience === 'mobile') {
    return (
      <Suspense fallback={<RootSkeleton />}>
        <MobileSite />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<RootSkeleton />}>
      <WinXP enableLayoutDebug={isLayoutRoute} />
    </Suspense>
  );
};

export default App;
