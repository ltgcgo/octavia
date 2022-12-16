"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import {MuDisplay} from "../disp/index.mjs";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";
import {
	getBridge
} from "../bridge/index.mjs";

import {
	PointEvent,
	RangeEvent,
	TimedEvents
} from "../../libs/lightfelt@ltgcgo/ext/timedEvents.js";

let demoBlobs = {};
let demoPerfs = {};
let demoModes = [];
demoModes[9] = "gm";
let currentPerformance;
let useMidiBus = false;

// Generate Octavia channel switch SysEx
let generateSwitch = function (ch = 0, min, max) {
	let data = [67, 16, 73, 0, 0, 10, ch];
	if (min?.constructor == Number) {
		data.push(min);
		if (max.constructor == Number) {
			data.push(max);
		};
	};
	return {
		type: 15,
		track: 0,
		data
	};
};

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
		currentPerformance = demoPerfs[e.title];
		currentPerformance?.resetIndex();
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
	currentPerformance?.resetIndex();
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
		if (currentPerformance) {
			currentPerformance.step(curTime)?.forEach((e) => {
				muVis.sendCmd(e.data);
			});
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

self.visualizer = muVis;
self.performance = currentPerformance;

// Hardcoded performance
{
	// Ninety Hipty
	let perf = new TimedEvents();
	perf.push(new PointEvent(0.5, generateSwitch(1, 0, 0)));
	perf.push(new PointEvent(19.7, generateSwitch(11)));
	perf.push(new PointEvent(28.5, generateSwitch(12)));
	perf.push(new PointEvent(37.4, generateSwitch(4, 0, 1)));
	perf.push(new PointEvent(45.8, generateSwitch(2)));
	perf.push(new PointEvent(50.6, generateSwitch(3)));
	perf.push(new PointEvent(54.9, generateSwitch(4)));
	perf.push(new PointEvent(74.4, generateSwitch(0)));
	perf.push(new PointEvent(76.85, generateSwitch(9)));
	perf.push(new PointEvent(81.75, generateSwitch(10)));
	perf.push(new PointEvent(86.6, generateSwitch(25)));
	perf.push(new PointEvent(96.7, generateSwitch(13)));
	perf.push(new PointEvent(106.2, generateSwitch(22)));
	perf.push(new PointEvent(111.25, generateSwitch(23)));
	perf.push(new PointEvent(116.1, generateSwitch(17)));
	perf.push(new PointEvent(121, generateSwitch(13)));
	perf.push(new PointEvent(127.9, generateSwitch(8)));
	perf.push(new PointEvent(138, generateSwitch(0)));
	perf.fresh();
	demoPerfs["ninety_hipty"] = perf;
};
{
	// Is it realy love?
	let perf = new TimedEvents();
	perf.push(new PointEvent(1.8, generateSwitch(24, 1, 2)));
	perf.push(new PointEvent(7.6, generateSwitch(29)));
	perf.push(new PointEvent(10.53, generateSwitch(0, 0, 1)));
	perf.push(new PointEvent(20.9, generateSwitch(22)));
	perf.push(new PointEvent(28.47, generateSwitch(23)));
	perf.push(new PointEvent(31.1, generateSwitch(3, 0, 0)));
	perf.push(new PointEvent(38.88, generateSwitch(17, 1, 1)));
	perf.push(new PointEvent(41.02, generateSwitch(5, 0, 1)));
	perf.push(new PointEvent(48.59, generateSwitch(17)));
	perf.push(new PointEvent(50.9, generateSwitch(0, 0, 0)));
	perf.push(new PointEvent(70.7, generateSwitch(1, 0, 1)));
	perf.push(new PointEvent(78.2, generateSwitch(17)));
	perf.push(new PointEvent(80.79, generateSwitch(2)));
	perf.push(new PointEvent(88.65, generateSwitch(1)));
	perf.push(new PointEvent(90.02, generateSwitch(2)));
	perf.push(new PointEvent(91.11, generateSwitch(1)));
	perf.push(new PointEvent(92.43, generateSwitch(2)));
	perf.push(new PointEvent(93.18, generateSwitch(0, 0, 0)));
	perf.push(new PointEvent(112.9, generateSwitch(1, 0, 1)));
	perf.push(new PointEvent(119, generateSwitch(17)));
	perf.push(new PointEvent(122.64, generateSwitch(2)));
	perf.push(new PointEvent(130.12, generateSwitch(15)));
	perf.push(new PointEvent(132.73, generateSwitch(0, 0, 0)));
	perf.push(new PointEvent(152.54, generateSwitch(1, 0, 1)));
	perf.push(new PointEvent(158.66, generateSwitch(17)));
	perf.push(new PointEvent(162.39, generateSwitch(2)));
	perf.push(new PointEvent(166.24, generateSwitch(14)));
	perf.push(new PointEvent(172.26, generateSwitch(8, 0, 0)));
	perf.push(new PointEvent(182.23, generateSwitch(8, 0, 1)));
	perf.push(new PointEvent(191.81, generateSwitch(23, 1, 1)));
	perf.push(new PointEvent(193, generateSwitch(0, 0, 0)));
	perf.fresh();
	demoPerfs["R-love"] = perf;
};
