"use strict";

const rounds = 262144;

export default function liteBench(intake) {
	let startTime = Date.now();
	for (let i = 0; i < rounds; i ++) {
		intake();
	};
	console.debug(`Function ${intake.name || "<anonymous>"} took ${(Date.now() - startTime) / rounds}ms per iteration.`);
};
