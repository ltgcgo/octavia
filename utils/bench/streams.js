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

Deno.bench(function warmUp () {
	return Math.log2(Math.random());
});
Deno.bench(function warmUp2 () {
	return Math.random()/Math.random();
});
Deno.bench(async function streamQueuePerf () {
	await streamQueue.enqueue("0123456789abcdef");
});
Deno.bench(async function tStreamPerf () {
	await tsWriter.ready;
	await tsWriter.write("0123456789abcdef");
});
