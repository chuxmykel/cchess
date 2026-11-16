import { render } from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';

import PieceImage from '.';
import { defaultPieceSet } from '../../defaultPieceSet';
import { animatedStyleOf } from '../../../../testUtils/animatedValue';
import { settleAnimations } from '../../../../testUtils/pieceGestures';

const SVG = defaultPieceSet.wk;

describe('PieceImage', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('draws no glow on a piece not in check', async () => {
    const screen = await render(
      <PieceImage svg={SVG} width={50} orientation="w" />,
    );

    expect(screen.queryByTestId('danger-glow')).toBeNull();
  });

  it('makes a king in check glow red', async () => {
    const screen = await render(
      <PieceImage
        svg={SVG}
        width={50}
        orientation="w"
        inDanger
        dangerColor="red"
      />,
    );

    // A shadow on iOS; Android draws none, so there it's a drop-shadow.
    const glow = StyleSheet.flatten(
      screen.getAllByTestId('danger-glow')[0].props.style,
    );
    if (Platform.OS === 'android') {
      expect(glow.filter).toEqual([
        {
          dropShadow: expect.objectContaining({ color: 'red' }),
        },
      ]);
      expect(glow.shadowColor).toBeUndefined();
    } else {
      expect(glow).toMatchObject({ shadowColor: 'red', shadowOpacity: 1 });
      expect(glow.filter).toBeUndefined();
    }
  });

  it('stands a mated king upright, then topples it', async () => {
    const screen = await render(
      <PieceImage svg={SVG} width={50} orientation="w" inDanger />,
    );
    expect(animatedStyleOf(screen.getByTestId('sprite'))).toMatchObject({
      transform: [{ rotate: '0deg' }],
    });

    await screen.rerender(
      <PieceImage svg={SVG} width={50} orientation="w" inDanger fallen />,
    );
    await settleAnimations();

    expect(animatedStyleOf(screen.getByTestId('sprite'))).toMatchObject({
      transform: [{ rotate: '45deg' }],
    });
  });
});
