"""Read a lichess database PGN stream on stdin, keep only games with engine
evals, and write one compact TSV line per game:

  white_elo  black_elo  result  base_seconds  increment  evals

result is 1 (white won), 0.5 or 0. evals is the eval after each move, from
white's side, comma separated: centipawns ("34", "-120") or mate ("#3", "#-2").
Stops after --limit games kept. Progress goes to stderr.
"""
import argparse
import re
import sys

EVAL = re.compile(r"\[%eval ([^\]\s]+)\]")
TAG = re.compile(r'^\[(\w+) "(.*)"\]$')
RESULTS = {"1-0": "1", "0-1": "0", "1/2-1/2": "0.5"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=400_000)
    args = parser.parse_args()

    out = sys.stdout
    kept = seen = 0
    tags = {}
    moves = []
    in_moves = False

    def finish():
        nonlocal kept, seen
        seen += 1
        text = " ".join(moves)
        if "[%eval" not in text:
            return
        result = RESULTS.get(tags.get("Result", ""))
        tc = tags.get("TimeControl", "-")
        try:
            white = int(tags["WhiteElo"])
            black = int(tags["BlackElo"])
            base, inc = (int(x) for x in tc.split("+"))
        except (KeyError, ValueError):
            return
        if result is None or tags.get("Variant", "Standard") != "Standard":
            return
        evals = []
        for raw in EVAL.findall(text):
            if raw.startswith("#"):
                evals.append(raw)
            else:
                evals.append(str(round(float(raw) * 100)))
        if not evals:
            return
        out.write(f"{white}\t{black}\t{result}\t{base}\t{inc}\t{','.join(evals)}\n")
        kept += 1
        if kept % 10_000 == 0:
            print(f"kept {kept} of {seen} games", file=sys.stderr, flush=True)

    for line in sys.stdin:
        line = line.rstrip("\n")
        if line.startswith("["):
            if in_moves:
                finish()
                if kept >= args.limit:
                    break
                tags, moves, in_moves = {}, [], False
            match = TAG.match(line)
            if match:
                tags[match.group(1)] = match.group(2)
        elif line:
            in_moves = True
            moves.append(line)
    else:
        if in_moves:
            finish()
    print(f"done: kept {kept} of {seen} games", file=sys.stderr, flush=True)


if __name__ == "__main__":
    main()
