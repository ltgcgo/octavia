"use strict";

import {StreamQueue} from "../../libs/rochelle@ltgcgo/splicer.mjs";

let streamQueue = new StreamQueue();
let tStream = new TransformStream();
let tsWriter = tStream.writable.getWriter();

(async () => {
	for await (let chunk of streamQueue.readable) {};
})();
(async () => {
	for await (let chunk of tStream.readable) {};
})();

const textDec = new TextDecoder("ascii"), dummyBuffer = new Uint8Array(16384)
let dummyText = "";
for (let i = 0; i < 1024; i ++) {
	crypto.getRandomValues(dummyBuffer);
	dummyText += textDec.decode(dummyBuffer);
};
console.debug(dummyText.length);

Deno.bench(function warmUp () {
	return Math.log2(Math.random());
});
Deno.bench(function warmUp2 () {
	return Math.random()/Math.random();
});
Deno.bench(async function streamQueuePerf () {
	await streamQueue.enqueue(dummyText);
});
Deno.bench(async function tStreamPerf () {
	await tsWriter.ready;
	await tsWriter.write(dummyText);
});