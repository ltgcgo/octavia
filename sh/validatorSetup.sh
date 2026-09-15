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
cp -v "../download/artist/JayB/HORIZON.mid.br" .
cp -v "../download/artist/JayB/KANDI8.mid.br" .
#cp -v "../download/artist/JayB/Corgi (Full Version).mid.br" "./CORGI.mid.br"
cp -v "../download/artist/ElectroKaplosion/Decades.mid.br" .
cp -v "../download/artist/David J. Reading/Cybergate.mid.br" .
cp -v "../download/artist/John Campbell/StarGame.mid.br" .
cp -v "../download/artist/John Campbell/MOON_L.mid.br" .
cp -v "../download/artist/John Campbell/BOP_U.mid.br" .
cp -v "../download/artist/Lim Chong Voon/BLUE_P.mid.br" .
cp -v "../download/vendor/gravis/ultrasound/gdvib6.mid.br" .
cp -v "../download/vendor/gravis/ultrasound/the_rain.mid.br" .
cp -v "../download/vendor/korg/ai2/05RWDEMO.mid.br" .
cp -v "../download/vendor/korg/ai2/AGDEMO1.mid.br" .
cp -v "../download/vendor/korg/ai2/AGDEMO2.mid.br" .
cp -v "../download/vendor/korg/ai2/Korg - We've Got Dreams.mid.br" "./X5DDEMO2.mid.br"
cp -v "../download/vendor/korg/ns5r/KORG - MissionMan.mid.br" "./MISSION.mid.br"
cp -v "../download/vendor/microsoft/windows/onestop.mid.br" .
cp -v "../download/vendor/roland/hypercanvas/04Orch.mid.br" .
cp -v "../download/vendor/roland/sc-55/ETHNO_PA.mid.br" .
cp -v "../download/vendor/roland/sc-55/HOME_ON.mid.br" .
cp -v "../download/vendor/roland/sc-55/WORM.mid.br" .
cp -v "../download/vendor/roland/sc-88/Y4002_03.mid.br" .
cp -v "../download/vendor/roland/sc-88/Y4002_06.mid.br" .
cp -v "../download/vendor/roland/sc-88pro/11Gt_EFX.mid.br" .
cp -v "../download/vendor/roland/sc-88pro/13Wah_G.mid.br" .
cp -v "../download/vendor/roland/sc-8820/26orchst.mid.br" .
cp -v "../download/vendor/roland/sc-8850/06DRUM.mid.br" .
cp -v "../download/vendor/roland/sd-20/Demo04.mid.br" .
cp -v "../download/vendor/roland/sd-90/07Gt_Org.mid.br" .
cp -v "../download/vendor/yamaha/motif_es/TheLanes.mid.br" .
cp -v "../download/vendor/yamaha/motif_es/TranceAct.mid.br" .
cp -v "../download/vendor/yamaha/plg_dx/12SOULDX.mid.br" .
cp -v "../download/vendor/yamaha/plg_dx/12VOICE.mid.br" .
cp -v "../download/vendor/yamaha/plg_sg/fmtnight.mid.br" .
cp -v "../download/vendor/yamaha/plg_sg/sg_yuki.mid.br" .
cp -v "../download/vendor/yamaha/plg_vl/DinoJung.mid.br" .
#cp -v "../download/vendor/yamaha/plg_pvl/BlkHole.mid.br" .
cp -v "../download/vendor/yamaha/qy/QY70D_1.mid.br" .
cp -v "../download/vendor/yamaha/qy/QY100D_2.mid.br" .
#cp -v "../download/vendor/yamaha/xgstudio/04Techno.mid.br" .
brotli -v -dj *.br
exit