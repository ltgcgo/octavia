"use strict";

import {
	IntegerHandler,
	Seamstress
} from "../../libs/seamstress@ltgcgo/index.mjs";
import {
	$e, $a
} from "../../libs/lightfelt@ltgcgo/main/quickPath";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";
import {
	smfEventRegulator
} from "../micc/utils.js";

self.IntegerHandler = IntegerHandler;
/*self.a = new Uint8Array([127, 0, 0, 0]);
self.b = new Uint8Array([129, 127, 0, 0]);
self.c = new Uint8Array([129, 129, 127, 0]);
self.d = new Uint8Array([129, 129, 129, 127, 0]);
self.a = new Uint8Array([63, 0, 0, 0]);
self.b = new Uint8Array([0b11000001, 0b01111111, 0, 0]);
self.c = new Uint8Array([0b11000001, 0b10010101, 0b01111111, 0]);
self.d = new Uint8Array([0b11000001, 0b10010101, 0b10010101, 0b01111111, 0]);*/

const resultDisplay = $e("div#results");
const typeSelector = $e("select#loaderType");
const fileProps = JSON.parse('{"extensions":[],"startIn":"pictures","id":"binOpener","description":"Open a file in a tag-length-value structure."}');
const fileTypes = {
	"mid": "smf",
	"kar": "smf",
	"aif": "iff",
	"aiff": "iff",
	"dls": "riff",
	"rmi": "riff",
	"sf2": "riff",
	"wav": "riff",
	"webp": "riff",
	"rseam": "rseam",
	"vseam": "vseam"
};
for (let extension in fileTypes) {
	fileProps.extensions.push(`.${extension.toLowerCase()}`);
	fileProps.extensions.push(`.${extension.toUpperCase()}`);
};
//console.debug(fileProps);

let summarizeSeamstressChunk = (sChunk) => {
	return `#${sChunk.id} (${sChunk.type}, #${sChunk.chunkId}): ${sChunk.offset}/${sChunk.size}, ${sChunk.data.length} B.`;
};

let showResult = async (stream, props = {}) => {
	if (!props.targetMode) {
		throw(new Error("A target mode must be defined."));
	};
	if (!props.name) {
		props.name = "<internal>";
	};
	if (!props.size) {
		props.size = -1;
	};
	let readStream;
	while (resultDisplay.childNodes.length > 0) {
		resultDisplay.childNodes[0].remove();
	};
	resultDisplay.append(`Showing the structure of binary stream "${props.name}" (${props.size >= 0 ? props.size : "N/A"} B).\nMode: ${props.targetMode}\n`);
	try {
		switch (props.targetMode) {
			case "smf": {
				let rawParser = new Seamstress();
				rawParser.headerSize = 0;
				rawParser.type = Seamstress.TYPE_4CC | Seamstress.ENDIAN_B | Seamstress.LENGTH_U32;
				rawParser.regulateStream = smfEventRegulator;
				rawParser.debugMode = !!self.debugMode;
				let splitStream = stream.tee();
				(async () => {
					for await (let chunk of rawParser.readRegulated(splitStream[1])) {
						rawParser.debugMode && console.debug(summarizeSeamstressChunk(chunk));
					};
					console.info("Finished chunk skimming.");
				})().catch((err) => {
					resultDisplay.append(`\n\nChunk skimmer: Uncaught ${err.name}: ${err.message}\n${err.stack}`);
				});
				readStream = rawParser.readChunks(splitStream[0]);
				break;
			};
			case "iff": {
				let rawParser = new Seamstress();
				rawParser.headerSize = 12;
				rawParser.type = rawParser.TYPE_4CC | rawParser.ENDIAN_B | rawParser.LENGTH_U32 | rawParser.MASK_PADDED;
				//rawParser.debugMode = true;
				readStream = rawParser.readChunks(stream);
				break;
			};
			case "riff": {
				let rawParser = new Seamstress();
				rawParser.headerSize = 12;
				rawParser.type = rawParser.TYPE_4CC | rawParser.ENDIAN_L | rawParser.LENGTH_U32 | rawParser.MASK_PADDED;
				//rawParser.debugMode = true;
				let splitStream = stream.tee();
				(async () => {
					for await (let chunk of rawParser.readChunks(splitStream[1])) {
						console.debug(summarizeSeamstressChunk(chunk));
					};
					console.info("Finished chunk skimming.");
				})().catch((err) => {
					resultDisplay.append(`\n\nChunk skimmer: Uncaught ${err.name}: ${err.message}\n${err.stack}`);
				});
				readStream = rawParser.readChunks(splitStream[0]);
				break;
			};
			default: {
				throw(new TypeError(`Stream type "${props.targetMode}" is not yet supported.`));
			};
		};
		resultDisplay.append(`\nType          No.     Offset      Size`);
	} catch (err) {
		resultDisplay.append(`\nUncaught ${err.name}: ${err.message ?? "No error message was provided."}\n${err.stack}`);
	};
	try {
		for await (let chunk of readStream) {
			let showKey = chunk.type;
			if (typeof chunk.type === "number") {
				showKey = `0x${chunk.type.toString(16)}`;
			};
			showKey = showKey.padEnd(10, " ");
			if (chunk.chunkId === 0) {
				resultDisplay.append(`\n${showKey}  - #${`${chunk.chunkId + 1}`.padStart(4, "0")}   0x${chunk.offsetData.toString(16).padStart(8, "0")}  ${chunk.data.length} B`);
			} else {
				resultDisplay.append(`\n            - #${`${chunk.chunkId + 1}`.padStart(4, "0")}   0x${chunk.offsetData.toString(16).padStart(8, "0")}  ${chunk.data.length} B`);
			};
		};
		resultDisplay.append(`\n\nStructure validation finished.`);
	} catch (err) {
		resultDisplay.append(`\n\nChunk scanner: Uncaught ${err.name}: ${err.message}\n${err.stack}`);
	};
};

let invokeAction = async () => {
	if (self.selectedFile) {
		self.selectedFile = selectedFile;
		let intendedMode = typeSelector.value;
		if (intendedMode === "auto") {
			let extensionIdx = selectedFile.name?.lastIndexOf(".");
			if (extensionIdx > 0) {
				let extensionName = selectedFile.name.substring(extensionIdx + 1).toLowerCase();
				intendedMode = fileTypes[extensionName];
				if (!intendedMode) {
					resultDisplay.append(`\nAssociation for extension "${extensionName}" is not found for: ${selectedFile.name}.`);
					return;
				};
			} else {
				resultDisplay.append(`\nInvalid extension for name: ${selectedFile.name}.`);
				return;
			};
		};
		selectedFile.targetMode = intendedMode;
		await showResult(selectedFile.stream(), selectedFile);
	};
};
$e("b#openFile").addEventListener("mouseup", async () => {
	let selectedFile = await fileOpen(fileProps);
	if (selectedFile) {
		self.selectedFile = selectedFile;
	};
	await invokeAction();
});
typeSelector.addEventListener("change", invokeAction);
