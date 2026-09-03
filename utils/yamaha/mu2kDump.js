"use strict";

// MU2000 Dumper - Automated sniffing and extraction of demo data in MU2000.
// Licensed under CC0.
// Usage: deno run --allow-all in.bin 0x1234
// Special thanks to ValleyBell for the pointer and dump slice discovery.

let fileBuffer = await Deno.readFile(Deno.args[0]),
fileLen = fileBuffer.length;
console.error(`Loaded "${Deno.args[0]}", ${fileLen} bytes in total.\n`);
let demoPtr = parseInt(Deno.args[1]), demoTrk = 4;

if (!(demoPtr >= 0)) {
	throw(new Error(`Invalid start pointer offset specified.`));
};

const readI32 = (buf) => {
	let gatedLength = Math.min(4, buf.length);
	let result = 0;
	for (let i = 0; i < gatedLength; i ++) {
		result <<= 8;
		result |= buf[i];
	};
	return result;
};

let smfName = `./0x${demoPtr.toString(16).padStart(6, "0")}.mid`;
let smfStart = Uint8Array.from([0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x02, 0x00, 0x01, 0x01, 0xe0]);
let smfTrack = Uint8Array.from([77, 84, 114, 107]);
await Deno.writeFile(smfName, smfStart, {createNew: true});

let writeTrackData = async function (idx, startPtr) {
	const finalSize = readI32(fileBuffer.subarray(startPtr, startPtr + 4));
	const dataBlocks = readI32(fileBuffer.subarray(startPtr + 4, startPtr + 8));
	console.error(`#${idx}: Data read began at offset 0x${startPtr.toString(16).padStart(6, "0")}.`);
	/*if (finalSize < 4096) {
			console.error(`#${idx}: The specified size is too low: ${finalSize} (0x${finalSize.toString(16)}).`);
			return false;
	} else*/ if (finalSize >= 1048576) {
			console.error(`#${idx}: The specified size is too high: ${finalSize} (0x${finalSize.toString(16)}).`);
			return false;
	};
	let expectedBlocks = Math.ceil(finalSize / 252);
	if (expectedBlocks !== dataBlocks) {
			console.error(`#${idx}: Data block count mismatch: Expected ${expectedBlocks}, given ${dataBlocks}.`);
			return false;
	} else {
			console.error(`#${idx}: Expected reconstruction size: ${finalSize} B. Expected blocks: ${dataBlocks}. Track dump started.`);
	};
	let restoredBuffer = new Uint8Array(finalSize + 8);
	restoredBuffer.set(smfTrack, 0);
	restoredBuffer.set(fileBuffer.subarray(startPtr, startPtr + 4), 4);
	let seekPtrBin = startPtr + 8;
	for (let block = 0; block < dataBlocks; block ++) {
			let viewSize = 252;
			if (block * 252 + viewSize > finalSize) {
				viewSize = finalSize % 252;
			};
			let currentView = fileBuffer.subarray(seekPtrBin, seekPtrBin + viewSize);
			restoredBuffer.set(currentView, 8 + block * 252);
			//console.error(fileBuffer[seekPtrBin], currentView[0], currentView.length);
			seekPtrBin += 256;
	};
	await Deno.writeFile(smfName, restoredBuffer, {"append": true});
	console.error(`#${idx}: Track dump finished.`);
	return true;
};

for (let idx = 0; idx < demoTrk; idx ++) {
	let targetPtr = demoPtr + idx * 12;
	if (!await writeTrackData(idx, readI32(fileBuffer.subarray(targetPtr, targetPtr + 4)))) {
		console.error(`\nDumped ${idx} tracks in total.`);
		break;
	};
};
console.error(`\nDumped ${demoTrk} tracks in total.`);
