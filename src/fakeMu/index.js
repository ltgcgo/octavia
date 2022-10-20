"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import {MuDisplay} from "../disp/index.mjs";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";
import {
	getBridge
} from "../bridge/index.mjs";

let demoBlobs = {};
let demoModes = [];
demoModes[9] = "gm";
let useMidiBus = false;

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
		muVis.switchMode(e.title, true);
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
		audioPlayer.pause();
		if (!demoBlobs[e.title]?.midi) {
			demoBlobs[e.title] = {};
			audioPlayer.src = "about:blank";
			demoBlobs[e.title].midi = await (await fetch(`./demo/${e.title}.mid`)).blob();
			demoBlobs[e.title].wave = await (await fetch(`./demo/${e.title}.opus`)).blob();
		};
		audioPlayer.currentTime = 0;
		muVis.reset();
		muVis.loadFile(demoBlobs[e.title].midi);
		if (audioBlob) {
			URL.revokeObjectURL(audioBlob);
		};
		audioBlob = demoBlobs[e.title].wave;
		audioPlayer.src = URL.createObjectURL(audioBlob);
		if (demoModes[i]?.length > 0) {
			muVis.switchMode(demoModes[i]);
		};
		stDemo.to(i);
	});
});

// Start the visualizers
self.muVis = new MuDisplay();
muVis.addEventListener("reset", function (e) {
	console.info("Processor reset.");
});

// Listen to mode switches
muVis.addEventListener("mode", function (ev) {
	stSwitch.to(stSwitchMode.indexOf(ev.data));
});

// Open the files
let midwIndicator = $e("#openMidw");
let audioBlob;
const propsMid = JSON.parse('{"extensions":[".mid",".MID",".kar",".KAR",".syx",".SYX"],"startIn":"music","id":"midiOpener","description":"Open a MIDI file"}'),
propsAud = JSON.parse('{"mimeTypes":["audio/*"],"startIn":"music","id":"audioOpener","description":"Open an audio file"}');
$e("#openMidi").addEventListener("click", async function () {
	useMidiBus = false;
	midwIndicator.classList.off("active");
	let file = await fileOpen(propsMid);
	let fileSplit = file.name.lastIndexOf("."), ext = "";
	if (fileSplit > -1) {
		ext = file.name.slice(fileSplit + 1).toLowerCase();
	};
	if (ext == "syx") {
		// Load SysEx blobs
		muVis.sendCmd({type: 15, track: 0, data: new Uint8Array(await file.arrayBuffer())});
	} else {
		stDemo.to(-1);
		muVis.reset();
		muVis.loadFile(file);
	};
});
$e("#openAudio").addEventListener("click", async function () {
	useMidiBus = false;
	midwIndicator.classList.off("active");
	if (audioBlob) {
		URL.revokeObjectURL(audioBlob);
	};
	audioBlob = await fileOpen(propsAud);
	audioPlayer.src = URL.createObjectURL(audioBlob);
});
midwIndicator.addEventListener("click", function () {
	stDemo.to(-1);
	if (audioBlob) {
		URL.revokeObjectURL(audioBlob);
	};
	audioBlob = null;
	audioPlayer.src = "";
	muVis.reset();
	useMidiBus = true;
	midwIndicator.classList.on("active");
});

// Get canvas
let dispCanv = $e("#ymhMu");
let dispCtx = dispCanv.getContext("2d");
dispCanv.addEventListener("wheel", function (ev) {
	let ch = muVis.getCh();
	if (ev.deltaY > 0) {
		muVis.setCh(ch + 1);
	} else {
		muVis.setCh(ch - 1);
	};
});
dispCanv.addEventListener("mousedown", function (ev) {
	let ch = muVis.getCh();
	if (ev.offsetX < 64) {
		muVis.setCh(ch - 1);
	} else if (ev.offsetX >= 776) {
		muVis.setCh(ch + 1);
	};
});

// Render frames
let audioPlayer = $e("#audioPlayer");
audioPlayer.onended = function () {
	muVis.reset();
	audioPlayer.currentTime = 0;
};
(async function () {
	muVis.reset();
	let midiBlob = await (await fetch("./demo/KANDI8.mid")).blob();
	demoBlobs.KANDI8 = {};
	demoBlobs.KANDI8.midi = midiBlob;
	muVis.loadFile(midiBlob);
	if (audioBlob) {
		URL.revokeObjectURL(audioBlob);
	};
	audioBlob = await (await fetch("./demo/KANDI8.opus")).blob();
	demoBlobs.KANDI8.wave = audioBlob;
	audioPlayer.src = URL.createObjectURL(audioBlob);
})();
let lastTime = 0;
let renderThread = setInterval(function () {
	if (/*!audioPlayer.paused*/true) {
		let curTime = audioPlayer.currentTime - (self.audioDelay || 0);
		if (curTime < lastTime) {
		};
		muVis.render(curTime, dispCtx);
		lastTime = curTime;
	};
}, 20);

getBridge().addEventListener("message", function (ev) {
	if (useMidiBus) {
		muVis.sendCmd(ev.data);
	};
});
