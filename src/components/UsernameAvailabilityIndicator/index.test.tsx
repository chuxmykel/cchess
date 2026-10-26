import { render } from '@testing-library/react-native';

import UsernameAvailabilityIndicator from '.';
import { USERNAME_AVAILABILITY } from '../../hooks/useUsernameAvailability';

describe('UsernameAvailabilityIndicator', () => {
  it('shows a spinner while checking', async () => {
    const screen = await render(
      <UsernameAvailabilityIndicator
        availability={USERNAME_AVAILABILITY.CHECKING}
      />,
    );

    expect(screen.getByTestId('username-checking')).toBeTruthy();
  });

  it('shows a green check for an available name', async () => {
    const screen = await render(
      <UsernameAvailabilityIndicator
        availability={USERNAME_AVAILABILITY.AVAILABLE}
      />,
    );

    expect(screen.getByTestId('username-available')).toHaveProp(
      'name',
      'check-circle',
    );
    expect(screen.getByLabelText('Username available')).toBeTruthy();
  });

  it('shows a red cross for a taken name', async () => {
    const screen = await render(
      <UsernameAvailabilityIndicator
        availability={USERNAME_AVAILABILITY.TAKEN}
      />,
    );

    expect(screen.getByTestId('username-taken')).toHaveProp(
      'name',
      'close-circle',
    );
    expect(screen.getByLabelText('Username taken')).toBeTruthy();
  });

  it('shows nothing when the name was not checked', async () => {
    const screen = await render(
      <UsernameAvailabilityIndicator
        availability={USERNAME_AVAILABILITY.NOT_CHECKED}
      />,
    );

    expect(screen.toJSON()).toBeNull();
  });
});
