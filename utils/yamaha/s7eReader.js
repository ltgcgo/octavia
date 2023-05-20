"use strict";

/*
  This script converts S7E files into voice maps.
  I bear no responsibility for you running this script. You have been warned.
*/

Uint8Array.prototype.same = function (arr) {
	let same = true;
	arr.forEach((e, i) => {
		same = same && this[i] == e;
	});
	return same;
};
Uint8Array.prototype.readInt = function () {
	let sum = 0;
	this.forEach((e) => {
		sum *= 256;
		sum += e;
	});
	return sum;
};

let utf8Dec = new TextDecoder();

let s7eBlob = await Deno.readFile(`${Deno.args[0]}`);
console.error(`Yamaha S7E file size: ${s7eBlob.length} bytes.`);

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
		if (rwin.subarray(0, 4).same(nullHead)) {
			sections.forEach((e, i, a) => {
				let length = s7eBlob.subarray(e.start + 4, e.start + 8).readInt();
				e.length = length;
				console.error(e);
			});
			console.info(`MSB	LSB	PRG	NME`);
			mode = 2;
		} else {
			let type = utf8Dec.decode(rwin.subarray(0, 4)),
			start = rwin.subarray(4, 8).readInt();
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
					voiceName && console.info(`063	${(entryWin[17] + 13).toString().padStart(3, "0")}	${entryWin[19].toString().padStart(3, "0")}	${voiceName}`);
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
					voiceName && console.info(`063	024	${entryWin[19].toString().padStart(3, "0")}	${voiceName}`);
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
					voiceName && console.info(`063	${(entryWin[17] + 1).toString().padStart(3, "0")}	${entryWin[19].toString().padStart(3, "0")}	${voiceName}`);
					entryStart += entryLen;
				};
				break;
			};
		};
		sectPtr ++;
		if (sectPtr >= sections.length) {
			mode = 3;
			resume = false;
			console.error(`S7E file read end.`);
		};
	}][mode] || (() => {
		resume = false;
		console.error(`Mode out of bound. Stopping.`);
	}))();
};
