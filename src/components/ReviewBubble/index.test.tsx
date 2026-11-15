import { render } from '@testing-library/react-native';

import ReviewBubble from '.';

describe('ReviewBubble', () => {
  it('heads the words with the class, the move and the score', async () => {
    const screen = await render(
      <ReviewBubble
        moveClass="mistake"
        title="Bg3 is a mistake"
        score="-2.0"
        text="Your bishop ends up *trapped* after this."
      />,
    );

    expect(screen.getByTestId('move-class-mistake')).toBeTruthy();
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'Bg3 is a mistake',
    );
    expect(screen.getByTestId('review-bubble-score')).toHaveTextContent('-2.0');
    expect(screen.getByTestId('review-bubble-text')).toHaveTextContent(
      'Your bishop ends up trapped after this.',
    );
  });

  it('underlines an idea worth knowing', async () => {
    const screen = await render(<ReviewBubble text="Watch for a *fork*." />);

    expect(screen.getByText('fork')).toHaveStyle({
      textDecorationLine: 'underline',
    });
  });

  it('shows a line of moves, numbered', async () => {
    const screen = await render(
      <ReviewBubble
        text="The line:"
        line={[
          { label: '12.', san: 'Bg3' },
          { label: null, san: 'f5' },
        ]}
      />,
    );

    expect(screen.getByTestId('review-bubble-line')).toHaveTextContent(
      '12. Bg3 f5',
    );
  });
});
