import { render } from '@testing-library/react-native';

import MoveClassIcon from '.';

describe('MoveClassIcon', () => {
  it('marks every class in the classic style', async () => {
    const screen = await render(<MoveClassIcon moveClass="best" size={20} />);
    expect(screen.getByTestId('move-class-best')).toBeTruthy();
  });

  it('marks only what matters in the cchess style, with symbols alone', async () => {
    const best = await render(
      <MoveClassIcon moveClass="best" size={20} markStyle="cchess" />,
    );
    expect(best.queryByTestId('move-class-best')).toBeNull();

    const miss = await render(
      <MoveClassIcon moveClass="miss" size={20} markStyle="cchess" />,
    );
    expect(miss.getByTestId('move-class-miss')).toHaveTextContent('?');
  });
});
