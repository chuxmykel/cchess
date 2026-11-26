import { useEffect, useMemo, useState } from 'react';
import { Color } from 'chess.js';

import { ReviewSettings } from '../constants/review';
import { badgesOf } from '../domain/review/badges';
import { DIFFICULTY_LABELS, hardestFind } from '../domain/review/difficulty';
import {
  formatSpent,
  guessTally,
  introLine,
  IntroContext,
  type Names,
  seedOf,
  timeLines,
} from '../domain/review/phrases';
import { chapters, decisiveMoment, storyStops } from '../domain/review/story';
import { calledOut, moveTimes, timeReport } from '../domain/review/time';
import type { GameReview, MoveClass, ThemeCard } from '../domain/review/types';
import { reviewView } from './reviewView';
import type { ReviewedGame } from './useGameReview';
import {
  useBrilliantSound,
  useMoveNavigationSounds,
  useMoveSounds,
} from './useGameSounds';
import { useRetryJudge } from './useRetryJudge';
import { useReviewStepper } from './useReviewStepper';
import { useReviewVoice } from './useReviewVoice';

export type ReviewSessionInput = {
  game: ReviewedGame;
  review: GameReview;
  // The side whose moves the review stops at, at the bottom of the board -
  // and the side the viewer played, null if they only watched.
  side: Color;
  viewerColor: Color | null;
  settings: ReviewSettings;
  // The move shown, as a ply, each time it changes - for the header's
  // analysis button; the game's end on the summary.
  onShownPly: (ply: number) => void;
};

// What the review's intro is chosen by: how the game went for the side
// reviewed - or that it was only watched - its opening, length and slips.
function introContext(
  game: ReviewedGame,
  review: GameReview,
  side: Color,
  viewerColor: Color | null,
): IntroContext {
  const winner =
    game.result === 'white' ? 'w' : game.result === 'black' ? 'b' : null;
  const mine = side === 'w' ? review.white : review.black;
  return {
    outcome:
      viewerColor === null
        ? null
        : winner === null
          ? 'draw'
          : winner === side
            ? 'win'
            : 'loss',
    white: game.white.displayName,
    black: game.black.displayName,
    opponent: (side === 'w' ? game.black : game.white).displayName,
    opening: review.opening?.name ?? null,
    moves: Math.ceil(review.moves.length / 2),
    accuracy: mine.accuracy,
    slips: mine.counts.mistake + mine.counts.miss + mine.counts.blunder,
  };
}

