import { render } from '@testing-library/react-native';

import Puzzles from '.';

describe('Puzzles', () => {
  it('says puzzles are coming', async () => {
    const screen = await render(<Puzzles />);

    expect(screen.getByTestId('puzzles-coming-soon')).toHaveTextContent(
      /Puzzles are on their way/,
    );
  });
});
