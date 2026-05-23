import {
  getInteractionFocusTarget,
  restoreInteractionFocus,
} from './useElementResize';

describe('useElementResize focus helpers', () => {
  test('tracks focus only for elements inside the active window', () => {
    document.body.innerHTML = '';

    const container = document.createElement('div');
    const insideButton = document.createElement('button');
    const outsideButton = document.createElement('button');

    insideButton.type = 'button';
    outsideButton.type = 'button';
    container.appendChild(insideButton);
    document.body.append(container, outsideButton);

    insideButton.focus();
    expect(
      getInteractionFocusTarget(container, document.activeElement),
    ).toBe(insideButton);

    outsideButton.focus();
    expect(
      getInteractionFocusTarget(container, document.activeElement),
    ).toBe(null);
  });

  test('restores focus to the previously active control', () => {
    document.body.innerHTML = '';

    const previousButton = document.createElement('button');
    const currentButton = document.createElement('button');

    previousButton.type = 'button';
    currentButton.type = 'button';
    document.body.append(previousButton, currentButton);

    previousButton.focus();
    currentButton.focus();

    restoreInteractionFocus(previousButton);

    expect(document.activeElement).toBe(previousButton);
  });
});
