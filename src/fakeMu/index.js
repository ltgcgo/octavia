"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import MuDisplay from "../disp/disp_mu.mjs";
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
let demoInfo = {};
let demoModes = [];
demoModes[9] = "gm";
let currentPerformance;
let currentAnimation;
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
let generateString = function (text) {
	let data = [67, 16, 76, 6, 0, 0];
	for (let c = 0; c < text.length; c ++) {
		data.push(text.charCodeAt(c));
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
		visualizer.switchMode(e.title, true);
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
		currentAnimation = demoInfo[e.title];
		audioPlayer.currentTime = 0;
		visualizer.reset();
		visualizer.loadFile(demoBlobs[e.title].midi);
		if (audioBlob) {
			URL.revokeObjectURL(audioBlob);
		};
		audioBlob = demoBlobs[e.title].wave;
		audioPlayer.src = URL.createObjectURL(audioBlob);
		if (demoModes[i]?.length > 0) {
			visualizer.switchMode(demoModes[i]);
		};
		stDemo.to(i);
	});
});

// Start the visualizers
self.visualizer = new MuDisplay();
visualizer.addEventListener("reset", function (e) {
	console.info("Processor reset.");
});

// Listen to mode switches
visualizer.addEventListener("mode", function (ev) {
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
		visualizer.sendCmd({type: 15, track: 0, data: new Uint8Array(await file.arrayBuffer())});
	} else {
		stDemo.to(-1);
		visualizer.reset();
		visualizer.loadFile(file);
		currentPerformance = undefined;
		currentAnimation = undefined;
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
	visualizer.reset();
	useMidiBus = true;
	midwIndicator.classList.on("active");
});

// Get canvas
let dispCanv = $e("#ymhMu");
let dispCtx = dispCanv.getContext("2d");
dispCanv.addEventListener("wheel", function (ev) {
	let ch = visualizer.getCh();
	if (ev.deltaY > 0) {
		visualizer.setCh(ch + 1);
	} else {
		visualizer.setCh(ch - 1);
	};
});
dispCanv.addEventListener("mousedown", function (ev) {
	let ch = visualizer.getCh();
	if (ev.offsetX < 64) {
		visualizer.setCh(ch - 1);
	} else if (ev.offsetX >= 776) {
		visualizer.setCh(ch + 1);
	};
});

// Render frames
let audioPlayer = $e("#audioPlayer");
audioPlayer.onended = function () {
	visualizer.reset();
	currentPerformance?.resetIndex();
	audioPlayer.currentTime = 0;
};
(async function () {
	visualizer.reset();
	let midiBlob = await (await fetch("./demo/KANDI8.mid")).blob();
	demoBlobs.KANDI8 = {};
	demoBlobs.KANDI8.midi = midiBlob;
	visualizer.loadFile(midiBlob);
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
				visualizer.sendCmd(e.data);
			});
		};
		if (currentAnimation && !visualizer.demoInfo) {
			visualizer.demoInfo = currentAnimation;
		};
		visualizer.render(curTime, dispCtx);
		lastTime = curTime;
	};
}, 20);

getBridge().addEventListener("message", function (ev) {
	if (useMidiBus) {
		visualizer.sendCmd(ev.data);
	};
});

self.visualizer = visualizer;
self.performance = currentPerformance;

// Hardcoded animation reference
{
	let mu80Ani = {class: "mubasic", fps: 10, size: 16};
	let mu1kAni = {class: "munativ", fps: 8, size: 32};
	demoInfo["ninety_hipty"] = mu80Ani;
	demoInfo["OutOfTheMuse"] = mu80Ani;
	demoInfo["MU100DEMO"] = mu80Ani;
	demoInfo["TheMusithm"] = mu80Ani;
	demoInfo["MU128DEMO"] = mu80Ani;
	demoInfo["PhoenixA"] = mu1kAni;
	demoInfo["PhoenixB"] = mu1kAni;
	demoInfo["R-love"] = mu1kAni;
};

