import { useCallback, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { useSocialContext } from '../context/SocialContext';
import { ChallengeOptions } from '../components/ChallengeSheet';

type FriendLike = {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
};

type FriendNavigation = {
  navigate: (...args: never[]) => void;
};

export type FriendActions = {
  openProfile: (friend: FriendLike) => void;
  message: (friend: FriendLike) => void;
  /** Watches this player's game, following them into their next. */
  watch: (player: FriendLike, gameId: string) => void;
  startChallenge: (friend: FriendLike) => void;
  challengeTarget: FriendLike | null;
  closeChallenge: () => void;
  sendChallenge: (options: ChallengeOptions) => Promise<void>;
  canPlayRated: boolean;
};

// What every friend card and profile offers: their profile, a message, a
// challenge (through ChallengeSheet), and watching their game.
export function useFriendActions(
  navigation: FriendNavigation,
  onChallengeSent?: (friend: FriendLike) => void,
): FriendActions {
  const session = useAuthSession();
  const social = useSocialContext();
  const [challengeTarget, setChallengeTarget] = useState<FriendLike | null>(
    null,
  );
  const navigate = navigation.navigate as (
    route: string,
    params?: object,
  ) => void;

  const sendChallenge = useCallback(
    async ({ timeControl, rated, color }: ChallengeOptions) => {
      if (!challengeTarget) {
        return;
      }
      await social.challenge({
        opponentUsername: challengeTarget.username,
        initialSeconds: timeControl.initialSeconds,
        incrementSeconds: timeControl.incrementSeconds,
        rated,
        color,
      });
      onChallengeSent?.(challengeTarget);
    },
    [challengeTarget, social, onChallengeSent],
  );

  return {
    openProfile: (friend) =>
      navigate('UserProfile', { username: friend.username }),
    message: (friend) =>
      navigate('Conversation', {
        userId: friend.id,
        username: friend.username,
        displayName: friend.displayName,
        avatarColor: friend.avatarColor,
      }),
    watch: (player, gameId) =>
      navigate('GameViewer', { gameId, watchedUserId: player.id }),
    startChallenge: setChallengeTarget,
    challengeTarget,
    closeChallenge: () => setChallengeTarget(null),
    sendChallenge,
    canPlayRated: session.isReady && !session.user.isGuest,
  };
}
