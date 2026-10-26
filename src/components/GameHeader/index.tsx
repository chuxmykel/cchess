import { View, Text, Pressable, StyleSheet } from 'react-native';

import { TimeControl } from '../../constants/timeControls';
import ConnectionStrengthIndicator from '../ConnectionStrengthIndicator';
import GameTypeIcon from '../GameTypeIcon';
import Icon from '../Icon';
import Placeholder from '../Placeholder';
import PopoverMenu, { PopoverMenuItem } from '../PopoverMenu';

const MENU_WIDTH = 200;

interface GameHeaderProps {
  timeControl?: TimeControl;
  rated?: boolean;
  onBack?: () => void;
  menuItems?: PopoverMenuItem[];
}

const GameHeader: React.FC<GameHeaderProps> = ({
  timeControl,
  rated,
  onBack,
  menuItems,
}) => (
  <View style={styles.container} testID="game-header">
    <View style={styles.side}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
          testID="game-header-back"
        >
          <Icon name="chevron-left" size={28} />
        </Pressable>
      ) : (
        <ConnectionStrengthIndicator />
      )}
    </View>

    <View style={styles.title}>
      {timeControl ? (
        <>
          <GameTypeIcon type={timeControl.type} size={16} />
          <Text style={styles.titleText}>
            {timeControl.label} • {rated ? 'Rated' : 'Casual'}
          </Text>
        </>
      ) : (
        <Placeholder width={120} height={20} testID="game-header-placeholder" />
      )}
    </View>

    <View style={[styles.side, styles.trailing]}>
      {menuItems && (
        <PopoverMenu
          items={menuItems}
          triggerIcon="dots-horizontal"
          width={MENU_WIDTH}
          testID="game-header-menu"
        />
      )}
    </View>
  </View>
);

export default GameHeader;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 44,
  },
  side: {
    width: 44,
    justifyContent: 'center',
  },
  trailing: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
