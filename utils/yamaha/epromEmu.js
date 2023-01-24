"use strict";

import {OctaviaDevice} from "../../src/state/index.mjs";

let fakeEprom = {
	data: new Uint8Array(4194304), // 4 MiB of EPROM space
	offset: 0
};
let octavia = new OctaviaDevice();
octavia.eprom = fakeEprom;
let sysexBlobs = [];
for (let i = 0; i < Deno.args?.length; i ++) {
	let e = Deno.args[i];
	try {
		sysexBlobs.push(await Deno.readFile(e));
	} catch (err) {
		console.error(`Failed loading "${e}".`);
	};
};

self.debugMode = false;

sysexBlobs.forEach((e) => {
	octavia.runJson({type: 15, track: 0, data: e});
});

await Deno.writeFile("out.bin", fakeEprom.data, {create: true});
