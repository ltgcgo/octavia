// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

const skipCheck = false;
const inspectTrace = false;
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
			const newKeyTree = tree.slice();
			newKeyTree.push(key);
			inspectTrace && console.info(newKeyTree.join("."));
			if (isInternal()) {
				return wrapProxies(target[key], newKeyTree);
			} else {
				return undefined;
			};
		},
		"apply": (target, thisArg, args) => {
			inspectTrace && console.info(`${tree.join(".")}()`);
			const newKeyTree = tree.slice();
			newKeyTree.push("[[Call]]");
			return wrapProxies(
				target.apply(thisArg, args),
				newKeyTree
			);
		}
	});
};

/** @param {NodeJS.Process} processObject
* @param {Set<string>|Iterable<string>} reservedFeatures */
export function getProcess(processObject, reservedFeatures, passThrough = false) {
	if (passThrough) {
		return wrapProxies(processObject);
	};
	const exposedProcess = new RestrictedProcess();
	if (!reservedFeatures) return exposedProcess;
	/*if (reservedFeatures.constructor !== Set) {
		reservedFeatures = new Set(reservedFeatures);
	};*/
	for (const key of reservedFeatures) {
		if (processObject[key] != null) {
			//console.debug(key);
			exposedProcess[key] = processObject[key];
		};
	};
	return wrapProxies(exposedProcess);
};