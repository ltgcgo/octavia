"use strict";

import liteBench from "./liteBench.mjs";

const bufferSize = 1 << 18,
dummyBuffer1 = new Uint8Array(bufferSize),
dummyBuffer2 = new Uint8Array(bufferSize);

liteBench(function warmUp() {
	return Math.log(Math.random());
});
liteBench(function warmUp2() {
	return Math.log(Math.random());
});
liteBench(function baseline() {
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