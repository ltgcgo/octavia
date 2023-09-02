"use strict";

import {Cambiare} from "../cambiare/index.mjs";
import {SheetData} from "../basic/sheetLoad.js";

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

let useMidiBus = false;
let audioFilePlayer = $e("#audioFilePlayer"),
visualizer = new Cambiare($e(".cambiare"), audioFilePlayer);
visualizer.reset();

Alpine.store("play", "smf");
Alpine.store("sound", "file");
Alpine.store("deviceMode", "?");
Alpine.store("showRange", "port1");
Alpine.store("startPort", 0);
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
	visualizer.device.switchMode(mode, true);
	Alpine.store("deviceMode", mode);
};
self.gRange = async function (mode) {
	visualizer.setRange(mode);
	Alpine.store("showRange", mode);
};
self.gPort = async function (port) {
	visualizer.setPort(port);
	Alpine.store("startPort", port);
};
self.gDemo = async function ({file, id, artist, title}) {
	await audioFilePlayer.pause();
	visualizer.reset();
	if (audioUri) {
		URL.revokeObjectURL(audioUri);
	};
	audioFilePlayer.src = "";
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
	Alpine.store("activeDemo", id);
	Alpine.store("play", "demo");
	Alpine.store("sound", "demo");
};

const propsMid = JSON.parse('{"extensions":[".mid",".MID",".kar",".KAR",".syx",".SYX",".s7e",".S7E"],"startIn":"music","id":"midiOpener","description":"Open a MIDI file"}'),
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
		case "s7e": {
			// Load sound banks
			visualizer.device.loadBank(ext, file);
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
	visualizer.loadMap(await(await fetch(`./data/map/gm.24.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/gm.12.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/gm.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/ns5r.24.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/ns5r.12.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/ns5r.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/xg.24.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/xg.12.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/xg.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/gs.24.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/gs.12.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/gs.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/sd.24.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/sd.12.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/sd.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/s90es.24.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/s90es.12.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/s90es.10.tsv`)).text());
	visualizer.loadMap(await(await fetch(`./data/map/kross.24.tsv`)).text());
})();

Alpine.start();
self.visualizer = visualizer;
