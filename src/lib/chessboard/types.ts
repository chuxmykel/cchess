// The board's own vocabulary. It knows squares and pieces, not the rules of
// chess: which moves are legal is the app's to say (`Movable.dests`). The
// unions are the same strings chess.js uses, so its values pass straight in.

export type Color = 'w' | 'b';
export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type Square = `${File}${Rank}`;

// A piece's image key: its color, then its kind - 'wk', 'bq', ...
export type PieceCode = `${Color}${PieceSymbol}`;

export type BoardPiece = {
  square: Square;
  color: Color;
  type: PieceSymbol;
};

export type Point = {
  x: number;
  y: number;
};

export type MoveSquares = {
  from: Square;
  to: Square;
};

// Where each piece that can move may go, by the square it starts from.
export type Dests = Partial<Record<Square, Square[]>>;

export type Movable = {
  // Whose pieces can be picked up, or tapped to show their moves.
  color: Color | 'both' | null;
  dests?: Dests;
  // Any piece to any square, or off the board - setting up a position.
  free?: boolean;
};

// Pieces that can be picked up to queue a move while `movable`'s can't -
// the side waiting on the other's move. A queued move goes to the app,
// which plays it once it's that side's turn; the board only marks it.
export type Premovable = {
  color: Color | null;
  // Where each may be queued to go.
  dests?: Dests;
  // The move queued, marked until the app drops it.
  current?: MoveSquares | null;
};

// A king the board marks in danger: glowing red, and tipped over once
// fallen.
export type KingCheck = {
  square: Square;
  fallen: boolean;
};

export type BoardColors = {
  light: string;
  dark: string;
  // The last move's two squares.
  lastMove: string;
  // A move's dot, and the drag guide's circle.
  moveHint: string;
  // The square a dragged piece came from.
  dragOrigin: string;
  // A king in danger's glow.
  check: string;
  // A queued move's two squares.
  premove: string;
};

// A set of pieces to draw: each piece an SVG document, drawn to fill its
// square - a 100x100 viewBox, say, with the piece standing on its bottom.
export type PieceSet = Record<PieceCode, string>;

export type BoardArrow = {
  from: Square;
  to: Square;
  color: string;
  // How thick, as a share of a square.
  weight: number;
};

export type BoardAnimation = {
  // Slide pieces to their squares, rather than put them there at once.
  enabled?: boolean;
  // Slide them into a position set without a move, too - which otherwise
  // they're put straight into.
  slideOnSet?: boolean;
};
