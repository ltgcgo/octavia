"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import Sc8850Display from "../disp/disp_sc8850.mjs";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";
import {
	getBridge
} from "../bridge/index.mjs";
import {SheetData} from "../basic/sheetLoad.js";

import {
	PointEvent,
	RangeEvent,
	TimedEvents
} from "../../libs/lightfelt@ltgcgo/ext/timedEvents.js";
import {gsChecksum} from "../state/utils.js";

let demoBlobs = {};
let demoPerfs = {};
let demoModes = [];
let currentPerformance;
demoModes[9] = "gm";
let useMidiBus = false;

let generateSwitch = function (ch = 0, min, max) {
	if (min !== undefined && max === undefined) {
		console.warn(`Invalid bounds for channel switch generation.`);
		return;
	};
	let data = [67, 16, 73, 11, 0, 0, ch];
	if (min !== undefined) {
		data.push(Math.floor(Math.log2(max - min + 1)), min);
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
let genNewSwitch = function (ch = 0) {
	return {
		type: 15,
		track: 0,
		data: [67, 16, 73, 11, 0, 0, ch]
	};
};
let genDispType = function (type = 0, peakHold) {
	let data = [65, 16, 69, 18, 16, 8, 0, type & 7];
	if (peakHold?.constructor) {
		data.push(peakHold);
	};
	data.push(gsChecksum(data.slice(4)));
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
		visualizer.device.switchMode(e.title, true, true);
		stSwitch.to(i);
	});
});

// Standard demo switching
let demoPool = new SheetData();
let stList = $e("span#demo-list"), stDemo = [];
const srcPaths = ['../../midi-demo-data/collection/octavia/', './demo/'];
let getBlobFrom = async function (filename) {
	let i = 0;
	while (i < srcPaths.length) {
		let e = srcPaths[i];
		let response = await fetch(`${e}${filename}`);
		if (response.status < 400) {
			return response;
		};
		i ++;
	};
	console.error(`Loading of data ${filename} failed.`);
};
let codepointArray = function (string) {
	let arr = new Uint16Array(string.length);
	arr.forEach((e, i, a) => {
		a[i] = string.charCodeAt(i);
	});
	return arr;
};
getBlobFrom(`list.tsv`).then(async (response) => {
	await demoPool.load(await response.text());
	//console.info(demoPool.data);
	demoPool.data.forEach((e, i) => {
		if (i) {
			let space = document.createElement("span");
			space.innerHTML = " ";
			stList.appendChild(space);
		} else {
			stList.innerText = "";
		};
		let demoChoice = document.createElement("b");
		demoChoice.innerText = e.text;
		demoChoice.title = e.file;
		demoChoice.standard = e.standard;
		demoChoice.classList.on("demo");
		stDemo.push(demoChoice);
		stList.appendChild(demoChoice);
	});
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
			visualizer.device.initOnReset = false;
			visualizer.device.setLetterDisplay(codepointArray(`\x8a${demoPool.data[i].artist.slice(0, 15).padEnd(15, " ")}\x8b${demoPool.data[i].title.slice(0, 15)}`));
			if (!demoBlobs[e.title]?.midi) {
				demoBlobs[e.title] = {};
				audioPlayer.src = "about:blank";
				demoBlobs[e.title].midi = await (await getBlobFrom(`${e.title}.mid`)).blob();
				demoBlobs[e.title].wave = await (await getBlobFrom(`${e.title}.opus`)).blob();
			};
			audioPlayer.currentTime = 0;
			visualizer.reset();
			visualizer.loadFile(demoBlobs[e.title].midi);
			if (audioBlob) {
				URL.revokeObjectURL(audioBlob);
			};
			audioBlob = demoBlobs[e.title].wave;
			audioPlayer.src = URL.createObjectURL(audioBlob);
			visualizer.device.setDetectionTargets(e.standard);
			if (demoModes[i]?.length > 0) {
				visualizer.switchMode(demoModes[i]);
			};
			stDemo.to(i);
			visualizer.device.setLetterDisplay(codepointArray(`\x8a${demoPool.data[i].artist.slice(0, 15).padEnd(15, " ")}\x8b${demoPool.data[i].title.slice(0, 15)}`));
			currentPerformance = demoPerfs[e.title];
			currentPerformance?.resetIndex();
		});
	});
});

