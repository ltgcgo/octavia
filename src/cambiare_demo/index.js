"use strict";

import {
	Cambiare,
	createElement, mountElement, classOff, classOn
} from "../cambiare/index.mjs";
import {SheetData} from "../basic/sheetLoad.js";
import {
	getBridge
} from "../bridge/index.mjs";
import StylePool from "../basic/styleLoad.js";

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

let createDropDown = function (mountedElement, opt = {}) {
	/*
	activeSlot: number
	*/
	if (typeof opt.activeSlot !== "number") {
		throw(new Error("The active dropdown slot is not defined."));
	};
	let dropdownId;
	if (mountedElement.id.includes("dropmount-")) {
		dropdownId = mountedElement.id.substring(10);
	};
	// Define the overall structure
	let dropdownTrigger = createElement("div", ["dropdown-trigger"]);
	let dropdownMenu = createElement("div", ["dropdown-menu"]);
	let dropdownButton = createElement("button");
	let dropdownDisplay = createElement("div");
	let dropdownIcon = createElement("div", ["iconset", "attach-right"]);
	let dropdownIconCollapsed = createElement("div", ["iconcut", "size-24"]);
	let dropdownIconExpanded = createElement("div", ["iconcut", "size-24"]);
	let dropdownContent = createElement("div", ["dropdown-content"]);
	let dropdownTemplate = createElement("template");
	let dropdownOption = createElement("a", ["dropdown-item"]);
	// Define attributes
	if (typeof opt.minWidth === "string") {
		dropdownTrigger.style.minWidth = opt.minWidth;
	};
	dropdownMenu.setAttribute("role", "menu");
	dropdownMenu.id = `dropdown-${dropdownId}`;
	dropdownButton.setAttribute("aria-haspopup", "true");
	dropdownIconCollapsed.style.maskImage = "url('./img/feather/chevron-down.svg')";
	dropdownIconExpanded.style.maskImage = "url('./img/feather/chevron-up.svg')";
	// Reactivity via AlpineJS
	mountedElement.setAttribute(":active", `active[${opt.activeSlot}]`);
	mountedElement.setAttribute(":class", `\x60column column-option column-button column-nowrap dropdown\x24{active[${opt.activeSlot}]?' is-active':''}\x60`);
	//dropdownTrigger.setAttribute("@click", `"";for(let i=0;i<active.length;i++){if(i==${opt.activeSlot}){active[${opt.activeSlot}]=!active[${opt.activeSlot}]}else{active[i]=0}}`);
	dropdownTrigger.setAttribute("@click", `active[${opt.activeSlot}]=!active[${opt.activeSlot}]`);
	if (typeof opt.displayText === "string") {
		dropdownDisplay.setAttribute("x-text", opt.displayText);
	};
	dropdownIconCollapsed.setAttribute("x-show", `!active[${opt.activeSlot}]`);
	dropdownIconExpanded.setAttribute("x-show", `active[${opt.activeSlot}]`);
	if (typeof opt.optionText === "string") {
		dropdownOption.setAttribute("x-text", opt.optionText);
	};
	if (typeof opt.optionDesc === "string") {
		dropdownOption.setAttribute(":title", opt.optionDesc);
	};
	if (typeof opt.optionActive === "string") {
		dropdownOption.setAttribute(":active", `${opt.optionActive}?'true':'false'`);
	};
	if (typeof opt.optionClick === "string") {
		//dropdownOption.setAttribute("@click", `${opt.optionClick};active[${opt.activeSlot}]=false`);
		dropdownOption.setAttribute("@click", `${opt.optionClick};active[${opt.activeSlot}]=false`);
	};
	dropdownTemplate.content.append(dropdownOption);
	if (typeof opt.eachExpr === "string") {
		dropdownTemplate.setAttribute("x-for", opt.eachExpr);
	};
	// Mount the structure
	mountElement(dropdownContent, [dropdownTemplate]);
	mountElement(dropdownButton, [dropdownDisplay]);
	mountElement(dropdownIcon, [dropdownIconCollapsed, dropdownIconExpanded]);
	mountElement(dropdownTrigger, [dropdownButton, dropdownIcon]);
	mountElement(dropdownMenu, [dropdownContent]);
	mountElement(mountedElement, [dropdownTrigger, dropdownMenu]);
};

// Create the dropdown menus
createDropDown($e("div#dropmount-levelXg"), {
	"activeSlot": 0,
	"minWidth": "9.5rem",
	"displayText": "xgLvls[$store.xgLvl??0][1]||'Invalid'",
	"eachExpr": "xgLvl in xgLvls",
	"optionText": "xgLvl[1]",
	"optionDesc": "`Internal ID: (${xgLvl[0]})`",
	"optionActive": "($store.xgLvl||4)==xgLvl[0]",
	"optionClick": "gXgLvl(xgLvl[0])"
});
createDropDown($e("div#dropmount-levelGs"), {
	"activeSlot": 1,
	"minWidth": "7.5rem",
	"displayText": "gsLvls[($store.gsLvl??4)-1][1]||'Invalid'",
	"eachExpr": "gsLvl in gsLvls",
	"optionText": "gsLvl[1]",
	"optionDesc": "`Internal ID: (${gsLvl[0]})`",
	"optionActive": "($store.gsLvl||4)==gsLvl[0]",
	"optionClick": "gGsLvl(gsLvl[0])"
});
createDropDown($e("div#dropmount-levelSc"), {
	"activeSlot": 2,
	"minWidth": "7.5rem",
	"displayText": "scLvls[($store.scLvl??3)-2][1]||'Invalid'",
	"eachExpr": "scLvl in scLvls",
	"optionText": "scLvl[1]",
	"optionDesc": "`Internal ID: (${scLvl[0]})`",
	"optionActive": "($store.scLvl||3)==scLvl[0]",
	"optionClick": "gScLvl(scLvl[0])"
});
createDropDown($e("div#dropmount-levelX5"), {
	"activeSlot": 3,
	"minWidth": "6.4rem",
	"displayText": "x5Lvls[($store.x5Lvl??82)-81][1]||'Invalid'",
	"eachExpr": "x5Lvl in x5Lvls",
	"optionText": "x5Lvl[1]",
	"optionDesc": "`Internal ID: (${x5Lvl[0]})`",
	"optionActive": "($store.x5Lvl||3)==x5Lvl[0]",
	"optionClick": "gX5Lvl(x5Lvl[0])"
});
createDropDown($e("div#dropmount-framerate"), {
	"activeSlot": 2,
	"minWidth": "5rem",
	"displayText": "frames[$store.frameTime??20][0]||'N/A'",
	"eachExpr": "(frame, frametime) in frames",
	"optionText": "frame[0]",
	"optionDesc": "frame[1]",
	"optionActive": "`${$store.frameTime??20}`==frametime",
	"optionClick": "gFrameTime(parseInt(frametime))"
});


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
(async () => {
	visualizer.styles = new StylePool();
	visualizer.styles.load((await fetch("./data/misc/yStyle.tsv")).body);
})();

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
	await visualizer.freeChord.loadFile("./data/bitmaps/xg/freeChord.tsv");

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
