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

(async function () {
	self.midiAccess = await navigator.requestMIDIAccess({"sysex": true, "software": true});
	self.fromJson = fromJson;
	self.toJson = toJson;
	self.MEE = SimpleMidiEventEmitter;
	self.inBridge = getBridge();
	midiAccess.addEventListener("statechange", (ev) => {
		console.info(ev.port);
	});
	midiAccess.inputs.forEach((port, id) => {
		console.info(`Discovered input ${id}: ${port.name}.`);
	});
	midiAccess.outputs.forEach((port, id) => {
		console.info(`Discovered output ${id}: ${port.name}.`);
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
