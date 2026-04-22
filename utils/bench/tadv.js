import {IntegerHandler} from "../../libs/seamstress@ltgcgo/index.mjs";
import liteBench from "./liteBench.mjs";

let benchmark;
if (self.Deno) {
	benchmark = Deno.bench;
} else {
	benchmark = liteBench;
};

let dummyArray = new Uint8Array(1024);
let dummyDv = new DataView(dummyArray.buffer);
let dummyAi32 = new Int32Array(dummyArray.buffer);

benchmark(function warmUp() {
	return Math.log2(Math.random());
});
benchmark(function warmUp2() {
	return Math.random() * Math.random();
});
benchmark(function warmUp3() {
	return Math.random() / Math.random();
});
benchmark(function u8DataView() {
	let dummyVar;
	for (let i = 0; i < dummyDv.byteLength; i ++) {
		dummyVar = dummyDv.getUint8(i);
	};
});
benchmark(function u8TypedArray() {
	let dummyVar;
	for (let i = 0; i < dummyArray.length; i ++) {
		dummyVar = dummyArray[i];
	};
});
benchmark(function i32DataViewA() {
	let dummyVar;
	for (let i = 0; i < dummyDv.byteLength; i += 4) {
		dummyVar = dummyDv.getInt32(i);
	};
});
benchmark(function i32DataViewB() {
	let dummyVar;
	for (let i = 0; (i << 2) < dummyDv.byteLength; i ++) {
		dummyVar = dummyDv.getInt32(i << 2);
	};
});
benchmark(function i32TypedArrayA() {
	let dummyVar;
	for (let i = 0; i < dummyAi32.length; i ++) {
		dummyVar = dummyAi32[i];
	};
});
benchmark(function i32TypedArrayB() {
	let dummyVar;
	for (let i = 0; (i << 2) < dummyArray.length; i ++) {
		dummyVar = IntegerHandler.readInt32(dummyArray, false, i);
	};
});
