"use strict";

import liteBench from "./liteBench.mjs";

// Browser portion.
if (!self.Deno) {
	liteBench(function warmUp() {
		return self;
	});
	liteBench(function directObjectKey () {
		return self?.debugMode ?? false;
	});
	liteBench(function testBeforeKey () {
		return Object.hasOwn(self, "debugMode") ? self.debugMode : false;
	});
} else {
	Deno.bench(function warmUp() {
		return self;
	});
	Deno.bench(function directObjectKey () {
			return self?.debugMode ?? false;
	});
	Deno.bench(function testBeforeKey () {
			return Object.hasOwn(self, "debugMode") ? self.debugMode : false;
	});
};
