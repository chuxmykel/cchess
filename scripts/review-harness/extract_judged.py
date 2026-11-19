"""Read a lichess database PGN stream on stdin and keep whole analysed games
(their moves carry lichess's ?!/?/?? judgements), --per-band of them for
each band of the players' average rating. Writes the PGNs to stdout, one
blank line between games; stops once every band is full.
"""
import argparse
import sys

BANDS = [(0, 1200), (1200, 1600), (1600, 2000), (2000, 4000)]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--per-band", type=int, default=150)
    args = parser.parse_args()
    filled = [0] * len(BANDS)
    lines = []
    in_moves = False

    def finish():
        text = "\n".join(lines)
        if "[%eval" not in text:
            return
        tags = {}
        for line in lines:
            if line.startswith("[") and ' "' in line:
                key, _, value = line[1:-1].partition(' "')
                tags[key] = value.rstrip('"')
        try:
            average = (int(tags["WhiteElo"]) + int(tags["BlackElo"])) / 2
        except (KeyError, ValueError):
            return
        if tags.get("Variant", "Standard") != "Standard":
            return
        if "-" not in tags.get("Result", "*"):
            return
        for index, (low, high) in enumerate(BANDS):
            if low <= average < high and filled[index] < args.per_band:
                filled[index] += 1
                sys.stdout.write(text + "\n\n")

    for line in sys.stdin:
        line = line.rstrip("\n")
        if line.startswith("[") and in_moves:
            finish()
            if all(count >= args.per_band for count in filled):
                break
            lines, in_moves = [], False
        if line:
            if not line.startswith("["):
                in_moves = True
            lines.append(line)
    print(f"bands filled: {filled}", file=sys.stderr)


if __name__ == "__main__":
    main()
