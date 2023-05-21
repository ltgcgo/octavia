"use strict";

/*
  This file converts YDL files into a SysEx blob.
*/


let fileBuffer = await Deno.readFile(Deno.args[0]),
fileLen = fileBuffer.length;
console.error(`Loaded "${Deno.args[0]}", ${fileLen} bytes in total.`);
let chunkSize = 0, fmtType = 0, trkCount = 0, tDiv = 0;
let trkSize = 0;
let count = 0, mode = 2, modePtr = 0;
let outPrefix = Deno.args[1] || `${Deno.args[0].slice(0, Deno.args[0].lastIndexOf("."))}`;
let streamBuffer = new Uint8Array(1);

let streamOut = async function (byte) {
	streamBuffer[0] = byte;
	let fileName = `${outPrefix}.syx`;
	//console.info(`Writing to ${fileName} ...`);
	await Deno.writeFile(fileName, streamBuffer, {append: true, create: true});
};

for (let ptr = 0; ptr < fileLen; ptr ++) {
	let byte = fileBuffer[ptr];
	switch (mode) {
		case 0: {
			// Wait for 0xf0 signal
			if (byte == 240) {
				mode = 4;
				await streamOut(byte);
			};
			break;
		};
		case 1: {
			// Extracting SysEx
			await streamOut(byte);
			if (byte == 247) {
				mode = 0;
				count ++;
				if (count % 100 == 0) {
				console.error(`Written ${count} SysEx blobs so far.`);
			};
			};
			break;
		};
		case 2: {
			// Extracting header meta
			switch (ptr) {
				case 4:
				case 5:
				case 6:
				case 7: {
					chunkSize = chunkSize << 8;
					chunkSize += byte;
					break;
				};
				case 9: {
					fmtType = byte;
					break;
				};
				case 10:
				case 11: {
					trkCount = trkCount << 8;
					trkCount += byte;
					break;
				};
				case 12:
				case 13: {
					tDiv = tDiv << 8;
					tDiv += byte;
					break;
				};
			};
			if (ptr == 13) {
				console.error(`Yamaha Update File Info\n\nChunk size: ${chunkSize}\nFormat type: ${fmtType}\nTime division: ${tDiv}\nContaining ${trkCount} track(s).\n`);
				mode = 3;
				modePtr = -1;
			};
			break;
		};
		case 3: {
			// Waiting for SysEx extraction to start
			if (modePtr > 3) {
				trkSize = trkSize << 8;
				trkSize += byte;
			};
			if (modePtr == 7) {
				console.error(`This track has ${trkSize} bytes.`);
				mode = 0;
				modePtr = -1;
			};
			break;
		};
		case 4: {
			// Wait till length section is over
			if (byte < 128) {
				mode = 1;
				modePtr = -1;
			};
			break;
		};
	};
	modePtr ++;
};

console.debug(`Extracted ${count} SysEx strings in total.`);
