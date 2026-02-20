"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import ScDisplay from "../disp/disp_sc.mjs";
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
let demoModes = [];
demoModes[9] = "gm";
let demoPerfs = {};
let currentPerformance;
let useMidiBus = false;

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
const srcPaths = ['../../midi-data/collection/octavia/', './demo/'];
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

let title = "";
// Start the visualizers
self.visualizer = new ScDisplay({useBlur: true});
visualizer.addEventListener("reset", function (e) {
	console.info("Processor reset.");
	title = "";
});

// Listen to mode switches
visualizer.addEventListener("mode", function (ev) {
	stSwitch.to(stSwitchMode.indexOf(ev.data));
});
visualizer.addEventListener("meta", function (ev) {
	if (!title) {
		ev.data.forEach(function (e) {
			if (!title && e.meta === 3) {
				title = e.data;
			};
		});
		if (title) {
			let textCmd = [];
			Array.from(title).forEach(function (e) {
				let charCode = e.charCodeAt(0);
				if (charCode < 128) {
					textCmd.push(charCode);
				};
			});
			visualizer.device.setLetterDisplay(textCmd);
		};
	};
});

// Open the files
let midwIndicator = $e("#openMidw");
let audioBlob;
const propsMid = JSON.parse('{"extensions":[".mid",".MID",".kar",".KAR",".syx",".SYX",".s7e",".S7E",".pcg",".PCG"],"startIn":"music","id":"midiOpener","description":"Open a MIDI file"}'),
propsAud = JSON.parse('{"mimeTypes":["audio/*"],"startIn":"music","id":"audioOpener","description":"Open an audio file"}');
$e("#openMidi").addEventListener("click", async function () {
	useMidiBus = false;
	visualizer.device.initOnReset = false;
	midwIndicator.classList.off("active");
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
	visualizer.device.initOnReset = false;
	midwIndicator.classList.off("active");
	if (audioBlob) {
		URL.revokeObjectURL(audioBlob);
	};
	visualizer.sendCmd({type: 15, track: 0, data: [67, 16, 76, 6, 0, 0, 76, 111, 97, 100, 105, 110, 103, 32, 97, 117, 100, 105, 111, 32, 102, 105, 108, 101]});
	audioBlob = await fileOpen(propsAud);
	audioPlayer.src = URL.createObjectURL(audioBlob);
	visualizer.sendCmd({type: 15, track: 0, data: [67, 16, 76, 6, 0, 0, 65, 117, 100, 105, 111, 32, 108, 111, 97, 100, 101, 100]});
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
	visualizer.device.initOnReset = true;
	midwIndicator.classList.on("active");
});

// Get canvas
let dispCanv = $e("#rlndSc");
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
	} else if (ev.offsetX >= 776) {
		visualizer.setCh(ch + 1);
	};
});

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
			let demoId = e.innerText.charCodeAt(0);
			if (demoId <= 122 && demoId > 96) {
				demoId -= 32;
			};
			visualizer.device.initOnReset = false;
			visualizer.device.setLetterDisplay([76, 111, 97, 100, 105, 110, 103, 32, 100, 101, 109, 111, 32, demoId]);
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
			visualizer.device.setLetterDisplay([76, 111, 97, 100, 101, 100, 32, 100, 101, 109, 111, 32, demoId]);
			stDemo.to(i);
			currentPerformance = demoPerfs[e.title];
			currentPerformance?.resetIndex();
		});
	});
	if (location.search.indexOf("minimal") > -1) {
		self.scroll(0, dispCanv.offsetTop - 4);
		midwIndicator.click();
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
	let midiBlob = await (await fetch("../../midi-data/collection/octavia/KANDI8.mid")).blob();
	demoBlobs.KANDI8 = {};
	demoBlobs.KANDI8.midi = midiBlob;
	visualizer.loadFile(midiBlob);
	if (audioBlob) {
		URL.revokeObjectURL(audioBlob);
	};
	audioBlob = await (await fetch("../../midi-data/collection/octavia/KANDI8.opus")).blob();
	demoBlobs.KANDI8.wave = audioBlob;
	audioPlayer.src = URL.createObjectURL(audioBlob);
	visualizer.loadMapPaths([
		`./data/map/gsCap.12.tsv`,
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
	visualizer.loadProps((await fetch("./data/bank/gs.prop.tsv")).body, false, 0, "gs.prop.tsv");
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
		visualizer.render(curTime, dispCtx);
		lastTime = curTime;
	};
}, 20);

getBridge().addEventListener("message", function (ev) {
	if (useMidiBus) {
		visualizer.sendCmd(ev.data);
	};
});

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
self.genNewSwitch = genNewSwitch;
self.genDispType = genDispType;
