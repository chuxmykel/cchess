import { act, fireEvent, render, screen } from '@testing-library/react-native';

import MaintenanceBanner, {
  MAINTENANCE_BANNER_SNOOZE_MS,
  maintenanceMessage,
} from '.';

describe('MaintenanceBanner', () => {
  it('shows nothing with no maintenance announced', async () => {
    await render(<MaintenanceBanner startsAt={null} />);
    expect(screen.queryByTestId('maintenance-banner')).toBeNull();
  });

  it('says when maintenance begins, and that new live games are paused', async () => {
    const startsAt = new Date(Date.now() + 5 * 60_000);
    await render(<MaintenanceBanner startsAt={startsAt} />);
    const { text, label } = maintenanceMessage(startsAt, Date.now());
    expect(screen.getByText(text)).toBeOnTheScreen();
    expect(screen.getByLabelText(label)).toBeOnTheScreen();
  });

  it('names the time until it begins, then that it has', () => {
    const startsAt = new Date('2026-11-18T14:05:00Z');
    const before = maintenanceMessage(startsAt, startsAt.getTime() - 60_000);
    expect(before.text).toMatch(/^Maintenance at .+ · new live games paused$/);
    expect(before.label).toMatch(/^Server maintenance at /);

    expect(maintenanceMessage(startsAt, startsAt.getTime()).text).toBe(
      'Maintenance under way · new live games paused',
    );
  });

  describe('dismissed', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('comes back a minute later', async () => {
      await render(
        <MaintenanceBanner startsAt={new Date(Date.now() + 60_000)} />,
      );
      await fireEvent.press(screen.getByTestId('maintenance-banner-dismiss'));
      expect(screen.queryByTestId('maintenance-banner')).toBeNull();

      await act(() =>
        jest.advanceTimersByTime(MAINTENANCE_BANNER_SNOOZE_MS - 1000),
      );
      expect(screen.queryByTestId('maintenance-banner')).toBeNull();
      await act(() => jest.advanceTimersByTime(1000));
      expect(screen.getByTestId('maintenance-banner')).toBeOnTheScreen();
    });
  });
});
