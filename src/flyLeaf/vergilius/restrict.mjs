// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

const skipCheck = false;
const inspectTrace = false;
const preventObtainThenAccessAtBoundary = false;
const lineLocationMatcher = /\((?<location>([ -_/.,:;@$#()]|\w|\d)+)\)/m;
const internalPathTester = /^(internal|native|node):/m;

const RestrictedProcess = class RestrictedProcess {};

export function isInternal() {
	if (skipCheck) return true;
	let stackMsg = (new Error()).stack;
	//console.debug(stackMsg);
	let loop = true;
	while (loop) {
		const nextLine = stackMsg.indexOf("\n") + 1;
		if (nextLine > 0) {
			stackMsg = stackMsg.substring(nextLine);
		} else {
			loop = false;
		};
		if (stackMsg?.length <= 0) {
			break;
		};
		const matchResult = lineLocationMatcher.exec(stackMsg)?.groups;
		if (!matchResult) continue;
		const {location} = matchResult;
		//console.debug(location);
		if (internalPathTester.test(location)) {
			return true;
		};
	};
	return false;
};

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
	return new Proxy(victim, {
		"get": (target, key) => {
			if (isInternal()) {
				if (inspectTrace) {
					const newKeyTree = tree.slice();
					newKeyTree.push(key);
					inspectTrace && console.info(newKeyTree.join("."));
					return wrapProxies(target[key], newKeyTree);
				} else {
					return target[key];
				};
			} else {
				return undefined;
			};
		},
		"apply": (target, thisArg, args) => {
			inspectTrace && console.info(`${tree.join(".")}()`);
			if (isInternal()) {
				const response = target.apply(thisArg, args);
				if (inspectTrace) {
					const newKeyTree = tree.slice();
					newKeyTree.push("[[Call]]");
					return wrapProxies(
						response,
						newKeyTree
					);
				} else {
					return response;
				};
			} else {
				return undefined;
			};
		}
	});
};

/** @param {NodeJS.Process} processObject
* @param {Set<string>|Iterable<string>} reservedFeatures */
export function getProcess(processObject, reservedFeatures, passThrough = false) {
	if (passThrough) {
		return wrapProxies(processObject, ["process"]);
	};
	const exposedProcess = new RestrictedProcess();
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
	return wrapProxies(exposedProcess, ["process"]);
};