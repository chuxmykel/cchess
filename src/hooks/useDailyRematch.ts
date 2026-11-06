import { Color } from 'chess.js';

import { useSocialContext } from '../context/SocialContext';
import { Challenge } from '../network/restClient';
import { UseRematchResult } from './useRematch';

type DailyRematchOptions = {
  opponent: { id: string; username: string };
  /** The game's days a move, in seconds - a rematch keeps them. */
  initialSeconds: number;
  rated: boolean;
  myColor: Color;
  onError: (message: string) => void;
};

function isRematchOf(
  challenge: Challenge,
  opponentId: string,
  initialSeconds: number,
): boolean {
  return (
    challenge.status === 'pending' &&
    challenge.initialSeconds === initialSeconds &&
    (challenge.challenger.id === opponentId ||
      challenge.opponent.id === opponentId)
  );
}

// A finished daily game's rematch is a daily challenge to the opponent,
// colors swapped: it waits days for an answer, so it goes where challenges
// do - their notifications - rather than on a game they may not open again.
// A challenge either of them has sent the other at the game's days counts
// as one, whoever sent it.
export function useDailyRematch({
  opponent,
  initialSeconds,
  rated,
  myColor,
  onError,
}: DailyRematchOptions): UseRematchResult {
  const social = useSocialContext();
  const sent = social.challenges.outgoing.find((challenge) =>
    isRematchOf(challenge, opponent.id, initialSeconds),
  );
  const received = social.challenges.incoming.find((challenge) =>
    isRematchOf(challenge, opponent.id, initialSeconds),
  );

  function report(action: Promise<void>) {
    action.catch((error: Error) => onError(error.message));
  }

  return {
    status: received ? 'received' : sent ? 'offered' : 'none',
    offer: () =>
      report(
        received
          ? social.acceptChallenge(received.id)
          : social.challenge({
              opponentUsername: opponent.username,
              initialSeconds,
              incrementSeconds: 0,
              rated,
              color: myColor === 'w' ? 'black' : 'white',
            }),
      ),
    decline: () => {
      if (received) report(social.declineChallenge(received.id));
      else if (sent) report(social.cancelChallenge(sent.id));
    },
  };
}
