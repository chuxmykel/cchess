import { View, Text, Pressable } from 'react-native';

import { TimeControl } from '../../constants/timeControls';
import ConnectionStrengthIndicator from '../ConnectionStrengthIndicator';
import GameTypeIcon from '../GameTypeIcon';
import Icon from '../Icon';
import Placeholder from '../Placeholder';
import PopoverMenu, { PopoverMenuItem } from '../PopoverMenu';
import { makeStyles } from '../../theme';

const MENU_WIDTH = 200;

interface GameHeaderProps {
  timeControl?: TimeControl;
  rated?: boolean;
  /** A line under the title, such as when the game was played. */
  subtitle?: string;
  onBack?: () => void;
  menuItems?: PopoverMenuItem[];
}

const GameHeader: React.FC<GameHeaderProps> = ({
  timeControl,
  rated,
  subtitle,
  onBack,
  menuItems,
}) => {
  const styles = useStyles();
  return (
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

      <View style={styles.titleColumn}>
        <View style={styles.title}>
          {timeControl ? (
            <>
              <GameTypeIcon type={timeControl.type} size={16} />
              <Text style={styles.titleText}>
                {timeControl.label} • {rated ? 'Rated' : 'Casual'}
              </Text>
            </>
          ) : (
            <Placeholder
              width={120}
              height={20}
              testID="game-header-placeholder"
            />
          )}
        </View>
        {subtitle && (
          <Text style={styles.subtitle} testID="game-header-subtitle">
            {subtitle}
          </Text>
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
};

export default GameHeader;

const useStyles = makeStyles((t) => ({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: t.spacing.lg,
    // Room enough to carry the move list down toward the board, rather
    // than leave a gap above the player bar.
    minHeight: 64,
  },
  side: {
    width: 44,
    justifyContent: 'center',
  },
  trailing: {
    alignItems: 'flex-end',
  },
  titleColumn: {
    flex: 1,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: t.fontSize.sm,
    color: t.colors.textMuted,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
  },
  titleText: {
    color: t.colors.text,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.semibold,
  },
}));
