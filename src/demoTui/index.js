"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import TuiDisplay from "../disp/disp_tui.mjs";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";
import {
	getBridge
} from "../bridge/index.mjs";

let demoBlobs = {};
let demoModes = [];
demoModes[9] = "gm";
let useMidiBus = false;

self.minCh = 0;

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
		useMidiBus = false;
		midwIndicator.classList.off("active");
		audioPlayer.pause();
		if (!demoBlobs[e.title]?.midi) {
			demoBlobs[e.title] = {};
			textDisplay.innerHTML = `Loading demo ${e.innerText.toUpperCase()}.${"<br/>".repeat(23)}`;
			demoBlobs[e.title].midi = await (await fetch(`./demo/${e.title}.mid`)).blob();
			demoBlobs[e.title].wave = await (await fetch(`./demo/${e.title}.opus`)).blob();
		};
		textDisplay.innerHTML = `Demo ${e.innerText.toUpperCase()} ready.${"<br/>".repeat(23)}`;
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
		visualizer.device.initOnReset = false;
	});
});

// Start the visualizers
self.visualizer = new TuiDisplay();
visualizer.addEventListener("reset", function (e) {
	minCh = 0;
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
		visualizer.device.initOnReset = false;
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
	visualizer.device.initOnReset = true;
});

// Get the canvas
let dispCanvas = $e("#bmDisp"),
dispCtx = dispCanvas.getContext("2d");
dispCanvas.addEventListener("wheel", function (ev) {
	if (ev.deltaY > 0) {
		if (minCh < 112) {
			minCh ++;
		};
	} else {
		if (minCh > 0) {
			minCh --;
		};
	};
});
dispCanvas.addEventListener("mouseup", function (ev) {
	if (ev.layerY > 47) {
		if (minCh < 112) {
			minCh = (1 + (minCh >> 4)) << 4;
		};
	} else if (ev.layerY < 47) {
		if (minCh > 0) {
			if (minCh < 16) {
				minCh = 16;
			};
			minCh = ((minCh >> 4) - 1) << 4;
		};
	};
});

// Render frames
let audioPlayer = $e("#audioPlayer");
let textDisplay = $e("#display");
dispCanvas.style.left = `${textDisplay.offsetLeft + textDisplay.offsetWidth - dispCanvas.offsetWidth}px`;
dispCanvas.style.top = `${textDisplay.offsetTop}px`;
audioPlayer.onended = function () {
	visualizer.reset();
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
	textDisplay.innerHTML = `${"<br/>".repeat(23)}`;
})();
let renderThread = setInterval(function () {
	if (!audioPlayer.paused || useMidiBus) {
		textDisplay.innerHTML = visualizer.render(audioPlayer.currentTime - (self.audioDelay || 0), dispCtx);
	};
}, 20);
getBridge().addEventListener("message", function (ev) {
	if (useMidiBus) {
		visualizer.sendCmd(ev.data);
	};
	//console.debug(ev.data);
});

addEventListener("resize", function () {
	dispCanvas.style.left = `${textDisplay.offsetLeft + textDisplay.offsetWidth - dispCanvas.offsetWidth}px`;
	dispCanvas.style.top = `${textDisplay.offsetTop}px`;
});
