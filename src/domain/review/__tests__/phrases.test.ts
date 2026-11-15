import {
  commentFor,
  headline,
  IntroContext,
  introLine,
  retryLine,
  seedOf,
} from '../phrases';

describe('phrases', () => {
  it('heads a move with its class', () => {
    expect(headline('Nf3', 'book')).toBe('Nf3 is a book move');
    expect(headline('Bg3', 'mistake')).toBe('Bg3 is a mistake');
    expect(headline('a3', 'inaccuracy')).toBe('a3 is an inaccuracy');
  });

  it('says the first fact, filled in', () => {
    const comment = commentFor(
      { san: 'Bg3', moveClass: 'mistake', bestPiece: 'knight' },
      [{ kind: 'trapped', piece: 'bishop' }],
      0,
    );
    expect(comment.text).toBe(
      'You permitted the opponent to win a bishop by eventually *trapping* it.',
    );
    expect(comment.spoken).toBe(
      'bishop g3 is a mistake. You permitted the opponent to win a bishop by eventually trapping it.',
    );
  });

  it('chooses among wordings by the seed', () => {
    const say = (seed: number) =>
      commentFor(
        { san: 'Bg3', moveClass: 'blunder', bestPiece: null },
        [{ kind: 'hangs', piece: 'rook' }],
        seed,
      ).text;
    expect(say(0)).not.toBe(say(1));
    expect(say(0)).toBe(say(5));
  });

  it('hints at the better move for a slip, without naming it', () => {
    const comment = commentFor(
      { san: 'a3', moveClass: 'inaccuracy', bestPiece: 'knight' },
      [{ kind: 'slips' }],
      0,
    );
    expect(comment.text).toContain('knight');
    expect(comment.text).not.toMatch(/Nf3|f3/);
    expect(comment.spoken).toContain('knight');
  });

  it('words each kind of slip its own way', () => {
    const say = (moveClass: 'inaccuracy' | 'blunder') =>
      commentFor({ san: 'a3', moveClass, bestPiece: null }, [], 0).text;
    expect(say('inaccuracy')).not.toBe(say('blunder'));
  });

  it('never talks about an engine', () => {
    for (let seed = 0; seed < 40; seed++) {
      for (const moveClass of [
        'best',
        'great',
        'excellent',
        'good',
        'mistake',
      ] as const) {
        const { text } = commentFor(
          { san: 'Nf3', moveClass, bestPiece: 'bishop' },
          [{ kind: 'slips' }],
          seed,
        );
        expect(text).not.toMatch(/engine/i);
      }
    }
  });

  it('falls back on the class when there’s no fact', () => {
    expect(
      commentFor({ san: 'Nf3', moveClass: 'best', bestPiece: null }, [], 0)
        .text,
    ).toBe('The best move in the position.');
  });

  it('seeds the same text the same way', () => {
    expect(seedOf('game:12')).toBe(seedOf('game:12'));
    expect(seedOf('game:12')).not.toBe(seedOf('game:13'));
  });
});

describe('introLine', () => {
  const context: IntroContext = {
    outcome: 'win',
    white: 'oydiya',
    black: 'chuxmykel',
    opponent: 'chuxmykel',
    opening: null,
    moves: 30,
    accuracy: 80,
    slips: 2,
  };
  const linesFor = (overrides: Partial<IntroContext>) =>
    new Set(
      Array.from({ length: 12 }, (_, seed) =>
        introLine({ ...context, ...overrides }, seed),
      ),
    );

  it('fits how the game went for the side reviewed', () => {
    expect([...linesFor({})].join(' ')).toMatch(/win/i);
    expect([...linesFor({ outcome: 'loss' })].join(' ')).toMatch(
      /tough|losses/i,
    );
    expect([...linesFor({ outcome: 'draw' })].join(' ')).toMatch(/draw|even/i);
  });

  it('names the players of a game only watched', () => {
    expect([...linesFor({ outcome: null })]).toContain(
      "Let's go through oydiya against chuxmykel.",
    );
  });

  it('notes a clean game, a short one, and its opening', () => {
    expect([...linesFor({ slips: 0, accuracy: 93 })]).toContain(
      "Barely a slip in sight - 93% accuracy. Let's look at the highlights.",
    );
    expect([...linesFor({ moves: 9 })]).toContain(
      "Short and sharp - 9 moves. Let's look at each one.",
    );
    expect([...linesFor({ opening: 'Scandinavian Defense' })]).toContain(
      "Scandinavian Defense. Let's see how it went from there.",
    );
  });

  it('says the same for the same game', () => {
    expect(introLine(context, 7)).toBe(introLine(context, 7));
  });
});

describe('retryLine', () => {
  it('asks for a move, then says how it went', () => {
    expect(retryLine('Black', null)).toBe('Find a better move for Black.');
    expect(
      retryLine('White', { san: 'Nf3', verdict: 'right', isPlayed: false }),
    ).toBe('Nf3 works. Well found!');
    expect(
      retryLine('White', { san: 'Ba6', verdict: 'wrong', isPlayed: true }),
    ).toBe("That's the move played. Try another.");
  });
});
