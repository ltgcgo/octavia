"use strict";

const minimumRounds = 4, maximumRounds = 1048576, maximumTime = 5000;

const esBench = function (intake) {
	let cumulativeTime = 0, rounds = 0,
	totalStartTime = performance.now();
	let sustain = true;
	while (sustain) {
		let startTime = performance.now();
		intake();
		cumulativeTime += performance.now() - startTime;
		rounds ++;
		if (rounds < minimumRounds) {
			// No-op.
		} else if (rounds >= maximumRounds) {
			sustain = false;
		} else if (cumulativeTime >= maximumTime) {
			sustain = false;
		};
	};
	const totalRunTime = performance.now() - totalStartTime;
	console.debug(`${intake.name || "<anonymous>"}: ${rounds} runs, at ${cumulativeTime} ms (${cumulativeTime / rounds} ms/run) in isolation, at ${totalRunTime} ms (${totalRunTime / rounds} ms/run) in total.`);
};

export default function liteBench(intake) {
	if (typeof globalThis?.Deno?.bench === "function") {
		Deno.bench(intake);
	} else {
		esBench(intake);
	};
};
