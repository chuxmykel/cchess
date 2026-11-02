import { render } from '@testing-library/react-native';

import PieceImage from '.';
import { animatedStyleOf } from '../../../testUtils/animatedValue';
import { settleAnimations } from '../../../testUtils/pieceGestures';

describe('PieceImage', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('draws no glow on a piece not in check', async () => {
    const screen = await render(
      <PieceImage id="wk" width={50} orientation="w" />,
    );

    expect(screen.queryByTestId('danger-glow')).toBeNull();
  });

  it('makes a king in check glow red', async () => {
    const screen = await render(
      <PieceImage id="wk" width={50} orientation="w" inDanger />,
    );

    expect(screen.getAllByTestId('danger-glow').length).toBeGreaterThan(0);
  });

  it('stands a mated king upright, then topples it', async () => {
    const screen = await render(
      <PieceImage id="wk" width={50} orientation="w" inDanger />,
    );
    expect(animatedStyleOf(screen.getByTestId('sprite'))).toMatchObject({
      transform: [{ rotate: '0deg' }],
    });

    await screen.rerender(
      <PieceImage id="wk" width={50} orientation="w" inDanger fallen />,
    );
    await settleAnimations();

    expect(animatedStyleOf(screen.getByTestId('sprite'))).toMatchObject({
      transform: [{ rotate: '45deg' }],
    });
  });
});
