"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import {PsrDisplay} from "../disp/index.mjs";
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
let demoId = 0;

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
		demoId = i;
	});
});

// Backlight color switching
let backlightColor = "white";
let blSwitch = $a("b.backlight");
blSwitch.to = function (i) {
	blSwitch.forEach(function (e) {
		e.classList.off("active");
	});
	if (i > -1) {
		blSwitch[i].classList.on("active");
	};
};
blSwitch.forEach(function (e, i) {
	e.addEventListener("click", function () {
		// backlightColor;
		blSwitch.to(i);
	});
});

// Automatic channel switching
let enableChannelSwitch = true;
let csSwitch = $a("b.channelSwitching");
csSwitch.to = function (i) {
	csSwitch.forEach(function (e) {
		e.classList.off("active");
	});
	if (enableChannelSwitch) {
		csSwitch[i].classList.on("active");
	};
};
csSwitch.forEach(function (e, i) {
	e.addEventListener("click", function () {
		enableChannelSwitch = !enableChannelSwitch;
		this.innerText = enableChannelSwitch ? "ON" : "OFF";
		csSwitch.to(i);
	});
});

// Start the visualizers
self.visualizer = new PsrDisplay();
visualizer.addEventListener("reset", function (e) {
	visualizer.songTitle = "";
	console.info("Processor reset.");
});

