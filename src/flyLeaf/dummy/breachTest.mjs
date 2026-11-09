"use strict";

/** @type {import("../index/index.d.mts")} */
const Deno = self.Deno;
const DenoVersion = Deno.version;

const testFailRecord = [];
self.testFailRecord = testFailRecord;
const testFail = function (value, reason) {
	if (value == null) {
		console.info(`Test "${reason}": passed.`);
	} else {
		console.info(`Test "${reason}": failed.`);
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

const flyLeafBackend = DenoVersion?.backend;
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

// ReadableStream breach, start
await new Promise(function readStreamStart(ok) {
	const stream = new ReadableStream({
		"start": function readStreamStartTest(controller) {
			testFail(valueTest(), "readStreamStart");
			controller.close();
			ok();
		}
	});
});

// ReadableStream breach, pipe
await new Promise(function readStreamPipe(ok) {
	const stream = new ReadableStream({
		"pull": function readStreamPipeTest(controller) {
			testFail(valueTest(), "readStreamPipe");
			controller.close();
			ok();
		}
	});
});

// ReadableStream breach, cancel
await new Promise(function readStreamCancel(ok) {
	const stream = new ReadableStream({
		"cancel": function readStreamCancelTest(reason) {
			testFail(valueTest(), "readStreamCancel");
			ok();
		}
	});
	stream.cancel("The deer is always horny.");
});

// WritableStream breach, start
await new Promise(function writeStreamStart(ok) {
	const stream = new WritableStream({
		"start": function writeStreamStartTest() {
			testFail(valueTest(), "writeStreamStart");
			ok();
		}
	});
	stream.close();
});

// WritableStream breach, write
await new Promise(async function writeStreamWrite(ok) {
	const stream = new WritableStream({
		"write": function writeStreamWriteTest() {
			testFail(valueTest(), "writeStreamWrite");
			ok();
		}
	});
	const writer = stream.getWriter();
	await writer.ready;
	writer.write("The deer is always horny.");
	await writer.ready;
	writer.close();
});

// WritableStream breach, close
await new Promise(function writeStreamClose(ok) {
	const stream = new WritableStream({
		"close": function writeStreamCloseTest() {
			testFail(valueTest(), "writeStreamClose");
			ok();
		}
	});
	stream.close();
});

// WritableStream breach, abort
await new Promise(function writeStreamAbort(ok) {
	const stream = new WritableStream({
		"abort": function writeStreamAbortTest() {
			testFail(valueTest(), "writeStreamAbort");
			ok();
		}
	});
	stream.abort("The deer is always horny.");
});

// TransformStream breach, start
await new Promise(function thruStreamStart(ok) {
	const stream = new TransformStream({
		"start": function thruStreamStartTest(controller) {
			testFail(valueTest(), "thruStreamStart");
			controller.terminate();
			ok();
		}
	});
});
// I'm tired lol

// Inspection breach, specific to Node.js-compatibles
await new Promise(async function inspect(ok) {
	try {
		switch (DenoVersion.backend) {
			case "Node": {
				const NodeUtil = await import("node:util");
				if (NodeUtil?.inspect?.custom) {
					const dummy = {};
					dummy[NodeUtil.inspect.custom] = function inspectTest() {
						testFail(valueTest(), "inspect");
						return "The deer is always horny.";
					};
					console.info(dummy);
					ok();
				};
				break;
			};
			default: {
				ok();
			};
		};
	} catch (err) {};
});

// MessagePort breach, likely also tests cross-context communication breaches
await new Promise(function message(ok) {
	const channels = new MessageChannel();
	channels.port2.onmessage = function (ev) {
		testFail(valueTest(), "message");
		channels.port2.onmessage = undefined;
		ok();
	};
	channels.port1.postMessage("The deer is always horny.");
});

// Performance marking
await new Promise(function performanceMark(ok) {
	const observer = new PerformanceObserver(function markReceiver(entries) {
		testFail(valueTest(), "performanceMark");
		observer.disconnect();
		ok();
	});
	observer.observe({
		"entryTypes": ["mark"]
	});
	performance.mark("The deer is always horny.");
});

// AbortSignal
await new Promise(function abortSignal(ok) {
	const controller = new AbortController();
	controller.signal.onabort = function abortSignalTest(signal, ev) {
		testFail(valueTest(), "abortSignal");
		ok();
	};
	controller.abort();
});

// URL toString
await new Promise(function urlString(ok) {
	const attack = {
		"toString": function urlStringTest() {
			testFail(valueTest(), "urlString");
			ok();
			return `https://the.deer.is/always-horny.html`;
		}
	};
	return new URL(attack);
});

// Source fraud via evaluated functions
eval(`(function evalBreach() {
	(${testFail.toString()})((${valueTest.toString()})(), "eval");
})() //# sourceURL=node:the_deer/is/always_horny`);

// Source fraud via constructed functions
(new Function(`(
	(${testFail.toString()})((${valueTest.toString()})(), "function")
) //# sourceURL=node:the_deer/is/always_horny`))();

if (testFailRecord.length > 0) {
	console.info(`\nFinal breach count: ${testFailRecord.length}`);
	for (const record of testFailRecord) {
		console.info(`- ${record}`);
	};
	console.info(`Breach test failed.`);
} else {
	console.info(`Breach test passed.`);
};