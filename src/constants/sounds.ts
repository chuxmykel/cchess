import { GameSound } from '../domain/moveSound';

// Made by scripts/generate-sounds.js; a recording saved under the same name
// replaces one.
export const SOUNDS: Record<GameSound, number> = {
  move: require('../../assets/sounds/move.wav'),
  capture: require('../../assets/sounds/capture.wav'),
  castle: require('../../assets/sounds/castle.wav'),
  check: require('../../assets/sounds/check.wav'),
  checkmate: require('../../assets/sounds/checkmate.wav'),
  'game-start': require('../../assets/sounds/game-start.wav'),
  'game-end': require('../../assets/sounds/game-end.wav'),
};
