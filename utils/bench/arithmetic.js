"use strict";

const dummyBuffer = new Uint16Array(1);
let getRandom = function getRandom () {
	crypto.getRandomValues(dummyBuffer);
	return dummyBuffer[0];
};

Deno.bench(function warmUp () {
	return getRandom();
});
Deno.bench(function warmUp2 () {
	return getRandom();
});
Deno.bench(function warmUp3 () {
	return getRandom();
});
Deno.bench(function algoAddOne() {
	return getRandom() + 1;
});
Deno.bench(function algoBOrOne() {
	return getRandom() | 1;
});
Deno.bench(function algoAddition () {
	return getRandom() + 127;
});
Deno.bench(function algoBitShift () {
	return (getRandom() << 1) | 1;
});
Deno.bench(function algoMultiply () {
	return getRandom() * Math.PI;
});
Deno.bench(function algoBitShift2 () {
	return getRandom() << 1;
});
Deno.bench(function algoMultiply2 () {
	return getRandom() * 2;
});
Deno.bench(function algoTrigFunc () {
	return Math.sin(getRandom());
});
Deno.bench(function divideNative () {
	return Math.ceil(getRandom() / 48);
});
Deno.bench(function divideNative2 () {
	return Math.floor(getRandom() / 48);
});
Deno.bench(function divideBitwise () {
	return (getRandom() * 85 + 4095) >> 12
});
Deno.bench(function divideNativePower2 () {
	return getRandom() / 16;
});
Deno.bench(function divideNativeShift2 () {
	return getRandom() >> 4;
});
/*Deno.bench(function divideNativePower2Breach () {
	return Math.floor(17 / 16);
});
Deno.bench(function divideNativeShift2Breach () {
	return 17 >> 4;
});*/
Deno.bench(function remainderNative () {
	return getRandom() % 16;
});
Deno.bench(function remainderShift () {
	return getRandom() & 15;
});
Deno.bench(function unstableTest () {
	const value = Math.random();
	if (value < 0.5) {
		return {};
	} else {
		return null;
	};
});