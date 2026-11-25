import { fireEvent, render } from '@testing-library/react-native';
import { processColor } from 'react-native';

import TimeGraph from '.';
import { lightTheme } from '../../theme';

const TIMES = [0, 0, 12_000, 3_000, 40_000, 2_000];
const COLORS = ['w', 'b', 'w', 'b', 'w', 'b'] as const;

async function renderGraph() {
  const onSelect = jest.fn();
  const screen = await render(
    <TimeGraph
      times={TIMES}
      colors={[...COLORS]}
      side="w"
      index={2}
      slow={4}
      hasty={5}
      onSelect={onSelect}
    />,
  );
  await fireEvent(screen.getByTestId('time-graph'), 'layout', {
    nativeEvent: { layout: { width: 300, height: 44 } },
  });
  return { screen, onSelect };
}

describe('TimeGraph', () => {
  it("draws a bar a move, the side's in the accent and the called-out moves set off", async () => {
    const { screen } = await renderGraph();
    const fill = (i: number) =>
      screen.getByTestId(`time-graph-bar-${i}`).props.fill;
    const { colors } = lightTheme;
    // react-native-svg keeps a fill as a processed color.
    const as = (color: string) => ({ type: 0, payload: processColor(color) });

    expect(fill(2)).toEqual(as(colors.accent));
    expect(fill(3)).toEqual(as(colors.textFaint));
    expect(fill(4)).toEqual(as(colors.moveClass.inaccuracy));
    expect(fill(5)).toEqual(as(colors.moveClass.blunder));
    // The longest the tallest.
    expect(screen.getByTestId('time-graph-bar-4').props.height).toBeGreaterThan(
      screen.getByTestId('time-graph-bar-2').props.height,
    );
    expect(screen.getByTestId('time-graph-cursor')).toBeTruthy();
  });

  it('picks the move tapped', async () => {
    const { screen, onSelect } = await renderGraph();

    await fireEvent(screen.getByTestId('time-graph'), 'responderGrant', {
      nativeEvent: { locationX: 160 },
    });

    expect(onSelect).toHaveBeenCalledWith(3);
  });
});
