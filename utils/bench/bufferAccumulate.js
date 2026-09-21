"use strict";

import liteBench from "./liteBench.mjs";

const bufferSize = globalThis?.bufferSize ?? (193 << 11),
dummyBuffer1 = new Uint8Array(bufferSize),
dummyBuffer2 = new Uint8Array(bufferSize);

/*
Performance tipping points where buffered becomes slower than direct writes with no flushing:
- SpiderMonkey (Firefox 140.16esr, Firefox 157.0): Never
- V8 (Deno 2.9.5, Deno 2.9.7): `193 << 11`
- V8 (Node 20 LTS): Never
- V8 (Chromium 152.0): Never
- JavaScriptCore (Bun 1.0.6, Bun 1.4.2): Never
*/

liteBench(function warmUp() {
	return Math.log(Math.random());
});
liteBench(function warmUp2() {
	return Math.log(Math.random());
});
liteBench(function baselineA() {
	let a = 0;
	for (let i = 0; i < bufferSize; i ++) {
		a |= 1;
	};
	return a;
});
liteBench(function baselineB() {
	let a = 0;
	for (let i = 0; i < bufferSize; i ++) {
		a |= 1;
	};
	return a;
});
liteBench(function writeDirectly() {
	const loopedSize = bufferSize << 3;
	for (let i = 0; i < loopedSize; i ++) {
		dummyBuffer1[i >>> 3] |= 1 << (i & 7);
	};
	return dummyBuffer1;
});
liteBench(function writeDirectlyWithFlushing() {
	dummyBuffer1.fill(0);
	const loopedSize = bufferSize << 3;
	for (let i = 0; i < loopedSize; i ++) {
		dummyBuffer1[i >>> 3] |= 1 << (i & 7);
	};
	return dummyBuffer1;
});
liteBench(function writeBuffered() {
	const loopedSize = bufferSize << 3;
	let buffered = 0;
	for (let i = 0; i < loopedSize; i ++) {
		buffered |= 1 << (i & 7);
		if ((i & 7) === 7) {
			dummyBuffer2[i >>> 3] = buffered;
			buffered = 0;
		};
	};
	if (buffered > 0) {
		dummyBuffer2[dummyBuffer2.length - 1] = buffered;
	};
	return dummyBuffer2;
});