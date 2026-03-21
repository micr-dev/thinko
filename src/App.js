import React, { useEffect, useState } from 'react';

import DrawingsAdminPage from './admin/DrawingsAdminPage';
import MobileSite from './mobile-site/index';
import { getBootExperience } from './app-mode';
import WinXP from 'WinXP';

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
    return <DrawingsAdminPage />;
  }

  if (bootExperience === 'mobile') {
    return <MobileSite />;
  }

  return <WinXP enableLayoutDebug={isLayoutRoute} />;
};

export default App;
