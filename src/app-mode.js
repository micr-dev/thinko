export const MOBILE_BREAKPOINT = 820;

export function isDesktopOverride(search = '') {
  const params = new URLSearchParams(search);
  return params.get('desktop') === '1';
}

export function shouldUseMobileExperience({
  pathname = '/',
  search = '',
  width = 0,
}) {
  if (
    pathname.startsWith('/admin/drawings') ||
    pathname.startsWith('/layout') ||
    isDesktopOverride(search)
  ) {
    return false;
  }

  return Number(width) <= MOBILE_BREAKPOINT;
}

export function getBootExperience(locationLike, width) {
  return shouldUseMobileExperience({
    pathname: locationLike?.pathname,
    search: locationLike?.search,
    width,
  })
    ? 'mobile'
    : 'desktop';
}
