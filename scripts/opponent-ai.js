// A small negamax / alpha-beta engine. It never touches rules itself: every
// legal move, check and mate comes from the chess.js instance passed in.

const INF = 1_000_000;
const MATE = 100_000;
const ENDGAME_MATERIAL = 2600; // combined non-pawn material below which kings centralise

const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Piece-square tables from White's point of view; index 0 is a8, index 63 is h1.
// prettier-ignore
const PST = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0,
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
};

// prettier-ignore
const KING_MIDDLEGAME = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20,
];

// prettier-ignore
const KING_ENDGAME = [
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50,
];

// depth: full-width plies searched; quiesce: extra capture-only plies at the
// leaves; noise: centipawns of randomness added to each root move.
const LEVELS = {
  easy: { depth: 1, quiesce: 1, noise: 60 },
  medium: { depth: 2, quiesce: 3, noise: 0 },
  hard: { depth: 3, quiesce: 3, noise: 0 },
};

// Try captures and promotions first so alpha-beta cuts off sooner.
function orderMoves(moves) {
  const priority = (m) =>
    (m.captured ? 10 * VALUE[m.captured] - VALUE[m.piece] : 0) +
    (m.promotion ? VALUE[m.promotion] : 0);
  return moves.sort((a, b) => priority(b) - priority(a));
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

// Static score in centipawns from the point of view of the side to move.
function evaluate(game) {
  const board = game.board();
  const kings = [];
  let score = 0;
  let nonPawnMaterial = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      const index = piece.color === 'w' ? row * 8 + col : (7 - row) * 8 + col;
      if (piece.type === 'k') {
        kings.push({ color: piece.color, index });
        continue;
      }
      const value = VALUE[piece.type] + PST[piece.type][index];
      score += piece.color === 'w' ? value : -value;
      if (piece.type !== 'p') nonPawnMaterial += VALUE[piece.type];
    }
  }

  const kingTable =
    nonPawnMaterial <= ENDGAME_MATERIAL ? KING_ENDGAME : KING_MIDDLEGAME;
  for (const { color, index } of kings) {
    score += color === 'w' ? kingTable[index] : -kingTable[index];
  }

  return game.turn() === 'w' ? score : -score;
}

// Resolve capture sequences at the leaves so we don't misjudge a position
// halfway through an exchange. Captures only: if promotions were searched here
// too, a pawn on the seventh would count as already queened at every leaf and
// the engine would never see a reason to actually promote.
function quiesce(game, alpha, beta, depth) {
  const standPat = evaluate(game);
  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;
  if (depth === 0) return alpha;

  const captures = game.moves({ verbose: true }).filter((m) => m.captured);
  for (const move of orderMoves(captures)) {
    game.move(move);
    const score = -quiesce(game, -beta, -alpha, depth - 1);
    game.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function search(game, depth, alpha, beta, ply, quiesceDepth) {
  if (depth === 0) return quiesce(game, alpha, beta, quiesceDepth);

  const moves = orderMoves(game.moves({ verbose: true }));
  if (moves.length === 0) return game.inCheck() ? -MATE + ply : 0;

  for (const move of moves) {
    game.move(move);
    const score = -search(
      game,
      depth - 1,
      -beta,
      -alpha,
      ply + 1,
      quiesceDepth,
    );
    game.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

// Returns the best chess.js Move for the side to move (or null if there are
// none). The game is restored to its original position before returning.
// `noise` adds up to that many centipawns of randomness to each root move so
// the weaker levels don't always play the same reply.
function findBestMove(game, { depth = 2, quiesce = 3, noise = 0 } = {}) {
  // Shuffle before the (stable) ordering so equally good moves vary between games.
  const moves = orderMoves(shuffle(game.moves({ verbose: true })));
  if (moves.length === 0) return null;

  let best = null;
  let bestScore = -INF;
  for (const move of moves) {
    game.move(move);
    let score;
    if (game.isCheckmate()) score = MATE;
    else if (game.isDraw())
      score = 0; // takes a draw when behind, dodges it when ahead
    else
      score = -search(
        game,
        depth - 1,
        -INF,
        noise ? INF : -bestScore,
        1,
        quiesce,
      );
    game.undo();

    if (noise) score += Math.random() * noise;
    if (score > bestScore) {
      best = move;
      bestScore = score;
    }
  }
  return best;
}

module.exports = {
  LEVELS,
  findBestMove,
};
