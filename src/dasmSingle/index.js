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

self.Alpine = Alpine;

// Elements
/** @type {HTMLInputElement} */
const inputRaw = $e("input#text-raw");
/** @type {HTMLInputElement} */
const inputMia = $e("input#text-mia");
/** @type {HTMLDivElement} */
const displayNakedEvent = $e("div#renderer-naked");

self.gParseRaw = async () => {
	const inputLength = inputRaw.value.length;
	const normalisedInput = inputRaw.value.padEnd(inputLength + (inputLength & 1), "0");
	const inputBuffer = bufferFrom("hex", normalisedInput);
};
self.gParseMia = async () => {
	// WIP!
	console.debug(inputMia.value);
};

(async () => {
	Alpine.start();
})();
