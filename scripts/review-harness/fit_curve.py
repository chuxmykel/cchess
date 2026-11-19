"""How an engine eval turns into a score, by rating: fitted from lichess
games with evals (see extract_evals.py's TSV, gzipped), between players
within --max-gap of each other.

Model: expected score for white = 1 / (1 + exp(-k * cp)), cp from white's
side, clipped to +-1000 (a mate counted as ten pawns, as the review does).
Lichess's winning chances are this curve with k = 0.00368208; we fit k for
each rating band and time class, by maximum likelihood (draws count half).

  python3 -I scripts/review-harness/fit_curve.py <evals.tsv.gz>
"""
import argparse
import gzip
import json
import math
import sys
from collections import defaultdict

LICHESS_K = 0.00368208
BANDS = [0, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500]
CLASSES = [("bullet", 180), ("blitz", 480), ("rapid", 1500), ("classical", 10**9)]


def band_of(rating):
    return max(low for low in BANDS if rating >= low)


def class_of(base, inc):
    estimate = base + 40 * inc
    return next(name for name, limit in CLASSES if estimate < limit)


def log_loss(k, points):
    total = 0.0
    for cp, score in points:
        p = 1 / (1 + math.exp(-k * cp))
        p = min(max(p, 1e-9), 1 - 1e-9)
        total -= score * math.log(p) + (1 - score) * math.log(1 - p)
    return total / len(points)


def fit(points):
    # The loss is convex in k: a golden-section search.
    low, high = 0.0002, 0.02
    ratio = (math.sqrt(5) - 1) / 2
    for _ in range(40):
        a = high - ratio * (high - low)
        b = low + ratio * (high - low)
        if log_loss(a, points) < log_loss(b, points):
            high = b
        else:
            low = a
    return (low + high) / 2


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("tsv")
    parser.add_argument("--max-gap", type=int, default=100)
    parser.add_argument("--per-cell", type=int, default=60_000)
    parser.add_argument("--every", type=int, default=3)
    args = parser.parse_args()

    cells = defaultdict(list)
    games = defaultdict(int)
    with gzip.open(args.tsv, "rt") as file:
        for line in file:
            white, black, result, base, inc, evals = line.rstrip("\n").split("\t")
            white, black = int(white), int(black)
            if abs(white - black) > args.max_gap:
                continue
            key = (band_of((white + black) / 2), class_of(int(base), int(inc)))
            if len(cells[key]) >= args.per_cell:
                continue
            games[key] += 1
            score = float(result)
            for ply, raw in enumerate(evals.split(",")):
                if ply < 8 or ply % args.every:
                    continue
                if raw.startswith("#"):
                    cp = 1000 if not raw.startswith("#-") else -1000
                else:
                    cp = max(-1000, min(1000, int(raw)))
                cells[key].append((cp, score))

    rows = []
    for (band, time_class), points in sorted(cells.items()):
        if len(points) < 5_000:
            continue
        k = fit(points)
        rows.append(
            {
                "band": band,
                "timeClass": time_class,
                "games": games[(band, time_class)],
                "points": len(points),
                "k": round(k, 6),
                "vsLichess": round(k / LICHESS_K, 2),
                # What +2 (200cp) is worth, as the review's 0-100 chances.
                "winChancesAt200": round(100 / (1 + math.exp(-k * 200)), 1),
            }
        )
    json.dump(rows, sys.stdout, indent=1)
    print()
    print(
        f"lichess's curve: k={LICHESS_K}, +2 = "
        f"{100 / (1 + math.exp(-LICHESS_K * 200)):.1f}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
