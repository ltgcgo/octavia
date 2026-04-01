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
const fileProps = JSON.parse('{"extensions":[],"startIn":"pictures","id":"binOpener","description":"Open a file in a tag-length-value structure."}');
for (let extension of "mid,kar,aiff,dls,jpeg,jpg,rmi,sf2,wav,webp,rseam,vseam".split(",")) {
	fileProps.extensions.push(extension.toLowerCase());
	fileProps.extensions.push(extension.toUpperCase());
};
console.debug(fileProps);

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
				map = await rawParser.getMapFromStream(stream);
				break;
			};
		};
		resultDisplay.append(`\nType          Offset    Size`);
	} catch (err) {
		resultDisplay.append(`\nUncaught ${err.name}: ${err.message ?? "No error message was provided."}\n${err.stack}`);
	};
	for (let [key, value] of map.entries()) {
		let showKey = key;
		if (typeof key === "number") {
			showKey = `0x${key.toString(16)}`;
		};
		showKey = showKey.padEnd(10, " ");
		let isFirst = true;
		for (let [offset, size] of value) {
			if (isFirst) {
				isFirst = false;
				resultDisplay.append(`\n${showKey}  - 0x${offset.toString(16).padStart(8, "0")}  ${size} B`);
			} else {
				resultDisplay.append(`\n            - 0x${offset.toString(16).padStart(8, "0")}  ${size} B`);
			};
		};
	};
};

$e("b#openFile").addEventListener("mouseup", async () => {
	let selectedFile = await fileOpen(fileProps);
	if (selectedFile) {
		selectedFile.targetMode = "smf";
		await showResult(selectedFile.stream(), selectedFile);
	};
});
