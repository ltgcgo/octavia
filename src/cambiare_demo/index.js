"use strict";

import {Cambiare} from "../cambiare/index.mjs";
import {SheetData} from "../basic/sheetLoad.js";
import {
	getBridge
} from "../bridge/index.mjs";

import {Alpine} from "../../libs/alpine@alpinejs/alpine.min.js";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";

self.$e = function (selector, target = document) {
	return target.querySelector(selector);
};
self.$a = function (selector, target = document) {
	return target.querySelectorAll(selector);
};
HTMLElement.prototype.$e = function (selector) {
	return this.querySelector(selector);
};
HTMLElement.prototype.$a = function (selector) {
	return this.querySelectorAll(selector);
};
self.Alpine = Alpine;

let deriveFactor = (baseFactor, baseTime, newTime) => {
	if (baseTime === newTime) {
		return baseFactor;
	};
	return Math.pow(baseFactor, newTime / baseTime);
};

let useMidiBus = false;
let audioFilePlayer = $e("#audioFilePlayer");
let timeMuxer = {};
Object.defineProperty(timeMuxer, "currentTime", {
	get: () => {
		if (useMidiBus) {
			return audioFilePlayer.currentTime || (Date.now() / 1000);
		} else {
			return audioFilePlayer.currentTime;
		};
	}
});
Object.defineProperty(timeMuxer, "realtime", {
	get: () => {
		return useMidiBus && !audioFilePlayer.currentTime;
	}
});
let visualizer = new Cambiare($e(".cambiare"), timeMuxer);
//visualizer.clockSource.attach(audioFilePlayer);
visualizer.reset();

Alpine.store("play", "smf");
Alpine.store("sound", "file");
Alpine.store("deviceMode", "?");
Alpine.store("deviceModeCatOverride", false);
Alpine.store("showRange", "port1");
Alpine.store("startPort", 0);
Alpine.store("useMidiBus", false);
Alpine.store("demo", [{
	id: 0,
	text: "Loading...",
	file: "about:blank"
}]);

audioFilePlayer.addEventListener("ended", () => {
	audioFilePlayer.currentTime = 0;
	visualizer.reset();
});

visualizer.addEventListener("mode", (ev) => {
	Alpine.store("deviceMode", ev.data);
	Alpine.store("deviceModeCatOverride", ev.data !== "?");
});
visualizer.addEventListener("banklevel", (ev) => {
	switch (ev.data.mode) {
		case "xg": {
			Alpine.store("xgLvl", ev.data.data);
			break;
		};
		default: {
			console.debug(`Unknown mode "${ev.data.mode}" for setting bank level.`);
		};
	};
});

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

let audioUri;