// Hardcoded performance
{
	// PhoenixA
	let perf = new TimedEvents();
	perf.push(new PointEvent(0, generateString(`     YAMAHA      TONE GENERATOR `)));
	perf.push(new PointEvent(0, generateSwitch(0, 0, 0)));
	perf.push(new PointEvent(2.52, generateString(`     YAMAHA      TONE GENERATOR `)));
	perf.push(new PointEvent(5.04, generateString(`      YAMAHA      TONE GENERATOR`)));
	perf.push(new PointEvent(5.21, generateString(`       YAMAHA      TONE GENERATO`)));
	perf.push(new PointEvent(5.37, generateString(`        YAMAHA      TONE GENERAT`)));
	perf.push(new PointEvent(5.54, generateString(`         YAMAHA      TONE GENERA`)));
	perf.push(new PointEvent(5.71, generateString(`          YAMAHA      TONE GENER`)));
	perf.push(new PointEvent(5.87, generateString(`           YAMAH       TONE GENE`)));
	perf.push(new PointEvent(6.04, generateString(`            YAMA        TONE GEN`)));
	perf.push(new PointEvent(6.21, generateString(`             YAM         TONE GE`)));
	perf.push(new PointEvent(6.38, generateString(`              YA          TONE G`)));
	perf.push(new PointEvent(6.54, generateString(`               Y           TONE `)));
	perf.push(new PointEvent(6.71, generateString(`                            TONE`)));
	perf.push(new PointEvent(6.88, generateString(`                             TON`)));
	perf.push(new PointEvent(7.04, generateString(`                              TO`)));
	perf.push(new PointEvent(7.21, generateString(`                               T`)));
	perf.push(new PointEvent(7.38, generateString(`                                `)));
	perf.push(new PointEvent(7.52, generateString(`        MU1000                  `)));
	perf.push(new PointEvent(8.14, generateString(`                                `)));
	perf.push(new PointEvent(8.76, generateString(`        MU1000                  `)));
	perf.push(new PointEvent(9.38, generateString(`                                `)));
	perf.push(new PointEvent(10.08, generateString(`        MU1000                  `)));
	perf.push(new PointEvent(10.49, generateString(`        DU1000                  `)));
	perf.push(new PointEvent(10.92, generateString(`        Db1000           0      `)));
	perf.push(new PointEvent(11.33, generateString(`        Dbl000           06     `)));
	perf.push(new PointEvent(11.75, generateString(`        DblC00           066    `)));
	perf.push(new PointEvent(12.17, generateString(`        DblCo0           066    `)));
	perf.push(new PointEvent(12.59, generateString(`        DblCon           066 0  `)));
	perf.push(new PointEvent(13.01, generateString(`        DblConG          066 00 `)));
	perf.push(new PointEvent(13.42, generateString(`        DblConGr         066 001`)));
	perf.push(new PointEvent(27.98, generateSwitch(4)));
	perf.push(new PointEvent(43.85, generateSwitch(10)));
	perf.push(new PointEvent(63.33, generateSwitch(19, 1, 1)));
	perf.push(new PointEvent(103.31, generateSwitch(34, 2, 2)));
	perf.push(new PointEvent(109.52, generateSwitch(35)));
	perf.push(new PointEvent(114.32, generateSwitch(32)));
	perf.push(new PointEvent(119.36, generateSwitch(33)));
	perf.push(new PointEvent(123.68, generateSwitch(36)));
	perf.push(new PointEvent(128.91, generateSwitch(41)));
	perf.push(new PointEvent(140.83, generateSwitch(45)));
	perf.push(new PointEvent(153.29, generateSwitch(42)));
	perf.push(new PointEvent(176.74, generateSwitch(2, 0, 0)));
	perf.push(new PointEvent(178.27, generateString(`        WindChim.        SFX 070`)));
	perf.push(new PointEvent(178.92, generateString(`        WindChim .       SFX 070`)));
	perf.push(new PointEvent(179.56, generateString(`        WindChim  .      SFX 070`)));
	perf.push(new PointEvent(180.21, generateString(`        WindChim   .     SFX 070`)));
	perf.push(new PointEvent(180.85, generateString(`        WindChim    .    SFX 070`)));
	perf.push(new PointEvent(181.5, generateString(`        WindChim     .   SFX 070`)));
	perf.push(new PointEvent(182.14, generateString(`        WindChim      .  SFX 070`)));
	perf.push(new PointEvent(182.79, generateString(`        WindChim       . SFX 070`)));
	perf.push(new PointEvent(183.43, generateString(`        WindChim        .SFX 070`)));
	perf.push(new PointEvent(184.08, generateString(`        BindChim         .FX 070`)));
	perf.push(new PointEvent(184.72, generateString(`        BrndChim         0.X 070`)));
	perf.push(new PointEvent(185.36, generateString(`        BrtdChim         06. 070`)));
	perf.push(new PointEvent(186.01, generateString(`        BrtFChim         066.070`)));
	perf.push(new PointEvent(186.66, generateString(`        BrtFrhim         066 .70`)));
	perf.push(new PointEvent(187.3, generateString(`        BrtFrHim         066 0.0`)));
	perf.push(new PointEvent(187.89, generateString(`        BrtFrHrm         066 06.`)));
	perf.push(new PointEvent(187.95, generateString(`        BrtFrHrn         066 061`)));
	perf.fresh();
	demoPerfs["PhoenixA"] = perf;
};
{
	// PhoenixB
	let perf = new TimedEvents();
	perf.push(new PointEvent(0, generateString(`        BrtFrHrn         066 061`)));
	perf.push(new PointEvent(0, generateSwitch(11, 0, 0)));
	perf.push(new PointEvent(2.02, {type: 15, track: 0, data: [67, 16, 76, 6, 0, 64]}));
	perf.push(new PointEvent(38.19, generateSwitch(9)));
	perf.push(new PointEvent(40.05, generateSwitch(16, 0, 1)));
	perf.push(new PointEvent(40.67, generateSwitch(34, 0, 3)));
	perf.push(new PointEvent(44.61, generateSwitch(17, 0, 1)));
	perf.push(new PointEvent(47.59, generateSwitch(32, 0, 3)));
	perf.push(new PointEvent(53.64, generateSwitch(18)));
	perf.push(new PointEvent(54.89, generateSwitch(32)));
	perf.push(new PointEvent(56.01, generateSwitch(49)));
	perf.push(new PointEvent(58.47, generateSwitch(9, 0, 0)));
	perf.push(new PointEvent(61.79, generateSwitch(0)));
	perf.push(new PointEvent(71.54, generateSwitch(1)));
	perf.push(new PointEvent(78.46, generateSwitch(16, 0, 3)));
	perf.push(new PointEvent(80.33, generateSwitch(0, 0, 0)));
	perf.push(new PointEvent(83.43, generateSwitch(0, 0, 3)));
	perf.push(new PointEvent(84.86, generateSwitch(0, 0, 0)));
	perf.push(new PointEvent(87.83, generateSwitch(0, 0, 1)));
	perf.push(new PointEvent(89.29, generateSwitch(1, 0, 3)));
	perf.push(new PointEvent(93.61, generateSwitch(1, 0, 0)));
	perf.push(new PointEvent(98.21, generateSwitch(16, 0, 3)));
	perf.push(new PointEvent(102.93, generateSwitch(17, 0, 1)));
	perf.push(new PointEvent(107.45, generateSwitch(16, 0, 3)));
	perf.push(new PointEvent(107.78, generateSwitch(17, 0, 1)));
	perf.push(new PointEvent(110.97, generateSwitch(32, 0, 3)));
	perf.push(new PointEvent(111.98, generateSwitch(16, 0, 1)));
	perf.push(new PointEvent(113.27, generateSwitch(34, 0, 3)));
	perf.push(new PointEvent(114.18, generateSwitch(16, 0, 1)));
	perf.push(new PointEvent(115.75, generateSwitch(17, 0, 3)));
	perf.push(new PointEvent(123.01, generateSwitch(5, 0, 0)));
	perf.push(new PointEvent(124.53, generateSwitch(7, 0, 0)));
	perf.push(new PointEvent(126.06, generateSwitch(20, 1, 1)));
	perf.push(new PointEvent(126.78, generateSwitch(32, 0, 3)));
	perf.fresh();
	demoPerfs["PhoenixB"] = perf;
};
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
{
	// MU128 demo
	let perf = new TimedEvents();
	// Disable native RS
	perf.push(new PointEvent(0, {type: 15, track: 0, data: [67, 16, 73, 0, 0, 14, 0]}));
	perf.push(new PointEvent(0, generateSwitch(0, 0, 0)));
	perf.push(new PointEvent(1.6, generateSwitch(0, 0, 3)));
	perf.push(new PointEvent(40.02, generateSwitch(48, 3, 3)));
	perf.push(new PointEvent(41.68, generateSwitch(49)));
	perf.push(new PointEvent(43.07, generateSwitch(50)));
	perf.push(new PointEvent(44.65, generateSwitch(51)));
	perf.push(new PointEvent(46.2, generateSwitch(52)));
	perf.push(new PointEvent(47.74, generateSwitch(53)));
	perf.push(new PointEvent(49.29, generateSwitch(54)));
	perf.push(new PointEvent(50.83, generateSwitch(55)));
	perf.push(new PointEvent(52.38, generateSwitch(56)));
	perf.push(new PointEvent(53.92, generateSwitch(58)));
	perf.push(new PointEvent(55.47, generateSwitch(59)));
	perf.push(new PointEvent(57.02, generateSwitch(48)));
	perf.push(new PointEvent(69.56, generateSwitch(8, 0, 0)));
	perf.push(new PointEvent(70.54, generateSwitch(9)));
	perf.push(new PointEvent(71.52, generateSwitch(10)));
	perf.push(new PointEvent(72.5, generateSwitch(11)));
	perf.push(new PointEvent(73.48, generateSwitch(12)));
	perf.push(new PointEvent(74.46, generateSwitch(13)));
	perf.push(new PointEvent(75.44, generateSwitch(14)));
	perf.push(new PointEvent(76.42, generateSwitch(15)));
	perf.push(new PointEvent(77.4, generateSwitch(8)));
	perf.push(new PointEvent(81.18, generateSwitch(0)));
	perf.push(new PointEvent(82.15, generateSwitch(1)));
	perf.push(new PointEvent(83.12, generateSwitch(2)));
	perf.push(new PointEvent(84.09, generateSwitch(3)));
	perf.push(new PointEvent(85.06, generateSwitch(4)));
	perf.push(new PointEvent(86.03, generateSwitch(5)));
	perf.push(new PointEvent(87.0, generateSwitch(6)));
	perf.push(new PointEvent(87.97, generateSwitch(7)));
	perf.push(new PointEvent(88.94, generateSwitch(0)));
	perf.push(new PointEvent(96.66, generateSwitch(16, 1, 1)));
	perf.push(new PointEvent(98.15, generateSwitch(17)));
	perf.push(new PointEvent(99.63, generateSwitch(18)));
	perf.push(new PointEvent(101.12, generateSwitch(19)));
	perf.push(new PointEvent(102.6, generateSwitch(20)));
	perf.push(new PointEvent(104.09, generateSwitch(21)));
	perf.push(new PointEvent(105.57, generateSwitch(22)));
	perf.push(new PointEvent(107.06, generateSwitch(23)));
	perf.push(new PointEvent(108.54, generateSwitch(24)));
	perf.push(new PointEvent(110.03, generateSwitch(25)));
	perf.push(new PointEvent(111.51, generateSwitch(26)));
	perf.push(new PointEvent(112.99, generateSwitch(27)));
	perf.push(new PointEvent(114.48, generateSwitch(28)));
	perf.push(new PointEvent(115.97, generateSwitch(29)));
	perf.push(new PointEvent(117.45, generateSwitch(30)));
	perf.push(new PointEvent(118.94, generateSwitch(31)));
	perf.push(new PointEvent(120.42, generateSwitch(16)));
	perf.push(new PointEvent(122.34, generateSwitch(5, 0, 1)));
	perf.push(new PointEvent(158.26, generateSwitch(0)));
	perf.fresh();
	demoPerfs["MU128DEMO"] = perf;
};
