#!/usr/bin/env bash
#
# bake.sh - rendered frame sequence -> optimized, multi-format scene video.
#
# Turns a folder of rendered PNG/JPG frames into a 60fps one-shot-forward video with
# our smooth ease baked into the timing (fast start, soft settle), emitting the full
# browser fallback set + a poster, at the SOURCE'S NATIVE RESOLUTION by default:
#
#   <out>.av1.mp4   AV1   (smallest; modern Chrome/Edge/Firefox, Safari 17+)
#   <out>.webm      VP9   (Chrome/Firefox, Safari 16.4+)
#   <out>.mp4       H.264 (universal Safari/old-browser floor)
#   <out>.poster.jpg      (last settled frame; <video poster> + reduced-motion fallback)
#
# The same 4 files are ALSO mirrored into <src_dir>/out/ (renders archived beside source).
#
# DEFAULT = keep the base/native frame size (no reduction). This is the MASTER: we keep
# full resolution so the site can derive whatever sizes it needs, incl. retina (2x). To
# produce a smaller site/retina variant, pass WIDTH explicitly (e.g. WIDTH=960).
#
# Pipeline: stage (lexical order) -> DENSIFY (ffmpeg minterpolate, motion-compensated)
#   -> RESAMPLE N frames at the ease positions -> ENCODE 3 codecs + poster.
# The "smooth end" is TEMPORAL (frame timing), so it survives any resolution/CRF change.
# Weight is driven by CONTENT, not frame count: a mostly-static scene compresses tiny,
# a full rotation stays heavy because every frame differs.
#
# Usage:
#   bake.sh <src_dir> <out_basepath> [profile]
#
#   profile = spin   (DEFAULT) full rotation / busy frame -> harder CRF (50/52/30)
#           = static mostly-static (a vault opening, a reveal) -> gentle CRF (30/33/22)
#   (profiles now only pick CRF; resolution defaults to native for BOTH.)
#
# Env overrides (any profile): WIDTH FRAMES FPS CRF_AV1 CRF_VP9 CRF_H264 EASING REVERSE
#   WIDTH   = output width in px. Unset = native source width (no reduction). Pass a
#             smaller value to derive a site/retina variant from the same frames.
#   EASING  = quad (default, easeOutQuad) | cubic | quint | expo (easeOutExpo, strong
#             decel - only smooth if the source has fine per-frame motion into the settle,
#             else it GELS on near-identical end frames) | linear (constant; for seamless
#             360 LOOPS where a settle would stutter the loop seam).
#   REVERSE = 1 plays the frames backwards (flips rotation direction) BEFORE easing, so
#             the soft settle stays at the END. 0 (default) keeps source order.
#   MIRROR  = h (horizontal flip, left<->right) | v (vertical flip, upside down) | none.
#
# Notes:
#   - Source frames play in LEXICAL order (ls | sort). Name them so a plain sort is the
#     play order; if a batch sorts wrong, stage it renamed 000.png,001.png... first.
#   - Handles filenames with spaces. Requires ffmpeg with libsvtav1 + libvpx-vp9 + libx264.
#   - <source> type strings for these encodes:
#       video/mp4; codecs=av01.0.08M.08   video/webm; codecs=vp9   video/mp4; codecs=avc1.640020
#
set -euo pipefail

SRC="${1:?usage: bake.sh <src_dir> <out_basepath> [spin|static]}"
OUT="${2:?missing output basepath (no extension, e.g. public/sprites/tree-spin)}"
PROFILE="${3:-spin}"

case "$PROFILE" in
  static) : "${CRF_AV1:=30}"; : "${CRF_VP9:=33}"; : "${CRF_H264:=22}" ;;
  spin)   : "${CRF_AV1:=50}"; : "${CRF_VP9:=52}"; : "${CRF_H264:=30}" ;;
  *) echo "unknown profile '$PROFILE' (use spin|static)"; exit 1 ;;
esac
: "${FRAMES:=60}"; : "${FPS:=60}"; : "${EASING:=quad}"; : "${REVERSE:=0}"; : "${MIRROR:=none}"
: "${FLOOR:=0}"; : "${DENSE_FPS:=180}"
case "$MIRROR" in h) FLIP=",hflip" ;; v) FLIP=",vflip" ;; *) FLIP="" ;; esac

