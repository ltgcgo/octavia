"use strict";

let fileBuffer = await Deno.readFile(Deno.args[0]),
fileLen = fileBuffer.length;
console.error(`Loaded "${Deno.args[0]}", ${fileLen} bytes in total.`);

let l9Dec = new TextDecoder("l9"),
smfMinSize = 4096, smfMaxSize = 1048576, smfIndex = 0;

const readI32 = (buf) => {
	let gatedLength = Math.min(4, buf.length);
	let result = 0;
	for (let i = 0; i < gatedLength; i ++) {
		result <<= 8;
		result |= buf[i];
	};
	return result;
};

for (let ptr = 0; ptr < fileLen; ptr ++) {
	let sliver = l9Dec.decode(fileBuffer.subarray(ptr, ptr + 4));
	if (sliver === "MThd") {
		if (l9Dec.decode(fileBuffer.subarray(ptr + 14, ptr + 18)) === "MTrk") {
			//console.error(`Valid SMF data found at offset 0x${ptr.toString(16).padStart(6, "0")}.`);
			// Seek to obtain the full size of SMF data.
			let startPtr = ptr + 14, seekPtr = startPtr,
			seekGuard = Math.min(fileLen, ptr + smfMaxSize), lastPtr = 0;
			while (l9Dec.decode(fileBuffer.subarray(seekPtr, seekPtr + 4)) === "MTrk") {
				if (seekPtr >= seekGuard) {
					console.error(`#${smfIndex} OOB reached - final size exceeded valid ranges. Offset 0x${ptr.toString(16).padStart(6, "0")}, end 0x${seekPtr.toString(16).padStart(6, "0")}.`);
					break;
				};
				let chunkLength = readI32(fileBuffer.subarray(seekPtr + 4, seekPtr + 8));
				if (chunkLength >= smfMaxSize) {
					console.error(`#${smfIndex} OOB reached - chunk size exceeded valid ranges. Offset 0x${ptr.toString(16).padStart(6, "0")}, seeked 0x${seekPtr.toString(16).padStart(6, "0")}, size ${chunkLength} B.`);
					break;
				};
				lastPtr = seekPtr;
				seekPtr += chunkLength + 8;
			};
			let fileSize = seekPtr - ptr;
			if (fileSize < smfMinSize) {
				console.error(`#${smfIndex} is not large enough. Offset 0x${ptr.toString(16).padStart(6, "0")}, seeked 0x${seekPtr.toString(16).padStart(6, "0")}, size ${fileSize} B.`);
			} else {
				console.error(`#${smfIndex} is being dumped. Offset 0x${ptr.toString(16).padStart(6, "0")}, seeked 0x${seekPtr.toString(16).padStart(6, "0")}, size ${fileSize} B.`);
				await Deno.writeFile(`./dump${`${smfIndex}`.padStart(4, "0")}.mid`, fileBuffer.subarray(ptr, seekPtr));
			};
			smfIndex ++;
			ptr += fileSize - 4;
		} else {
			//console.error(`Invalid SMF data found at offset 0x${ptr.toString(16).padStart(6, "0")}.`);
		};
	};
};
