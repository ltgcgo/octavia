"use strict";

let fileBuffer = await Deno.readFile(Deno.args[0]),
fileLen = fileBuffer.length;
console.error(`Loaded "${Deno.args[0]}", ${fileLen} bytes in total.`);
let outBuffer = new Uint8Array(fileLen);
fileBuffer.forEach((e, fi) => {
	let i = ((fi >> 1) << 1) + (+!(fi & 1));
	outBuffer[i] = e;
});
await Deno.writeFile(Deno.args[1] || `${Deno.args[0]}.out`, outBuffer);