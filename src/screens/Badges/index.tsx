import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import BadgeCard from '../../components/BadgeCard';
import BadgeTileView from '../../components/BadgeTileView';
import SectionHeader from '../../components/SectionHeader';
import { allTiles, type BadgeTile, earnedCount } from '../../domain/badges';
import { useBadges } from '../../hooks/useBadges';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { makeStyles } from '../../theme';
import type { HomeStackScreenProps } from '../HomeStack/types';

// Every badge there is, for one player, as a grid in its groups: the
// milestones reached - and the next games one to reach - then each group's
// badges, earned or faded. A tap opens a badge's card: what it's for, and
// the games that earned it.
const Badges: React.FC<HomeStackScreenProps<'Badges'>> = ({
  navigation,
  route,
}) => {
  const styles = useStyles();
  const { username } = route.params;
  const { badges, reload } = useBadges(username);
  const refresh = usePullToRefresh(reload);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const groups = allTiles(badges);
  const open: BadgeTile | null =
    groups
      .flatMap((group) => group.tiles)
      .find((tile) => tile.key === openKey) ?? null;
  const count = earnedCount(badges);

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl {...refresh} />}
        testID="badges-screen"
      >
        <Text style={styles.summary} testID="badges-earned">
          {count === 1 ? '1 badge earned' : `${count} badges earned`}
        </Text>
        {groups.map((group) => (
          <View key={group.title}>
            <View style={styles.section}>
              <SectionHeader title={group.title} />
            </View>
            <View style={styles.grid}>
              {group.tiles.map((tile) => (
                <BadgeTileView
                  key={tile.key}
                  tile={tile}
                  onPress={() => setOpenKey(tile.key)}
                  testID={`badges-${tile.key.replace(/:+$/, '').replace(/:+/g, '-')}`}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <BadgeCard
        tile={open}
        onOpenGame={(gameId) => {
          setOpenKey(null);
          navigation.navigate('GameViewer', { gameId });
        }}
        onClose={() => setOpenKey(null)}
      />
    </>
  );
};

export default Badges;

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  content: { paddingBottom: t.spacing.xxl },
  summary: {
    ...t.typography.body,
    color: t.colors.textMuted,
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.lg,
  },
  section: { marginTop: t.spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.md,
    marginHorizontal: t.spacing.lg,
    padding: t.spacing.lg,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
}));
