"use strict";

const rounds = 262144;

const esBench = function (intake) {
	let startTime = Date.now();
	for (let i = 0; i < rounds; i ++) {
		intake();
	};
	console.debug(`Function ${intake.name || "<anonymous>"} took ${(Date.now() - startTime) / rounds}ms per iteration.`);
};

export default function liteBench(intake) {
	if (typeof globalThis?.Deno?.bench === "function") {
		Deno.bench(intake);
	} else {
		esBench(intake);
	};
};
