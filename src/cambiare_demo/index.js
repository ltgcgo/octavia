// 2022-2026 © Lightingale Community
// Licensed under CC BY-NC-SA 4.0 license.

"use strict";

import {
	Cambiare,
	createElement, mountElement, classOff, classOn
} from "../cambiare/index.mjs";
import {SheetData} from "../basic/sheetLoad.js";
import {
	getBridge
} from "../bridge/index.mjs";
import {StylePool} from "../basic/index.mjs";

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
	try {
		// The @ character may error out on some browsers.
		dropdownTrigger.setAttribute("@click", `active[${opt.activeSlot}]=!active[${opt.activeSlot}]`);
	} catch (err) {
		alert(`The current version of browser is not compliant to the W3C specification.\n${err.stack}`);
	};
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
createDropDown($e("div#dropmount-pixelprofile"), {
	"activeSlot": 0,
	"minWidth": "6.75rem",
	"displayText": "profiles[$store.pixelProfile??'none']||'N/A'",
	"eachExpr": "(name, id) in profiles",
	"optionText": "name",
	"optionDesc": "`Internal ID: (${id})`",
	"optionActive": "($store.pixelProfile??'none')===id",
	"optionClick": "gPixelC(id)"
});
createDropDown($e("div#dropmount-framerate"), {
	"activeSlot": 2,
	"minWidth": "5rem",
	"displayText": "frames[$store.frameTime??20][0]||'N/A'",
	"eachExpr": "(frame, frametime) in frames",
	"optionText": "frame[0]",
	"optionDesc": "frame[1]",
	"optionActive": "`${$store.frameTime??20}`===frametime",
	"optionClick": "gFrameTime(parseInt(frametime))"
});
createDropDown($e("div#dropmount-ecmode"), {
	"activeSlot": 3,
	"minWidth": "7rem",
	"displayText": "ecModes[($store.useElementCount??true) ? 1 : 0][1]||'N/A'",
	"eachExpr": "([id, name], idx) in ecModes",
	"optionText": "name",
	"optionDesc": "`Internal ID: (${id})`",
	"optionActive": "($store.useElementCount??true)===id",
	"optionClick": "gEcMode(id)"
});
createDropDown($e("div#dropmount-levelXg"), {
	"activeSlot": 0,
	"minWidth": "9.5rem",
	"displayText": "xgLvls[$store.xgLvl??0][1]||'Invalid'",
	"eachExpr": "xgLvl in xgLvls",
	"optionText": "xgLvl[1]",
	"optionDesc": "`Internal ID: (${xgLvl[0]})`",
	"optionActive": "($store.xgLvl||4)===xgLvl[0]",
	"optionClick": "gXgLvl(xgLvl[0])"
});
createDropDown($e("div#dropmount-levelGs"), {
	"activeSlot": 1,
	"minWidth": "7.5rem",
	"displayText": "gsLvls[($store.gsLvl??4)-1][1]||'Invalid'",
	"eachExpr": "gsLvl in gsLvls",
	"optionText": "gsLvl[1]",
	"optionDesc": "`Internal ID: (${gsLvl[0]})`",
	"optionActive": "($store.gsLvl||4)===gsLvl[0]",
	"optionClick": "gGsLvl(gsLvl[0])"
});
createDropDown($e("div#dropmount-levelSc"), {
	"activeSlot": 2,
	"minWidth": "7.5rem",
	"displayText": "scLvls[($store.scLvl??3)-2][1]||'Invalid'",
	"eachExpr": "scLvl in scLvls",
	"optionText": "scLvl[1]",
	"optionDesc": "`Internal ID: (${scLvl[0]})`",
	"optionActive": "($store.scLvl||3)===scLvl[0]",
	"optionClick": "gScLvl(scLvl[0])"
});
createDropDown($e("div#dropmount-levelX5"), {
	"activeSlot": 3,
	"minWidth": "6.4rem",
	"displayText": "x5Lvls[($store.x5Lvl??82)-81][1]||'Invalid'",
	"eachExpr": "x5Lvl in x5Lvls",
	"optionText": "x5Lvl[1]",
	"optionDesc": "`Internal ID: (${x5Lvl[0]})`",
	"optionActive": "($store.x5Lvl||82)===x5Lvl[0]",
	"optionClick": "gX5Lvl(x5Lvl[0])"
});
createDropDown($e("div#dropmount-notestyle"), {
	"activeSlot": 0,
	"minWidth": "6.5rem",
	"displayText": "styles[$store.noteStyle||'comb']||'N/A'",
	"eachExpr": "(name, id) in styles",
	"optionText": "name",
	"optionDesc": "`Internal ID: (${id})`",
	"optionActive": "($store.noteStyle||'comb')===id",
	"optionClick": "gStyle(id)"
});
createDropDown($e("div#dropmount-panstyle"), {
	"activeSlot": 1,
	"minWidth": "6.5rem",
	"displayText": "pans[$store.panStyle??11]||'N/A'",
	"eachExpr": "(name, id) in pans",
	"optionText": "name",
	"optionDesc": "`Internal ID: (${id})`",
	"optionActive": "`${$store.panStyle??11}`===id",
	"optionClick": "gPanStyle(id)"
});
createDropDown($e("div#dropmount-accenttype"), {
	"activeSlot": 2,
	"displayText": "accents[$store.accentType ?? 0][0]||'N/A'",
	"eachExpr": "([name, desc], id) in accents",
	"optionText": "name",
	"optionDesc": "desc",
	"optionActive": "($store.accentType ?? 0)===id",
	"optionClick": "gAccentType(id)"
});
createDropDown($e("div#dropmount-colourscheme"), {
	"activeSlot": 0,
	"minWidth": "6.5rem",
	"displayText": "schemes[$store.scheme ?? 0]||'N/A'",
	"eachExpr": "(name, id) in schemes",
	"optionText": "name",
	"optionDesc": "`Internal ID: (${id})`",
	"optionActive": "($store.scheme ?? 0)===id",
	"optionClick": "gSetScheme(id)"
});
createDropDown($e("div#dropmount-background"), {
	"activeSlot": 1,
	"minWidth": "6.65rem",
	"displayText": "backgrounds[$store.bgGroup ?? 'soft'][0]||'N/A'",
	"eachExpr": "([name, desc], id) in backgrounds",
	"optionText": "name",
	"optionDesc": "desc",
	"optionActive": "($store.bgGroup ?? 'soft')===id",
	"optionClick": "gBgGroup(id)"
});
createDropDown($e("div#dropmount-wallpaper-strategy"), {
	"activeSlot": 2,
	"minWidth": "7rem",
	"displayText": "strats[$store.bgStrat ?? 'cover'][0]||'N/A'",
	"eachExpr": "([name, desc], id) in strats",
	"optionText": "name",
	"optionDesc": "desc",
	"optionActive": "($store.bgStrat ?? 'cover')===id",
	"optionClick": "gBgStrat(id)"
});
Alpine.store("wallpapers", [['Loading...', 'Please wait until metadata is loaded.']]);
createDropDown($e("div#dropmount-wallpaper-choice"), {
	"activeSlot": 3,
	"minWidth": "5.5rem",
	"displayText": "$store.wallpapers[$store.bgChoice ?? 0][0]||'N/A'",
	"eachExpr": "([name, desc], id) in $store.wallpapers",
	"optionText": "name",
	"optionDesc": "desc",
	"optionActive": "($store.bgChoice ?? 0)===id",
	"optionClick": "gBgSelect(id)"
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
let visualiser = new Cambiare($e(".cambiare"), timeMuxer);
//visualiser.clockSource.attach(audioFilePlayer);
visualiser.reset();
(async () => {
	visualiser.styles = new StylePool();
	visualiser.styles.load((await fetch("../../midi-db/misc/yStyle.tsv")).body);
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
	visualiser.reset();
});

visualiser.addEventListener("mode", (ev) => {
	Alpine.store("deviceMode", ev.data);
	Alpine.store("deviceModeCatOverride", ev.data !== "?");
});
visualiser.addEventListener("banklevel", (ev) => {
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
	visualiser.device.switchMode(mode, true, true);
	Alpine.store("deviceMode", mode);
	Alpine.store("deviceModeCatOverride", mode !== "?");
};
self.gRange = async function (mode) {
	visualiser.setRange(mode);
	Alpine.store("showRange", mode);
};
self.gPort = async function (port) {
	visualiser.setPort(port);
	Alpine.store("startPort", port);
};
self.gDemo = async function ({file, id, artist, title, standard}) {
	await audioFilePlayer.pause();
	visualiser.reset();
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
	visualiser.dispatchEvent("title", `Loading demo: ${artist} - ${title} ... (MIDI)`);
	let midiBlob = await(await getBlobFrom(`${file}.mid`)).blob();
	visualiser.dispatchEvent("title", `Loading demo: ${artist} - ${title} ... (audio)`);
	let audioBlob = await(await getBlobFrom(`${file}.opus`)).blob();
	visualiser.dispatchEvent("title", `Polak is cute!`);
	await visualiser.loadFile(midiBlob);
	audioUri = URL.createObjectURL(audioBlob);
	audioFilePlayer.currentTime = 0;
	audioFilePlayer.src = audioUri;
	visualiser.device.initOnReset = false;
	visualiser.dispatchEvent("title", "");
	visualiser.device.setDetectionTargets(standard);
	Alpine.store("activeDemo", id);
	Alpine.store("play", "demo");
	Alpine.store("sound", "demo");
};
self.gStyle = async function (type) {
	visualiser.style = type;
	Alpine.store("noteStyle", type);
};
self.gPixelC = async function (profile) {
	visualiser.setPixelProfile(profile);
	Alpine.store("pixelProfile", profile);
};
self.gXgLvl = async function (level) {
	//visualiser.device.setGsTargets(false, level);
	//Alpine.store("xgLvl", level);
	visualiser.sendCmd({
		type: 15,
		track: 0,
		data: [67, 16, 73, 0, 0, 18, level]
	});
};
self.gGsLvl = async function (level) {
	visualiser.device.setGsTargets(false, level);
	Alpine.store("gsLvl", level);
};
self.gScLvl = async function (level) {
	visualiser.device.setGsTargets(true, level);
	Alpine.store("scLvl", level);
};
self.gLimitDump = async function (limit) {
	visualiser.device.setDumpLimit(limit);
	Alpine.store("limitDump", limit);
};
self.gFrameTime = (frameTime) => {
	visualiser.setFrameTime(frameTime);
	Alpine.store("frameTime", frameTime);
};
self.gPanStyle = (panStyle) => {
	visualiser.panStyle = panStyle;
	Alpine.store("panStyle", panStyle);
};
self.gEcMode = (ecMode) => {
	visualiser.useElementCount = ecMode;
	Alpine.store("useElementCount", ecMode);
};
let fileTooltip = $e("div#show-wallpaper-tooltip"),
schemeCat = 0, schemeSubCat = 0, schemeGroup, bgChosen, bgColour, bgOnDevice;
const setWallpaper = async (invokeButton) => {
	if (schemeGroup === "imageLuma" || schemeGroup === "imageColour") {
		if (typeof bgChosen[2]?.length === "number") {
			let chosen = bgChosen[2][0];
			if (schemeCat !== 0 && schemeCat < bgChosen[2].length) {
				chosen = bgChosen[2][schemeCat];
			};
			visualiser.setWallpaperUrl(chosen.url);
			visualiser.setWallpaperOpacity(chosen.opacity);
			gBgStrat(chosen.strategy);
			while (fileTooltip.childNodes.length > 0) {
				fileTooltip.childNodes[0].remove();
			};
			let linkedArtist = document.createElement("a");
			linkedArtist.target = "_blank";
			linkedArtist.href = chosen.link;
			linkedArtist.innerText = chosen.artist;
			mountElement(fileTooltip, [`${chosen.year} © `, linkedArtist, ` - ${chosen.license}`]);
		} else {
			// Display the chosen local file
			fileTooltip.innerText = "Slide over this text to adjust wallpaper opacity.";
		};
	} else {
		visualiser.setWallpaperUrl();
	};
};
const setTrueScheme = () => {
	if (schemeCat === 1) {
		visualiser.setScheme(1);
	} else if (schemeCat === 0) {
		visualiser.setScheme(schemeSubCat ? 2 : 0);
	} else {
		console.warn(`Invalid colour scheme category: ${schemeCat}.`);
	};
	setWallpaper(false);
};
self.gSetScheme = (scheme) => {
	schemeCat = scheme;
	setTrueScheme();
	Alpine.store("scheme", scheme);
};
self.gBgGroup = (group) => {
	switch (group) {
		case "soft":
		case "colour": {
			schemeSubCat = 0;
			break;
		};
		case "luma":
		case "imageLuma":
		case "imageColour": {
			schemeSubCat = 1;
			break;
		};
		default: {
			console.debug(group);
		};
	};
	schemeGroup = group;
	setTrueScheme();
	Alpine.store("bgGroup", group);
	switch (group) {
		case "colour":
		case "imageColour": {
			visualiser.setBackgroundColour(bgColour);
			break;
		};
		case "soft":
		case "luma":
		case "imageLuma": {
			visualiser.setBackgroundColour();
			break;
		};
	};
};
self.gBgStrat = (strat) => {
	visualiser.setWallpaperStrat(strat);
	Alpine.store("bgStrat", strat);
};
const colourPickerBg = $e("div#button-background-colour-picker > input"),
colourDispBg = $e("div#button-background-colour-picker > div");
colourPickerBg.addEventListener("input", function () {
	bgColour = this.value;
	visualiser.setBackgroundColour(bgColour);
	colourDispBg.style.backgroundColor = this.value;
});
self.gBgColour = function () {
	bgColour = null;
	visualiser.setBackgroundColour(bgColour);
	colourPickerBg.showPicker();
	colourPickerBg.value = `#${Math.floor(Math.random()*16777216).toString(16).padStart(6, "0")}`;
};
$e("div#button-background-colour-picker").addEventListener("contextmenu", (ev) => {
	ev.preventDefault();
	ev.stopImmediatePropagation();
	bgColour = null;
	visualiser.setBackgroundColour(bgColour);
});
self.gBgSelect = (id) => {
	bgChosen = Alpine.store("wallpapers")[id];
	setWallpaper(true);
	Alpine.store("bgChoice", id);
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
			visualiser.sendCmd({type: 15, track: 0, data: new Uint8Array(await file.arrayBuffer())});
			console.debug("Loaded an SYX blob.");
			break;
		};
		case "s7e":
		case "pcg": {
			// Load sound banks
			visualiser.device.loadBank(ext, file);
			console.debug(`Loaded ${ext.toUpperCase()} voice banks.`);
			break;
		};
		case "mdat": {
			// Load ID to name maps
			visualiser.loadMap(await file.text(), true);
			console.debug("Loaded a voice name map.");
			break;
		};
		default: {
			// Load MIDI files
			Alpine.store("activeDemo", -1);
			visualiser.reset();
			visualiser.dispatchEvent("title", `Loading MIDI...`);
			await visualiser.loadFile(file);
			visualiser.dispatchEvent("title", ``);
			visualiser.device.initOnReset = false;
			console.debug("Loaded a MIDI file.");
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
	visualiser.init();
	useMidiBus = !useMidiBus;
	Alpine.store("useMidiBus", useMidiBus);
	visualiser.device.initOnReset = useMidiBus;
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
	visualiser.loadEfx(await(await fetch(`../../midi-db/misc/efxId.tsv`)).text());
	visualiser.loadMapPaths([
		`../../midi-db/map/gm.24.tsv`,
		`../../midi-db/map/ns5r.24.tsv`,
		`../../midi-db/map/xg.24.tsv`,
		`../../midi-db/map/gs.24.tsv`,
		`../../midi-db/map/sd.24.tsv`,
		`../../midi-db/map/cs2x.24.tsv`,
		`../../midi-db/map/s90es.24.tsv`,
		`../../midi-db/map/kross.24.tsv`,
		`../../midi-db/map/pa.24.tsv`,
		`../../midi-db/map/gm.12.tsv`,
		`../../midi-db/map/ns5r.12.tsv`,
		`../../midi-db/map/xg.12.tsv`,
		`../../midi-db/map/gs.12.tsv`,
		`../../midi-db/map/sd.12.tsv`,
		`../../midi-db/map/s90es.12.tsv`,
		`../../midi-db/map/gm.10.tsv`,
		`../../midi-db/map/ns5r.10.tsv`,
		`../../midi-db/map/xg.10.tsv`,
		`../../midi-db/map/gs.10.tsv`,
		`../../midi-db/map/sd.10.tsv`,
		`../../midi-db/map/cs2x.10.tsv`,
		`../../midi-db/map/s90es.10.tsv`
	]);
	await visualiser.glyphs.loadFile("../../midi-db/bitmaps/xg/font.tsv");
	await visualiser.freeChord.loadFile("../../midi-db/bitmaps/xg/freeChord.tsv");
	demoPool.load(await (await getBlobFrom(`list.tsv`)).text());
	Alpine.store("demo", demoPool.data);
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
				let roundedBeat = Math.floor(visualiser.noteBeat * 2) / 2;
				let roundedTime = (visualiser.noteBar * visualiser.getTimeSig()[0] + roundedBeat + visualiser.noteOffset) * 60 / visualiser.getTempo();
				//visualiser.getTimeSig()
				console.info(`Requested rounded note progress: ${visualiser.noteBar + 1}/${roundedBeat + 1}, ${Math.round(roundedTime * 1000) / 1000}s (${Math.round(timeMuxer.currentTime * 1000) / 1000}s)`);
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
		visualiser.sendCmd(ev.data);
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
	try {
		let bundledBackgrounds = await (await fetch("./bg/defaults.json")).json();
		let bgData = [];
		for (let i = 0; i < bundledBackgrounds.length; i ++) {
			let e = bundledBackgrounds[i];
			//console.debug(e);
			bgData.push([`#${i + 1}`, `Authored by ${e[0].artist}, ${e[1].artist}.`, e]);
		};
		bgData.push(['File', `Choose a file from your device.`, {'type': 'local'}]);
		//console.debug(bgData);
		Alpine.store("wallpapers", bgData);
		if (bgData.length > 1) {
			bgChosen = bgData[0];
			gBgGroup('imageLuma');
		};
	} catch (err) {
		console.info(`Metadata for bundled backgrounds cannot be found.`);
		Alpine.store("wallpapers", [['File', `Choose a file from your device.`, {'type': 'local'}]]);
	};
})();

gBgGroup('soft');
gBgStrat('cover');

Alpine.start();
self.visualiser = visualiser;
self.gOpenLni();