self.gMode = async function (mode) {
	visualizer.device.switchMode(mode, true, true);
	Alpine.store("deviceMode", mode);
	Alpine.store("deviceModeCatOverride", mode !== "?");
};
self.gRange = async function (mode) {
	visualizer.setRange(mode);
	Alpine.store("showRange", mode);
};
self.gPort = async function (port) {
	visualizer.setPort(port);
	Alpine.store("startPort", port);
};
self.gDemo = async function ({file, id, artist, title, standard}) {
	await audioFilePlayer.pause();
	visualizer.reset();
	if (audioUri) {
		URL.revokeObjectURL(audioUri);
	};
	audioFilePlayer.src = "";
	if (!file) {
		Alpine.store("activeDemo", -1);
		console.debug(`Cleared out demos.`);
		return;
	} else {
		useMidiBus = false;
		Alpine.store("useMidiBus", false);
	};
	visualizer.dispatchEvent("title", `Loading demo: ${artist} - ${title} ... (MIDI)`);
	let midiBlob = await(await getBlobFrom(`${file}.mid`)).blob();
	visualizer.dispatchEvent("title", `Loading demo: ${artist} - ${title} ... (audio)`);
	let audioBlob = await(await getBlobFrom(`${file}.opus`)).blob();
	visualizer.dispatchEvent("title", `Polak is cute!`);
	await visualizer.loadFile(await midiBlob);
	audioUri = URL.createObjectURL(audioBlob);
	audioFilePlayer.currentTime = 0;
	audioFilePlayer.src = audioUri;
	visualizer.device.initOnReset = false;
	visualizer.dispatchEvent("title", "");
	visualizer.device.setDetectionTargets(standard);
	Alpine.store("activeDemo", id);
	Alpine.store("play", "demo");
	Alpine.store("sound", "demo");
};
self.gStyle = async function (type) {
	visualizer.style = type;
	Alpine.store("noteStyle", type);
};
self.gPixelC = async function (profile) {
	visualizer.setPixelProfile(profile);
	Alpine.store("pixelProfile", profile);
};
self.gXgLvl = async function (level) {
	//visualizer.device.setGsTargets(false, level);
	//Alpine.store("xgLvl", level);
	visualizer.sendCmd({
		type: 15,
		track: 0,
		data: [67, 16, 73, 0, 0, 18, level]
	});
};
self.gGsLvl = async function (level) {
	visualizer.device.setGsTargets(false, level);
	Alpine.store("gsLvl", level);
};
self.gScLvl = async function (level) {
	visualizer.device.setGsTargets(true, level);
	Alpine.store("scLvl", level);
};
self.gLimitDump = async function (limit) {
	visualizer.device.setDumpLimit(limit);
	Alpine.store("limitDump", limit);
};
self.gFrameTime = (frameTime) => {
	visualizer.setFrameTime(frameTime);
	Alpine.store("frameTime", frameTime);
};
self.gPanStyle = (panStyle) => {
	visualizer.panStyle = panStyle;
	Alpine.store("panStyle", panStyle);
};
self.gSetScheme = (scheme) => {
	visualizer.setScheme(scheme);
	Alpine.store("scheme", scheme);
};
self.gEcMode = (ecMode) => {
	visualizer.useElementCount = ecMode;
	Alpine.store("useElementCount", ecMode);
};

const propsMid = JSON.parse('{"extensions":[".mid",".MID",".kar",".KAR",".syx",".SYX",".s7e",".S7E",".mdat",".MDAT",".pcg",".PCG"],"startIn":"music","id":"midiOpener","description":"Open a MIDI file"}'),
propsAud = JSON.parse('{"mimeTypes":["audio/*"],"startIn":"music","id":"audioOpener","description":"Open an audio file"}');
self.gOpenSmf = async function () {
	useMidiBus = false;
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
		case "mdat": {
			// Load ID to name maps
			visualizer.loadMap(await file.text(), true);
			break;
		};
		default: {
			// Load MIDI files
			Alpine.store("activeDemo", -1);
			visualizer.reset();
			visualizer.dispatchEvent("title", `Loading MIDI...`);
			await visualizer.loadFile(file);
			visualizer.dispatchEvent("title", ``);
			visualizer.device.initOnReset = false;
			Alpine.store("play", "smf");
		};
	};
};
self.gOpenSnd = async function () {
	useMidiBus = false;
	let audioBlob = await fileOpen(propsAud);
	Alpine.store("sound", "file");
	if (audioUri) {
		URL.revokeObjectURL(audioUri);
	};
	audioUri = URL.createObjectURL(audioBlob);
	audioFilePlayer.src = audioUri;
};
self.gOpenLni = function () {
	gDemo({});
	visualizer.init();
	useMidiBus = !useMidiBus;
	Alpine.store("useMidiBus", useMidiBus);
	visualizer.device.initOnReset = useMidiBus;
};

