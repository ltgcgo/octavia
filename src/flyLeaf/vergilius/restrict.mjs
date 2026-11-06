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
const lineLocationMatcher = /^\s+at\s((?<method>(\w|\d|[/\\_.<>])+)\s)?(\()?(?<location>([ -_/.,:;@$#()]|\w|\d)+):\d+(:\d+)?\)?$/m;
const internalPathTester = /^(internal|native|node):/m;
const externalPathPostponed = /^(node:(vm)):/m;
const externalPathImmediate = /^(node:(repl)):/m;

const blacklistedProperties = new Set([
	"prototype",
	Symbol.species
]);
const unwrappedObjects = new WeakMap();

const RestrictedView = class RestrictedView {};

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

export function isInternal() {
	if (skipCheck) return true;
	let stackMsg = (new Error()).stack;
	//console.debug(stackMsg);
	let depth = 0;
	let loop = true;
	while (loop) {
		const nextLine = stackMsg.indexOf("\n") + 1;
		if (nextLine > 0) {
			stackMsg = stackMsg.substring(nextLine);
			depth ++;
		} else {
			loop = false;
		};
		//console.debug(`---------\nStack: ${stackMsg}\n---------`);
		if (stackMsg?.length <= 0) {
			break;
		};
		const matchResult = lineLocationMatcher.exec(stackMsg)?.groups;
		if (!matchResult) continue;
		const {location} = matchResult;
		inspectInternal && console.debug(`Inspect (${depth}): ${location}`);
		if (externalPathImmediate.test(location)) {
			inspectInternal && console.debug(`Verdict (${depth}):, type spotted external.`);
			return false;
		};
		if (externalPathPostponed.test(location)) continue;
		if (internalPathTester.test(location)) {
			inspectInternal && console.debug(`Verdict (${depth}):, type spotted internal.`);
			return true;
		};
	};
	if (depth <= 2) {
		inspectInternal && console.debug(`Verdict (${depth}):, type inferred internal.`);
		return true;
	} else {
		inspectInternal && console.debug(`Verdict (${depth}):, type inferred external.`);
		return false;
	};
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
export function wrapProxies(victim, tree, sniffOnly = false) {
	if (victim == null) {
		return victim;
	};
	switch (typeof victim) {
		case "bigint":
		case "boolean":
		case "number":
		case "symbol":
		case "string": {
			return victim;
			break;
		};
	};
	if (!tree) {
		switch (typeof victim) {
			case "function": {
				tree = [victim.name ?? "<anonymous>"];
				break;
			};
			default: {
				tree = [victim[Symbol.toStringTag] ?? (victim.constructor && victim.constructor[Symbol.toStringTag])];
			};
		};
	};
	const newProxy = new Proxy(victim, {
		"get": (target, key) => {
			const newKeyTree = tree.slice();
			if (typeof key === "symbol") {
				newKeyTree.push(key.toString());
			} else if (typeof key === "number" || Number.isSafeInteger(parseInt(key))) {
				newKeyTree.push(`${newKeyTree.pop()}[${key}]`);
			} else {
				newKeyTree.push(key);
			};
			if (inspectTrace > 2) {
				console.info(`[\x1b[1;34mGET \x1b[0m] ${newKeyTree.join(".")} = ${visualiseValue(target[key])}`);
			} else if (inspectTrace > 1) {
				console.info(`[\x1b[1;34mGET \x1b[0m] ${newKeyTree.join(".")}`);
			};
			if (sniffOnly || isInternal()) {
				if (blacklistedProperties.has(key)) return unwrappedObjects.get(target[key]) ?? target[key];
				return wrapProxies(target[key], newKeyTree, sniffOnly);
			} else {
				return undefined;
			};
		},
		"apply": (target, thisArg, args) => {
			const invokeId = getRandomID();
			if (inspectTrace > 2) {
				console.info(`[\x1b[1;33mCALL\x1b[0m] ${tree.join(".")}(${visualiseArguments(args)}): <${invokeId}>`);
			} else if (inspectTrace > 1) {
				console.info(`[\x1b[1;33mCALL\x1b[0m] ${tree.join(".")}(): <${invokeId}>`);
			};
			if (sniffOnly || inspectTrace) {
				const copiedArgs = [];
				for (let i = 0; i < args.length; i ++) {
					const arg = args[i];
					if (typeof arg === "function" || typeof arg?.apply === "function") {
						const newKeyTree = tree.slice();
						newKeyTree.push(`${newKeyTree.pop()}<${invokeId}>{${i}}()`);
						copiedArgs.push(wrapProxies(arg, tree, sniffOnly));
					} else {
						copiedArgs.push(arg);
					};
				};
				args = copiedArgs;
			};
			if (sniffOnly || isInternal()) {
				const response = target.apply(unwrappedObjects.get(thisArg) ?? thisArg, args);
				if (inspectTrace > 1) {
					console.info(`[\x1b[1;32mDONE\x1b[0m] ${tree.join(".")}<${invokeId}>() => ${visualiseValue(response)}`);
				};
				if (sniffOnly || inspectTrace) {
					const newKeyTree = tree.slice();
					newKeyTree.push(`${newKeyTree.pop()}<${invokeId}>()`);
					return wrapProxies(response, newKeyTree, sniffOnly);
				} else {
					return response;
				};
			} else {
				throw(new Error(`Invalid non-internal invocation.`));
				return undefined;
			};
		},
		"construct": (target, args) => {
			const invokeId = getRandomID();
			if (inspectTrace > 2) {
				console.info(`[\x1b[1;35mNEW \x1b[0m] new ${tree.join(".")}<${invokeId}>(${visualiseArguments(args)})`);
			} else if (inspectTrace > 1) {
				console.info(`[\x1b[1;35mNEW \x1b[0m] new ${tree.join(".")}<${invokeId}>()`);
			};
			if (sniffOnly || isInternal()) {
				if (sniffOnly || inspectTrace) {
					const newKeyTree = tree.slice();
					newKeyTree.push(`${newKeyTree.pop()}<${invokeId}>())`);
					newKeyTree.unshift(`(new ${newKeyTree.shift()}`);
					return wrapProxies(
						Reflect.construct(target, args),
						newKeyTree, sniffOnly
					);
				} else {
					return Reflect.construct(target, args);
				};
			} else {
				throw(new Error(`Invalid non-internal construction.`));
				return undefined;
			};
		}
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
	const exposedProcess = new RestrictedView();
	if (!reservedFeatures) return exposedProcess;
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
				exposedProcess,
				key, {
					"value": assigned,
					"configurable": true,
					"enumerable": true,
					"writable": false,
				}
			);
		};
	};
	return wrapProxies(exposedProcess, [rootName]);
};
