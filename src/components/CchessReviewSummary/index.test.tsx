import { fireEvent, render } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import CchessReviewSummary from '.';
import { buildReview } from '../../domain/review/buildReview';
import { chapters, decisiveMoment } from '../../domain/review/story';

const at = (cp: number, pv: string[]) => ({
  score: { kind: 'cp' as const, cp },
  pv,
  second: null,
  depth: 14,
});

// 1. e4 e5 2. Ba6?? bxa6
const REVIEW = buildReview(
  DEFAULT_POSITION,
  ['e2e4', 'e7e5', 'f1a6', 'b7a6'].map((uci) => ({ uci })),
  [
    at(20, ['e2e4']),
    at(30, ['e7e5']),
    at(30, ['g1f3', 'b8c6']),
    at(-300, ['b7a6', 'g1f3']),
    at(-300, ['g1f3', 'd7d6']),
  ],
);
const NAMES = { w: 'Ann', b: 'Bo' };

async function renderSummary(
  overrides: Partial<React.ComponentProps<typeof CchessReviewSummary>> = {},
) {
  const onSelectMove = jest.fn();
  const onStartChapter = jest.fn();
  const screen = await render(
    <CchessReviewSummary
      moves={REVIEW.moves}
      names={NAMES}
      white={REVIEW.white}
      black={REVIEW.black}
      side="w"
      decisive={decisiveMoment(REVIEW, NAMES)}
      story={chapters(REVIEW, NAMES, 'black')}
      guesses={null}
      onSelectMove={onSelectMove}
      onStartChapter={onStartChapter}
      {...overrides}
    />,
  );
  return { screen, onSelectMove, onStartChapter };
}

describe('CchessReviewSummary', () => {
  it('leads with the decisive move, going to it when tapped', async () => {
    const { screen, onSelectMove } = await renderSummary();

    expect(screen.getByTestId('review-decisive')).toHaveTextContent(
      /Decided at move 2.*Ba6\?\? took Ann from level to losing\./,
    );
    await fireEvent.press(screen.getByTestId('review-decisive'));
    expect(onSelectMove).toHaveBeenCalledWith(2);
  });

  it('says so when no move decided it, and offers nothing to tap', async () => {
    const { screen, onSelectMove } = await renderSummary({
      decisive: { moment: null, text: 'No single move decided it.' },
    });

    expect(screen.getByTestId('review-decisive')).toHaveTextContent(
      /No decisive move.*No single move decided it\./,
    );
    await fireEvent.press(screen.getByTestId('review-decisive'));
    expect(onSelectMove).not.toHaveBeenCalled();
  });

  it('lists the chapters, starting the review at one tapped', async () => {
    const { screen, onStartChapter } = await renderSummary();

    expect(screen.getByTestId('review-chapter-1')).toHaveTextContent(
      /Move 2.*Ann played Ba6\?\?/,
    );
    await fireEvent.press(screen.getByTestId('review-chapter-2'));
    expect(onStartChapter).toHaveBeenCalledWith(2);
  });

  it("counts each side's marks and shows its accuracy - no rating", async () => {
    const { screen } = await renderSummary();

    expect(screen.getByTestId('review-marks-w-??')).toHaveTextContent('1');
    expect(screen.getByTestId('review-marks-b-??')).toHaveTextContent('0');
    expect(screen.getByTestId('review-accuracy-w')).toHaveTextContent(
      REVIEW.white.accuracy.toFixed(1),
    );
    expect(screen.queryByText(/rating/i)).toBeNull();
  });

  it('shows how many turning points were found, once any were asked', async () => {
    const { screen } = await renderSummary();
    expect(screen.queryByTestId('review-guess-tally')).toBeNull();

    await screen.rerender(
      <CchessReviewSummary
        moves={REVIEW.moves}
        names={NAMES}
        white={REVIEW.white}
        black={REVIEW.black}
        side="w"
        decisive={decisiveMoment(REVIEW, NAMES)}
        story={chapters(REVIEW, NAMES, 'black')}
        guesses={{ found: 1, asked: 2 }}
        onSelectMove={jest.fn()}
        onStartChapter={jest.fn()}
      />,
    );
    expect(screen.getByTestId('review-guess-tally')).toHaveTextContent(
      '1 of 2 found',
    );
  });

  it("names the side's hardest find", async () => {
    const { screen } = await renderSummary({
      hardest: { san: 'Bxf7+', label: 'Only move' },
    });

    expect(screen.getByTestId('review-hardest-find')).toHaveTextContent(
      'Bxf7+ · Only move',
    );
  });
});
