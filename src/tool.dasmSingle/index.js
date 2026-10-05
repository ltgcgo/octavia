"use strict";

import {
	Alpine
} from "../../libs/alpine@alpinejs/alpine.min.js";
import {
	$e,
	$a
} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import {
	bufferFrom,
	bufferTo
} from "../state/utils/bufferIo.mjs";
import {
	bufferToDHex
} from "../state/utils.js";
import {
	MIDINakedEvent
} from "../micc/index.mjs";
import {
	MICCInternalsSMF,
	MICCInternalsMIA
} from "../micc/index.mjs";

self.Alpine = Alpine;

// Elements
/** @type {HTMLInputElement} */
const inputRaw = $e("input#text-raw");
/** @type {HTMLInputElement} */
const inputMia = $e("input#text-mia");
/** @type {HTMLDivElement} */
const displayNakedEvent = $e("div#renderer-naked");

const displayClear = async () => {
	while (displayNakedEvent.childNodes.length > 0) {
		displayNakedEvent.childNodes[0].remove();
	};
};
const jsonPrettifier = (k, v) => {
	switch (typeof v) {
		case "boolean":
		case "number":
		case "string": {
			return v;
			break;
		};
		case "bigint": {
			return `${v?.toString()}n`;
			break;
		};
		case "function": {
			return `${v?.name || "<anonymous>"}() {}`;
			break;
		};
		case "symbol": {
			return v.toString();
			break;
		};
		default: {
			switch (v?.constructor) {
				case Uint8Array:
				case Uint8ClampedArray: {
					return `(${v.length} B) ${bufferToDHex(v, 12)}`;
					break;
				};
				default: {
					return v;
				};
			};
		};
	};
};

self.gSchemaIsWrapped = async (value) => {
	Alpine.store("schemaIsWrapped", value);
};
self.gHasDelta = async (value) => {
	Alpine.store("hasDelta", value);
};
self.gFinalise = async (value) => {
	Alpine.store("finalise", value);
};
self.gUseReadable = async (value) => {
	Alpine.store("useReadable", value);
};

/** @type {MIDINakedEvent} */
let parsedEvent;
self.gParseRaw = async () => {
	const sanitisedInput = inputRaw.value.replaceAll(" ", "");
	inputRaw.value = sanitisedInput;
	const inputLength = sanitisedInput.length;
	const normalisedInput = sanitisedInput.padEnd(inputLength + (inputLength & 1), "0");
	try {
		/** @type {import("../micc/index.mjs").MICCSMFMIAHandleOptions} */
		const config = {
			"hasDelta": Alpine.store("hasDelta"),
			"isSmfWrapped": Alpine.store("schemaIsWrapped"),
			"preferReadable": Alpine.store("useReadable")
		};
		const inputBuffer = bufferFrom("hex", normalisedInput);
		//console.debug(inputBuffer);
		parsedEvent = MICCInternalsSMF.parseSingleEvent(inputBuffer, config);
		displayClear();
		displayNakedEvent.append(JSON.stringify(parsedEvent, jsonPrettifier, "\t"));
		console.debug(parsedEvent);
		inputMia.value = MICCInternalsMIA.emitSingleEvent(parsedEvent, config);
	} catch (err) {
		parsedEvent = null;
		console.warn(err);
		displayClear();
		const errorMsg = document.createElement("span");
		errorMsg.classList.add("has-text-warning");
		errorMsg.append(`Uncaught ${err.name}: ${err.message}\nAt:\n\t${err.stack.split("\n").join("\n\t")}`);
		displayNakedEvent.append(errorMsg);
	};
};
self.gSerialiseRaw = async () => {
	if (parsedEvent) {
		const serialisedBuffer = MICCInternalsSMF.emitSingleEvent(parsedEvent, {
			"hasDelta": Alpine.store("hasDelta"),
			"isSmfWrapped": Alpine.store("schemaIsWrapped")
		});
		if (serialisedBuffer.toHex) {
			const hexResult = serialisedBuffer.toHex().toUpperCase();
			if (inputRaw.value.toUpperCase() === hexResult) {
				inputRaw.value = hexResult;
			} else {
				displayClear();
				const errorMsg = document.createElement("span");
				errorMsg.classList.add("has-text-warning");
				errorMsg.append(`Failed lossless round-trip test. Assembly result:\n${hexResult}`);
				displayNakedEvent.append(errorMsg);
			};
		};
		console.info(`Serialised: ${bufferToDHex(serialisedBuffer)}\n`, serialisedBuffer);
	} else {
		displayClear();
		const errorMsg = document.createElement("span");
		errorMsg.classList.add("has-text-warning");
		errorMsg.append(`No valid parsed event exists. Please parse an event first.`);
		displayNakedEvent.append(errorMsg);
	};
};
self.gParseMia = async () => {
	// WIP!
	console.debug(inputMia.value);
};
self.gSerialiseMia = async () => {};

inputRaw.addEventListener("keydown", async (ev) => {
	switch (ev.key) {
		case "Enter": {
			await gParseRaw();
			break;
		};
	};
});

(async () => {
	Alpine.store("schemaIsWrapped", false);
	Alpine.store("hasDelta", false);
	Alpine.store("finalise", false);
	Alpine.store("useReadable", false);
	Alpine.start();
})();
