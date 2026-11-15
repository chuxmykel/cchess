import { render, within } from '@testing-library/react-native';

import ReviewSummary from '.';
import { MOVE_CLASSES, SideReview } from '../../domain/review/types';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';

const counts = (overrides: Partial<SideReview['counts']>) => ({
  ...(Object.fromEntries(
    MOVE_CLASSES.map((c) => [c, 0]),
  ) as SideReview['counts']),
  ...overrides,
});

const { white, black } = makeGameSnapshot();

async function renderSummary() {
  return render(
    <ReviewSummary
      white={{
        player: white,
        review: { accuracy: 66.94, rating: 1150, counts: counts({ best: 9 }) },
      }}
      black={{
        player: black,
        review: { accuracy: 74, rating: 1400, counts: counts({ blunder: 2 }) },
      }}
      side="w"
    />,
  );
}

describe('ReviewSummary', () => {
  it("shows each side's accuracy and the rating it played at", async () => {
    const screen = await renderSummary();

    expect(screen.getByTestId('review-accuracy-w')).toHaveTextContent('66.9');
    expect(screen.getByTestId('review-accuracy-b')).toHaveTextContent('74.0');
    expect(screen.getByText('Game rating')).toBeTruthy();
    expect(screen.getByTestId('review-rating-w')).toHaveTextContent('1150');
    expect(screen.getByTestId('review-rating-b')).toHaveTextContent('1400');
  });

  it('counts each class under its player, its mark between them', async () => {
    const screen = await renderSummary();

    expect(screen.getByTestId('review-count-w-best')).toHaveTextContent('9');
    expect(screen.getByTestId('review-count-b-blunder')).toHaveTextContent('2');
    // A row: the class's name, white's count, the mark, black's count.
    const row = screen.getByTestId('review-count-w-best').parent!.parent!
      .parent!;
    const inRow = within(row);
    expect(inRow.getByText('Best')).toBeTruthy();
    expect(inRow.getByTestId('move-class-best')).toBeTruthy();
    expect(inRow.getByTestId('review-count-b-best')).toBeTruthy();
  });
});