// Start the visualizers
self.visualizer = new Sc8850Display({useBlur: true});
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
const propsMid = JSON.parse('{"extensions":[".mid",".MID",".kar",".KAR",".syx",".SYX",".s7e",".S7E",".pcg",".PCG"],"startIn":"music","id":"midiOpener","description":"Open a MIDI file"}'),
propsAud = JSON.parse('{"mimeTypes":["audio/*"],"startIn":"music","id":"audioOpener","description":"Open an audio file"}');
$e("#openMidi").addEventListener("click", async function () {
	useMidiBus = false;
	midwIndicator.classList.off("active");
	visualizer.device.initOnReset = false;
	let file = await fileOpen(propsMid);
	let fileSplit = file.name.lastIndexOf("."), ext = "";
	if (fileSplit > -1) {
		ext = file.name.slice(fileSplit + 1).toLowerCase();
	};
	switch (ext) {
		case "syx": {
			// Load SysEx blobs
			visualizer.sendCmd({type: 15, track: 0, data: new Uint8Array(await file.arrayBuffer())});
			break;
		};
		case "s7e":
		case "pcg": {
			// Load sound banks
			visualizer.device.loadBank(ext, file);
			break;
		};
		default: {
			// Load MIDI files
			stDemo.to(-1);
			visualizer.reset();
			visualizer.loadFile(file);
			visualizer.device.initOnReset = false;
			currentPerformance?.resetIndex();
			currentPerformance = undefined;
		};
	};
});
$e("#openAudio").addEventListener("click", async function () {
	useMidiBus = false;
	midwIndicator.classList.off("active");
	visualizer.device.initOnReset = false;
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
	visualizer.device.initOnReset = true;
	audioBlob = null;
	audioPlayer.src = "";
	visualizer.reset();
	useMidiBus = true;
	midwIndicator.classList.on("active");
});

// Get canvas
let dispCanv = $e("#rlndSc8850");
let dispCtx = dispCanv.getContext("2d");
dispCanv.addEventListener("wheel", function (ev) {
	ev.preventDefault();
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
	} else if (ev.offsetX >= 744) {
		visualizer.setCh(ch + 1);
	};
});

// Allow channel switching in browser console
self.toCh = function (ch) {
	visualizer.setCh(ch);
};

// Render frames
let audioPlayer = $e("#audioPlayer");
audioPlayer.onended = function () {
	visualizer.reset();
	currentPerformance?.resetIndex();
	audioPlayer.currentTime = 0;
};
(async function () {
	visualizer.reset();
	let midiBlob = await (await fetch("../../midi-demo-data/collection/octavia/KANDI8.mid")).blob();
	demoBlobs.KANDI8 = {};
	demoBlobs.KANDI8.midi = midiBlob;
	visualizer.loadFile(midiBlob);
	if (audioBlob) {
		URL.revokeObjectURL(audioBlob);
	};
	audioBlob = await (await fetch("../../midi-demo-data/collection/octavia/KANDI8.opus")).blob();
	demoBlobs.KANDI8.wave = audioBlob;
	audioPlayer.src = URL.createObjectURL(audioBlob);
	visualizer.loadMapPaths([
		`./data/map/gm.12.tsv`,
		`./data/map/ns5r.12.tsv`,
		`./data/map/xg.12.tsv`,
		`./data/map/gs.12.tsv`,
		`./data/map/sd.12.tsv`,
		`./data/map/s90es.12.tsv`,
		`./data/map/gm.10.tsv`,
		`./data/map/ns5r.10.tsv`,
		`./data/map/xg.10.tsv`,
		`./data/map/gs.10.tsv`,
		`./data/map/sd.10.tsv`,
		`./data/map/cs2x.10.tsv`,
		`./data/map/s90es.10.tsv`
	]);
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
		visualizer.render(curTime, dispCtx, location.hash === "#trueMode");
		lastTime = curTime;
	};
}, 20);

