"use strict";

import {
	IntegerHandler,
	Seamstress
} from "../../libs/seamstress@ltgcgo/index.mjs";
import {
	$e, $a
} from "../../libs/lightfelt@ltgcgo/main/quickPath";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";

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
	let map;
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
				rawParser.regulateStream = function (offset, subchunk) {
					switch (subchunk.type) {
						case "MTrk":
						case "XFIH":
						case "XFKM": {
							let eventContext = subchunk.context;
							delete eventContext.statusPos;
							delete eventContext.sizePos; // f0, ff
							delete eventContext.dataPos; // f0, ff
							let deltaSize = IntegerHandler.sizeVLV(subchunk.data, offset);
							let remainingSize = subchunk.data.length - offset;
							if (deltaSize <= 0 || deltaSize > 4) {
								if (deltaSize === 0 && remainingSize < 4) {
									return 0;
								};
								throw(new Error(`Delta time is invalid at 0x${(subchunk.offsetData + offset).toString(16).padStart(6, "0")}`));
							};
							if (deltaSize >= remainingSize) {
								return 0;
							};
							let statusPos = offset + deltaSize;
							eventContext.statusPos = deltaSize;
							let fullStatusPos = statusPos + subchunk.offsetData;
							let statusByte = 0, isStale = false;
							if (subchunk.data[statusPos] & 0x80) {
								// Status byte.
								statusByte = subchunk.data[statusPos];
								eventContext.status = statusByte;
								this.debugMode && console.debug(`Status (fresh): ${statusByte.toString(16)}`);
							} else {
								// Re-use running status.
								if ((subchunk.offset + offset) === 0) {
									throw(new Error(`Stale running status should never be at the start of the chunk at 0x${fullStatusPos.toString(16).padStart(6, "0")}`));
								} else if (eventContext.status >= 0xf0) {
									throw(new Error(`Stale running status should never be ${eventContext.status.toString(16)} at 0x${fullStatusPos.toString(16).padStart(6, "0")}`));
								} else {
									statusByte = eventContext.status;
									isStale = true;
									this.debugMode && console.debug(`Status (stale): ${statusByte.toString(16)}`);
								};
							};
							let fullSize = deltaSize;
							switch (statusByte) {
								case 0xf0:
								case 0xf7: {
									// SysEx and SysEx continuation.
									let seSizeSize = IntegerHandler.sizeVLV(subchunk.data, offset + deltaSize + 1);
									let seRSize = remainingSize - deltaSize - 1;
									if (seSizeSize <= 0 || seSizeSize > 4) {
										if (seSizeSize === 0 && seRSize < 4) {
											return 0;
										};
										throw(new Error(`SysEx size is invalid at 0x${(subchunk.offsetData + offset).toString(16).padStart(6, "0")}`));
									};
									eventContext.sizePos = deltaSize + 1;
									eventContext.dataPos = eventContext.sizePos + seSizeSize;
									fullSize += 1 + seSizeSize + IntegerHandler.readVLV(subchunk.data, offset + deltaSize + 1);
									break;
								};
								case 0xff: {
									// Metadata.
									let mdSizeSize = IntegerHandler.sizeVLV(subchunk.data, offset + deltaSize + 2);
									let mdRSize = remainingSize - deltaSize - 2;
									if (mdSizeSize <= 0 || mdSizeSize > 4) {
										if (mdSizeSize === 0 && mdRSize < 4) {
											return 0;
										};
										throw(new Error(`Metadata size is invalid at 0x${(subchunk.offsetData + offset).toString(16).padStart(6, "0")}`));
									};
									eventContext.sizePos = deltaSize + 2;
									eventContext.dataPos = eventContext.sizePos + mdSizeSize;
									fullSize += 2 + mdSizeSize + IntegerHandler.readVLV(subchunk.data, offset + deltaSize + 2);
									break;
								};
								default: {
									switch (statusByte >> 4) {
										case 8:
										case 9:
										case 10:
										case 11:
										case 14: {
											// Normal events.
											fullSize += isStale ? 2 : 3;
											break;
										};
										case 12:
										case 13: {
											// Normal events.
											fullSize += isStale ? 1 : 2;
											break;
										};
										case 15: {
											throw(new Error(`Unknown SMF status 0x${statusByte.toString(16)} at 0x${(fullStatusPos).toString(16).padStart(6, "0")}.`));
											break;
										};
										default: {
											// Malformed SMF data!
											throw(new Error(`SMF data malformed at 0x${(fullStatusPos).toString(16).padStart(6, "0")}.`));
										};
									};
								};
							};
							if (remainingSize < fullSize) {
								return 0;
							};
							this.debugMode && console.debug(`0x${(subchunk.offsetData + offset).toString(16).padStart(6, "0")} (${offset}): ${deltaSize} %o`, subchunk.data.subarray(offset, offset + fullSize));
							return fullSize;
							break;
						};
						case "MThd":
						default: {
							return 0;
						};
					};
				};
				rawParser.debugMode = !!self.debugMode;
				let splitStream = stream.tee();
				(async () => {
					for await (let chunk of rawParser.readRegulated(splitStream[1])) {
						rawParser.debugMode && console.debug(summarizeSeamstressChunk(chunk));
					};
					console.info("Finished chunk skimming.");
				})();
				map = rawParser.readChunks(splitStream[0]);
				break;
			};
			case "iff": {
				let rawParser = new Seamstress();
				rawParser.headerSize = 12;
				rawParser.type = rawParser.TYPE_4CC | rawParser.ENDIAN_B | rawParser.LENGTH_U32 | rawParser.MASK_PADDED;
				//rawParser.debugMode = true;
				map = rawParser.readChunks(stream);
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
				})();
				map = rawParser.readChunks(splitStream[0]);
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
	for await (let chunk of map) {
		let showKey = chunk.type;
		if (typeof key === "number") {
			showKey = `0x${key.toString(16)}`;
		};
		showKey = showKey.padEnd(10, " ");
		if (chunk.chunkId === 0) {
			resultDisplay.append(`\n${showKey}  - #${`${chunk.chunkId + 1}`.padStart(4, "0")}   0x${chunk.offsetData.toString(16).padStart(8, "0")}  ${chunk.data.length} B`);
		} else {
			resultDisplay.append(`\n            - #${`${chunk.chunkId + 1}`.padStart(4, "0")}   0x${chunk.offsetData.toString(16).padStart(8, "0")}  ${chunk.data.length} B`);
		};
	};
	resultDisplay.append(`\n\nStructure validation finished.`);
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
