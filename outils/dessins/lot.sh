#!/bin/bash
# Rendu final des dessins : chaque image de chaque exercice demandé (ou de tous),
# en mode « découpe » (fond transparent, pour le fond sombre de la salle).
# Usage : DEST=<dossier> ./lot.sh [slug ...]   (réglages : W, H, SUBDIV, SAMPLES, THREADS)
HERE=$(cd "$(dirname "$0")" && pwd)
DEST=${DEST:-$HERE/rendus}
mkdir -p "$DEST"
W=${W:-1000}; H=${H:-875}; SUBDIV=${SUBDIV:-2}; SAMPLES=${SAMPLES:-24}; THREADS=${THREADS:-4}
for line in $(cd "$HERE" && python3 list_frames.py "$@" | tr ' ' ':'); do
  slug=${line%%:*}; k=${line##*:}
  out=$DEST/$slug-$k
  [ -f "$out-decoupe.png" ] && continue
  T=$k STYLE=dessin SCULPT=1 SUBDIV=$SUBDIV THREADS=$THREADS python3 "$HERE/render.py" $slug $out.png auto $SAMPLES $W $H > $out.log 2>&1
  NOCROP=1 python3 "$HERE/npr3.py" ${out}_passes $out-decoupe.png decoupe >> $out.log 2>&1
  echo "$(date +%T) $slug $k $(grep -c Traceback $out.log)"
done
echo FINI
