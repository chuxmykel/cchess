import { gameOverSound, moveSound, stepSound } from '../moveSound';

describe('moveSound', () => {
  it.each([
    ['e4', 'move'],
    ['Nf3', 'move'],
    ['e8=Q', 'move'],
    ['exd5', 'capture'],
    ['Bxf7', 'capture'],
    ['O-O', 'castle'],
    ['O-O-O', 'castle'],
    ['Bb5+', 'check'],
    ['Qxf7+', 'check'],
    ['O-O+', 'check'],
    ['Qh5#', 'checkmate'],
    ['Qxf7#', 'checkmate'],
    ['exf8=Q#', 'checkmate'],
  ])('%s sounds as a %s', (san, sound) => {
    expect(moveSound(san)).toBe(sound);
  });
});

describe('stepSound', () => {
  const sans = ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3'];

  it('sounds the move landed on, stepping or jumping forward', () => {
    expect(stepSound(sans, 2, 3)).toBe('capture');
    expect(stepSound(sans, 0, 5)).toBe('move');
  });

  it('slides back with a plain move, whatever is taken back', () => {
    expect(stepSound(sans, 3, 2)).toBe('move');
    expect(stepSound(sans, 5, 0)).toBe('move');
  });

  it('is quiet staying put', () => {
    expect(stepSound(sans, 3, 3)).toBeNull();
  });
});

describe('gameOverSound', () => {
  it('sounds every end but mate, which sounded with its move', () => {
    expect(gameOverSound('resignation')).toBe('game-end');
    expect(gameOverSound('threefold-repetition')).toBe('game-end');
    expect(gameOverSound('abort')).toBe('game-end');
    expect(gameOverSound('checkmate')).toBeNull();
  });
});
