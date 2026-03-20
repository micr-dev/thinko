import React, { useEffect } from 'react';

import DrawingsAdminPage from './admin/DrawingsAdminPage';
import WinXP from 'WinXP';

const App = () => {
  const isAdminRoute = window.location.pathname.startsWith('/admin/drawings');
  const isLayoutRoute = window.location.pathname.startsWith('/layout');

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

  return <WinXP enableLayoutDebug={isLayoutRoute} />;
};

export default App;
