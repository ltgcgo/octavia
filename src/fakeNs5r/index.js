"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import Ns5rDisplay from "../disp/disp_n5.mjs";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";
import {
	getBridge
} from "../bridge/index.mjs";
import {sysexBitmap} from "../state/emitGlobal.js";
import {SheetData} from "../basic/sheetLoad.js";

import {
	PointEvent,
	RangeEvent,
	TimedEvents
} from "../../libs/lightfelt@ltgcgo/ext/timedEvents.js";

let demoBlobs = {};
let demoPerfs = {};
let demoModes = [];
let currentPerformance;
demoModes[9] = "gm";
let useMidiBus = false;

self.generateSwitch = function (ch = 0, min, max) {
	let data = [67, 16, 73, 0, 0, 64, ch];
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
self.sysexBitmap = sysexBitmap;
self.visualizer = new Ns5rDisplay({useBlur: true});
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
		case "s7e": {
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
let dispCanv = $e("#ns5rSc");
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
	} else if (ev.offsetX >= 801) {
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
	visualizer.loadMap(await(await fetch(`./data/map/gm.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/ns5r.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/xg.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/gs.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/sd.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/s90es.10.tsv`)).text());
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
		visualizer.render(curTime, dispCtx, location.hash == "#trueMode");
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
	// Wild Cat!!
	let perf = new TimedEvents();
	perf.push(new PointEvent(1.51, generateSwitch(4)));
	perf.push(new PointEvent(3.02, generateSwitch(5)));
	perf.push(new PointEvent(4.53, generateSwitch(0)));
	perf.push(new PointEvent(6.04, generateSwitch(1)));
	perf.push(new PointEvent(7.55, generateSwitch(15)));
	perf.push(new PointEvent(9.06, generateSwitch(14)));
	perf.push(new PointEvent(10.57, generateSwitch(13)));
	perf.push(new PointEvent(12.08, generateSwitch(7)));
	perf.push(new PointEvent(13.4, generateSwitch(8)));
	perf.push(new PointEvent(13.76, generateSwitch(0)));
	perf.push(new PointEvent(13.94, generateSwitch(1)));
	perf.push(new PointEvent(14.12, generateSwitch(0)));
	perf.push(new PointEvent(14.3, generateSwitch(1)));
	perf.push(new PointEvent(14.48, generateSwitch(0)));
	perf.push(new PointEvent(14.66, generateSwitch(1)));
	perf.push(new PointEvent(14.84, generateSwitch(0)));
	perf.push(new PointEvent(15.01, generateSwitch(9)));
	perf.push(new PointEvent(16.42, generateSwitch(8)));
	perf.push(new PointEvent(16.78, generateSwitch(3)));
	perf.push(new PointEvent(16.96, generateSwitch(2)));
	perf.push(new PointEvent(17.14, generateSwitch(3)));
	perf.push(new PointEvent(17.32, generateSwitch(2)));
	perf.push(new PointEvent(17.5, generateSwitch(3)));
	perf.push(new PointEvent(17.68, generateSwitch(2)));
	perf.push(new PointEvent(17.86, generateSwitch(3)));
	perf.push(new PointEvent(18.03, generateSwitch(15)));
	perf.push(new PointEvent(19.43, generateSwitch(8)));
	perf.push(new PointEvent(19.79, generateSwitch(0)));
	perf.push(new PointEvent(19.97, generateSwitch(1)));
	perf.push(new PointEvent(20.15, generateSwitch(0)));
	perf.push(new PointEvent(20.33, generateSwitch(1)));
	perf.push(new PointEvent(20.51, generateSwitch(0)));
	perf.push(new PointEvent(20.69, generateSwitch(1)));
	perf.push(new PointEvent(20.87, generateSwitch(0)));
	perf.push(new PointEvent(21.04, generateSwitch(9)));
	perf.push(new PointEvent(22.45, generateSwitch(8)));
	perf.push(new PointEvent(22.81, generateSwitch(3)));
	perf.push(new PointEvent(22.99, generateSwitch(2)));
	perf.push(new PointEvent(23.17, generateSwitch(3)));
	perf.push(new PointEvent(23.35, generateSwitch(2)));
	perf.push(new PointEvent(23.53, generateSwitch(3)));
	perf.push(new PointEvent(23.71, generateSwitch(2)));
	perf.push(new PointEvent(23.89, generateSwitch(3)));
	perf.push(new PointEvent(24.06, generateSwitch(15)));
	perf.push(new PointEvent(25.66, generateSwitch(8)));
	perf.push(new PointEvent(27.17, generateSwitch(9)));
	perf.push(new PointEvent(28.68, generateSwitch(7)));
	perf.push(new PointEvent(30.19, generateSwitch(15)));
	perf.push(new PointEvent(31.7, generateSwitch(0)));
	perf.push(new PointEvent(33.21, generateSwitch(2)));
	perf.push(new PointEvent(34.72, generateSwitch(1)));
	perf.push(new PointEvent(36.23, generateSwitch(3)));
	perf.push(new PointEvent(37.55, generateSwitch(6))); //
	perf.push(new PointEvent(38.49, generateSwitch(4)));
	perf.push(new PointEvent(39.06, generateSwitch(5)));
	perf.push(new PointEvent(40.75, generateSwitch(6)));
	perf.push(new PointEvent(42.26, generateSwitch(8)));
	perf.push(new PointEvent(43.77, generateSwitch(9)));
	perf.push(new PointEvent(45.28, generateSwitch(15)));
	perf.push(new PointEvent(46.6, generateSwitch(4)));
	perf.push(new PointEvent(48.11, generateSwitch(5)));
	perf.push(new PointEvent(49.62, generateSwitch(6))); // 12.07
	perf.push(new PointEvent(50.56, generateSwitch(4)));
	perf.push(new PointEvent(51.13, generateSwitch(5)));
	perf.push(new PointEvent(52.82, generateSwitch(6)));
	perf.push(new PointEvent(54.33, generateSwitch(8)));
	perf.push(new PointEvent(55.84, generateSwitch(9)));
	perf.push(new PointEvent(57.35, generateSwitch(15)));
	perf.push(new PointEvent(58.87, generateSwitch(4)));
	perf.push(new PointEvent(59.05, generateSwitch(5)));
	perf.push(new PointEvent(59.62, generateSwitch(4)));
	perf.push(new PointEvent(59.8, generateSwitch(5)));
	perf.push(new PointEvent(60.19, generateSwitch(4)));
	perf.push(new PointEvent(60.57, generateSwitch(0)));
	perf.push(new PointEvent(60.75, generateSwitch(1)));
	perf.push(new PointEvent(61.13, generateSwitch(4)));
	perf.push(new PointEvent(61.32, generateSwitch(12)));
	perf.push(new PointEvent(61.89, generateSwitch(2)));
	perf.push(new PointEvent(63.4, generateSwitch(3)));
	perf.push(new PointEvent(65.09, generateSwitch(11)));
	perf.push(new PointEvent(66.6, generateSwitch(9)));
	perf.push(new PointEvent(68.11, generateSwitch(11)));
	perf.push(new PointEvent(73.58, generateSwitch(9)));
	perf.push(new PointEvent(74.34, generateSwitch(10)));
	perf.push(new PointEvent(80.45, generateSwitch(1)));
	perf.push(new PointEvent(84.98, generateSwitch(0)));
	perf.push(new PointEvent(85.74, generateSwitch(12)));
	perf.push(new PointEvent(86.11, generateSwitch(0)));
	perf.push(new PointEvent(86.87, generateSwitch(12)));
	perf.push(new PointEvent(87.25, generateSwitch(0)));
	perf.push(new PointEvent(88, generateSwitch(9)));
	perf.push(new PointEvent(97.35, generateSwitch(8)));
	perf.fresh();
	demoPerfs["AGDEMO1"] = perf;
};
