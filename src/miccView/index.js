"use strict";

import {
	MICC,
    MICCSequence
} from "../micc/index.mjs";
import {
	bufferFrom,
	bufferTo
} from "../state/utils/bufferIo.mjs";
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

const [dispFileName, dispSize] = $a("div#info-title-success > span");
const dispCrashError = $e("div#info-title-failure");

/** @type {MICCSequence?} */
let sequence;

const populateViewer = async () => {};

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
	Alpine.start();
})();