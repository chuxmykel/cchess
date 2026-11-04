import { fireEvent, render } from '@testing-library/react-native';

import EngineLines from '.';
import { EngineAnalysis } from '../../hooks/useEngineAnalysis';

const THINKING: EngineAnalysis = {
  status: 'thinking',
  depth: 16,
  lines: [
    {
      score: { kind: 'cp', cp: 34 },
      formatted: '+0.34',
      sans: ['e4', 'e5', 'Nf3'],
      moves: [
        { label: '1.', san: 'e4' },
        { label: null, san: 'e5' },
        { label: '2.', san: 'Nf3' },
      ],
      pv: ['e2e4', 'e7e5', 'g1f3'],
    },
    {
      score: { kind: 'cp', cp: 20 },
      formatted: '+0.20',
      sans: ['d4'],
      moves: [{ label: '1.', san: 'd4' }],
      pv: ['d2d4'],
    },
  ],
  stale: false,
};

describe('EngineLines', () => {
  it("shows each line's score and moves, and the depth", async () => {
    const screen = await render(
      <EngineLines status="ready" analysis={THINKING} onRetry={jest.fn()} />,
    );

    expect(screen.getByTestId('engine-line-0-score')).toHaveTextContent(
      '+0.34',
    );
    expect(screen.getByText('1. e4 e5 2. Nf3')).toBeTruthy();
    expect(screen.getByTestId('engine-line-1-score')).toHaveTextContent(
      '+0.20',
    );
    expect(screen.getByTestId('engine-depth')).toHaveTextContent('Depth 16');
  });

  it('shows how far the first download has got', async () => {
    const screen = await render(
      <EngineLines
        status="downloading"
        downloadProgress={0.42}
        analysis={THINKING}
        onRetry={jest.fn()}
      />,
    );

    expect(screen.getByText('Downloading engine… 42%')).toBeTruthy();
  });

  it('offers to try again when the engine fails', async () => {
    const onRetry = jest.fn();
    const screen = await render(
      <EngineLines status="error" analysis={THINKING} onRetry={onRetry} />,
    );

    await fireEvent.press(screen.getByTestId('engine-retry'));

    expect(onRetry).toHaveBeenCalled();
  });

  it("plays a line's first move when it's tapped", async () => {
    const onPlayLine = jest.fn();
    const screen = await render(
      <EngineLines
        status="ready"
        analysis={THINKING}
        onRetry={jest.fn()}
        onPlayLine={onPlayLine}
      />,
    );

    await fireEvent.press(screen.getByTestId('engine-line-1'));

    expect(onPlayLine).toHaveBeenCalledWith(THINKING.lines[1]);
  });

  it("keeps the last position's lines, greyed and not to be played, until this one's come", async () => {
    const onPlayLine = jest.fn();
    const screen = await render(
      <EngineLines
        status="ready"
        analysis={{ ...THINKING, stale: true }}
        onRetry={jest.fn()}
        onPlayLine={onPlayLine}
      />,
    );

    expect(screen.getByText('1. e4 e5 2. Nf3')).toBeTruthy();
    expect(screen.getByTestId('engine-line-0')).toBeDisabled();
    expect(screen.getByTestId('engine-line-0')).toHaveStyle({ opacity: 0.4 });
    await fireEvent.press(screen.getByTestId('engine-line-0'));
    expect(onPlayLine).not.toHaveBeenCalled();
  });
});
