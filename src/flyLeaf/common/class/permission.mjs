// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

// The common fallback permission system. Can be modified on alternative runtimes with permissions support, which currently is none.

/** @type {Set<import("../../index/index.d.mts").LeafPermName>} */
const LeafPermNames = new Set("env,ffi,net,read,run,sys,write".split(","));

export const LeafSymbolPermPartial = Symbol("Symbol.leafPermPartial");
export const LeafSymbolPermState = Symbol("Symbol.leafPermState");

export class LeafPermStatus extends EventTarget {
	[LeafSymbolPermPartial] = false;
	/** @type {import("../../index/index.d.mts").LeafPermState} */
	[LeafSymbolPermState] = "prompt";
	get partial() {
		return this[LeafSymbolPermPartial];
	};
	get state() {
		return this[LeafSymbolPermState];
	};
	/** No-op for the moment, including every single listener operation. */
	onchange;
};

/** @type {import("../../index/index.d.mts").LeafPermHookMethodBoth} */
const methodPassAll = () => {
	const result = new LeafPermStatus();
	result[LeafSymbolPermState] = "granted";
	return result;
};
/** @type {import("../../index/index.d.mts").LeafPermRuntimeTypeHooksBoth} */
const permPassAll = {
	"query": [methodPassAll],
	"request": [methodPassAll],
	"revoke": [methodPassAll]
};
/** @type {import("../../index/index.d.mts").LeafPermRuntimeTypeHooksBoth} */
const permEnvHooks = {
	"query": [(details) => {
		return methodPassAll();
	}],
	"request": [(details) => {
		return methodPassAll();
	}],
	"revoke": [(details) => {
		return methodPassAll();
	}]
};
/** @type {import("../../index/index.d.mts").LeafPermRuntimeTypeHooksBoth} */
const permSysHooks = {
	"query": [(details) => {
		return methodPassAll();
	}],
	"request": [(details) => {
		return methodPassAll();
	}],
	"revoke": [(details) => {
		return methodPassAll();
	}]
};

export class LeafPermissionsBaseline {
	/** @type {import("../../index/index.d.mts").LeafPermRuntimeHookMapBoth} */
	#hooksQuery = new Map();
	/** @type {import("../../index/index.d.mts").LeafPermRuntimeHookMapBoth} */
	#hooksRequest = new Map();
	/** @type {import("../../index/index.d.mts").LeafPermRuntimeHookMapBoth} */
	#hooksRevoke = new Map();
	/** @param {import("../../index/index.d.mts").LeafPermRuntimeHooksBoth} hooks */
	constructor(hooks) {
		const queryHooks = this.#hooksQuery;
		const requestHooks = this.#hooksRequest;
		const revokeHooks = this.#hooksRevoke;
		const defaultHooks = {
			"import": permPassAll,
			"env": permEnvHooks,
			"sys": permSysHooks,
			"ffi": permPassAll,
			"net": permPassAll,
			"read": permPassAll,
			"run": permPassAll,
			"write": permPassAll
		};
		for (const name of LeafPermNames) {
			queryHooks.set(name, defaultHooks[name].query);
			requestHooks.set(name, defaultHooks[name].request);
			revokeHooks.set(name, defaultHooks[name].revoke);
		};
		if (hooks) {
			for (const type in hooks) {
				/** @type {import("../../index/index.d.mts").LeafPermRuntimeTypeHooksBoth} */
				const typeHook = hooks[type];
				if (typeof typeHook !== "object") {
					throw(new TypeError(`The "${type}" hook must be a method collection object.`));
				} else if (LeafPermNames.has(type)) {
					for (const hookType in typeHook) {
						/** @type {import("../../index/index.d.mts").LeafPermHookMethodBoth} */
						const actualHook = typeHook[hookType];
						if (typeof actualHook[0] !== "function") {
							throw(new TypeError(`The "${hookType}" hook type must be a method.`));
						};
						switch (hookType) {
							case "query": {
								queryHooks.set(type, actualHook);
								break;
							};
							case "request": {
								requestHooks.set(type, actualHook);
								break;
							};
							case "revoke": {
								revokeHooks.set(type, actualHook);
								break;
							};
							default: {
								console.warn(`The "${type}" hook type is not supported in this version of Fly Leaf.`);
							};
						};
					};
				} else {
					console.warn(`The "${type} hook is not supported in this version of Fly Leaf.`);
				};
			};
		};
		//console.debug(queryHooks);
		//console.debug(requestHooks);
		//console.debug(revokeHooks);
	};
	/** @param {import("../../index/index.d.mts").LeafPermDetails} details */
	#assertNoNull(details){
		if (!details) {
			throw(new TypeError(`The provided value "undefined" is not a valid permission name.`)); // Actual text.
		};
	};
	/** @param {import("../../index/index.d.mts").LeafPermDetails} details */
	querySync(details) {
		this.#assertNoNull(details);
		const hooks = this.#hooksQuery.get(details.name);
		console.debug(hooks);
		if (hooks && typeof hooks[0] === "function") {
			return hooks[0](details);
		} else {
			throw(new TypeError(`The provided value "${details.name}" is not a valid permission name`));
		};
	};
	/** @param {import("../../index/index.d.mts").LeafPermDetails} details */
	async query(details) {
		this.#assertNoNull(details);
		let failed = true;
		const hooks = this.#hooksQuery.get(details.name);
		if (hooks) {
			if (typeof hooks[1] === "function") {
				failed = false;
				return await hooks[1](details);
			} else if (typeof hooks[0] === "function") {
				failed = false;
				return hooks[0](details);
			};
		};
		if (failed) {
			throw(new TypeError(`The provided value "${details.name}" is not a valid permission name`));
		};
	};
	/** @param {import("../../index/index.d.mts").LeafPermDetails} details */
	requestSync(details) {
		this.#assertNoNull(details);
		const hooks = this.#hooksRequest.get(details.name);
		if (hooks && typeof hooks[0] === "function") {
			return hooks[0](details);
		} else {
			throw(new TypeError(`The provided value "${details.name}" is not a valid permission name`));
		};
	};
	/** @param {import("../../index/index.d.mts").LeafPermDetails} details */
	async request(details) {
		this.#assertNoNull(details);
		let failed = true;
		const hooks = this.#hooksRequest.get(details.name);
		if (hooks) {
			if (typeof hooks[1] === "function") {
				failed = false;
				return await hooks[1](details);
			} else if (typeof hooks[0] === "function") {
				failed = false;
				return hooks[0](details);
			};
		};
		if (failed) {
			throw(new TypeError(`The provided value "${details.name}" is not a valid permission name`));
		};
	};
	/** @param {import("../../index/index.d.mts").LeafPermDetails} details */
	revokeSync(details) {
		this.#assertNoNull(details);
		const hooks = this.#hooksRevoke.get(details.name);
		if (hooks && typeof hooks[0] === "function") {
			return hooks[0](details);
		} else {
			throw(new TypeError(`The provided value "${details.name}" is not a valid permission name`));
		};
	};
	/** @param {import("../../index/index.d.mts").LeafPermDetails} details */
	async revoke(details) {
		this.#assertNoNull(details);
		let failed = true;
		const hooks = this.#hooksRevoke.get(details.name);
		if (hooks) {
			if (typeof hooks[1] === "function") {
				failed = false;
				return await hooks[1](details);
			} else if (typeof hooks[0] === "function") {
				failed = false;
				return hooks[0](details);
			};
		};
		if (failed) {
			throw(new TypeError(`The provided value "${details.name}" is not a valid permission name`));
		};
	};
};