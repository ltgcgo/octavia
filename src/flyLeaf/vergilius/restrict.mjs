// 2021-2022 © Lightingale Community, Minuette Author(s)
// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import {
	getPrintInternal,
	getPrintTrace,
	getPrisonWarden,
	getSkipCheck
} from "./config.mjs";

const skipCheck = getSkipCheck();
const inspectTrace = getPrintTrace();
const inspectInternal = getPrintInternal();
const preventObtainThenAccessAtBoundary = getPrisonWarden();
const hasStackTraceLimit = Error.stackTraceLimit;
const oldCaptureStackTrace = Error.captureStackTrace;
const oldPrepareStackTrace = Error.prepareStackTrace;
const useNuclear = false; // Nuclear option.
const lineLocationMatcher = /^\s+at(\s(?<async>async))?(\s(?<new>new))?\s((?<method>(\w|\d|[/\\_.<>])+)\s)?(\[(?<alias>(\w|\d|[ _.@$#])+)\]\s)?\(?((?<location>(\w+:)?([ _\-+.,/\\@$#]|\w|\d)+):\d+:\d+|\<(\w|\d)+\>)\)?$/gm;
const internalPathTester = /^(internal|node):/m;
const externalPathPostponed = /^(node:(async_hooks|vm|internal\/(console\/constructor|event_target|modules\/esm\/(module_job|loader)|perf\/observe|process\/task_queues|timers|util\/inspect|webstreams\/(readablestream|transformstream|util|writablestream))))$|^node:internal\/per_context\//m;
const externalPathImmediate = /^(REPL\d+|\[repl\]|(node:(repl|internal\/(modules\/run_main))))/m;
const externalStrictImmediate = /^((npm|file|https?|[A-Z]):|\/)/m; // Nuclear option, not sure if this needs to be enabled. Likely lots of false negatives.

const blacklistedProperties = new Set([
	"prototype",
	Symbol.species // Fixes zlib panics.
]);
const silentProperties = new Set([
	Symbol.iterator // Node.js `internal:undici` SPAMS this!
]);
const blacklistedConstructors = new Set([
	// Node.js buffers will get proxied
	DataView,
	SharedArrayBuffer,
	ArrayBuffer,
	Uint8ClampedArray,
	Uint8Array,
	Int8Array,
	Uint16Array,
	Int16Array,
	Uint32Array,
	Int32Array,
	Float32Array,
	BigUint64Array,
	BigInt64Array,
	Float64Array
]);
const blacklistedExact = new Set([]);
if (globalThis.Buffer) {
	blacklistedExact.add(Buffer.concat);
};

const b64Alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-";
const dummyU8 = new Uint8Array(8);
const dummyU8B64 = dummyU8.subarray(0, (dummyU8.length * 3) >>> 2);
const getRandomID = function () {
	crypto.getRandomValues(dummyU8);
	if (typeof dummyU8B64.toBase64 === "function") {
		return dummyU8B64.toBase64({"alphabet": "base64url"});
	} else {
		let result = "";
		for (const e of dummyU8) {
			result += b64Alphabet[e & 63];
		};
		return result;
	};
};

const RestrictedView = class RestrictedView {};
const unwrappedObjects = new WeakMap();

/** @type {Error} */
const errorStackReceiver = {};
/** @param {Function} root */
const isInternal = function (root) {
	// Error.prepareStackTrace is non-standard and shouldn't be used. SpiderMonkey and JavaScriptCore don't have it.
	// Function.prototype.caller is banned for strict mode parsing, and Fly Leaf has strict mode enabled for the entire project. Ouch.
	// I'm stealing kneecaps if anything is said about call site capturing in Node.js, it is non-standard.
	// Porffor doesn't need to, and shouldn't use this function.
	// External methods all seem to not match internal tests at depth 3, but this isn't a guarantee.
	if (skipCheck) return true;
	let restoreStackTraceLimit;
	if (
		typeof hasStackTraceLimit === "number" &&
		Error.stackTraceLimit < 10
	) {
		restoreStackTraceLimit = Error.stackTraceLimit;
		Error.stackTraceLimit = 10; // Browsers are on 128. 10 is the default in Deno, Ende, Bun, Node, Ant.
	};
	let restorePrepareStackTrace;
	if (
		typeof oldPrepareStackTrace === "function" &&
		Error.prepareStackTrace !== oldPrepareStackTrace
	) {
		restorePrepareStackTrace = Error.prepareStackTrace;
		Error.prepareStackTrace = oldPrepareStackTrace;
	};
	oldCaptureStackTrace(errorStackReceiver, root);
	let stackMsg = errorStackReceiver.stack;
	//console.debug(stackMsg);
	let depth = 0;
	let verdict = undefined;
	for (const line of stackMsg.matchAll(lineLocationMatcher)) {
		depth ++;
		const report = line?.groups;
		if (
			report == null ||
			typeof report.location !== "string"
		) continue;
		const {location} = report;
		inspectInternal && console.debug(`Inspect (${depth}): ${location} ${report?.async ? "async " : ""}${report?.new ? "new " : ""}"${report?.method ?? "<empty>"}"${report?.alias ? ` ${report.alias}` : ""}`);
		if (useNuclear && externalStrictImmediate.test(location)) {
			inspectInternal && console.debug(`Verdict (${depth}): type spotted nuclear external.`);
			verdict = false;
			break;
		};
		if (externalPathImmediate.test(location)) {
			inspectInternal && console.debug(`Verdict (${depth}): spotted, type external.`);
			verdict = false;
			break;
		};
		if (externalPathPostponed.test(location)) continue;
		if (internalPathTester.test(location)) {
			inspectInternal && console.debug(`Verdict (${depth}): spotted, type internal.`);
			verdict = true;
			break;
		};
	};
	if (verdict == null) {
		/*if (depth <= 0) {
			inspectInternal && console.debug(`Verdict (${depth}): inferred, type internal.`);
			verdict = true;
		} else {*/
			inspectInternal && console.debug(`Verdict (${depth}): inferred, type external.`);
			verdict = false;
		//};
	};
	if (typeof restorePrepareStackTrace === "function") {
		Error.prepareStackTrace = restorePrepareStackTrace;
	};
	if (typeof restoreStackTraceLimit === "number") {
		Error.stackTraceLimit = restoreStackTraceLimit;
	};
	return verdict;
};
export function isCallSiteInternal() {
	return isInternal(isCallSiteInternal);
};

export function deepUnwrap(wrapped) {
	let unwrapped;
	while ((unwrapped = unwrappedObjects.get(wrapped)) != null) {
		wrapped = unwrapped;
	};
	return wrapped;
};

const visualiseValue = function (value) {
	if (value === null) {
		return "null";
	};
	switch (typeof value) {
		case "undefined": {
			return "undefined";
			break;
		};
		case "bigint": {
			return `${value}n`;
			break;
		};
		case "function": {
			return value?.name ? `${value?.name}() {}` : "() => {}";
			break;
		};
		case "symbol":  {
			return value.toString();
			break;
		};
		case "boolean":
		case "number":
		case "string":  {
			return JSON.stringify(value);
			break;
		};
		case "object": {
			switch (value.constructor) {
				case Promise: {
					return `Promise<unknown>`;
					break;
				};
				default: {
					if (value instanceof Array) {
						return value.length < 2 ? `[(${value.length} element)]` : `[(${value.length} elements)]`;
					};
					return value.constructor?.name ? `${value.constructor?.name} {}` : "{}";
				};
			};
			break;
		};
		default: {
			throw(new RangeError(`Something shouldn't happen has happened.`));
		};
	};
};
const visualiseArguments = function (args) {
	if (args.length > 1) {
		let result = visualiseValue(args[0]);
		for (let i = 1; i < args.length; i ++) {
			result += `, ${visualiseValue(args[i])}`;
		};
		return result;
	} else if (args.length > 0) {
		return args[0] === undefined ? "" : visualiseValue(args[0]);
	} else {
		return "";
	};
};

/** @template {T}
* @param {T} victim
* @param {string[]} tree
* @returns {T} */
export function wrapProxies(victim, tree, sniffOnly = false, disablePrint = false) {
	let unwrappedVictim = deepUnwrap(victim);
	if (unwrappedVictim == null) {
		return victim;
	};
	switch (typeof unwrappedVictim) {
		case "bigint":
		case "boolean":
		case "number":
		case "symbol":
		case "string": {
			return victim;
			break;
		};
	};
	if (blacklistedConstructors.has(deepUnwrap(unwrappedVictim?.constructor))) {
		return victim;
	};
	if (!tree) {
		switch (typeof unwrappedVictim) {
			case "function": {
				tree = [victim.name ?? "<anonymous>"];
				break;
			};
			default: {
				tree = [victim[Symbol.toStringTag] ?? (victim.constructor && victim.constructor[Symbol.toStringTag])];
			};
		};
	};
	const handlerGet = (target, key) => {
		const newKeyTree = tree.slice();
		if (typeof key === "symbol") {
			newKeyTree.push(key.toString());
		} else if (typeof key === "number" || Number.isSafeInteger(parseInt(key))) {
			newKeyTree.push(`${newKeyTree.pop()}[${key}]`);
		} else {
			newKeyTree.push(key);
		};
		if (sniffOnly || isInternal(handlerGet)) {
			if (disablePrint) {
			} else if (inspectTrace > 2) {
				console.info(`[\x1b[1;34mGET \x1b[0m] ${newKeyTree.join(".")} = ${visualiseValue(target[key])}`);
			} else if (inspectTrace > 1) {
				console.info(`[\x1b[1;34mGET \x1b[0m] ${newKeyTree.join(".")}`);
			};
			const value = Reflect.get(unwrappedVictim, key);
			const unwrappedKey = deepUnwrap(key);
			const unwrappedValue = deepUnwrap(value);
			const valueDesc = Object.getOwnPropertyDescriptor(unwrappedVictim, key);
			if (
				blacklistedProperties.has(key) ||
				blacklistedProperties.has(unwrappedKey) ||
				blacklistedConstructors.has(value?.constructor) ||
				blacklistedConstructors.has(deepUnwrap(unwrappedValue?.constructor)) ||
				blacklistedExact.has(value) ||
				blacklistedExact.has(unwrappedValue) ||
				(
					valueDesc?.configurable === false &&
					valueDesc?.writable === false
				)
			) return unwrappedValue;
			if (unwrappedValue !== value) {
				// Do not wrap the same value again and again.
				return value;
			};
			const mutedChild = silentProperties.has(key) || disablePrint;
			return wrapProxies(value, newKeyTree, sniffOnly, mutedChild);
		} else {
			if (disablePrint) {
			} else if (inspectTrace > 2) {
				console.info(`[\x1b[1;34mGET \x1b[0m] ${newKeyTree.join(".")} = (\x1b[1;31mbanned\x1b[0m) ${visualiseValue(target[key])}`);
			} else if (inspectTrace > 1) {
				console.info(`[\x1b[1;34mGET \x1b[0m] ${newKeyTree.join(".")} = (\x1b[1;31mbanned\x1b[0m)`);
			};
			return undefined;
		};
	};
	const handlerSet = (target, key, value) => {
		let returnValue = true;
		const newKeyTree = tree.slice();
		if (typeof key === "symbol") {
			newKeyTree.push(key.toString());
		} else if (typeof key === "number" || Number.isSafeInteger(parseInt(key))) {
			newKeyTree.push(`${newKeyTree.pop()}[${key}]`);
		} else {
			newKeyTree.push(key);
		};
		if (sniffOnly || isInternal(handlerSet)) {
			const invokeId = getRandomID();
			const unwrappedKey = deepUnwrap(key);
			const unwrappedValue = deepUnwrap(value);
			let writeFailed = true, sourceReadOnly, caughtError;
			try {
				if (
					blacklistedProperties.has(key) ||
					blacklistedProperties.has(unwrappedKey) ||
					blacklistedConstructors.has(target?.constructor) ||
					blacklistedConstructors.has(deepUnwrap(unwrappedVictim?.constructor)) ||
					blacklistedExact.has(value) ||
					blacklistedExact.has(unwrappedValue)
				) {
					const oldValue = unwrappedVictim[key];
					Reflect.set(unwrappedVictim, key, unwrappedValue);
					writeFailed = unwrappedVictim[key] !== unwrappedValue;
					sourceReadOnly = unwrappedVictim[key] === oldValue;
				} else {
					const oldValue = unwrappedVictim[key];
					const wrappedValue = unwrappedValue === value ? wrapProxies(unwrappedValue, newKeyTree, sniffOnly, disablePrint) : value;
					Reflect.set(unwrappedVictim, key, wrappedValue);
					writeFailed = unwrappedVictim[key] !== wrappedValue;
					sourceReadOnly = unwrappedVictim[key] === oldValue;
				};
			} catch (err) {
				writeFailed = true;
				caughtError = err;
				returnValue = false;
			};
			let trailingText = "";
			if (writeFailed) {
				trailingText = `(\x1b[1;31m${
					caughtError ? "thrown" : (
						sourceReadOnly ? "readonly" : "failure"
					)
				}\x1b[0m) `;
			};
			if (disablePrint) {
			} else if (inspectTrace > 2) {
				console.info(`[\x1b[1;37mSET \x1b[0m] ${newKeyTree.join(".")} <${invokeId}> = ${trailingText}${visualiseValue(value)}`);
			} else if (inspectTrace > 1) {
				console.info(`[\x1b[1;37mSET \x1b[0m] ${newKeyTree.join(".")} <${invokeId}>${trailingText}`);
			};
		} else {
			if (disablePrint) {
			} else if (inspectTrace > 2) {
				console.info(`[\x1b[1;37mSET \x1b[0m] ${newKeyTree.join(".")} = (\x1b[1;31mbanned\x1b[0m) ${visualiseValue(value)}`);
			} else if (inspectTrace > 1) {
				console.info(`[\x1b[1;37mSET \x1b[0m] ${newKeyTree.join(".")} = (\x1b[1;31mbanned\x1b[0m)`);
			};
			returnValue = false;
		};
		return returnValue;
	};
	const handlerCall = (target, thisArg, args) => {
		const invokeId = getRandomID();
		if (sniffOnly || inspectTrace > 1) {
			const copiedArgs = [];
			for (let i = 0; i < args.length; i ++) {
				const arg = deepUnwrap(args[i]);
				if ((typeof arg === "function" || typeof arg?.apply === "function") && !blacklistedConstructors.has(arg)) {
					const newKeyTree = tree.slice();
					newKeyTree.push(`${newKeyTree.pop()}<${invokeId}>{${i}}`);
					copiedArgs.push(wrapProxies(arg, newKeyTree, sniffOnly, disablePrint));
				} else {
					copiedArgs.push(arg);
				};
			};
			args = copiedArgs;
		};
		if (sniffOnly || isInternal(handlerCall)) {
			if (disablePrint) {
			} else if (inspectTrace > 2) {
				console.info(`[\x1b[1;33mCALL\x1b[0m] ${tree.join(".")}(${visualiseArguments(args)}): <${invokeId}>`);
			} else if (inspectTrace > 1) {
				console.info(`[\x1b[1;33mCALL\x1b[0m] ${tree.join(".")}(): <${invokeId}>`);
			};
			try {
				const response = target.apply(deepUnwrap(thisArg), args);
				if (disablePrint) {
				} else if (inspectTrace > 1) {
					console.info(`[\x1b[1;32mDONE\x1b[0m] ${tree.join(".")}<${invokeId}>() => ${visualiseValue(response)}`);
				};
				if (!blacklistedConstructors.has(response?.constructor) && (sniffOnly || inspectTrace > 1)) {
					const newKeyTree = tree.slice();
					newKeyTree.push(`${newKeyTree.pop()}<${invokeId}>()`);
					return wrapProxies(response, newKeyTree, sniffOnly, disablePrint);
				} else {
					return response;
				};
			} catch (err) {
				console.info(`[\x1b[1;31mFAIL\x1b[0m] ${tree.join(".")}<${invokeId}>() <= ${err.name ?? "<unknownError>"}${err.message.length > 0 ? ": " : ""}${err.message}`);
				throw(err);
			};
		} else {
			if (disablePrint) {
			} else if (inspectTrace > 1) {
				console.info(`[\x1b[1;33mCALL\x1b[0m] ${tree.join(".")}(): (\x1b[1;31mbanned\x1b[0m)`);
			};
			throw(new Error(`Invalid non-internal invocation.`));
			return undefined;
		};
	};
	const handlerNew = (target, args) => {
		const invokeId = getRandomID();
		if (!blacklistedConstructors.has(target) && (sniffOnly || isInternal(handlerNew))) {
			if (disablePrint) {
			} else if (inspectTrace > 2) {
				console.info(`[\x1b[1;35mNEW \x1b[0m] new ${tree.join(".")}<${invokeId}>(${visualiseArguments(args)})`);
			} else if (inspectTrace > 1) {
				console.info(`[\x1b[1;35mNEW \x1b[0m] new ${tree.join(".")}<${invokeId}>()`);
			};
			if (sniffOnly || inspectTrace > 0) {
				const newKeyTree = tree.slice();
				newKeyTree.push(`${newKeyTree.pop()}<${invokeId}>())`);
				newKeyTree.unshift(`(new ${newKeyTree.shift()}`);
				return wrapProxies(
					Reflect.construct(target, args),
					newKeyTree, sniffOnly, disablePrint
				);
			} else {
				return Reflect.construct(target, args);
			};
		} else {
			if (disablePrint) {
			} else if (inspectTrace > 1) {
				console.info(`[\x1b[1;35mNEW \x1b[0m] new ${tree.join(".")}<${invokeId}>(): (\x1b[1;31mbanned\x1b[0m)`);
			};
			throw(new Error(`Invalid non-internal construction.`));
			return undefined;
		};
	};
	const newProxy = new Proxy(victim, {
		"get": handlerGet,
		"set": handlerSet,
		"apply": handlerCall,
		"construct": handlerNew
	});
	unwrappedObjects.set(newProxy, victim);
	return newProxy;
};

/** @template {T}
* @param {T} target
* @param {string} key
* @param {object|Function} value
* @returns {T} */
export function setInternalOnlyProperty(target, key, value) {
	//console.debug(target, key);
	target[key] = wrapProxies(value, [key]);
	return target;
};

/** @template {T}
* @param {T} processObject
* @param {Set<string>|Iterable<string>} reservedFeatures
* @returns {T} */
export function getRestrictedView(processObject, reservedFeatures, rootName = "<anonymous>", passThrough = false) {
	if (passThrough) {
		return wrapProxies(processObject, [rootName]);
	};
	const publicView = new RestrictedView();
	if (!reservedFeatures) return publicView;
	/*if (reservedFeatures.constructor !== Set) {
		reservedFeatures = new Set(reservedFeatures);
	};*/
	for (const key of reservedFeatures) {
		if (processObject[key] != null) {
			//console.debug(key);
			let assigned = processObject[key];
			if (preventObtainThenAccessAtBoundary) {
				assigned = wrapProxies(assigned, tree);
			};
			// Mimics actual Node.js `process` properties.
			Object.defineProperty(
				publicView,
				key, {
					"value": assigned,
					"configurable": true,
					"enumerable": true,
					"writable": false,
				}
			);
		};
	};
	return wrapProxies(publicView, [rootName]);
};