self.formatTime = function (seconds, withMs = false) {
	let remains;
	let result;
	if (withMs) {
		remains = Math.round(seconds * 100) / 100
		result = `.`;
		result += `${Math.floor(remains * 100 % 100)}`.padStart(2, "0");
	} else {
		result = "";
		remains = Math.round(seconds);
	};
	result = `${Math.floor(remains / 60) % 60}`.padStart(2, "0") + ":" + `${remains % 60}`.padStart(2, "0") + result;
	if (seconds >= 3600) {
		result = `${Math.floor(remains / 3600)}`.padStart(2, "0") + `:${result}`;
	};
	return result;
};

let demoPool = new SheetData();
(async () => {
	demoPool.load(await (await getBlobFrom(`list.tsv`)).text());
	Alpine.store("demo", demoPool.data);
	visualizer.loadEfx(await(await fetch(`./data/misc/efxId.tsv`)).text());
	visualizer.loadMapPaths([
		`./data/map/gm.24.tsv`,
		`./data/map/ns5r.24.tsv`,
		`./data/map/xg.24.tsv`,
		`./data/map/gs.24.tsv`,
		`./data/map/sd.24.tsv`,
		`./data/map/cs2x.24.tsv`,
		`./data/map/s90es.24.tsv`,
		`./data/map/kross.24.tsv`,
		`./data/map/pa.24.tsv`,
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
	await visualizer.glyphs.loadFile("./data/bitmaps/xg/font.tsv");
})();

document.body.addEventListener("keydown", async (ev) => {
	let preventKey = true;
	let {
		metaKey, ctrlKey, altKey, shiftKey,
		location, key
	} = ev;
	let portSwitch = "12345678".indexOf(key),
	modeSwitch = "[]\\".indexOf(key);
	if (portSwitch > -1) {
		gPort(portSwitch);
	} else if (modeSwitch > -1) {
		gRange(["port1", "port2", "port4"][modeSwitch]);
	} else {
		switch (key) {
			case "Enter": {
				// Full screen
				if (document.fullscreen || document.mozFullscreen || document.webkitFullscreen) {
					(document.exitFullscreen || document.mozExitFullscreen || document.webkitExitFullscreen).apply(document);
				} else {
					let cc = $e(".cambiare");
					(cc.requestFullscreen || cc.mozRequestFullscreen || cc.webkitRequestFullscreen).apply(cc);
				};
				break;
			};
			case " ": {
				// Play/pause
				if (audioFilePlayer.paused) {
					audioFilePlayer.play();
				} else {
					audioFilePlayer.pause();
				};
				break;
			};
			case "ArrowUp": {
				// Volume
				break;
			};
			case "ArrowDown": {
				// Volume
				break;
			};
			case "ArrowLeft": {
				// Slow down
				break;
			};
			case "ArrowRight": {
				// Accelerate
				break;
			};
			case "z": {
				// Show time signature
				let roundedBeat = Math.floor(visualizer.noteBeat * 2) / 2;
				let roundedTime = (visualizer.noteBar * visualizer.getTimeSig()[0] + roundedBeat + visualizer.noteOffset) * 60 / visualizer.getTempo();
				//visualizer.getTimeSig()
				console.info(`Requested rounded note progress: ${visualizer.noteBar + 1}/${roundedBeat + 1}, ${Math.round(roundedTime * 1000) / 1000}s (${Math.round(timeMuxer.currentTime * 1000) / 1000}s)`);
				break;
			};
			default: {
				preventKey = false;
				self.debugMode && console.debug(`Unknown key "${key}" pressed.`);
			};
		};
	};
	if (preventKey) {
		ev.preventDefault();
	};
});

getBridge().addEventListener("message", function (ev) {
	if (useMidiBus) {
		visualizer.sendCmd(ev.data);
	};
	//console.debug(ev.data);
});

(async () => {
	try {
		let commitInfo = await (await fetch("../latest.json")).json();
		console.info(`Latest commit: ${commitInfo.hash}\nCommit time: %o`, new Date(commitInfo.time));
	} catch (err) {
		console.info(`Development build detected.`);
	};
})();

Alpine.start();
self.visualizer = visualizer;
self.gOpenLni();
