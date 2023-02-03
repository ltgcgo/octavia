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

let inPortMap = {};

let inputConv = function (ev) {
	midiLine.postMessage(toJson(ev.data, inPortMap[ev.target.id]));
};
let inputConn = function () {
	let inputPort = midiAccess.inputs.get(this.getAttribute("mw-port-id"));
	inPortMap[inputPort.id] = 0;
	inputPort.open();
	inputPort.addEventListener("midimessage", inputConv);
};

(async function () {
	self.midiAccess = await navigator.requestMIDIAccess({"sysex": true, "software": true});
	self.fromJson = fromJson;
	self.toJson = toJson;
	self.MEE = SimpleMidiEventEmitter;
	self.inBridge = getBridge();
	let midiInBox = $e("#midi-in-list"), midiOutBox = $e("#midi-out-list");
	midiAccess.addEventListener("statechange", (ev) => {
		console.debug(ev.port);
	});
	midiAccess.inputs.forEach((port, id) => {
		let midin = document.createElement("li");
		midin.innerText = port.name;
		midin.id = `mw-in-${id}`;
		midin.setAttribute("mw-port-id", id);
		midin.addEventListener("click", inputConn);
		midiInBox.appendChild(midin);
	});
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
