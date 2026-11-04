import { render } from '@testing-library/react-native';

import EvalBar from '.';
import { animatedStyleOf } from '../../testUtils/animatedValue';
import { settleAnimations } from '../../testUtils/pieceGestures';

describe('EvalBar', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('splits evenly, with no figure, before there is a score', async () => {
    const screen = await render(<EvalBar score={null} />);

    expect(animatedStyleOf(screen.getByTestId('eval-bar-fill'))).toMatchObject({
      width: '50%',
    });
    expect(screen.queryByTestId('eval-bar-score')).toBeNull();
  });

  it("fills to white's share, and shows the score", async () => {
    const screen = await render(<EvalBar score={{ kind: 'cp', cp: 0 }} />);

    await screen.rerender(
      <EvalBar score={{ kind: 'mate', moves: 2, winner: 'w' }} />,
    );
    await settleAnimations();

    expect(animatedStyleOf(screen.getByTestId('eval-bar-fill'))).toMatchObject({
      width: '100%',
    });
    expect(screen.getByTestId('eval-bar-score')).toHaveTextContent('#2');
  });

  it("keeps the last score while the next position's is coming", async () => {
    const screen = await render(<EvalBar score={{ kind: 'cp', cp: 300 }} />);
    await settleAnimations();
    const before = animatedStyleOf(screen.getByTestId('eval-bar-fill'));

    await screen.rerender(<EvalBar score={null} />);
    await settleAnimations();

    expect(animatedStyleOf(screen.getByTestId('eval-bar-fill'))).toEqual(
      before,
    );
    expect(screen.getByTestId('eval-bar-score')).toHaveTextContent('+3.0');
  });

  it("fills beside the board from white's end, whichever way it faces", async () => {
    const screen = await render(
      <EvalBar
        score={{ kind: 'mate', moves: 1, winner: 'w' }}
        direction="vertical"
        orientation="b"
      />,
    );
    await settleAnimations();

    expect(animatedStyleOf(screen.getByTestId('eval-bar-fill'))).toMatchObject({
      height: '100%',
    });
    expect(screen.getByTestId('eval-bar-fill')).toHaveStyle({ top: 0 });
  });
});
