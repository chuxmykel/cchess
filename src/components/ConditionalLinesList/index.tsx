import { Pressable, ScrollView, Text, View } from 'react-native';

import Icon from '../Icon';
import { LineRow } from '../../domain/conditionalMoves';
import { makeStyles, useTheme } from '../../theme';

interface ConditionalLinesListProps {
  /** Each line's moves, as rows. */
  lines: LineRow[][];
  /** The line being written. */
  current: number;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
}

// Conditional moves being written: each line under its name, its moves in
// numbered rows of white's and black's, the one being written marked. A
// tap on a line goes on with it; its bin deletes it.
const ConditionalLinesList: React.FC<ConditionalLinesListProps> = ({
  lines,
  current,
  onSelect,
  onDelete,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <ScrollView style={styles.list} testID="conditional-lines">
      {lines.map((rows, index) => {
        const isCurrent = index === current;
        return (
          <Pressable
            key={index}
            onPress={() => onSelect(index)}
            accessibilityRole="button"
            accessibilityState={{ selected: isCurrent }}
            testID={`conditional-line-${index}`}
          >
            <View style={[styles.header, isCurrent && styles.currentHeader]}>
              <Text style={[styles.name, isCurrent && styles.currentName]}>
                Line {index + 1}
              </Text>
              <Pressable
                onPress={() => onDelete(index)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Delete line ${index + 1}`}
                testID={`delete-conditional-line-${index}`}
              >
                <Icon
                  name="trash-can-outline"
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
            {rows.map((row) => (
              <View key={row.number} style={styles.row}>
                <Text style={styles.number}>
                  {row.white ? `${row.number}.` : `${row.number}...`}
                </Text>
                <Text style={styles.move}>{row.white ?? ''}</Text>
                <Text style={styles.move}>{row.black ?? ''}</Text>
              </View>
            ))}
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

export default ConditionalLinesList;

const useStyles = makeStyles((t) => ({
  list: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.sm,
    backgroundColor: t.colors.surface,
  },
  currentHeader: {
    backgroundColor: t.colors.surfaceRaised,
  },
  name: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.semibold,
  },
  currentName: {
    color: t.colors.text,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.xs,
  },
  number: {
    width: 48,
    color: t.colors.textMuted,
    fontSize: t.fontSize.base,
  },
  move: {
    flex: 1,
    color: t.colors.text,
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.semibold,
  },
}));
