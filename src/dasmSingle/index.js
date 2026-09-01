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
import MICCInternalsSMF from "../micc/parser/smf.mjs";

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

self.gParseRaw = async () => {
	const inputLength = inputRaw.value.length;
	const normalisedInput = inputRaw.value.padEnd(inputLength + (inputLength & 1), "0");
	try {
		const inputBuffer = bufferFrom("hex", normalisedInput);
		console.debug(inputBuffer);
		const parsedEvent = MICCInternalsSMF.parseSingleEvent(inputBuffer);
		displayClear();
		displayNakedEvent.append(JSON.stringify(parsedEvent, (k, v) => {
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
							return `(${v.length} B) ${bufferToDHex(v, 8)}`;
							break;
						};
						default: {
							return v;
						};
					};
				};
			};
		}, "\t"));
		console.debug(parsedEvent);
	} catch (err) {
		console.warn(err);
		displayClear();
		const errorMsg = document.createElement("span");
		errorMsg.classList.add("has-text-warning");
		errorMsg.append(`Uncaught ${err.name}: ${err.message}\nAt:\n\t${err.stack.split("\n").join("\n\t")}`);
		displayNakedEvent.append(errorMsg);
	};
};
self.gParseMia = async () => {
	// WIP!
	console.debug(inputMia.value);
};

inputRaw.addEventListener("keydown", async (ev) => {
	switch (ev.key) {
		case "Enter": {
			await gParseRaw();
			break;
		};
	};
});

(async () => {
	Alpine.start();
})();
