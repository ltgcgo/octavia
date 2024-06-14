"use strict";

import {streamDisassemble} from "../../src/micc/index.mjs";

WritableStream.prototype.from = async function (asyncIt) {
	let writer = this.getWriter();
	for await (const e of asyncIt) {
		await writer.ready;
		await writer.write(e);
	};
	writer.releaseLock(); // Manual closure is required
};

let stream = streamDisassemble((await Deno.open(Deno.args[0])).readable);
await (await Deno.open(Deno.args[1], {"write": true, "create": true})).writable.from(stream);
