#!/bin/bash
function cpSafe {
	if [ -f "$2" ]; then
		echo "Overwriting \"$2\" has skipped!"
	else
		cp -v "$1" "$2"
	fi
}

mkdir -p cache
mkdir -p cache/download
cd cache/download
curl -H "Sec-Fetch-Mode: ltgcgo/octavia@github.com" -Ls "https://github.com/ltgcgo/midi-data/releases/download/pages-build/pages-build-br.tar" | tar xf -
mkdir -p ../source
mkdir -p ../target
cd ../source
rm *.mid 2>/dev/null
cpSafe "../download/artist/JayB/DREAMOFL.mid.br" .
cpSafe "../download/artist/JayB/HORIZON.mid.br" .
cpSafe "../download/artist/JayB/KANDI8.mid.br" .
cpSafe "../download/artist/JayB/Corgi (Full Version).mid.br" "./CORGI.mid.br"
cpSafe "../download/artist/ElectroKaplosion/Decades.mid.br" .
cpSafe "../download/artist/David J. Reading/Cybergate.mid.br" .
cpSafe "../download/artist/TôBach/MIDI Massacre.mid.br" .
# Gravis UltraSound demo songs
cpSafe "../download/vendor/gravis/ultrasound/chris2.mid.br" .
cpSafe "../download/vendor/gravis/ultrasound/chris3.mid.br" .
cpSafe "../download/vendor/gravis/ultrasound/entertnr.mid.br" .
cpSafe "../download/vendor/gravis/ultrasound/gdvib6.mid.br" .
cpSafe "../download/vendor/gravis/ultrasound/hero.mid.br" .
cpSafe "../download/vendor/gravis/ultrasound/hidnseek.mid.br" .
cpSafe "../download/vendor/gravis/ultrasound/techno78.mid.br" .
cpSafe "../download/vendor/gravis/ultrasound/the_rain.mid.br" .
cpSafe "../download/vendor/gravis/ultrasound/yelowros.mid.br" .
# Korg AI2 demo songs
cpSafe "../download/vendor/korg/ai2/05RWDEMO.mid.br" .
cpSafe "../download/vendor/korg/ai2/AGDEMO1.mid.br" .
cpSafe "../download/vendor/korg/ai2/AGDEMO2.mid.br" .
cpSafe "../download/vendor/korg/ai2/Korg - We've Got Dreams.mid.br" "./X5DDEMO2.mid.br"
cpSafe "../download/vendor/korg/ns5r/KORG - 2000 Fever.mid.br" "./2KFEVER.mid.br"
cpSafe "../download/vendor/korg/ns5r/KORG - MissionMan.mid.br" "./MISSION.mid.br"
# Korg PA demo songs
cpSafe "../download/vendor/korg/microArranger/7898.mid.br" .
cpSafe "../download/vendor/korg/microArranger/BLDPIANO.mid.br" .
cpSafe "../download/vendor/korg/microArranger/EASY.mid.br" .
cpSafe "../download/vendor/korg/microArranger/FILMSCOR.mid.br" .
cpSafe "../download/vendor/korg/microArranger/SNOWTOWN.mid.br" .
# Microslop demo songs
cpSafe "../download/vendor/microsoft/windows/canyon.mid.br" .
cpSafe "../download/vendor/microsoft/windows/clouds.mid.br" .
cpSafe "../download/vendor/microsoft/windows/flourish.mid.br" .
cpSafe "../download/vendor/microsoft/windows/onestop.mid.br" .
cpSafe "../download/vendor/microsoft/windows/passport.mid.br" .
cpSafe "../download/vendor/microsoft/windows/town.mid.br" .
# Roland HyperCanvas
cpSafe "../download/vendor/roland/hypercanvas/04Orch.mid.br" .
# SC-55 demo songs
cpSafe "../download/artist/Lim Chong Voon/BLUE_P.mid.br" .
cpSafe "../download/artist/John Campbell/BOP_U.mid.br" .
cpSafe "../download/artist/川口淳一/ETHNO_PA.mid.br" .
cpSafe "../download/vendor/roland/sc-55/HOME_ON.mid.br" .
cpSafe "../download/artist/Chas Smith/LOW_FLY.mid.br" .
cpSafe "../download/artist/Adrian Scott/MONOPOLY.mid.br" .
cpSafe "../download/artist/John Campbell/MOON_L.mid.br" .
cpSafe "../download/artist/John Campbell/StarGame.mid.br" .
cpSafe "../download/vendor/roland/sc-55/WORM.mid.br" .
# SC-88 demo songs
cpSafe "../download/vendor/roland/sc-88/Y4002_01.mid.br" .
cpSafe "../download/vendor/roland/sc-88/Y4002_02.mid.br" .
cpSafe "../download/vendor/roland/sc-88/Y4002_03.mid.br" .
cpSafe "../download/vendor/roland/sc-88/Y4002_05.mid.br" .
cpSafe "../download/vendor/roland/sc-88/Y4002_06.mid.br" .
cpSafe "../download/vendor/roland/sc-88/Y4002_07.mid.br" .
# SC-88 Pro demo songs
cpSafe "../download/vendor/roland/sc-88pro/05EPiano.mid.br" .
cpSafe "../download/vendor/roland/sc-88pro/11Gt_EFX.mid.br" .
cpSafe "../download/vendor/roland/sc-88pro/13Wah_G.mid.br" .
cpSafe "../download/vendor/roland/sc-88pro/21Ochstr.mid.br" .
cpSafe "../download/vendor/roland/sc-88pro/30Syn_H.mid.br" .
# SC-8850 demo songs
cpSafe "../download/vendor/roland/sc-8850/01JAZZ.mid.br" .
cpSafe "../download/vendor/roland/sc-8850/02DANCE.mid.br" .
cpSafe "../download/vendor/roland/sc-8850/05ORCHE.mid.br" .
cpSafe "../download/vendor/roland/sc-8850/06DRUM.mid.br" .
cpSafe "../download/vendor/roland/sc-8850/07SFX.mid.br" .
cpSafe "../download/artist/原田智宏/10GAMLAN.mid.br" .
# SC-8820 demo songs
cpSafe "../download/vendor/roland/sc-8820/26orchst.mid.br" "./SC8820.26orchst.mid.br"
cpSafe "../download/vendor/roland/sc-8820/dance.mid.br" "./SC8820.dance.mid.br"
cpSafe "../download/vendor/roland/sc-8820/fusion.mid.br" "./SC8820.fusion.mid.br"
cpSafe "../download/vendor/roland/sc-8820/sfx.mid.br" "./SC8820.sfx.mid.br"
# SD-20 demo songs
#cpSafe "../download/vendor/roland/sd-20/Demo01.mid.br" "./SD20_D1.mid"
#cpSafe "../download/vendor/roland/sd-20/Demo04.mid.br" "./SD20_D4.mid"
#cpSafe "../download/vendor/roland/sd-20/Demo05.mid.br" "./SD20_D5.mid"
# SD-90 demo songs
cpSafe "../download/vendor/roland/sd-90/01Piano.mid.br" .
cpSafe "../download/vendor/roland/sd-90/04NylonG.mid.br" .
cpSafe "../download/vendor/roland/sd-90/07Gt_Org.mid.br" .
cpSafe "../download/vendor/roland/sd-90/08Violin.mid.br" .
cpSafe "../download/vendor/roland/sd-90/10JzFunk.mid.br" .
cpSafe "../download/vendor/roland/sd-90/13Tpt.mid.br" .
cpSafe "../download/vendor/roland/sd-90/14WindOc.mid.br" .
cpSafe "../download/vendor/roland/sd-90/16Techno.mid.br" .
# Motif ES demo songs
cpSafe "../download/vendor/yamaha/motif_es/BlueMan.mid.br" .
cpSafe "../download/vendor/yamaha/motif_es/LandOfPeace.mid.br" .
cpSafe "../download/vendor/yamaha/motif_es/OneWorld.mid.br" .
cpSafe "../download/vendor/yamaha/motif_es/TheLanes.mid.br" .
cpSafe "../download/vendor/yamaha/motif_es/TranceAct.mid.br" .
# MU built-in ROM and demo disk demo songs
cpSafe "../download/vendor/yamaha/mu/Amazing.mid.br" .
cpSafe "../download/vendor/yamaha/mu/Classic.mid.br" .
cpSafe "../download/vendor/yamaha/mu/F-Cool.mid.br" .
cpSafe "../download/vendor/yamaha/mu/Jingle.mid.br" .
cpSafe "../download/vendor/yamaha/mu/MU128DEMO.mid.br" . # ROM
cpSafe "../download/vendor/yamaha/mu/MU15DEMO.mid.br" . # ROM
cpSafe "../download/vendor/yamaha/mu/ninety_hipty.mid.br" . # ROM
cpSafe "../download/vendor/yamaha/mu/opus8.mid.br" .
cpSafe "../download/vendor/yamaha/mu/OutOfTheMuse.mid.br" .
cpSafe "../download/vendor/yamaha/mu/PhoenixA.mid.br" . # ROM
cpSafe "../download/vendor/yamaha/mu/PhoenixB.mid.br" . # ROM
cpSafe "../download/vendor/yamaha/mu/R-loveLM.mid.br" . # ROM
cpSafe "../download/vendor/yamaha/mu/R-love.mid.br" . # ROM
cpSafe "../download/artist/Sam Sketty/rushhour.mid.br" .
cpSafe "../download/vendor/yamaha/mu/sa-world.mid.br" .
cpSafe "../download/vendor/yamaha/mu/TheMusithm.mid.br" . # ROM
cpSafe "../download/vendor/yamaha/mu/Trance.mid.br" "./MU100.Trance.mid.br"
# PLG150-AN demo songs
cpSafe "../download/vendor/yamaha/plg_an/RnB.mid.br" "./PLG-AN.RnB.mid.br"
cpSafe "../download/vendor/yamaha/plg_an/Trance.mid.br" "./PLG-AN.Trance.mid.br"
# PLG150-AP/PF demo songs
cpSafe "../download/vendor/yamaha/plg_ap/Arabesq.mid.br" .
cpSafe "../download/vendor/yamaha/plg_ap/Bounce.mid.br" .
cpSafe "../download/vendor/yamaha/plg_ap/Solace.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pf/02THEATR.mid.br" .
# PLG150-DR/PC demo songs
cpSafe "../download/vendor/yamaha/plg_dr/DSL_DEMO.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pc/PXG_DEMO.mid.br" .
# PLG1X0-DX demo songs
cpSafe "../download/vendor/yamaha/plg_dx/02COLORS.mid.br" .
cpSafe "../download/vendor/yamaha/plg_dx/12DROCK.mid.br" .
cpSafe "../download/vendor/yamaha/plg_dx/12EP.mid.br" .
cpSafe "../download/vendor/yamaha/plg_dx/12IEKIA.mid.br" .
cpSafe "../download/vendor/yamaha/plg_dx/12POP80.mid.br" .
cpSafe "../download/vendor/yamaha/plg_dx/12SHTDM.mid.br" .
cpSafe "../download/vendor/yamaha/plg_dx/12SOULDX.mid.br" .
cpSafe "../download/vendor/yamaha/plg_dx/12VOICE.mid.br" .
# PLG100-SG demo songs
cpSafe "../download/vendor/yamaha/plg_sg/fmtnight.mid.br" .
cpSafe "../download/vendor/yamaha/plg_sg/sg_koi.mid.br" .
cpSafe "../download/vendor/yamaha/plg_sg/sg_mura.mid.br" .
cpSafe "../download/vendor/yamaha/plg_sg/sg_yuki.mid.br" .
# PLG1X0-VL demo songs
cpSafe "../download/vendor/yamaha/plg_vl/Clouds.mid.br" .
cpSafe "../download/vendor/yamaha/plg_vl/CoolJiva.mid.br" .
cpSafe "../download/vendor/yamaha/plg_vl/DinoJung.mid.br" .
cpSafe "../download/vendor/yamaha/plg_vl/DoGrooVA.mid.br" .
cpSafe "../download/vendor/yamaha/plg_vl/FatPizz.mid.br" .
cpSafe "../download/vendor/yamaha/plg_vl/Nobody.mid.br" .
cpSafe "../download/vendor/yamaha/plg_vl/Oxygen.mid.br" .
cpSafe "../download/vendor/yamaha/plg_vl/Silhouet.mid.br" .
cpSafe "../download/vendor/yamaha/plg_vl/USPatrol.mid.br" .
cpSafe "../download/vendor/yamaha/plg_vl/VAmbient.mid.br" .
cpSafe "../download/vendor/yamaha/plg_vl/VLjazzy.mid.br" .
cpSafe "../download/vendor/yamaha/plg_vl/VLMarch.mid.br" .
cpSafe "../download/vendor/yamaha/plg_vl/Wiener.mid.br" .
# PLG-PVL demo songs
cpSafe "../download/vendor/yamaha/plg_pvl/BarbHip.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pvl/BlkHole.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pvl/DeepHip.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pvl/FLight.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pvl/GRPlayer.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pvl/HrtBeat.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pvl/JzPicnte.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pvl/PRckStar.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pvl/Sincere.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pvl/Tabiji.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pvl/Taiga.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pvl/Timeless.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pvl/UnderGrd.mid.br" .
cpSafe "../download/vendor/yamaha/plg_pvl/Virtual.mid.br" .
# PSR lineup built-in ROM demo songs
cpSafe "../download/vendor/yamaha/psr/Castaway.mid.br" .
cpSafe "../download/vendor/yamaha/psr/Cruisin.mid.br" .
cpSafe "../download/vendor/yamaha/psr/D660-01.mid.br" .
cpSafe "../download/vendor/yamaha/psr/NV80-01.mid.br" .
cpSafe "../download/vendor/yamaha/psr/D660-02.mid.br" .
cpSafe "../download/vendor/yamaha/psr/D660-12.mid.br" .
cpSafe "../download/vendor/yamaha/psr/P530-08.mid.br" .
cpSafe "../download/vendor/yamaha/psr/P730-13.mid.br" .
cpSafe "../download/vendor/yamaha/psr/P2000-06.mid.br" .
# QY70 demo songs
cpSafe "../download/vendor/yamaha/qy/QY70D_1.mid.br" .
cpSafe "../download/vendor/yamaha/qy/QY70D_2.mid.br" .
cpSafe "../download/vendor/yamaha/qy/QY70D_3.mid.br" .
# QY100 demo songs
cpSafe "../download/vendor/yamaha/qy/QY100D_1.mid.br" .
cpSafe "../download/vendor/yamaha/qy/QY100D_2.mid.br" .
cpSafe "../download/vendor/yamaha/qy/QY100D_3.mid.br" .
# S90 ES demo songs
cpSafe "../download/vendor/yamaha/s90_es/DJEthnik.mid.br" .
cpSafe "../download/vendor/yamaha/s90_es/ForToots.mid.br" .
cpSafe "../download/vendor/yamaha/s90_es/MarsSafari.mid.br" .
cpSafe "../download/vendor/yamaha/s90_es/TheyreGone.mid.br" .
cpSafe "../download/vendor/yamaha/s90_es/True Colors (S80).mid.br" "./TrueColors.S80-S90ES.mid.br"
# XG Techno Kit demo songs
cpSafe "../download/vendor/yamaha/techno_kit/1EASTSNG.mid.br" .
cpSafe "../download/vendor/yamaha/techno_kit/3FILTSNG.mid.br" .
cpSafe "../download/vendor/yamaha/techno_kit/4CLUBSNG.mid.br" .
cpSafe "../download/vendor/yamaha/techno_kit/6COOLSNG.mid.br" .
# VL70-m built-in ROM demo songs
cpSafe "../download/vendor/yamaha/vl70m/02_Jazz Trumpet.mid.br" "./VL70_D2.mid.br"
cpSafe "../download/vendor/yamaha/vl70m/03_Shakuhachi.mid.br" "./VL70_D3.mid.br"
cpSafe "../download/vendor/yamaha/vl70m/04_Guitar Hero.mid.br" "./VL70_D4.mid.br"
cpSafe "../download/vendor/yamaha/vl70m/06_Waterphone.mid.br" "./VL70_D6.mid.br"
# XGStudio demo songs
cpSafe "../download/vendor/yamaha/xgstudio/01Electr.mid.br" .
cpSafe "../download/vendor/yamaha/xgstudio/02Sticks.mid.br" .
cpSafe "../download/vendor/yamaha/xgstudio/03Waltz.mid.br" .
cpSafe "../download/vendor/yamaha/xgstudio/04Techno.mid.br" .
brotli -vdj *.br
#curl -H "Sec-Fetch-Mode: ltgcgo/octavia@github.com" -Ls "92940_Human.mid" "https://furbnet.com/92940_Human.mid" # Server error, breaks their own MIDI preview feature as of 7 Oct 2026.
exit