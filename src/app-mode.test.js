import {
  getBootExperience,
  isDesktopOverride,
  MOBILE_BREAKPOINT,
  shouldUseMobileExperience,
} from './app-mode';

describe('app mode helpers', () => {
  test('detects desktop override query flag', () => {
    expect(isDesktopOverride('?desktop=1')).toBe(true);
    expect(isDesktopOverride('?foo=bar')).toBe(false);
  });

  test('keeps admin and layout routes on desktop', () => {
    expect(
      shouldUseMobileExperience({
        pathname: '/admin/drawings',
        search: '',
        width: 320,
      }),
    ).toBe(false);

    expect(
      shouldUseMobileExperience({
        pathname: '/layout',
        search: '',
        width: 320,
      }),
    ).toBe(false);
  });

  test('selects mobile at or below the breakpoint', () => {
    expect(
      shouldUseMobileExperience({
        pathname: '/',
        search: '',
        width: MOBILE_BREAKPOINT,
      }),
    ).toBe(true);
  });

  test('selects desktop above the breakpoint', () => {
    expect(
      getBootExperience(
        {
          pathname: '/',
          search: '',
        },
        MOBILE_BREAKPOINT + 1,
      ),
    ).toBe('desktop');
  });

  test('desktop override beats mobile width', () => {
    expect(
      getBootExperience(
        {
          pathname: '/',
          search: '?desktop=1',
        },
        390,
      ),
    ).toBe('desktop');
  });
});
