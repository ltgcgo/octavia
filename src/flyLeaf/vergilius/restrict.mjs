// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

const skipCheck = false;
const inspectTrace = false;
const inspectInternal = false;
const preventObtainThenAccessAtBoundary = false;
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

/** @template {T}
* @param {T} victim
* @param {string[]} tree
* @returns {T} */
export function wrapProxies(victim, tree) {
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
			inspectTrace && console.info(newKeyTree.join("."));
			if (isInternal()) {
				if (blacklistedProperties.has(key)) return unwrappedObjects.get(target[key]) ?? target[key];
				return wrapProxies(target[key], newKeyTree);
			} else {
				return undefined;
			};
		},
		"apply": (target, thisArg, args) => {
			inspectTrace && console.info(`${tree.join(".")}()`);
			if (isInternal()) {
				const response = target.apply(unwrappedObjects.get(thisArg) ?? thisArg, args);
				if (inspectTrace) {
					const newKeyTree = tree.slice();
					newKeyTree.push(`${newKeyTree.pop()}()`);
					return wrapProxies(
						response,
						newKeyTree
					);
				} else {
					return response;
				};
			} else {
				throw(new Error(`Invalid non-internal invocation.`));
				return undefined;
			};
		},
		"construct": (target, args) => {
			inspectTrace && console.info(`new ${tree.join(".")}()`);
			if (isInternal()) {
				if (inspectTrace) {
					const newKeyTree = tree.slice();
					newKeyTree.push(`${newKeyTree.pop()}())`);
					newKeyTree.unshift(`(new ${newKeyTree.shift()}`);
					return wrapProxies(
						Reflect.construct(target, args),
						newKeyTree
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
