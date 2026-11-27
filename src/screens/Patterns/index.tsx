import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import Placeholder from '../../components/Placeholder';
import SectionHeader from '../../components/SectionHeader';
import SegmentedTabs from '../../components/SegmentedTabs';
import {
  DEFAULT_RATING_PERIOD,
  RATING_PERIOD_LABELS,
} from '../../constants/ratingPeriods';
import { PUZZLE_THEME_LABELS } from '../../domain/puzzles/themes';
import type { Phase } from '../../domain/review/digest';
import { MARK_GLYPHS } from '../../domain/review/marks';
import type { Patterns as PatternStats } from '../../domain/review/patterns';
import { usePatterns } from '../../hooks/usePatterns';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { RATING_PERIODS, RatingPeriod } from '../../network/restClient';
import { makeStyles, useTheme } from '../../theme';
import type { HomeStackScreenProps } from '../HomeStack/types';

const PHASES: { phase: Phase; label: string }[] = [
  { phase: 'opening', label: 'Opening' },
  { phase: 'middlegame', label: 'Middlegame' },
  { phase: 'endgame', label: 'Endgame' },
];
// The most games the accuracy chart shows, the latest.
const TREND_SHOWN = 30;
const OPENINGS_SHOWN = 5;

const percent = (count: number, of: number) =>
  `${Math.round((count / of) * 100)}%`;
const games = (count: number) => (count === 1 ? '1 game' : `${count} games`);

// Your patterns over a period, from your reviewed games: accuracy, game by
// game and by phase; the marks you earn; how often you win when winning
// and save a lost position; the tactics you miss - each with its puzzles;
// the clock; and your openings as white and as black.
const Patterns: React.FC<HomeStackScreenProps<'Patterns'>> = ({
  navigation,
  route,
}) => {
  const styles = useStyles();
  const { username } = route.params;
  const [period, setPeriod] = useState<RatingPeriod>(DEFAULT_RATING_PERIOD);
  const { state, reload } = usePatterns(username, period);
  const refresh = usePullToRefresh(reload);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl {...refresh} />}
      testID="patterns-screen"
    >
      <SegmentedTabs<RatingPeriod>
        tabs={RATING_PERIODS.map((key) => ({
          key,
          label: RATING_PERIOD_LABELS[key],
        }))}
        selected={period}
        onSelect={setPeriod}
      />
      {state.status === 'loading' && (
        <View style={styles.loading} testID="patterns-loading">
          <Placeholder width="90%" height={120} />
          <Placeholder width="90%" height={120} />
        </View>
      )}
      {state.status === 'error' && (
        <View style={styles.loading} testID="patterns-error">
          <Text style={styles.muted}>
            {"Your patterns couldn't be loaded."}
          </Text>
          <Button label="Try again" variant="outline" onPress={reload} />
        </View>
      )}
      {state.status === 'ready' && !state.patterns && (
        <EmptyState
          illustration="activity"
          title="No reviewed games"
          message="Review your games, and what keeps happening in them shows up here."
          compact
          testID="patterns-empty"
        />
      )}
      {state.status === 'ready' && state.patterns && (
        <PatternsBody
          patterns={state.patterns}
          onPractise={(theme) =>
            navigation.navigate('Puzzle', { deck: { deck: 'pool', theme } })
          }
        />
      )}
    </ScrollView>
  );
};

