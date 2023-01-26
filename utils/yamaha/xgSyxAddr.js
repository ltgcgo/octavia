"use strict";

/*
  This file will extract XG SysEx addresses from the target SYX file.
*/

let fileBuffer = await Deno.readFile(Deno.args[0]),
fileLen = fileBuffer.length;
console.error(`Loaded "${Deno.args[0]}", ${fileLen} bytes in total.`);
let mode = 0, modePtr = 0;
let outPrefix = Deno.args[1] || `${Deno.args[0].slice(0, Deno.args[0].lastIndexOf("."))}`;
let encoder = new TextEncoder();
let addrLength = 6;

let streamOut = async function (str) {
	let streamBuffer = encoder.encode(str);
	let fileName = `${outPrefix}.struct.txt`;
	await Deno.writeFile(fileName, streamBuffer, {append: true, create: true});
};

for (let ptr = 0; ptr < fileLen; ptr ++) {
	let byte = fileBuffer[ptr];
	switch (mode) {
		case 0: {
			// Wait for 0xf0 signal
			if (byte == 240) {
				mode = 1;
				modePtr = -1;
				addrLength = 6;
			};
			break;
		};
		case 1: {
			// Extracting SysEx address
			if (byte == 247) {
				await streamOut(`\n`);
				mode = 0;
			} else {
				if (modePtr == 0) {
					await streamOut(`0x${ptr.toString(16).padStart(6, "0")}:`);
				};
				if (modePtr == 3) {
					switch (byte) {
						case 1:
						case 2: {
							addrLength = 8;
							break;
						};
						case 0:
						case 3:{
							//addrLength = 6;
							break;
						};
					};
				};
				if (modePtr < addrLength) {
					await streamOut(" ");
					await streamOut(byte.toString(16).padStart(2, "0"));
				};
			};
			break;
		};
	};
	modePtr ++;
};
