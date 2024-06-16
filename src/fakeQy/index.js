"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import QyDisplay from "../disp/disp_qy.mjs";
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

let demoBlobs = {};
let demoPerfs = {};
let demoModes = [];
demoModes[9] = "gm";
let currentPerformance;
let useMidiBus = false;
let demoId = 0;

self.genNewSwitch = function (ch = 0) {
	return {
		type: 15,
		track: 0,
		data: [67, 16, 73, 11, 0, 0, ch]
	};
};
self.generateString = function (text) {
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
			demoId = i;
			visualizer.device.setLetterDisplay(codepointArray(`\x8a${demoPool.data[i].artist.slice(0, 15).padEnd(15, " ")}\x8b${demoPool.data[i].title.slice(0, 15)}`));
			currentPerformance = demoPerfs[e.title];
			currentPerformance?.resetIndex();
		});
	});
});

// Start the visualizers
self.visualizer = new QyDisplay();
visualizer.addEventListener("reset", function (e) {
	visualizer.songTitle = "";
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
	visualizer.device.initOnReset = true;
	if (audioBlob) {
		URL.revokeObjectURL(audioBlob);
	};
	audioBlob = null;
	audioPlayer.src = "";
	visualizer.reset();
	useMidiBus = true;
	midwIndicator.classList.on("active");
});

visualizer.addEventListener("meta", function (ev) {
	if (!visualizer.songTitle) {
		ev.data.forEach(function (e) {
			if (!visualizer.songTitle && e.meta == 3) {
				visualizer.songTitle = e.data;
			};
		});
	};
});

// Get canvas
let dispCanv = $e("#qyScreen");
let dispCtx = dispCanv.getContext("2d");
let mixerView = false;
dispCanv.addEventListener("wheel", function (ev) {
	ev.preventDefault();
	let ch = visualizer.getCh();
	if (ev.deltaY > 0) {
		visualizer.setCh(ch + 1);
	} else {
		visualizer.setCh(ch - 1);
	};
	ev.preventDefault();
	ev.stopImmediatePropagation();
});
/* dispCanv.addEventListener("contextmenu", function (ev) {
	ev.preventDefault();
	ev.stopImmediatePropagation();
}); */
dispCanv.addEventListener("mousedown", function (ev) {
	let ch = visualizer.getCh();
	if (ev.button == 0) {
		if (ev.offsetX < 64) {
			visualizer.setCh(ch - 1);
		} else if (ev.offsetX >= 717) {
			visualizer.setCh(ch + 1);
		} else if (ev.offsetY < 72) {
			mixerView = !mixerView;
		};
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
})();
let lastTime = 0;
let renderThread = setInterval(function () {
	if (/*!audioPlayer.paused*/true) {
		let curTime = audioPlayer.currentTime - (self.audioDelay || 0);
		if (curTime < lastTime) {
		};
		// Snap the player head to normalize frames
		self.debugTimeSource && console.debug(curTime);
		curTime = Math.round(curTime * 50 / audioPlayer.playbackRate) / 50 * audioPlayer.playbackRate;
		if (currentPerformance) {
			currentPerformance.step(curTime)?.forEach((e) => {
				visualizer.sendCmd(e.data);
			});
		};
		visualizer.render(curTime, dispCtx, mixerView, useMidiBus ? 0 : demoId, location.hash == "#trueMode");
		lastTime = curTime;
	};
}, 20);

getBridge().addEventListener("message", function (ev) {
	if (useMidiBus) {
		visualizer.sendCmd(ev.data);
	};
});

{
	// Kandi8
	let perf = new TimedEvents();
	perf.push(new PointEvent(1, genNewSwitch(15)));
	perf.push(new PointEvent(5.72, genNewSwitch(12)));
	perf.push(new PointEvent(15.37, genNewSwitch(11)));
	perf.push(new PointEvent(15.8, genNewSwitch(10)));
	perf.push(new PointEvent(16.24, genNewSwitch(9)));
	perf.push(new PointEvent(16.67, genNewSwitch(8)));
	perf.push(new PointEvent(17.11, genNewSwitch(7)));
	perf.push(new PointEvent(17.54, genNewSwitch(6)));
	perf.push(new PointEvent(17.98, genNewSwitch(5)));
	perf.push(new PointEvent(18.41, genNewSwitch(4)));
	perf.push(new PointEvent(18.85, genNewSwitch(3)));
	perf.push(new PointEvent(19.28, genNewSwitch(2)));
	perf.push(new PointEvent(19.72, genNewSwitch(1)));
	perf.push(new PointEvent(26.64, genNewSwitch(3)));
	perf.push(new PointEvent(33.62, genNewSwitch(5)));
	perf.push(new PointEvent(40.54, genNewSwitch(7)));
	perf.push(new PointEvent(47.52, genNewSwitch(8)));
	perf.push(new PointEvent(54.48, genNewSwitch(11)));
	perf.push(new PointEvent(59.62, genNewSwitch(10)));
	perf.push(new PointEvent(61.36, genNewSwitch(9)));
	perf.push(new PointEvent(68.38, genNewSwitch(13)));
	perf.push(new PointEvent(71.86, genNewSwitch(12)));
	perf.push(new PointEvent(75.34, genNewSwitch(4)));
	perf.push(new PointEvent(87.72, genNewSwitch(1)));
	perf.push(new PointEvent(88.18, genNewSwitch(2)));
	perf.push(new PointEvent(88.39, genNewSwitch(3)));
	perf.push(new PointEvent(88.61, genNewSwitch(4)));
	perf.push(new PointEvent(88.82, genNewSwitch(5)));
	perf.push(new PointEvent(89.04, genNewSwitch(6)));
	perf.push(new PointEvent(89.25, genNewSwitch(0)));
	perf.push(new PointEvent(110.16, genNewSwitch(15)));
	perf.push(new PointEvent(117.02, genNewSwitch(12)));
	perf.push(new PointEvent(124.04, genNewSwitch(6)));
	perf.push(new PointEvent(127.52, genNewSwitch(5)));
	perf.push(new PointEvent(129.26, genNewSwitch(7)));
	perf.push(new PointEvent(131, genNewSwitch(0)));
	perf.push(new PointEvent(137.96, generateString(" JayB - Kandi8  For XG Synthesis")));
	perf.push(new PointEvent(139.7, generateString("Performed on                    ")));
	perf.push(new PointEvent(140.57, generateString("Performed on        YAMAHA QY100")));
	perf.push(new PointEvent(141.44, generateString("Composed by                     ")));
	perf.push(new PointEvent(142.31, generateString('Johannes "JayB"         Berthold')));
	perf.push(new PointEvent(143.18, generateString("Inspired by                     ")));
	perf.push(new PointEvent(144.05, generateString("Inspired by          Anjunabeats")));
	//perf.push(new PointEvent(144.92, generateString("Screen FX by       Lumiere Eleve")));
	perf.fresh();
	demoPerfs["KANDI8"] = perf;
};
