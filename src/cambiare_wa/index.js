"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import Cambiare from "../cambiare/index.mjs";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";
import {
	getBridge
} from "../bridge/index.mjs";

let demoBlobs = {};
let demoPerfs = {};
let demoInfo = {};
let demoModes = [];
demoModes[9] = "gm";
let currentPerformance;
let currentAnimation;
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
let targetWidth, targetHeight;
let dispCanv = $e("#cambiare-stage");
let dispCtx = dispCanv.getContext("2d");

// Start the visualizers
self.visualizer = new Cambiare(dispCtx);
visualizer.addEventListener("reset", function (e) {
	console.info("Processor reset.");
});

// Listen to mode switches
visualizer.addEventListener("mode", function (ev) {
	stSwitch.to(stSwitchMode.indexOf(ev.data));
});

let canvFull = async function () {
	if (document.fullscreenElement) {
		document.exitFullscreen();
		visualizer.resizeCanvas(targetWidth, targetHeight);
	} else {
		dispCanv.requestFullscreen();
		visualizer.resizeCanvas(screen.width, screen.height);
	};
};
dispCanv.addEventListener("dblclick", canvFull);
dispCanv.addEventListener("contextmenu", (ev) => {
	if (document.fullscreenElement) {
		ev.preventDefault();
		ev.stopPropagation();
		canvFull();
	};
});

// Resize the canvas and calculate critical positioning
let winResize = function (ev) {
	let tabHeight = document.children[0].clientHeight,
	tabWidth = document.children[0].clientWidth;
	targetWidth = Math.floor(tabWidth * devicePixelRatio / 10) * 10,
	targetHeight = Math.floor((tabHeight - dispCanv.offsetTop) * devicePixelRatio / 10) * 10;
	dispCanv.style.position = `absolute`;
	dispCanv.style.top = `120px`;
	dispCanv.style.left = `${(tabWidth - targetWidth) >> 1}px`;
	visualizer.resizeCanvas(targetWidth, targetHeight);
};
addEventListener("resize", winResize);
winResize();

// Render frames
let audioPlayer = $e("#audioPlayer");
audioPlayer.onended = function () {
	visualizer.reset();
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
		visualizer.render(curTime);
		lastTime = curTime;
	};
}, 20);

getBridge().addEventListener("message", function (ev) {
	if (useMidiBus) {
		visualizer.sendCmd(ev.data);
	};
});
