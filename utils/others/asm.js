"use strict";

//import {streamAssemble} from "../../src/micc/index.mjs";
import TextReader from "../../libs/rochelle@ltgcgo/textRead.mjs";

WritableStream.prototype.from = async function (asyncIt) {
	let writer = this.getWriter();
	for await (const e of asyncIt) {
		await writer.ready;
		await writer.write(e);
	};
	writer.releaseLock(); // Manual closure is required
};

console.info(`Reading MIDI assembly...`);
let stream = TextReader.feed((await Deno.open(Deno.args[0])).readable);
console.info(`Streaming contents to the assembler...`);
//await Deno.stdout.writable.from(stream);
for await (const e of stream) {
	console.debug(e);
};
//await (await Deno.open(Deno.args[1], {"write": true, "createNew": true})).writable.from(stream);
console.info(`Assembly finished.`);