getBridge().addEventListener("message", function (ev) {
	if (useMidiBus) {
		visualizer.sendCmd(ev.data);
	};
});

// Hardcoded performance
{
	// PhoenixA
	let perf = new TimedEvents();
	perf.push(new PointEvent(0, generateString(`     YAMAHA      TONE GENERATOR `)));
	perf.push(new PointEvent(0.5, {type: 15, data: [67, 16, 73, 0, 0, 18, 1]}));
	perf.push(new PointEvent(0.8, generateSwitch(0, 0, 0)));
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
	perf.push(new PointEvent(10.49, generateString(`        DMU1000                 `)));
	perf.push(new PointEvent(10.92, generateString(`        DbMU1000         0      `)));
	perf.push(new PointEvent(11.33, generateString(`        DblMU100         06     `)));
	perf.push(new PointEvent(11.75, generateString(`        DblCMU10         066    `)));
	perf.push(new PointEvent(12.17, generateString(`        DblCoMU1         066    `)));
	perf.push(new PointEvent(12.59, generateString(`        DblConMU         066 0  `)));
	perf.push(new PointEvent(13.01, generateString(`        DblConGM         066 00 `)));
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
	perf.push(new PointEvent(0, generateSwitch(2, 0, 0)));
	perf.push(new PointEvent(0.5, {type: 15, data: [67, 16, 73, 0, 0, 18, 1]}));
	perf.push(new PointEvent(1, generateSwitch(11, 0, 0)));
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
	perf.push(new PointEvent(38.48, generateSwitch(17, 1, 1)));
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
	perf.push(new PointEvent(166.02, generateSwitch(14)));
	perf.push(new PointEvent(169.9, generateSwitch(21)));
	perf.push(new PointEvent(170.49, generateSwitch(20)));
	perf.push(new PointEvent(171.08, generateSwitch(19)));
	perf.push(new PointEvent(171.67, generateSwitch(18)));
	perf.push(new PointEvent(172.26, generateSwitch(8, 0, 0)));
	perf.push(new PointEvent(182.23, generateSwitch(8, 0, 1)));
	perf.push(new PointEvent(191.81, generateSwitch(23, 1, 1)));
	perf.push(new PointEvent(193, generateSwitch(0, 0, 0)));
	perf.fresh();
	demoPerfs["R-love"] = perf;
};
{
	// MU80 demo, Out of the Muse
	let perf = new TimedEvents();
	perf.push(new PointEvent(1.6, generateSwitch(19, 0, 1)));
	perf.push(new PointEvent(18.92, generateSwitch(3, 0, 0)));
	perf.push(new PointEvent(27.29, generateSwitch(2)));
	perf.push(new PointEvent(31.47, generateSwitch(9)));
	perf.push(new PointEvent(33.49, generateSwitch(10)));
	perf.push(new PointEvent(35.52, generateSwitch(19, 0, 1)));
	perf.push(new PointEvent(37.62, generateSwitch(1)));
	perf.push(new PointEvent(39.73, generateSwitch(3)));
	perf.push(new PointEvent(41.83, generateSwitch(6)));
	perf.push(new PointEvent(43.93, generateSwitch(18)));
	perf.push(new PointEvent(46.03, generateSwitch(19)));
	perf.push(new PointEvent(48.13, generateSwitch(21)));
	perf.push(new PointEvent(50.23, generateSwitch(24)));
	perf.push(new PointEvent(52.34, generateSwitch(3, 0, 0)));
	perf.push(new PointEvent(57.76, generateSwitch(4)));
	perf.push(new PointEvent(61.12, generateSwitch(3)));
	perf.push(new PointEvent(64.11, generateSwitch(4)));
	perf.push(new PointEvent(69.84, generateSwitch(6)));
	perf.push(new PointEvent(87.48, generateSwitch(4, 0, 1)));
	perf.push(new PointEvent(117.12, generateSwitch(23)));
	perf.push(new PointEvent(125, generateSwitch(0)));
	perf.fresh();
	demoPerfs["OutOfTheMuse"] = perf;
};
{
	// MU100 demo, It's an AmaZing MU World!!
	let perf = new TimedEvents();
	perf.push(new PointEvent(0.5, {type: 15, data: [67, 16, 73, 0, 0, 18, 1]}));
	perf.push(new PointEvent(3.28, generateSwitch(1)));
	perf.push(new PointEvent(6.22, generateSwitch(5)));
	perf.push(new PointEvent(7.93, generateSwitch(6)));
	perf.push(new PointEvent(10.92, generateSwitch(5)));
	perf.push(new PointEvent(13.98, generateSwitch(6)));
	perf.push(new PointEvent(17.31, generateSwitch(5)));
	perf.push(new PointEvent(18.64, generateSwitch(6)));
	perf.push(new PointEvent(23.93, generateSwitch(11)));
	perf.push(new PointEvent(24.41, generateSwitch(2)));
	perf.push(new PointEvent(24.89, generateSwitch(9)));
	perf.push(new PointEvent(25.37, generateSwitch(10)));
	perf.push(new PointEvent(25.89, generateSwitch(3)));
	perf.push(new PointEvent(27.87, generateSwitch(1)));
	perf.push(new PointEvent(29.85, generateSwitch(3)));
	perf.push(new PointEvent(31.83, generateSwitch(2)));
	perf.push(new PointEvent(33.81, generateSwitch(9)));
	perf.push(new PointEvent(35.79, generateSwitch(10)));
	perf.push(new PointEvent(37.75, generateSwitch(9)));
	perf.push(new PointEvent(39.73, generateSwitch(25)));
	perf.push(new PointEvent(41.84, generateSwitch(15)));
	perf.push(new PointEvent(43.93, generateSwitch(14)));
	perf.push(new PointEvent(46.02, generateSwitch(15)));
	perf.push(new PointEvent(50.25, generateSwitch(16)));
	perf.push(new PointEvent(54.46, generateSwitch(15)));
	perf.push(new PointEvent(58.37, generateSwitch(16)));
	perf.push(new PointEvent(62.34, generateSwitch(15)));
	perf.push(new PointEvent(66.58, generateSwitch(16)));
	perf.push(new PointEvent(70.41, generateSwitch(15)));
	perf.push(new PointEvent(74.64, generateSwitch(25)));
	perf.push(new PointEvent(77.96, generateSwitch(14)));
	perf.push(new PointEvent(79.97, generateSwitch(25)));
	perf.push(new PointEvent(80.47, generateSwitch(10)));
	perf.push(new PointEvent(80.97, generateSwitch(9)));
	perf.push(new PointEvent(81.48, generateSwitch(14)));
	perf.push(new PointEvent(81.98, generateSwitch(17)));
	perf.push(new PointEvent(85.99, generateSwitch(18)));
	perf.push(new PointEvent(88.03, generateSwitch(19)));
	perf.push(new PointEvent(91.49, generateSwitch(20)));
	perf.push(new PointEvent(93.15, generateSwitch(21)));
	perf.push(new PointEvent(95.98, generateSwitch(22)));
	perf.push(new PointEvent(99.99, generateSwitch(24)));
	perf.push(new PointEvent(103.91, generateSwitch(22)));
	perf.push(new PointEvent(107.97, generateSwitch(24)));
	perf.push(new PointEvent(112.04, generateSwitch(22)));
	perf.push(new PointEvent(116.05, generateSwitch(24)));
	perf.push(new PointEvent(120.07, generateSwitch(22)));
	perf.push(new PointEvent(127.1, generateSwitch(9)));
	perf.push(new PointEvent(130, generateSwitch(0)));
	perf.fresh();
	demoPerfs["MU100DEMO"] = perf;
};
{
	// MU128 demo
	let perf = new TimedEvents();
	// Disable native RS
	perf.push(new PointEvent(0, {type: 15, track: 0, data: [67, 16, 73, 0, 0, 68, 0]}));
	perf.push(new PointEvent(0, generateSwitch(0, 0, 0)));
	perf.push(new PointEvent(0.5, {type: 15, data: [67, 16, 73, 0, 0, 18, 1]}));
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
{
	// Moonlight Picnic
	let perf = new TimedEvents();
	perf.push(new PointEvent(1.611, genDispType(0, 0)));
	perf.push(new PointEvent(1.611, genNewSwitch(11)));
	perf.push(new PointEvent(8.053, genNewSwitch(0)));
	perf.push(new PointEvent(12.884, genNewSwitch(5)));
	perf.push(new PointEvent(14.495, genDispType(4)));
	perf.push(new PointEvent(14.495, genNewSwitch(12)));
	perf.push(new PointEvent(17.313, genDispType(0)));
	perf.push(new PointEvent(17.716, genDispType(4)));
	perf.push(new PointEvent(18.824, genDispType(0)));
	perf.push(new PointEvent(19.219, genDispType(4)));
	perf.push(new PointEvent(20.534, genDispType(6, 3)));
	perf.push(new PointEvent(20.534, genNewSwitch(13)));
	perf.push(new PointEvent(32.21, genNewSwitch(3)));
	perf.push(new PointEvent(33.821, genNewSwitch(13)));
	perf.push(new PointEvent(46.705, genDispType(0)));
	perf.push(new PointEvent(46.705, genNewSwitch(6)));
	perf.push(new PointEvent(57.979, genNewSwitch(14)));
	perf.push(new PointEvent(59.589, genNewSwitch(6)));
	perf.push(new PointEvent(69.252, genDispType(5)));
	perf.push(new PointEvent(69.252, genNewSwitch(11)));
	perf.push(new PointEvent(75.695, genNewSwitch(12)));
	perf.push(new PointEvent(82.942, genNewSwitch(13)));
	perf.push(new PointEvent(86.968, genNewSwitch(15)));
	perf.push(new PointEvent(89.384, genNewSwitch(0)));
	perf.fresh();
	demoPerfs["MOON_L"] = perf;
};
{
	// Low Flying
	let perf = new TimedEvents();
	perf.push(new PointEvent(2.608, genDispType(4, 1)));
	perf.push(new PointEvent(2.608, genNewSwitch(3)));
	perf.push(new PointEvent(18.259, genNewSwitch(2)));
	perf.push(new PointEvent(20.867, genNewSwitch(1)));
	perf.push(new PointEvent(23.476, genDispType(1, 0)));
	perf.push(new PointEvent(23.476, genNewSwitch(8)));
	perf.push(new PointEvent(28.693, genNewSwitch(7)));
	perf.push(new PointEvent(33.909, genNewSwitch(8)));
	perf.push(new PointEvent(39.126, genNewSwitch(9)));
	perf.push(new PointEvent(44.343, genNewSwitch(6)));
	perf.push(new PointEvent(49.56, genNewSwitch(5)));
	perf.push(new PointEvent(54.777, genDispType(0, 2)));
	perf.push(new PointEvent(54.777, genNewSwitch(6)));
	perf.push(new PointEvent(65.21, genDispType(5, 0)));
	perf.push(new PointEvent(65.21, genNewSwitch(3)));
	perf.push(new PointEvent(86.078, genDispType(2, 2)));
	perf.push(new PointEvent(86.078, genNewSwitch(12)));
	perf.push(new PointEvent(96.511, genNewSwitch(3)));
	perf.push(new PointEvent(99.12, genNewSwitch(10)));
	perf.push(new PointEvent(101.728, genNewSwitch(3)));
	perf.push(new PointEvent(106.945, genDispType(0, 0)));
	perf.push(new PointEvent(109.553, genNewSwitch(6)));
	perf.push(new PointEvent(112.162, genNewSwitch(3)));
	perf.push(new PointEvent(127.812, genDispType(0, 1)));
	perf.push(new PointEvent(127.812, genNewSwitch(6)));
	perf.push(new PointEvent(137, genNewSwitch(0)));
	perf.fresh();
	demoPerfs["LOW_FLY"] = perf;
};
{
	// Suplex Hold
	let perf = new TimedEvents();
	perf.push(new PointEvent(7, genDispType(0, 0)));
	perf.push(new PointEvent(7.6, genNewSwitch(15)));
	perf.push(new PointEvent(10.84, genNewSwitch(10)));
	perf.push(new PointEvent(14.72, genDispType(6)));
	perf.push(new PointEvent(20.08, genDispType(0)));
	perf.push(new PointEvent(24.93, genDispType(4)));
	perf.push(new PointEvent(24.93, genNewSwitch(4)));
	perf.push(new PointEvent(34.67, genDispType(0)));
	perf.push(new PointEvent(34.77, genNewSwitch(5)));
	perf.push(new PointEvent(39.02, genNewSwitch(2)));
	perf.push(new PointEvent(40.77, genNewSwitch(3)));
	perf.push(new PointEvent(42.62, genNewSwitch(9)));
	perf.push(new PointEvent(46.34, genNewSwitch(0)));
	perf.push(new PointEvent(48.18, genNewSwitch(1)));
	perf.push(new PointEvent(49.71, genDispType(0, 1)));
	perf.push(new PointEvent(49.84, genNewSwitch(6)));
	perf.push(new PointEvent(52.51, genNewSwitch(7)));
	perf.push(new PointEvent(56.95, genNewSwitch(8)));
	perf.push(new PointEvent(60.78, genNewSwitch(6)));
	perf.push(new PointEvent(64.62, genNewSwitch(2)));
	perf.push(new PointEvent(68.32, genNewSwitch(3)));
	perf.push(new PointEvent(73.85, genNewSwitch(5)));
	perf.push(new PointEvent(74.78, genNewSwitch(6)));
	perf.push(new PointEvent(88.39, genNewSwitch(2)));
	perf.push(new PointEvent(92.31, genNewSwitch(3)));
	perf.push(new PointEvent(96.13, genNewSwitch(6)));
	perf.push(new PointEvent(102.5, genNewSwitch(13)));
	perf.push(new PointEvent(102.5, genDispType(0, 0)));
	perf.push(new PointEvent(106.7, genNewSwitch(15)));
	perf.push(new PointEvent(110.9, genDispType(4)));
	perf.push(new PointEvent(110.9, genNewSwitch(14)));
	perf.push(new PointEvent(113, genNewSwitch(0)));
	perf.fresh();
	demoPerfs["SUPLEX"] = perf;
};
{
	// Monopoly
	let perf = new TimedEvents();
	perf.push(new PointEvent(2.026, genNewSwitch(3)));
	perf.push(new PointEvent(10.328, genNewSwitch(4)));
	perf.push(new PointEvent(18.646, genNewSwitch(5)));
	perf.push(new PointEvent(26.984, genNewSwitch(8)));
	perf.push(new PointEvent(35.292, genNewSwitch(3)));
	perf.push(new PointEvent(39.445, genNewSwitch(4)));
	perf.push(new PointEvent(43.598, genNewSwitch(5)));
	perf.push(new PointEvent(47.764, genNewSwitch(2)));
	perf.push(new PointEvent(51.898, genDispType(0, 3)));
	perf.push(new PointEvent(51.898, genNewSwitch(14)));
	perf.push(new PointEvent(56.064, genNewSwitch(15)));
	perf.push(new PointEvent(60.203, genNewSwitch(1)));
	perf.push(new PointEvent(64.369, genNewSwitch(9)));
	perf.push(new PointEvent(68.509, genNewSwitch(0)));
	perf.push(new PointEvent(70.57, genDispType(0, 1)));
	perf.push(new PointEvent(70.663, genNewSwitch(3)));
	perf.push(new PointEvent(74.735, genNewSwitch(4)));
	perf.push(new PointEvent(78.902, genNewSwitch(5)));
	perf.push(new PointEvent(83.066, genNewSwitch(1)));
	perf.push(new PointEvent(87.231, genNewSwitch(9)));
	perf.push(new PointEvent(91.384, genNewSwitch(2)));
	perf.push(new PointEvent(98, genNewSwitch(0)));
	perf.fresh();
	demoPerfs["MONOPOLY"] = perf;
};
