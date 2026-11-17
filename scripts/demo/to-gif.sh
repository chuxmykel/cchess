#!/bin/sh
# A screen recording as a README GIF:
#
#   scripts/demo/to-gif.sh in.mp4 out.gif [speed] [width]
#
# Played `speed` times as fast (1.5 unless given - Maestro's steps leave
# pauses between them), 10 frames a second, `width` pixels wide (480 -
# shown at 300 in the README, sharp on a retina screen), with a palette made
# for this clip: ffmpeg's two-pass palettegen/paletteuse, only the parts of
# each frame that changed redrawn, which keeps a mostly still screen small.
set -eu

in=$1
out=$2
speed=${3:-1.5}
width=${4:-480}

ffmpeg -nostdin -v error -y -i "$in" -filter_complex \
  "[0:v]setpts=PTS/$speed,fps=10,scale=$width:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
  "$out"
