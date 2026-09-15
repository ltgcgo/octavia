#!/bin/bash
mkdir -p cache
mkdir -p cache/download
cd cache/download
curl -Ls "https://github.com/ltgcgo/midi-data/releases/download/pages-build/pages-build-br.tar" | tar xf -
mkdir -p ../source
mkdir -p ../target
cd ../source
rm *.mid 2>/dev/null
cp -v "../download/artist/JayB/DREAMOFL.mid.br" .
#cp -v "../download/artist/JayB/HORIZON.mid.br" .
cp -v "../download/artist/JayB/KANDI8.mid.br" .
#cp -v "../download/artist/JayB/Corgi (Full Version).mid.br" "./CORGI.mid.br"
cp -v "../download/artist/ElectroKaplosion/Decades.mid.br" .
cp -v "../download/artist/David J. Reading/Cybergate.mid.br" .
cp -v "../download/artist/John Campbell/StarGame.mid.br" .
cp -v "../download/artist/John Campbell/MOON_L.mid.br" .
cp -v "../download/artist/John Campbell/BOP_U.mid.br" .
cp -v "../download/artist/Lim Chong Voon/BLUE_P.mid.br" .
brotli -v -dj *.br
exit