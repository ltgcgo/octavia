"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";
import {
	toJson,
	fromJson,
	getBridge,
	SimpleMidiEventEmitter
} from "../bridge/index.mjs";

let globalAudioCtx;
let getGAC = function () {
	if (!globalAudioCtx) {
		globalAudioCtx = new AudioContext();
	};
};
let switchList = function (list, index) {
	list?.forEach((e, i) => {
		if (i == index) {
			e.classList.on("active");
		} else {
			e.classList.off("active");
		};
	});
};

let inPortMap = {};

let activeIn, activeInPort = 0, activeOut, activeOutPort = 0;

let midiInBox = $e("#midi-in-list"), midiOutBox = $e("#midi-out-list");
let midiInSw = $e(".actor-port-in"), midiOutSw = $e(".actor-port-out");
let midiInSel = $a(".selector-port-in"), midiOutSel = $a(".selector-port-out");
let portInList = [], portOutList = [];

let refreshPortIn = function () {
	while (portInList > 0) {
		portInList.pop().remove();
	};
	midiAccess.inputs.forEach((port, id) => {
		let midin = document.createElement("li");
		midin.innerText = port.name;
		midin.id = `mw-in-${id}`;
		midin.setAttribute("mw-port-id", id);
		midin.addEventListener("click", inputSel);
		midiInBox.appendChild(midin);
		portInList.push(midin);
	});
};

let inputConv = function (ev) {
	midiLine.postMessage(toJson(ev.data, inPortMap[ev.target.id]));
};
let inputSel = function () {
	activeIn = midiAccess.inputs.get(this.getAttribute("mw-port-id"));
	midiInSw.innerText = activeIn.connection == "closed" ? "Closed" : "Opened";
	if (inPortMap[activeIn.id] || activeIn.connection == "open") {
		switchList(midiInSel, inPortMap[activeIn.id]);
	};
	portInList.forEach((e) => {
		let elId = e.getAttribute("mw-port-id");
		if (elId == activeIn.id) {
			e.classList.on("active");
		} else {
			e.classList.off("active");
		};
	});
};
midiInSw.addEventListener("click", function () {
	if (activeIn.connection == "closed") {
		activeIn.open();
		inPortMap[activeIn.id] = activeInPort;
		activeIn.addEventListener("midimessage", inputConv);
		midiLine.postMessage({
			type: 255,
			meta: 33,
			track: 240 + activeInPort,
			data: activeInPort
		});
		midiInSw.innerText = "Opened";
	} else {
		activeIn.close();
		activeIn.removeEventListener("midimessage", inputConv);
		midiInSw.innerText = "Closed";
	};
});
midiInSel.forEach((e, i) => {
	e.addEventListener("click", function () {
		activeInPort = i;
		switchList(midiInSel, i);
	});
});

(async function () {
	self.midiAccess = await navigator.requestMIDIAccess({"sysex": true, "software": true});
	self.fromJson = fromJson;
	self.toJson = toJson;
	self.MEE = SimpleMidiEventEmitter;
	midiAccess.addEventListener("statechange", (ev) => {
		console.debug(ev.port);
	});
	refreshPortIn();
	midiAccess.outputs.forEach((port, id) => {
		let midout = document.createElement("li");
		midout.innerText = port.name;
		midout.id = `mw-in-${id}`;
		midout.setAttribute("mw-port-id", id);
		midiOutBox.appendChild(midout);
	});
	self.midiLine = getBridge();
	const propsMid = JSON.parse('{"extensions":[".mid",".MID",".kar",".KAR",".syx",".SYX"],"startIn":"music","id":"midiOpener","description":"Open a MIDI file"}');
	$e("#openMidi").addEventListener("click", async function () {
		let file = await fileOpen(propsMid);
		let fileSplit = file.name.lastIndexOf("."), ext = "";
		if (fileSplit > -1) {
			ext = file.name.slice(fileSplit + 1).toLowerCase();
		};
		if (ext == "syx") {
			// Load SysEx blobs
			//tuiVis.sendCmd({type: 15, track: 0, data: new Uint8Array(await file.arrayBuffer())});
		} else {
			//tuiVis.reset();
			//tuiVis.loadFile(file);
			self.midiBlob = file;
		};
	});
})();
