"use strict";

Deno.bench(function warmUp() {
	return self;
});
Deno.bench(function directObjectKey () {
	return self?.debugMode ?? false;
});
Deno.bench(function testBeforeKey () {
	return Object.hasOwn(self, "debugMode") ? self.debugMode : false;
});

// Browser portion.
{
	let customBench = (intake) => {
		let startTime = Date.now();
		for (let i = 0; i < 4194304; i ++) {
			intake();
		};
		console.debug(`Function ${intake.name || "<anonymous>"} took ${(Date.now() - startTime) / 4194304}ms per iteration.`);
	};
	customBench(function warmUp() {
		return self;
	});
	customBench(function directObjectKey () {
		return self?.debugMode ?? false;
	});
	customBench(function testBeforeKey () {
		return Object.hasOwn(self, "debugMode") ? self.debugMode : false;
	});
};
