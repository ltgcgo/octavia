"use strict";

import {Cambiare} from "../cambiare/index.mjs";
import {SheetData} from "../basic/sheetLoad.js";

import {Alpine} from "../../libs/alpine@alpinejs/alpine.min.js";

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

let audioFilePlayer = $e("#audioFilePlayer"),
visualizer = new Cambiare($e(".cambiare"), audioFilePlayer);

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
	Alpine.store("deviceMode", mode);
};
self.gRange = async function (mode) {
	Alpine.store("showRange", mode);
};
self.gPort = async function (port) {
	Alpine.store("startPort", port);
};
self.gDemo = async function ({file, id}) {
	await audioFilePlayer.pause();
	let midiBlob = await(await getBlobFrom(`${file}.mid`)).blob(),
	audioBlob = await(await getBlobFrom(`${file}.opus`)).blob();
	visualizer.reset();
	await visualizer.loadFile(await midiBlob);
	if (audioUri) {
		URL.revokeObjectURL(audioUri);
	};
	audioUri = URL.createObjectURL(audioBlob);
	audioFilePlayer.currentTime = 0;
	audioFilePlayer.src = audioUri;
	Alpine.store("activeDemo", id);
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
})();

Alpine.start();