function PatternsBody({
  patterns,
  onPractise,
}: {
  patterns: PatternStats;
  onPractise: (theme: (typeof patterns.weakThemes)[number]['theme']) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { results, converting, saving } = patterns;
  const trend = patterns.accuracyTrend.slice(-TREND_SHOWN);
  const mostSlips = Math.max(1, ...Object.values(patterns.slipsByPhase));

  return (
    <View>
      <Section title="Overview">
        <View style={styles.stats}>
          <Stat
            value={String(patterns.games)}
            label="Reviewed games"
            testID="patterns-games"
          />
          <Stat
            value={
              patterns.accuracy === null
                ? '-'
                : `${Math.round(patterns.accuracy)}%`
            }
            label="Accuracy"
            testID="patterns-accuracy"
          />
          <Stat
            value={(patterns.missedTactics / patterns.games).toFixed(1)}
            label="Missed tactics a game"
            testID="patterns-missed"
          />
        </View>
        {(['w', 'b'] as const).map((color) => (
          <Text
            key={color}
            style={styles.line}
            testID={`patterns-results-${color}`}
          >
            As {color === 'w' ? 'white' : 'black'}: {results[color].wins}W{' '}
            {results[color].draws}D {results[color].losses}L
          </Text>
        ))}
      </Section>

      <Section title="Accuracy">
        <View style={styles.chart} testID="patterns-trend">
          {trend.map((game) => (
            <View
              key={game.gameId}
              style={[
                styles.bar,
                {
                  height: `${Math.max(4, game.accuracy)}%`,
                  backgroundColor: colors.accent,
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.caption}>
          {trend.length === 1 ? 'Your game' : `Your last ${trend.length} games`}
        </Text>
        {PHASES.map(({ phase, label }) => {
          const accuracy = patterns.accuracyByPhase[phase];
          return (
            <Bar
              key={phase}
              label={label}
              share={(accuracy ?? 0) / 100}
              value={accuracy === null ? '-' : `${Math.round(accuracy)}%`}
              color={colors.accent}
              testID={`patterns-phase-${phase}`}
            />
          );
        })}
      </Section>

      <Section title="Marks a game">
        <View style={styles.stats} testID="patterns-marks">
          {MARK_GLYPHS.map((glyph) => (
            <Stat
              key={glyph}
              value={patterns.marksPerGame[glyph].toFixed(1)}
              label={glyph}
              testID={`patterns-mark-${glyph}`}
            />
          ))}
        </View>
      </Section>

      <Section title="Winning and saving">
        <Text style={styles.line} testID="patterns-converting">
          {converting.chances === 0
            ? 'You were never winning a game outright.'
            : `Won ${converting.won} of the ${games(converting.chances)} you were winning (${percent(converting.won, converting.chances)})`}
        </Text>
        <Text style={styles.line} testID="patterns-saving">
          {saving.chances === 0
            ? 'You were never losing a game outright.'
            : `Saved ${saving.saved} of the ${games(saving.chances)} you were losing (${percent(saving.saved, saving.chances)})`}
        </Text>
      </Section>

      <Section title="Where the mistakes come">
        {PHASES.map(({ phase, label }) => (
          <Bar
            key={phase}
            label={label}
            share={patterns.slipsByPhase[phase] / mostSlips}
            value={`${patterns.slipsByPhase[phase]}`}
            color={colors.danger}
            testID={`patterns-slips-${phase}`}
          />
        ))}
        <Text style={styles.caption}>
          {Object.values(patterns.hangingByPhase).reduce((a, b) => a + b, 0)} of
          them left a piece hanging
        </Text>
      </Section>

      {patterns.weakThemes.length > 0 && (
        <Section title="Tactics you miss">
          {patterns.weakThemes.slice(0, 5).map(({ theme, count }) => (
            <View
              key={theme}
              style={styles.themeRow}
              testID={`patterns-theme-${theme}`}
            >
              <Text style={styles.themeLabel}>
                {PUZZLE_THEME_LABELS[theme]} · {count}
              </Text>
              <Button
                label="Practise"
                variant="text"
                onPress={() => onPractise(theme)}
                testID={`patterns-practise-${theme}`}
              />
            </View>
          ))}
        </Section>
      )}

      {patterns.accuracyByClock && (
        <Section title="The clock">
          <Text style={styles.line} testID="patterns-clock">
            {Math.round(patterns.accuracyByClock.plenty)}% accurate with time to
            spare, {Math.round(patterns.accuracyByClock.short)}% when short of
            it
          </Text>
          <Text style={styles.line} testID="patterns-time-trouble">
            {patterns.timeTroubleSlips} mistakes with under a quarter of your
            time left
          </Text>
        </Section>
      )}

      {patterns.openings.length > 0 && (
        <Section title="Your openings">
          {patterns.openings.slice(0, OPENINGS_SHOWN).map((opening) => (
            <View
              key={`${opening.color}:${opening.name}`}
              style={styles.opening}
            >
              <Text style={styles.openingName} numberOfLines={1}>
                {opening.color === 'w' ? '○' : '●'} {opening.name}
              </Text>
              <Text style={styles.muted}>
                {opening.wins}W {opening.draws}D {opening.losses}L ·{' '}
                {Math.round(opening.accuracy)}%
              </Text>
            </View>
          ))}
        </Section>
      )}
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  return (
    <View>
      <View style={styles.section}>
        <SectionHeader title={title} />
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Stat({
  value,
  label,
  testID,
}: {
  value: string;
  label: string;
  testID: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.stat} testID={testID}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
}

function Bar({
  label,
  share,
  value,
  color,
  testID,
}: {
  label: string;
  share: number;
  value: string;
  color: string;
  testID: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.barRow} testID={testID}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.round(share * 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );
}

export default Patterns;

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  content: { paddingTop: t.spacing.md, paddingBottom: t.spacing.xxl },
  loading: {
    alignItems: 'center',
    gap: t.spacing.lg,
    paddingTop: t.spacing.xl,
  },
  section: { marginTop: t.spacing.lg },
  card: {
    marginHorizontal: t.spacing.lg,
    padding: t.spacing.lg,
    gap: t.spacing.sm,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...t.typography.heading, color: t.colors.text },
  line: { ...t.typography.body, color: t.colors.text },
  muted: { ...t.typography.body, color: t.colors.textMuted },
  caption: {
    ...t.typography.caption,
    color: t.colors.textMuted,
    textAlign: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: t.spacing.xxs,
    height: 80,
  },
  bar: { flex: 1, borderRadius: t.radius.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  barLabel: { width: 96, ...t.typography.body, color: t.colors.text },
  track: {
    flex: 1,
    height: 8,
    borderRadius: t.radius.sm,
    backgroundColor: t.colors.separator,
    overflow: 'hidden',
  },
  fill: { height: 8 },
  barValue: {
    width: 44,
    textAlign: 'right',
    ...t.typography.body,
    color: t.colors.text,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeLabel: { ...t.typography.body, color: t.colors.text },
  opening: { flexDirection: 'row', gap: t.spacing.sm },
  openingName: { flex: 1, ...t.typography.body, color: t.colors.text },
}));