// Listen to mode switches
visualizer.addEventListener("mode", function (ev) {
	stSwitch.to(stSwitchMode.indexOf(ev.data));
	let textCmd = [67, 16, 76, 6, 0, 0, 77, 79, 68, 69, 58, 32];
	let modeText = {
		gm: [71, 77],
		gs: [71, 83],
		xg: [88, 71],
		g2: [71, 77, 50],
		mt32: [77, 84, 45, 51, 50],
		ns5r: [78, 83, 53, 82],
		ag10: [65, 71, 45, 49, 48],
		"05rw": [48, 53, 82, 47, 87],
		x5d: [88, 53, 68],
		k11: [71, 77, 101, 103, 97],
		sg: [83, 71],
		krs: [75, 82, 79, 83, 83]
	};
	visualizer.sendCmd({type: 15, track: 0, data: textCmd.concat(modeText[visualizer.getMode()])});
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
		demoId = 0;
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
let dispCanv = $e("#ymhPsr");
let dispCtx = dispCanv.getContext("2d");
let mixerView = false;
let tempoView = false;
dispCanv.addEventListener("wheel", function (ev) {
	let ch = visualizer.getCh();
	if (ev.deltaY > 0) {
		visualizer.setCh(ch + 1);
	} else {
		visualizer.setCh(ch - 1);
	};
	ev.preventDefault();
	ev.stopImmediatePropagation();
});
dispCanv.addEventListener("mousedown", function (ev) {
	let ch = visualizer.getCh();
	if (ev.button == 0) {
		if (ev.offsetX < 64) {
			visualizer.setCh(ch - 1);
		} else if (ev.offsetX >= 1046) {
			visualizer.setCh(ch + 1);
		} else if (ev.offsetY < 110) {
			mixerView = !mixerView;
		} else if (ev.offsetY > 218) {
			tempoView = !tempoView;
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
	currentPerformance = demoPerfs["KANDI8"];
})();
let lastTime = 0;
let renderThread = setInterval(function () {
	if (/*!audioPlayer.paused*/true) {
		let curTime = audioPlayer.currentTime - (self.audioDelay || 0);
		if (curTime < lastTime) {
		};
		if (enableChannelSwitch && currentPerformance) {
			currentPerformance.step(curTime)?.forEach((e) => {
				visualizer.sendCmd(e.data);
			});
		};
		// visualizer.render(curTime, dispCtx, mixerView, useMidiBus ? 0 : demoId);
		visualizer.render(curTime, dispCtx, backlightColor, mixerView, tempoView, useMidiBus ? 0 : demoId);
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

// Hardcoded channel switching
{
	// KANDI8
	let perf = new TimedEvents();
	perf.push(new PointEvent(4, generateSwitch(15)));
	perf.push(new PointEvent(5.7, generateSwitch(12)));
	perf.push(new PointEvent(20, generateSwitch(1)));
	perf.push(new PointEvent(89, generateSwitch(0)));
	perf.push(new PointEvent(117, generateSwitch(6)));
	perf.fresh();
	demoPerfs["KANDI8"] = perf;
};
{
	// Straight to the Horizon
	let perf = new TimedEvents();
	perf.push(new PointEvent(7, generateSwitch(6)));
	perf.push(new PointEvent(22, generateSwitch(5)));
	perf.push(new PointEvent(80, generateSwitch(1)));
	perf.fresh();
	demoPerfs["HORIZON"] = perf;
};
{
	// Low Down
	let perf = new TimedEvents();
	perf.push(new PointEvent(3, generateSwitch(2)));
	perf.push(new PointEvent(6, generateSwitch(5)));
	perf.push(new PointEvent(28, generateSwitch(1)));
	perf.push(new PointEvent(51, generateSwitch(6)));
	perf.push(new PointEvent(73.5, generateSwitch(5)));
	perf.push(new PointEvent(96, generateSwitch(4)));
	perf.push(new PointEvent(118, generateSwitch(6)));
	perf.push(new PointEvent(141, generateSwitch(5)));
	perf.push(new PointEvent(163, generateSwitch(5)));
	perf.push(new PointEvent(186, generateSwitch(5)));
	perf.fresh();
	demoPerfs["Sam Sketty - Low Down"] = perf;
};
{
	// StarGame
	let perf = new TimedEvents();
	perf.push(new PointEvent(0, generateSwitch(3)));
	perf.push(new PointEvent(8.6, generateSwitch(2)));
	perf.fresh();
	demoPerfs["StarGame"] = perf;
};
{
	// Japanese
	let perf = new TimedEvents();
	perf.push(new PointEvent(2, generateSwitch(8)));
	perf.push(new PointEvent(7.5, generateSwitch(9)));
	perf.fresh();
	demoPerfs["25Japan"] = perf;
};
{
	// Clasitario
	let perf = new TimedEvents();
	perf.push(new PointEvent(7.5, generateSwitch(2)));
	perf.push(new PointEvent(21.5, generateSwitch(0)));
	perf.push(new PointEvent(28.5, generateSwitch(2)));
	perf.push(new PointEvent(53.5, generateSwitch(0)));
	perf.push(new PointEvent(57.5, generateSwitch(2)));
	perf.push(new PointEvent(93, generateSwitch(5)));
	perf.push(new PointEvent(132, generateSwitch(2)));
	perf.push(new PointEvent(160, generateSwitch(0)));
	perf.push(new PointEvent(182.5, generateSwitch(2)));
	perf.fresh();
	demoPerfs["AGDEMO3"] = perf;
};
{
	// Kimi ga Iru dake de
	let perf = new TimedEvents();
	perf.push(new PointEvent(12, generateSwitch(3)));
	perf.fresh();
	demoPerfs["01KIMIGA"] = perf;
};
{
	// Do-Re-Mi
	let perf = new TimedEvents();
	perf.push(new PointEvent(15, generateSwitch(0)));
	perf.push(new PointEvent(22, generateSwitch(1)));
	perf.push(new PointEvent(30.5, generateSwitch(3)));
	perf.push(new PointEvent(32.5, generateSwitch(2)));
	perf.push(new PointEvent(38, generateSwitch(1)));
	perf.push(new PointEvent(40, generateSwitch(3)));
	perf.push(new PointEvent(42, generateSwitch(0)));
	perf.push(new PointEvent(46, generateSwitch(7)));
	perf.push(new PointEvent(47, generateSwitch(4)));
	perf.push(new PointEvent(62.5, generateSwitch(11)));
	perf.push(new PointEvent(77.5, generateSwitch(2)));
	perf.push(new PointEvent(90, generateSwitch(11)));
	perf.push(new PointEvent(104, generateSwitch(0)));
	perf.push(new PointEvent(107.5, generateSwitch(1)));
	perf.push(new PointEvent(121, generateSwitch(6)));
	perf.push(new PointEvent(128, generateSwitch(1)));
	perf.push(new PointEvent(141, generateSwitch(5)));
	perf.push(new PointEvent(154.5, generateSwitch(12)));
	perf.push(new PointEvent(168, generateSwitch(11)));
	perf.push(new PointEvent(188, generateSwitch(3)));
	perf.push(new PointEvent(201, generateSwitch(11)));
	perf.push(new PointEvent(237, generateSwitch(1)));
	perf.push(new PointEvent(244, generateSwitch(3)));
	perf.fresh();
	demoPerfs["10DOREMI"] = perf;
};
{
	// Haru yo Koi
	let perf = new TimedEvents();
	perf.push(new PointEvent(5, generateSwitch(3)));
	perf.push(new PointEvent(27.5, generateSwitch(0)));
	perf.fresh();
	demoPerfs["haruyoko"] = perf;
};
{
	// The PF Theatre
	let perf = new TimedEvents();
	perf.push(new PointEvent(0, generateSwitch(0)));
	perf.fresh();
	demoPerfs["02THEATR"] = perf;
};