command -v ffmpeg >/dev/null || { echo "ffmpeg not found (brew install ffmpeg)"; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe not found (comes with ffmpeg)"; exit 1; }
[ -d "$SRC" ] || { echo "source dir not found: $SRC"; exit 1; }

WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/src" "$WORK/dense" "$WORK/eased"

# Stage frames in lexical order (optionally reversed), renumbered to a clean %03d run.
STREAM="$(ls -1 "$SRC" | grep -iE '\.(png|jpg|jpeg)$' | sort)"
[ "$REVERSE" = "1" ] && STREAM="$(printf '%s\n' "$STREAM" | awk '{a[NR]=$0} END{for(i=NR;i>=1;i--) print a[i]}')"
n=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  cp "$SRC/$f" "$WORK/src/$(printf '%03d' "$n").png"; n=$((n + 1))
done <<< "$STREAM"
[ "$n" -gt 0 ] || { echo "no image frames in $SRC"; exit 1; }

# Default WIDTH to the native source width (no reduction) - the master res for site/retina.
NATIVE_W="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$WORK/src/000.png")"
: "${WIDTH:=${NATIVE_W:-1024}}"
echo "staged $n source frames (profile=$PROFILE width=$WIDTH native=$NATIVE_W easing=$EASING reverse=$REVERSE)"

# 1. DENSIFY: time the source to 1s (-framerate n) so minterpolate fps == frame count.
ffmpeg -y -framerate "$n" -i "$WORK/src/%03d.png" \
  -vf "scale=${WIDTH}:-2${FLIP},minterpolate=fps=${DENSE_FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
  "$WORK/dense/%03d.png" >/dev/null 2>&1
echo "densified to $(ls "$WORK/dense" | wc -l | tr -d ' ') frames @ ${WIDTH}px"

# 2. RESAMPLE: FRAMES frames at the ease positions over the dense set.
FRAMES="$FRAMES" EASING="$EASING" FLOOR="$FLOOR" python3 - "$WORK/dense" "$WORK/eased" <<'PY'
import os, shutil, sys
src, dst = sys.argv[1], sys.argv[2]
files = sorted(f for f in os.listdir(src) if f.endswith(".png"))
D, N, E = len(files), int(os.environ["FRAMES"]), os.environ["EASING"]
FLOOR = float(os.environ.get("FLOOR", "0"))
def ease(t):
    if E == "linear": return t
    if E == "cubic":  return 1 - (1 - t) ** 3
    if E == "quint":  return 1 - (1 - t) ** 5
    if E == "expo":   return 1.0 if t >= 1 else 1 - 2 ** (-10 * t)   # easeOutExpo
    return 1 - (1 - t) ** 2            # quad (default)
for k in range(N):
    t = k / (N - 1)
    # Velocity floor: blend the ease toward linear so the END keeps moving (no freeze
    # onto near-identical settle frames -> kills the residual step at the end).
    e = (1 - FLOOR) * ease(t) + FLOOR * t
    idx = min(D - 1, round(e * (D - 1)))
    shutil.copy(os.path.join(src, files[idx]), os.path.join(dst, f"{k:03d}.png"))
print(f"resampled {N} frames (easeOut-{E}, floor={FLOOR})")
PY

# 3. ENCODE: AV1 + VP9 + H.264, plus a poster (last settled frame).
ffmpeg -y -start_number 0 -framerate "$FPS" -i "$WORK/eased/%03d.png" \
  -c:v libsvtav1 -crf "$CRF_AV1" -pix_fmt yuv420p -movflags +faststart "$OUT.av1.mp4" >/dev/null 2>&1
ffmpeg -y -start_number 0 -framerate "$FPS" -i "$WORK/eased/%03d.png" \
  -c:v libvpx-vp9 -crf "$CRF_VP9" -b:v 0 -pix_fmt yuv420p "$OUT.webm" >/dev/null 2>&1
ffmpeg -y -start_number 0 -framerate "$FPS" -i "$WORK/eased/%03d.png" \
  -c:v libx264 -crf "$CRF_H264" -preset slow -pix_fmt yuv420p -movflags +faststart "$OUT.mp4" >/dev/null 2>&1
LAST="$(printf '%03d' "$((FRAMES - 1))")"
ffmpeg -y -i "$WORK/eased/$LAST.png" -q:v 3 "$OUT.poster.jpg" >/dev/null 2>&1

# Mirror the 4 outputs into a sibling out/ folder next to the SOURCE frames, so each
# scene keeps its renders (3 codecs + last-frame poster) archived beside its input.
SRC_OUT="$SRC/out"; mkdir -p "$SRC_OUT"
BASE="$(basename "$OUT")"
for ext in av1.mp4 webm mp4 poster.jpg; do
  [ -f "$OUT.$ext" ] && cp "$OUT.$ext" "$SRC_OUT/$BASE.$ext"
done

echo "done:"
for ext in av1.mp4 webm mp4 poster.jpg; do
  [ -f "$OUT.$ext" ] && printf "  %-24s %s\n" "$OUT.$ext" "$(ls -lh "$OUT.$ext" | awk '{print $5}')"
done
echo "mirrored to $SRC_OUT/"
