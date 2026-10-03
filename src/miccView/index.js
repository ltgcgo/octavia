"use strict";

import {
	MICC,
	MICCConstants,
    MICCSequence
} from "../micc/index.mjs";
import {
	bufferToDHex
} from "../state/utils.js";
import {
	Alpine
} from "../../libs/alpine@alpinejs/alpine.min.js";
import {
	$e,
	$a
} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import {
	fileOpen
} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";
import {
	BinaryString
} from "../../libs/rochelle@ltgcgo/binaryString.mjs";

const fileProps = JSON.parse('{"extensions":[],"startIn":"pictures","id":"binOpener","description":"Open a file in a tag-length-value structure."}');
const fileTypes = {
	"mid": "smf",
	"kar": "smf",
	"mia": "mia",
	"xws": "xws",
	"rmi": "smf",
	"wrk": "wrk",
	"it": "it",
	"mptm": "mptm",
	"s3m": "s3m",
	"xm": "xm"
};
for (let extension in fileTypes) {
	fileProps.extensions.push(`.${extension.toLowerCase()}`);
	fileProps.extensions.push(`.${extension.toUpperCase()}`);
};
const metaSeqNames = {
	"format": "File format",
	"type": "File type",
	"title": "File title",
	"isSmpte": "SMPTE time division?",
	"smpte": "SMPTE frames",
	"tpqn": "Ticks per quarter note",
	"track": "Expected tracks",
	"style": "Expected styles",
	"clip": "Expected clips"
};
const metaModNames = {
	"isTracker": "Tracker module?"
};

const inputUrl = $e("input#text-raw");
const [dispFileName, dispSize] = $a("div#info-title-success > span");
const dispCrashError = $e("div#info-title-failure");

/** @type {MICCSequence?} */
let sequence;

const populateViewer = async () => {
	{
		const infoSeq = [];
		for (let k in metaSeqNames) {
			const metaEntry = sequence.meta[k];
			if (metaEntry == null) continue;
			switch (k) {
				case "tpqn": {
					//if (sequence.meta.isSmpte) continue;
					break;
				};
				case "smpte": {
					if (!sequence.meta.isSmpte) continue;
					break;
				};
			};
			switch (typeof metaEntry) {
				case "boolean": {
					infoSeq.push([k, metaSeqNames[k], metaEntry ? "Yes" : "No"]);
					break;
				};
				default: {
					infoSeq.push([k, metaSeqNames[k], metaEntry]);
				};
			};
		};
		Alpine.store("metaSequence", infoSeq);
	};
	{
		const infoSeq = [];
		for (let k in metaModNames) {
			const metaEntry = sequence.tracker[k];
			if (metaEntry == null) continue;
			switch (k) {
				case "isTracker": {
					break;
				};
				default: {
					if (!sequence.tracker.isTracker) continue;
				};
			};
			switch (typeof metaEntry) {
				case "boolean": {
					infoSeq.push([k, metaModNames[k], metaEntry ? "Yes" : "No"]);
					break;
				};
				default: {
					infoSeq.push([k, metaModNames[k], metaEntry]);
				};
			};
		};
		Alpine.store("metaTracker", infoSeq);
	};
	{
		const infoSeq = [];
		for (const track of sequence.tracks) {
			infoSeq.push([track.offset?.toString(16).padStart(6, "0") ?? "N/A", track.id, track.type, track.vendor, track.data.length]);
		};
		Alpine.store("trackInfo", infoSeq);
	};
	Alpine.store("trackContent", []);
};
self.gShowTrack = async (trackId) => {
	const infoSeq = [], source = sequence.tracks[trackId].data;
	for (let i = 0; i < source.length; i ++) {
		const event = source[i];
		let payloadLook = "has-text-white";
		switch (event.type) {
			case MICCConstants.MIDI_NOTE_OFF: {
				payloadLook = "has-text-danger";
				break;
			};
			case MICCConstants.MIDI_NOTE_ON: {
				payloadLook = event.data[1] > 0 ? "has-text-success" : "has-text-danger";
				break;
			};
			case MICCConstants.MIDI_CONTROL: {
				switch (event.data[0]) {
					case 0:
					case 32: {
						payloadLook = "has-text-purple";
						break;
					};
					default: {
						payloadLook = "has-text-magenta";
					};
				};
				break;
			};
			case MICCConstants.MIDI_PROGRAM: {
				payloadLook = "has-text-purple";
				break;
			};
			case MICCConstants.MIDI_SYSEX_NEW:
			case MICCConstants.MIDI_SYSEX_RESUME: {
				payloadLook = "has-text-warning";
				break;
			};
			case MICCConstants.MIDI_META: {
				if (event.parsed?.constructor === BinaryString) {
					payloadLook = "has-text-shaded";
				} else {
					payloadLook = "has-text-info";
				};
				break;
			};
		};
		let payloadResult;
		switch (event.type) {
			case MICCConstants.AS_TRACKER: {
				// WIP, this should be invalid for now.
				break;
			};
			default: {
				if (event.parsed != null) {
					switch (event.parsed.constructor) {
						case Number: {
							payloadResult = event.parsed;
							break;
						};
						case BinaryString: {
							//console.debug(event.parsed);
							payloadResult = event.parsed.text;
							break;
						};
					};
				} else {
					payloadResult = bufferToDHex(event.data, Infinity);
				};
			};
		};
		infoSeq.push([
			payloadLook,
			event.offset?.toString(16).padStart(6, "0") ?? "N/A",
			i,
			event.delta,
			`${Math.floor(event.tick / sequence.meta.tpqn).toString().padStart(4, "0")} ${(event.tick % sequence.meta.tpqn).toString().padStart(3, "0")}`,
			event.isStale ? "*" : "",
			event.type.toString(16).padStart(2, "0"),
			event.port,
			(event.ch ?? event.meta)?.toString(16).padStart(2, "0"),
			payloadResult
		]);
	};
	Alpine.store("trackContent", infoSeq);
};

