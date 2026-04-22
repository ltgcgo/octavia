import liteBench from "./liteBench.mjs";

let benchmark;
if (self.Deno) {
	benchmark = Deno.bench;
} else {
	benchmark = liteBench;
};

let dummyArray = new Uint8Array(1024);
let dummyDv = new DataView(dummyArray.buffer);

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
