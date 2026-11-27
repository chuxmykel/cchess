import { fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import {
  EarnedBadgesProvider,
  useHoldEarnedBadges,
  useReportEarnedBadges,
} from '../EarnedBadgesContext';
import type { Badge } from '../../domain/badges';
import { makeBadge } from '../../testUtils/badges';

const MINIATURE = makeBadge({ id: 'a', kind: 'miniature' });
const COMEBACK = makeBadge({ id: 'b', kind: 'comeback' });

// A game's screen: holding the card back while open, its game reporting
// what it earned.
function GameScreen({ badges }: { badges: Badge[] }) {
  useHoldEarnedBadges();
  useReportEarnedBadges(badges);
  return <Text>game</Text>;
}

function App({ onSeeAll }: { onSeeAll: () => void }) {
  const [inGame, setInGame] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);
  return (
    <EarnedBadgesProvider onSeeAll={onSeeAll}>
      {inGame && <GameScreen badges={badges} />}
      <Pressable testID="earn" onPress={() => setBadges([MINIATURE])} />
      <Pressable
        testID="earn-more"
        onPress={() => setBadges([MINIATURE, COMEBACK])}
      />
      <Pressable testID="leave" onPress={() => setInGame(false)} />
    </EarnedBadgesProvider>
  );
}

describe('EarnedBadgesProvider', () => {
  it("shows a game's badges only once its screen is left", async () => {
    const screen = await render(<App onSeeAll={jest.fn()} />);
    await fireEvent.press(screen.getByTestId('earn'));
    await fireEvent.press(screen.getByTestId('earn-more'));
    expect(screen.queryByTestId('earned-badges-card')).toBeNull();

    await fireEvent.press(screen.getByTestId('leave'));
    expect(screen.getByTestId('earned-badges-title')).toHaveTextContent(
      '2 badges earned',
    );
    expect(screen.getByTestId('earned-badge-miniature')).toBeTruthy();
    expect(screen.getByTestId('earned-badge-comeback')).toBeTruthy();
  });

  it('is put away with ✕, nothing to claim', async () => {
    const screen = await render(<App onSeeAll={jest.fn()} />);
    await fireEvent.press(screen.getByTestId('earn'));
    await fireEvent.press(screen.getByTestId('leave'));
    expect(screen.getByTestId('earned-badges-title')).toHaveTextContent(
      'Badge earned',
    );

    await fireEvent.press(screen.getByTestId('earned-badges-close'));
    expect(screen.queryByTestId('earned-badges-card')).toBeNull();
  });

  it('opens every badge from See all badges', async () => {
    const onSeeAll = jest.fn();
    const screen = await render(<App onSeeAll={onSeeAll} />);
    await fireEvent.press(screen.getByTestId('earn'));
    await fireEvent.press(screen.getByTestId('leave'));

    await fireEvent.press(screen.getByTestId('earned-badges-see-all'));
    expect(onSeeAll).toHaveBeenCalled();
    expect(screen.queryByTestId('earned-badges-card')).toBeNull();
  });

  it('shows nothing for a game that earned none', async () => {
    const screen = await render(<App onSeeAll={jest.fn()} />);
    await fireEvent.press(screen.getByTestId('leave'));
    expect(screen.queryByTestId('earned-badges-card')).toBeNull();
  });
});
