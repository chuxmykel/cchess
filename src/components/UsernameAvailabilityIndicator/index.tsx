import { ActivityIndicator, View } from 'react-native';

import Icon from '../Icon';
import {
  USERNAME_AVAILABILITY,
  UsernameAvailability,
} from '../../hooks/useUsernameAvailability';

interface UsernameAvailabilityIndicatorProps {
  availability: UsernameAvailability;
}

const ICON_SIZE = 22;

const UsernameAvailabilityIndicator: React.FC<
  UsernameAvailabilityIndicatorProps
> = ({ availability }) => {
  switch (availability) {
    case USERNAME_AVAILABILITY.CHECKING:
      return (
        <ActivityIndicator
          size="small"
          accessibilityLabel="Checking username"
          testID="username-checking"
        />
      );
    case USERNAME_AVAILABILITY.AVAILABLE:
      return (
        <View accessible accessibilityLabel="Username available">
          <Icon
            name="check-circle"
            size={ICON_SIZE}
            color="#4caf50"
            testID="username-available"
          />
        </View>
      );
    case USERNAME_AVAILABILITY.TAKEN:
      return (
        <View accessible accessibilityLabel="Username taken">
          <Icon
            name="close-circle"
            size={ICON_SIZE}
            color="#e53935"
            testID="username-taken"
          />
        </View>
      );
    case USERNAME_AVAILABILITY.NOT_CHECKED:
      return null;
  }
};

export default UsernameAvailabilityIndicator;