self.gParseUrl = async () => {
	Alpine.store("appState", 1);
	try {
		sequence = MICC.parseSmf((await fetch(inputUrl.value)).body);
		await sequence.finalised;
		Alpine.store("appState", 2);
		dispFileName.innerText = "<stream>";
		dispSize.innerText = "N/A";
		await populateViewer();
	} catch (err) {
		console.error(err);
		let errorText = `Uncaught ${err.name}: ${err.message}\n\t`;
		errorText += err.stack.split("\n").join("\n\t");
		dispCrashError.innerText = errorText;
		Alpine.store("appState", 3);
	};
};
self.gParseFile = async () => {
	const file = await fileOpen(fileProps);
	if (file) {
		const extensionIdx = file.name?.lastIndexOf(".");
		let intendedMode;
		if (extensionIdx > 0) {
			const fileExt = file.name.substring(extensionIdx + 1).toLowerCase();
			intendedMode = fileTypes[fileExt];
			if (!intendedMode) {
				throw(new Error(`Unknown file extension "${fileExt}".`));
			};
		} else {
			throw(new Error(`Invalid file extension.`));
		};
		Alpine.store("appState", 1);
		dispFileName.innerText = file.name;
		dispSize.innerText = file.size.toString();
		try {
			switch (intendedMode) {
				case "smf": {
					sequence = MICC.parseSmf(file.stream());
					break;
				};
				default: {
					throw(new TypeError(`Format "${intendedMode}" isn't yet supported by MICC.`));
				};
			};
			await sequence.finalised;
			Alpine.store("appState", 2);
			await populateViewer();
		} catch (err) {
			console.error(err);
			let errorText = `Uncaught ${err.name}: ${err.message}\n\t`;
			errorText += err.stack.split("\n").join("\n\t");
			dispCrashError.innerText = errorText;
			Alpine.store("appState", 3);
		};
	};
};

(async () => {
	Alpine.store("appState", 0);
	Alpine.store("metaSequence", []);
	Alpine.store("metaTracker", []);
	Alpine.start();
})();