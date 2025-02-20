"use strict";

import {BlobDecoder} from "./decoders.mjs";

// Utils
let same = function (origin, arr) {
	let same = true;
	arr.forEach((e, i) => {
		same = same && origin[i] === e;
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
			if (utf8Dec.decode(rwin.subarray(0, 4)) === "YSFC") {
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
						if (voiceName.slice(0, 5) === "Init ") {
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
						if (voiceName.slice(0, 5) === "Init ") {
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
						if (voiceName === "----------") {
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
bankDecoder.set("pcg", async function (blob) {
	let sysexBlob = new Uint8Array(await blob.arrayBuffer());
	let voiceMap = "MSB	LSB	PRG	NME";
	let ptr = 100, mode = 0, headSects = 0, resume = true;
	let sections = [], sectPtr = 0;
	while (resume) {
		let rwin = sysexBlob.subarray(ptr);
		([() => {
			resume = utf8Dec.decode(rwin.subarray(0, 4)) === "INI2";
			headSects = rwin[15];
			//console.error(`Section count: ${headSects}`);
			ptr += 16;
			mode = 1;
		}, () => {
			let type = utf8Dec.decode(rwin.subarray(0, 4));
			let tipMsb = rwin[5], tipLsb = rwin[7];
			let nameLen = rwin[11];
			let length = readInt(rwin.subarray(12, 16));
			let start = readInt(rwin.subarray(16, 20));
			let entryLen = readInt(rwin.subarray(36, 40));
			let name = utf8Dec.decode(rwin.subarray(44, 44 + nameLen));
			sections.push({
				type, tipMsb, tipLsb, nameLen,
				length, start, entryLen, name
			});
			ptr += 64;
			headSects --;
			if (headSects < 1) {
				mode = 2;
			};
		}, () => {
			// Section reading mode
			let section = sections[sectPtr];
			let sectWin = sysexBlob.subarray(section.start, section.start + section.length);
			switch (section.type) {
				case "PRG1": {
					break;
				};
				case "PBK1": {
					let msb = 63, prg = (section.tipMsb ? 6 : 0) + section.tipLsb;
					for (let i = 0; i < 128; i ++) {
						let entryStart = i * section.entryLen;
						let entryWin = sectWin.subarray(entryStart, entryStart + section.entryLen);
						let name = utf8Dec.decode(entryWin.subarray(0, 24)).trimEnd().replace("InitProg", "");
						if (name.length && prg > 5) {
							voiceMap += `\n${(msb).toString().padStart(3, "0")}	${(prg).toString().padStart(3, "0")}	${(i).toString().padStart(3, "0")}	${name}`;
						};
					};
					break;
				};
				case "CBK1": {
					let msb = 63, prg = (section.tipMsb ? 3 : 0) + section.tipLsb + 10;
					for (let i = 0; i < 128; i ++) {
						let entryStart = i * section.entryLen;
						let entryWin = sectWin.subarray(entryStart, entryStart + section.entryLen);
						let name = utf8Dec.decode(entryWin.subarray(0, 24)).trimEnd().replace("InitCombi", "");
						if (name.length && prg > 12) {
							voiceMap += `\n${(msb).toString().padStart(3, "0")}	${(prg).toString().padStart(3, "0")}	${(i).toString().padStart(3, "0")}	${name}`;
						};
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
			//console.error(`Mode out of bound. Stopping.`);
		}))();
	};
	//console.debug(voiceMap);
	return voiceMap;
});

export {
	bankDecoder
};