// A review being looked through, shared by its two screens - the summary
// and the moves: where it is (the stepper), what it shows and says there
// (the view), read aloud and sounded; and for the cchess style, the game's
// story - its chapters, the move that decided it, where it asks for the
// move - and its clock.
export function useReviewSession({
  game,
  review,
  side,
  viewerColor,
  settings,
  onShownPly,
}: ReviewSessionInput) {
  const [retrying, setRetrying] = useState(false);
  const judge = useRetryJudge(retrying);

  const cchess = settings.style === 'cchess';
  const names = useMemo<Names>(
    () => ({ w: game.white.displayName, b: game.black.displayName }),
    [game],
  );
  const story = useMemo(
    () => (cchess ? chapters(review, names, game.result) : []),
    [cchess, review, names, game.result],
  );
  const hardest = useMemo(() => {
    const found = hardestFind(review.moves, side);
    return found
      ? { san: found.move.san, label: DIFFICULTY_LABELS[found.difficulty] }
      : null;
  }, [review, side]);
  const badges = useMemo(
    () => (cchess ? badgesOf(review, side, game.result) : []),
    [cchess, review, side, game.result],
  );
  const decisive = useMemo(
    () => decisiveMoment(review, names),
    [review, names],
  );
  const clock = useMemo(() => {
    if (!cchess || !game.clock) return null;
    const movers = review.moves.map((move) => move.color);
    const times = moveTimes(game.clock, movers);
    // A clock no move took any time on says nothing.
    if (times.every((ms) => ms === 0)) return null;
    const report = timeReport(review.moves, game.clock, side);
    return {
      times,
      colors: movers,
      report,
      // "Your longest think" to the player reviewed, else by name.
      lines: timeLines(report, viewerColor === side ? null : names[side]),
      ...calledOut(report),
    };
  }, [cchess, game.clock, review, side, viewerColor, names]);
  const stepperOptions = useMemo(() => {
    if (!cchess) return undefined;
    const { stops, guesses } = storyStops(story, review.moves, side);
    const extraCards: ThemeCard[] = [];
    if (clock && clock.lines.length > 0) {
      extraCards.push({
        theme: 'time',
        title: 'Time',
        text: clock.lines.join(' '),
      });
    }
    if (guesses.length > 0) {
      extraCards.push({ theme: 'turns', title: 'Turning points', text: '' });
    }
    return { stops, guesses, extraCards };
  }, [cchess, story, review, side, clock]);
  const stepper = useReviewStepper(review, side, judge, stepperOptions);
  const asked = stepperOptions?.guesses.length ?? 0;
  const answered = Object.values(stepper.guessResults);
  const tally =
    asked > 0 && answered.length > 0
      ? { found: answered.filter((r) => r === 'found').length, asked }
      : null;
  const isGuessing = stepper.mode.kind === 'guess';
  const isRetrying = stepper.mode.kind === 'retry' || isGuessing;
  if (isRetrying !== retrying) setRetrying(isRetrying);
  const voice = useReviewVoice(settings.voice, settings.voiceId);
  // The guesses' card says how they went, as they're made.
  const theme =
    stepper.card?.theme === 'turns'
      ? { ...stepper.card, text: guessTally(tally?.found ?? 0, asked) }
      : stepper.card;
  const lastIndex = review.moves.length - 1;
  // The move on the board: on a closing card, the last.
  const shownIndex = Math.min(stepper.index, lastIndex);
  const intro = useMemo(
    () =>
      introLine(
        introContext(game, review, side, viewerColor),
        seedOf(game.seed),
      ),
    [game, review, side, viewerColor],
  );

  const view = reviewView({
    review,
    phase: stepper.phase,
    index: shownIndex,
    mode: stepper.mode,
    line: stepper.line,
    lineStep: stepper.lineStep,
    showBestMoves: settings.showBestMoves,
    theme,
    intro,
    style: settings.style,
    side,
    names,
    // None for a move that took none - a side's first, which starts no
    // clock.
    timeSpent:
      clock && shownIndex >= 0 && clock.times[shownIndex] > 0
        ? formatSpent(clock.times[shownIndex])
        : null,
  });

  // Each new thing said is read aloud, in place of the last - but not the
  // moves played on the way to a key moment, only the moment itself, nor
  // those passed scrolling the move list.
  const { say } = voice;
  const [scrubbing, setScrubbing] = useState(false);
  const quiet = stepper.isPlaying || scrubbing;
  useEffect(() => {
    if (!quiet) say(view.spoken);
  }, [view.spoken, quiet, say]);

  useMoveNavigationSounds(review.moves, shownIndex + 1, false);
  const shownPly =
    stepper.phase === 'summary' ? review.moves.length : shownIndex + 1;
  useEffect(() => {
    onShownPly(shownPly);
  }, [onShownPly, shownPly]);
  // Show's line sounds each of its moves as it's played out.
  const lineMoveSan =
    view.bubble.lineAt !== null
      ? (view.bubble.line?.[view.bubble.lineAt]?.san ?? null)
      : null;
  const lineMove = useMemo(
    () => (lineMoveSan ? { san: lineMoveSan, step: stepper.lineStep } : null),
    [lineMoveSan, stepper.lineStep],
  );
  useMoveSounds(lineMove);
  // A brilliant move gets a sound of its own when the review stops on it.
  const stoppedOnBrilliant =
    stepper.phase !== 'summary' &&
    !stepper.isPlaying &&
    stepper.mode.kind === 'move' &&
    stepper.lineStep === null &&
    view.moveClass === 'brilliant';
  useBrilliantSound(stoppedOnBrilliant ? String(shownIndex) : null);

  const moveClasses = useMemo(
    () =>
      Object.fromEntries(
        review.moves.map((move) => [move.ply, move.moveClass]),
      ) as Record<number, MoveClass>,
    [review],
  );

  return {
    game,
    review,
    side,
    settings,
    cchess,
    names,
    story,
    decisive,
    hardest,
    badges,
    clock,
    guesses: stepperOptions?.guesses ?? [],
    tally,
    stepper,
    isGuessing,
    theme,
    view,
    lastIndex,
    shownIndex,
    moveClasses,
    setScrubbing,
  };
}

export type ReviewSession = ReturnType<typeof useReviewSession>;
