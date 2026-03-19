import React from 'react';

import DrawingsAdminPage from './admin/DrawingsAdminPage';
import WinXP from 'WinXP';

const App = () => {
  const isAdminRoute = window.location.pathname.startsWith('/admin/drawings');
  const isLayoutRoute = window.location.pathname.startsWith('/layout');

  if (isAdminRoute) {
    return <DrawingsAdminPage />;
  }

  return <WinXP enableLayoutDebug={isLayoutRoute} />;
};

export default App;
