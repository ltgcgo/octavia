/*

Just a simple KORG KROSS 2 PCG file to bank mapping converter.
I bear no responsibility for you running this piece of software. You have been warned.

License: WTFPL

*/

"use strict";

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

let sysexBlob = await Deno.readFile(`${Deno.args[0]}`);
console.error(`KORG KROSS 2 PCG file size: ${sysexBlob.length} bytes.`);
console.error(`File type: ${utf8Dec.decode(sysexBlob.subarray(16, 20))}`);

let ptr = 100, mode = 0, headSects = 0, resume = true;
let sections = [], sectPtr = 0;
while (resume) {
	let rwin = sysexBlob.subarray(ptr);
	([() => {
		resume = utf8Dec.decode(rwin.subarray(0, 4)) == "INI2";
		headSects = rwin[15];
		console.error(`Section count: ${headSects}`);
		ptr += 16;
		mode = 1;
	}, () => {
		let type = utf8Dec.decode(rwin.subarray(0, 4));
		let tipMsb = rwin[5], tipLsb = rwin[7];
		let nameLen = rwin[11];
		let length = rwin.subarray(12, 16).readInt();
		let start = rwin.subarray(16, 20).readInt();
		let entryLen = rwin.subarray(36, 40).readInt();
		let name = utf8Dec.decode(rwin.subarray(44, 44 + nameLen));
		/* console.error(``);
		console.error(`Section type: ${type}`);
		console.error(`Section ID: ${tipMsb.toString(16)} ${tipLsb.toString(16)}`);
		console.error(`Section name length: ${nameLen}`);
		console.error(`Section size: ${length} byte(s)`);
		console.error(`Start pointer: ${start}`);
		console.error(`Entry size: ${entryLen} byte(s)`);
		console.error(`Section name: ${name}`) */
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
		console.error(`\nNow reading #${(sectPtr + 1).toString().padStart(2, "0")}:${section.type} (${section.name})`);
		switch (section.type) {
			case "PRG1": {
				console.info(`MSB	PRG	LSB	NME`);
				break;
			};
			case "PBK1": {
				let msb = 63, prg = (section.tipMsb ? 6 : 0) + section.tipLsb;
				for (let i = 0; i < 128; i ++) {
					let entryStart = i * section.entryLen;
					let entryWin = sectWin.subarray(entryStart, entryStart + section.entryLen);
					let name = utf8Dec.decode(entryWin.subarray(0, 24)).trimEnd().replace("InitProg", "");
					name.length && console.info(`${(msb).toString().padStart(3, "0")}	${(prg).toString().padStart(3, "0")}	${(i).toString().padStart(3, "0")}	${name}`);
				};
				break;
			};
			case "CBK1": {
				let msb = 63, prg = (section.tipMsb ? 3 : 0) + section.tipLsb + 10;
				for (let i = 0; i < 128; i ++) {
					let entryStart = i * section.entryLen;
					let entryWin = sectWin.subarray(entryStart, entryStart + section.entryLen);
					let name = utf8Dec.decode(entryWin.subarray(0, 24)).trimEnd().replace("InitCombi", "");
					name.length && console.info(`${(msb).toString().padStart(3, "0")}	${(prg).toString().padStart(3, "0")}	${(i).toString().padStart(3, "0")}	${name}`);
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
		console.error(`Mode out of bound. Stopping.`);
	}))();
};
