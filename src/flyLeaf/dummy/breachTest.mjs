"use strict";

/** @type {import("../index/index.d.mts")} */
const Deno = self.Deno;

const testFailRecord = [];
const testFail = function (value, reason) {
	if (value != null) {
		testFailRecord.push(reason);
	};
};

const immediateResolve = function immediateResolve(ok) {
	ok();
};
const immediateReject = function immediateReject(ok, no) {
	no();
};
const immediateThrow = function immediateThrow(ok) {
	throw(new Error("Immediate throw"));
	ok();
};

const flyLeafBackend = Deno.version?.backend;
let valueTest;
let valueParent, valueKey;
switch (flyLeafBackend) {
	case "Node": {
		valueTest = function () {
			return Buffer.length;
		};
		valueParent = globalThis.global;
		valueKey = "FinalizationRegistry";
		break;
	};
	case "Bun": {
		valueTest = function () {
			return process.availableMemory;
		};
		valueParent = globalThis.process;
		valueKey = "availableMemory";
		break;
	};
	default: {
		valueTest = function () {
			throw(new RangeError(`Test specific to runtime "${flyLeafBackend}" has not been registered.`));
		};
	};
};

// Top-level
(function topLevel() {
	testFail(valueTest(), "topLevel");
})();

// Top-level await
await (async function topLevelAwait() {
	testFail(valueTest(), "topLevelAwait");
})();

// Reflect get
(function reflectorGet() {
	testFail(Reflect.get(valueParent, valueKey), "reflectorGet");
})();

// Timeout
await new Promise(function timeoutAsync(ok) {
	const timerId = setTimeout(function timeoutTest() {
		clearTimeout(timerId);
		testFail(valueTest(), "timeout");
		ok();
	}, 1);
});

// Timeout async
await new Promise(function timeoutAsyncDouble(ok) {
	const timerId = setTimeout(async function timeoutTestAsync() {
		clearTimeout(timerId);
		testFail(valueTest(), "timeoutAsync");
		ok();
	}, 1);
});

// Interval
await new Promise(function intervalAsync(ok) {
	const timerId = setInterval(function intervalTest() {
		clearInterval(timerId);
		testFail(valueTest(), "interval");
		ok();
	}, 1);
});

// Interval async
await new Promise(function intervalAsyncDouble(ok) {
	const timerId = setInterval(async function intervalTestAsync() {
		clearInterval(timerId);
		testFail(valueTest(), "intervalAsync");
		ok();
	}, 1);
});

// Event target
await new Promise(function eventTarget(ok) {
	const dummy = new EventTarget();
	dummy.addEventListener("hornydeer", function eventTargetTest() {
		testFail(valueTest(), "eventTarget");
		ok();
	});
	dummy.dispatchEvent(new Event("hornydeer"));
});

// Microtask queue
await new Promise(function microtaskQueue(ok) {
	queueMicrotask(function microtaskQueueTest() {
		testFail(valueTest(), "microtaskQueue");
		ok();
	});
});

// Promise resolution chain
await new Promise(function promiseResolve(ok) {
	(new Promise(immediateResolve)).then(function promiseResolveTest() {
		testFail(valueTest(), "promiseResolve");
		ok();
	});
});

// Promise rejection chain
await new Promise(function promiseReject(ok) {
	(new Promise(immediateReject)).then(() => {}, function promiseRejectTest() {
		testFail(valueTest(), "promiseReject");
		ok();
	});
});

// Promise throw chain
await new Promise(function promiseThrow(ok) {
	(new Promise(immediateThrow)).catch(function promiseThrowTest() {
		testFail(valueTest(), "promiseThrow");
		ok();
	});
});

if (testFailRecord.length > 0) {
	console.info(`Final breaches:`);
	for (const record of testFailRecord) {
		console.info(`- ${record}`);
	};
	console.info(`Breach test failed.`);
} else {
	console.info(`Breach test passed.`);
};