#!/bin/bash
# Aperçus rapides : chaque image de chaque exercice, en petit (vérification des poses).
# Usage : ./apercus.sh [slug ...] → apercus/<slug>-<n>-e.png
HERE=$(cd "$(dirname "$0")" && pwd)
cd "$HERE"; mkdir -p apercus
job() { slug=$1; t=$2; out=apercus/$slug-$t
  T=$t STYLE=dessin SCULPT=1 SUBDIV=1 THREADS=1 python3 render.py $slug $out.png auto 6 360 315 > $out.log 2>&1
  NOCROP=1 python3 npr3.py ${out}_passes $out-e.png encre >> $out.log 2>&1
  echo "$(date +%T) $slug $t $(grep -c Traceback $out.log)"; }
export -f job
python3 list_frames.py "$@" | xargs -P ${PAR:-4} -n 2 bash -c 'job "$@"' _
echo FINI
