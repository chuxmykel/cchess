# Review harness

Checks the game review's judgements against games that other sites have
already judged. It covers chess.com's accuracy for a player's games, and
lichess's ?!/?/?? marks along with the evals behind them. Engine evals
are kept per game, so after a change to the classifier you only need to
rebuild the reviews, which takes minutes, not a fresh engine run.
Everything it downloads or writes goes in `.review-harness/`, which git
ignores.

```bash
# Games: a chess.com player's reviewed games, from the public API
npx tsx scripts/review-harness/importChesscom.ts --user <username>

# ...and analysed lichess games with their marks, from a month of the open
# database (https://database.lichess.org), streamed rather than kept
curl -sL https://database.lichess.org/standard/lichess_db_standard_rated_2026-10.pgn.zst \
  | zstd -dc | python3 -I scripts/review-harness/extract_judged.py \
  > .review-harness/lichess/judged-2026-10.pgn
npx tsx scripts/review-harness/importLichess.ts --pgn .review-harness/lichess/judged-2026-10.pgn

# Our engine's evals for every game (the pinned Stockfish, run under Node;
# resumes where it stopped)
npx tsx scripts/review-harness/analyse.ts --games .review-harness/chesscom-<username>.json --jobs 4
npx tsx scripts/review-harness/analyse.ts --games .review-harness/lichess-judged-2026-10.json --jobs 4

# The reviews rebuilt with the current buildReview, compared with the sites'
npx tsx scripts/review-harness/report.ts --label <name> [--source chesscom|lichess]

# Where our slips part from lichess's: its evals and ours, its thresholds
# and ours, our other rules
npx tsx scripts/review-harness/slipSources.ts --pgn .review-harness/lichess/judged-2026-10.pgn

# How an eval turns into a score at each rating, fitted from a month of
# lichess's analysed games
curl -sL https://database.lichess.org/standard/lichess_db_standard_rated_2026-10.pgn.zst \
  | zstd -dc | python3 -I scripts/review-harness/extract_evals.py --limit 1000000 \
  | gzip > .review-harness/lichess/evals-2026-10.tsv.gz
python3 -I scripts/review-harness/fit_curve.py .review-harness/lichess/evals-2026-10.tsv.gz
```
