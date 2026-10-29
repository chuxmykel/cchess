import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import EarlierPositionOverlay from './EarlierPositionOverlay';
import { settleAnimations } from '../../testUtils/pieceGestures';

describe('EarlierPositionOverlay', () => {
  const width = 400;
  const EARLIER = '4k3/8/8/8/4P3/8/8/4K3 w - - 0 1';
  const LIVE = '4k3/8/8/4P3/8/8/8/4K3 b - - 0 1';

  beforeEach(() => jest.useFakeTimers());

  // How see-through the overlay is drawn: 1 shown, 0 not.
  function opacityOf(screen: Awaited<ReturnType<typeof render>>) {
    return StyleSheet.flatten(screen.root.props.style).opacity ?? 1;
  }
  afterEach(() => jest.useRealTimers());

  function overlay(props: { fen: string; visible: boolean; animate: boolean }) {
    return <EarlierPositionOverlay width={width} orientation="w" {...props} />;
  }

  it('stays up, stepping on to the live position, until its pieces are there', async () => {
    const screen = await render(
      overlay({ fen: EARLIER, visible: true, animate: true }),
    );

    await screen.rerender(
      overlay({ fen: LIVE, visible: false, animate: true }),
    );
    expect(opacityOf(screen)).toBe(1);
    // Not in the way of the live board meanwhile.
    expect(screen.queryByTestId('earlier-position')).toBeNull();

    await settleAnimations();
    expect(opacityOf(screen)).toBe(0);
  });

  it('goes at once without animations', async () => {
    const screen = await render(
      overlay({ fen: EARLIER, visible: true, animate: false }),
    );

    await screen.rerender(
      overlay({ fen: LIVE, visible: false, animate: false }),
    );

    expect(opacityOf(screen)).toBe(0);
  });
});
