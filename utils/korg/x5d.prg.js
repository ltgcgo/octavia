/*

Just a simple KORG X5D(R) Dump SysEx to bank mapping converter.
I bear no risk for you running this piece of software. You have been warned.

License: WTFPL

*/

"use strict";

let sysexBlob = await Deno.readFile(`${Deno.args[0]}`);
console.error(`KORG NS5R SysEx file size: ${sysexBlob.length} bytes.`);
let pointer = 6, dataOff = 0;
console.info(`MSB\tPRG\tLSB\tNME`);
let name = "", isDouble = false, msb = 82, lsb = 0, prg = 0;
while (pointer < sysexBlob.length) {
	if (dataOff % 7 == 0) {
		pointer ++;
	};
	let value = sysexBlob[pointer];
	switch (dataOff % 164) {
		case 0:
		case 1:
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
		case 7:
		case 8:
		case 9: {
			name += String.fromCharCode(value);
			break;
		};
		case 10: {
			isDouble = !!value;
			break;
		};
		case 11: {
			if (prg < 100) {
				console.info(`${msb.toString().padStart(3, "0")}\t${prg.toString().padStart(3, "0")}\t${lsb.toString().padStart(3, "0")}\t${name.trim()}`);
			};
			prg ++;
			name = "";
			break;
		};
		default: {};
	};
	dataOff ++;
	pointer ++;
};
