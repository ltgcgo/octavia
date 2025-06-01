"use strict";

import {streamDisassemble} from "../../src/micc/oldIndex.mjs";

WritableStream.prototype.from = async function (asyncIt) {
	let writer = this.getWriter();
	for await (const e of asyncIt) {
		await writer.ready;
		await writer.write(e);
	};
	writer.releaseLock(); // Manual closure is required
};

console.info(`Reading MIDI file...`);
let stream = streamDisassemble((await Deno.open(Deno.args[0])).readable);
console.info(`Streaming contents to the disassembler...`);
await (await Deno.open(Deno.args[1], {"write": true, "createNew": true})).writable.from(stream);
console.info(`Disassembly finished.`);
