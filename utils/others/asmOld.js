"use strict";

import {streamAssemble} from "../../src/micc/index.mjs";

WritableStream.prototype.from = async function (asyncIt) {
	let writer = this.getWriter();
	for await (const e of asyncIt) {
		await writer.ready;
		await writer.write(e);
	};
	writer.releaseLock(); // Manual closure is required
};

console.info(`Reading MIDI assembly...`);
let stream = streamAssemble((await Deno.open(Deno.args[0])).readable);
console.info(`Streaming contents to the assembler...`);
await (await Deno.open(Deno.args[1] || `${Deno.args[0]}.mid`, {"write": true, "createNew": true})).writable.from(stream);
console.info(`Assembly finished.`);
