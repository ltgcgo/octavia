"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import ScDisplay from "../disp/disp_sc.mjs";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";
import {
	getBridge
} from "../bridge/index.mjs";
import {SheetData} from "../basic/sheetLoad.js";

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
		visualizer.switchMode(e.title, true, true);
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
			if (demoModes[i]?.length > 0) {
				visualizer.switchMode(demoModes[i]);
			};
			visualizer.device.setLetterDisplay([76, 111, 97, 100, 101, 100, 32, 100, 101, 109, 111, 32, demoId]);
			stDemo.to(i);
		});
	});
});

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
			if (!title && e.meta == 3) {
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
const propsMid = JSON.parse('{"extensions":[".mid",".MID",".kar",".KAR",".syx",".SYX",".s7e",".S7E"],"startIn":"music","id":"midiOpener","description":"Open a MIDI file"}'),
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

// Render frames
let audioPlayer = $e("#audioPlayer");
audioPlayer.onended = function () {
	visualizer.reset();
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
	visualizer.loadMap(await(await fetch(`./data/map/gm.12.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/gm.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/ns5r.12.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/ns5r.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/xg.12.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/xg.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/gs.12.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/gs.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/sd.12.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/sd.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/s90es.12.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/s90es.10.tsv`)).text());
})();
let lastTime = 0;
let renderThread = setInterval(function () {
	if (/*!audioPlayer.paused*/true) {
		let curTime = audioPlayer.currentTime - (self.audioDelay || 0);
		if (curTime < lastTime) {
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
