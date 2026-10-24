import { render } from '@testing-library/react-native';

import GameClock from '.';

describe('GameClock', () => {
  it('formats minutes and seconds, padding seconds under 10', async () => {
    const screen = await render(
      <GameClock ms={65000} isActive={false} label="White" />,
    );

    expect(screen.getByText('1:05')).toBeTruthy();
  });

  it('rounds up a sub-second remainder so it never displays a lower whole second', async () => {
    const screen = await render(
      <GameClock ms={10500} isActive={false} label="White" />,
    );

    expect(screen.getByText('0:11')).toBeTruthy();
  });

  it('shows tenths of a second once time is low', async () => {
    const screen = await render(
      <GameClock ms={9800} isActive={false} label="White" />,
    );

    expect(screen.getByText('0:09.8')).toBeTruthy();
  });

  it('rounds up a sub-decisecond remainder in low-time mode so it never displays 0:00.0 while time remains', async () => {
    const screen = await render(
      <GameClock ms={55} isActive={false} label="White" />,
    );

    expect(screen.getByText('0:00.1')).toBeTruthy();
  });

  it('shows the given label', async () => {
    const screen = await render(
      <GameClock ms={10000} isActive={false} label="Black" />,
    );

    expect(screen.getByText('Black')).toBeTruthy();
  });
});
