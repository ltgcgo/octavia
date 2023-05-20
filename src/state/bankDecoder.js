"use strict";

import {BlobDecoder} from "./decoders.mjs";

// Utils
let same = function (origin, arr) {
	let same = true;
	arr.forEach((e, i) => {
		same = same && origin[i] == e;
	});
	return same;
};
let readInt = function (arr) {
	let sum = 0;
	arr.forEach((e) => {
		sum *= 256;
		sum += e;
	});
	return sum;
};
let utf8Dec = new TextDecoder();

// Register decoders
let bankDecoder = new BlobDecoder();
bankDecoder.set("s7e", async function (blob) {
	let s7eBlob = new Uint8Array(await blob.slice(0, 65536).arrayBuffer());
	let voiceMap = "MSB	LSB	PRG	NME";
	// Constants
	const nullHead = [0, 0, 0, 0];
	const globalOffset = 32;
	let ptr = 0, mode = 0, resume = true;
	let sections = [], sectPtr = 0;
	while (resume) {
		let rwin = s7eBlob.subarray(ptr);
		([() => {
			// Waiting for header read
			if (utf8Dec.decode(rwin.subarray(0, 4)) == "YSFC") {
				ptr += 80;
				mode = 1;
			} else {
				ptr ++;
			};
		}, () => {
			// Read offsets of each section
			if (same(rwin.subarray(0, 4), nullHead)) {
				sections.forEach((e, i, a) => {
					let length = readInt(s7eBlob.subarray(e.start + 4, e.start + 8));
					e.length = length;
				});
				mode = 2;
			} else {
				let type = utf8Dec.decode(rwin.subarray(0, 4)),
				start = readInt(rwin.subarray(4, 8));
				//console.error(`Section ${type} begins at ${start}.`);
				sections.push({type, start});
				ptr += 8;
			};
		}, () => {
			// Read sections
			let section = sections[sectPtr];
			let sectWin = s7eBlob.subarray(section.start, section.start + section.length);
			let entryLen = 32;
			switch (section.type) {
				case "ENVC": {
					// Encoded Normal Voice Config
					let entryStart = globalOffset;
					while (entryStart < sectWin.length) {
						let entryWin = sectWin.subarray(entryStart, entryStart + entryLen);
						let voiceName = utf8Dec.decode(entryWin.subarray(0, 10)).trimEnd();
						if (voiceName.slice(0, 5) == "Init ") {
							voiceName = "";
						};
						if (voiceName) {
							voiceMap += `\n063	${(entryWin[17] + 13).toString().padStart(3, "0")}	${entryWin[19].toString().padStart(3, "0")}	${voiceName}`;
						};
						entryStart += entryLen;
					};
					break;
				};
				case "EDVC": {
					// Encoded Drum Voice Config
					let entryStart = globalOffset;
					while (entryStart < sectWin.length) {
						let entryWin = sectWin.subarray(entryStart, entryStart + entryLen);
						let voiceName = utf8Dec.decode(entryWin.subarray(0, 10)).trimEnd();
						if (voiceName.slice(0, 5) == "Init ") {
							voiceName = "";
						};
						if (voiceName) {
							voiceMap += `\n063	024	${entryWin[19].toString().padStart(3, "0")}	${voiceName}`;
						};
						entryStart += entryLen;
					};
					break;
				};
				case "EPVC": {
					// Encoded Plugin Voice Config
					let entryLen = 32, entryStart = globalOffset;
					while (entryStart < sectWin.length) {
						let entryWin = sectWin.subarray(entryStart, entryStart + entryLen);
						let voiceName = utf8Dec.decode(entryWin.subarray(0, 10)).trimEnd();
						if (voiceName == "----------") {
							voiceName = "";
						};
						if (voiceName) {
							voiceMap += `\n063	${(entryWin[17] + 1).toString().padStart(3, "0")}	${entryWin[19].toString().padStart(3, "0")}	${voiceName}`;
						};
						entryStart += entryLen;
					};
					break;
				};
			};
			sectPtr ++;
			if (sectPtr >= sections.length) {
				mode = 3;
				resume = false;
			};
		}][mode] || (() => {
			resume = false;
		}))();
	};
	return voiceMap;
});

export {
	bankDecoder
};
