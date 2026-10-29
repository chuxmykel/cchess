import { useEffect, useRef } from 'react';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { SOUNDS } from '../constants/sounds';
import {
  GameSound,
  gameOverSound,
  moveSound,
  stepSound,
} from '../domain/moveSound';

// One player per sound for the whole app, made when a board first needs
// them, so every board shares them instead of loading its own.
let players: Record<GameSound, AudioPlayer> | null = null;

function loadPlayers(): Record<GameSound, AudioPlayer> {
  if (!players) {
    // Sound effects, not media: the silent switch mutes them, and they play
    // over whatever else is playing rather than stopping it.
    setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
    players = {
      move: createAudioPlayer(SOUNDS.move),
      capture: createAudioPlayer(SOUNDS.capture),
      castle: createAudioPlayer(SOUNDS.castle),
      check: createAudioPlayer(SOUNDS.check),
      checkmate: createAudioPlayer(SOUNDS.checkmate),
      'game-start': createAudioPlayer(SOUNDS['game-start']),
      'game-end': createAudioPlayer(SOUNDS['game-end']),
    };
  }
  return players;
}

function playSound(sound: GameSound): void {
  const player = loadPlayers()[sound];
  // A player stays at its end once played, so it goes back to the start
  // first - and only then plays: play() runs at once but seekTo() later,
  // so played straight after asking to rewind, a sound already heard once
  // would start from its end and make no sound.
  player.seekTo(0).then(
    () => player.play(),
    () => {},
  );
}

// Plays each move's sound as it lands on the board - either side's, on the
// move it's applied: a position reached without a move (a refused move
// taken back, say) leaves `lastMove` null and stays quiet.
export function useMoveSounds(lastMove: { san: string } | null): void {
  // Loaded with the board, so the first move doesn't wait on them.
  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (lastMove) playSound(moveSound(lastMove.san));
  }, [lastMove]);
}

// Sounds a board stepping through a game's moves (useMoveNavigation's
// `currentPly`): forward or back a move, or to one picked from the list.
// A move just played is sounded only with `soundsNewMoves` - a game being
// watched - since a board playing the game sounds its moves itself.
export function useMoveNavigationSounds(
  moves: { san: string }[],
  currentPly: number,
  soundsNewMoves: boolean,
): void {
  const shown = useRef({ ply: currentPly, moveCount: moves.length });

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    const before = shown.current;
    shown.current = { ply: currentPly, moveCount: moves.length };
    const sans = moves.map((move) => move.san);
    if (moves.length !== before.moveCount) {
      // A move played - or another game altogether, as a rematch starts.
      const isNextMove =
        moves.length === before.moveCount + 1 && currentPly === moves.length;
      if (soundsNewMoves && isNextMove) {
        playSound(moveSound(sans[currentPly - 1]));
      }
      return;
    }
    const sound = stepSound(sans, before.ply, currentPly);
    if (sound) playSound(sound);
    // `moves` only matters with `currentPly`: a list refetched unchanged
    // shouldn't play anything.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPly, moves.length]);
}

// Sounds a game starting, as its screen opens on it: only a game that's new
// - on, with no moves yet - not one reopened part way through.
export function useGameStartSound(isNewGame: boolean): void {
  useEffect(() => {
    if (isNewGame) playSound('game-start');
    // Once, as the game opens: it's new or it isn't.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// Sounds a game ending while it's shown - not one already over when opened.
// Mate has sounded with its move (see gameOverSound).
export function useGameOverSound(
  isOver: boolean,
  resultReason: string | null,
): void {
  const wasOver = useRef(isOver);

  useEffect(() => {
    if (isOver && !wasOver.current) {
      const sound = gameOverSound(resultReason);
      if (sound) playSound(sound);
    }
    wasOver.current = isOver;
    // The reason arrives with the end, so only the end needs watching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOver]);
}
