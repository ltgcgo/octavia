"use strict";

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

// Top-level
(function topLevel() {
	testFail(Buffer.length, "topLevel");
})();

// Top-level await
await (async function topLevelAwait() {
	testFail(Buffer.length, "topLevelAwait");
})();

// Timeout
await new Promise(function timeoutAsync(ok) {
	const timerId = setTimeout(function timeoutTest() {
		clearTimeout(timerId);
		testFail(Buffer.length, "timeout");
		ok();
	}, 1);
});

// Timeout async
await new Promise(function timeoutAsyncDouble(ok) {
	const timerId = setTimeout(async function timeoutTestAsync() {
		clearTimeout(timerId);
		testFail(Buffer.length, "timeoutAsync");
		ok();
	}, 1);
});

// Interval
await new Promise(function intervalAsync(ok) {
	const timerId = setInterval(function intervalTest() {
		clearInterval(timerId);
		testFail(Buffer.length, "interval");
		ok();
	}, 1);
});

// Interval async
await new Promise(function intervalAsyncDouble(ok) {
	const timerId = setInterval(async function intervalTestAsync() {
		clearInterval(timerId);
		testFail(Buffer.length, "intervalAsync");
		ok();
	}, 1);
});

// Event target
await new Promise(function eventTarget(ok) {
	const dummy = new EventTarget();
	dummy.addEventListener("hornydeer", function eventTargetTest() {
		testFail(Buffer.length, "eventTarget");
		ok();
	});
	dummy.dispatchEvent(new Event("hornydeer"));
});

// Microtask queue
await new Promise(function microtaskQueue(ok) {
	queueMicrotask(function microtaskQueueTest() {
		testFail(Buffer.length, "microtaskQueue");
		ok();
	});
});

// Promise resolution chain
await new Promise(function promiseResolve(ok) {
	(new Promise(immediateResolve)).then(function promiseResolveTest() {
		testFail(Buffer.length, "promiseResolve");
		ok();
	});
});

// Promise rejection chain
await new Promise(function promiseReject(ok) {
	(new Promise(immediateReject)).then(() => {}, function promiseRejectTest() {
		testFail(Buffer.length, "promiseReject");
		ok();
	});
});

// Promise throw chain
await new Promise(function promiseThrow(ok) {
	(new Promise(immediateThrow)).catch(function promiseThrowTest() {
		testFail(Buffer.length, "promiseThrow");
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