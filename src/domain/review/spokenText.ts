// A move's SAN as it's said aloud: "Nf3" is "knight f3", "exd5" "e takes
// d5", "O-O" "castles kingside" - a speech voice reads SAN as letters.

const PIECE_WORDS: Record<string, string> = {
  K: 'king',
  Q: 'queen',
  R: 'rook',
  B: 'bishop',
  N: 'knight',
};

export function sanToSpeech(san: string): string {
  const mate = san.endsWith('#');
  const check = san.endsWith('+');
  const bare = san.replace(/[+#!?]+$/, '');
  let words: string;
  if (bare === 'O-O') words = 'castles kingside';
  else if (bare === 'O-O-O') words = 'castles queenside';
  else {
    const match = bare.match(
      /^([KQRBN])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=([QRBN]))?$/,
    );
    if (!match) return san;
    const [, piece, file, rank, takes, to, promotion] = match;
    const parts: string[] = [];
    if (piece) parts.push(PIECE_WORDS[piece]);
    if (file || rank) parts.push(`${file ?? ''}${rank ?? ''}`);
    if (takes) parts.push('takes');
    parts.push(to);
    if (promotion) parts.push(`promotes to ${PIECE_WORDS[promotion]}`);
    words = parts.join(' ');
  }
  if (mate) return `${words}, checkmate`;
  if (check) return `${words}, check`;
  return words;
}

// A comment's text as it's read aloud: the marks around a word taken out.
export function textToSpeech(text: string): string {
  return text.replace(/\*([^*]+)\*/g, '$1');
}
