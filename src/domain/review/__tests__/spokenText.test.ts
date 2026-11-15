import { sanToSpeech, textToSpeech } from '../spokenText';

describe('sanToSpeech', () => {
  it.each([
    ['e4', 'e4'],
    ['Nf3', 'knight f3'],
    ['exd5', 'e takes d5'],
    ['Bxe5+', 'bishop takes e5, check'],
    ['Qh7#', 'queen h7, checkmate'],
    ['O-O', 'castles kingside'],
    ['O-O-O+', 'castles queenside, check'],
    ['e8=Q', 'e8 promotes to queen'],
    ['Nbd2', 'knight b d2'],
    ['R1e2', 'rook 1 e2'],
  ])('says %s as "%s"', (san, spoken) => {
    expect(sanToSpeech(san)).toBe(spoken);
  });
});

describe('textToSpeech', () => {
  it('leaves out the marks around a word', () => {
    expect(textToSpeech('Allows a *fork* and a *pin*.')).toBe(
      'Allows a fork and a pin.',
    );
  });
});
