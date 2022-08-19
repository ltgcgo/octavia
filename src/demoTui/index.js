"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import {TuiDisplay} from "../disp/index.mjs";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";

let demoBlobs = {};
let demoModes = [];
demoModes[2] = "x5d";

// Standard switching
let stSwitch = $a("b.mode");
let stSwitchMode = [];
stSwitch.to = function (i) {
	stSwitch.forEach(function (e) {
		e.classList.off("active");
	});
	if (i > -1) {
		stSwitch[i].classList.on("active");
	};
};
stSwitch.forEach(function (e, i, a) {
	stSwitchMode[i] = e.title;
	e.addEventListener("click", function () {
		tuiVis.switchMode(e.title, true);
		stSwitch.to(i);
	});
});

// Standard demo switching
let stDemo = $a("b.demo");
stDemo.to = function (i) {
	stDemo.forEach(function (e) {
		e.classList.off("active");
	});
	if (i > -1) {
		stDemo[i].classList.on("active");
	};
};
stDemo.forEach(function (e, i, a) {
	e.addEventListener("click", async function () {
		if (!demoBlobs[e.title]?.midi) {
			demoBlobs[e.title] = {};
			demoBlobs[e.title].midi = await (await fetch(`./demo/${e.title}.mid`)).blob();
			demoBlobs[e.title].wave = await (await fetch(`./demo/${e.title}.opus`)).blob();
		};
		audioPlayer.pause();
		audioPlayer.currentTime = 0;
		tuiVis.reset();
		tuiVis.loadFile(demoBlobs[e.title].midi);
		if (audioBlob) {
			URL.revokeObjectURL(audioBlob);
		};
		audioBlob = demoBlobs[e.title].wave;
		audioPlayer.src = URL.createObjectURL(audioBlob);
		if (demoModes[i]?.length > 0) {
			tuiVis.switchMode(demoModes[i]);
		};
		if (i == 5) {
			self.audioDelay = 0.975;
		} else {
			self.audioDelay = 0;
		};
		stDemo.to(i);
	});
});

// Start the visualizers
self.tuiVis = new TuiDisplay();
tuiVis.addEventListener("reset", function (e) {
});

// Listen to mode switches
tuiVis.addEventListener("mode", function (ev) {
	stSwitch.to(stSwitchMode.indexOf(ev.data));
});

// Open the files
let audioBlob;
const propsMid = JSON.parse('{"extensions":[".mid",".MID"],"startIn":"music","id":"midiOpener","description":"Open a MIDI file"}'),
propsAud = JSON.parse('{"mimeTypes":["audio/*"],"startIn":"music","id":"audioOpener","description":"Open an audio file"}');
$e("#openMidi").addEventListener("click", async function () {
	stDemo.to(-1);
	tuiVis.reset();
	tuiVis.loadFile(await fileOpen(propsMid));
});
$e("#openAudio").addEventListener("click", async function () {
	if (audioBlob) {
		URL.revokeObjectURL(audioBlob);
	};
	audioBlob = await fileOpen(propsAud);
	audioPlayer.src = URL.createObjectURL(audioBlob);
});

// Render frames
let audioPlayer = $e("#audioPlayer");
let textDisplay = $e("#display");
audioPlayer.onended = function () {
	tuiVis.reset();
};
(async function () {
	tuiVis.reset();
	let midiBlob = await (await fetch("./demo/KANDI8.mid")).blob();
	demoBlobs.KANDI8 = {};
	demoBlobs.KANDI8.midi = midiBlob;
	tuiVis.loadFile(midiBlob);
	if (audioBlob) {
		URL.revokeObjectURL(audioBlob);
	};
	audioBlob = await (await fetch("./demo/KANDI8.opus")).blob();
	demoBlobs.KANDI8.wave = audioBlob;
	audioPlayer.src = URL.createObjectURL(audioBlob);
})();
let renderThread = setInterval(function () {
	if (!audioPlayer.paused) {
		textDisplay.innerHTML = tuiVis.render(audioPlayer.currentTime - (self.audioDelay || 0));
	};
}, 20);
