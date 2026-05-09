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
Deno.bench(function algoAddition () {
	return getRandom() + 127;
});
Deno.bench(function algoBitShift () {
	return (getRandom() << 1) | 1;
});
Deno.bench(function algoMultiply () {
	return getRandom() * Math.PI;
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