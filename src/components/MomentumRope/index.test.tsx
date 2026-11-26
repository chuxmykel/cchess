import { fireEvent, render } from '@testing-library/react-native';

import MomentumRope from '.';
import { animatedStyleOf } from '../../testUtils/animatedValue';
import { settleAnimations } from '../../testUtils/pieceGestures';

const NAMES = { w: 'Ann', b: 'Bo' };
const cp = (value: number) => ({ kind: 'cp' as const, cp: value });

// White's 1.e4, then black's 1...f6?, the turning point: white winning.
const MOVES = [
  { ply: 1, color: 'w' as const, san: 'e4', moveClass: 'book' as const },
  { ply: 2, color: 'b' as const, san: 'f6', moveClass: 'mistake' as const },
];

async function renderRope(
  scores = [cp(0), cp(500)],
  at: number | null = null,
  moves = MOVES.slice(0, scores.length - 1),
) {
  const onReplay = jest.fn();
  const onStop = jest.fn();
  const screen = await render(
    <MomentumRope
      scores={scores}
      at={at}
      moves={moves}
      turns={[1]}
      names={NAMES}
      isPlaying={at !== null}
      onReplay={onReplay}
      onStop={onStop}
    />,
  );
  await fireEvent(
    screen.getByTestId('momentum-rope').children[1] as never,
    'layout',
    {
      nativeEvent: { layout: { width: 318, height: 28 } },
    },
  );
  await settleAnimations();
  return { screen, onReplay, onStop };
}

const knotX = (screen: Awaited<ReturnType<typeof render>>) =>
  (
    animatedStyleOf(screen.getByTestId('momentum-knot')).transform as {
      translateX: number;
    }[]
  )[0].translateX;

describe('MomentumRope', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("pulls the knot toward white's end, on the left, when white's winning", async () => {
    const { screen } = await renderRope([cp(0), cp(500)]);

    expect(knotX(screen)).toBeLessThan(0);
    expect(screen.getByText('Ann')).toBeTruthy();
    expect(screen.getByText('Bo')).toBeTruthy();
  });

  it("toward black's end when black's winning", async () => {
    const { screen } = await renderRope([cp(0), cp(-500)]);

    expect(knotX(screen)).toBeGreaterThan(0);
  });

  it('says what it is at rest, and replays when asked', async () => {
    const { screen, onReplay } = await renderRope();

    expect(screen.getByTestId('momentum-caption')).toHaveTextContent(
      /Who was winning, move by move/,
    );
    expect(screen.getByTestId('momentum-replay')).toHaveTextContent('Replay');
    await fireEvent.press(screen.getByTestId('momentum-replay'));
    expect(onReplay).toHaveBeenCalled();
  });

  it('names the move it is at and who is ahead, and stops when asked', async () => {
    const { screen, onStop } = await renderRope([cp(0), cp(10)], 1);

    expect(Math.abs(knotX(screen))).toBeLessThan(10);
    expect(screen.getByTestId('momentum-caption')).toHaveTextContent(
      'Move 1. e4 · level',
    );
    expect(screen.getByTestId('momentum-replay')).toHaveTextContent('Stop');
    await fireEvent.press(screen.getByTestId('momentum-replay'));
    expect(onStop).toHaveBeenCalled();
  });

  it("marks a turning point, with the move's mark", async () => {
    const { screen } = await renderRope([cp(0), cp(10), cp(500)], 2);

    expect(screen.getByTestId('momentum-caption')).toHaveTextContent(
      'Move 1... f6? · Ann is winning · Turning point',
    );
  });

  it('starts at the start', async () => {
    const { screen } = await renderRope([cp(0), cp(500)], 0);

    expect(screen.getByTestId('momentum-caption')).toHaveTextContent(
      'The start · level',
    );
  });
});
