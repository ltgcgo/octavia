// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

/** Use carefully, incorrect uses will cause memory leaks. */
export class PoolIDMaps {
	/** @type {Map<number, object|Function>} */
	#idToObject = new Map();
	/** @type {WeakMap<object|Function, number>} */
	#objectToId = new WeakMap();
	#counter = 0;
	#doWrap(intake) {
		this.#counter = Math.max(intake, this.#counter);
		if (this.#counter > 4294967295) {
			this.#counter = 0;
		};
	};
	/** @param {number} id  */
	toSource(id) {
		return this.#idToObject.get(id);
	};
	/** @param {object|Function} source */
	toId(source) {
		return this.#objectToId.get(source);
	};
	/** @param {object|Function} source
	* @returns {number} */
	assign(source) {
		if (source == null) {
			throw(new TypeError(`Non-null members required.`));
		};
		switch (typeof source) {
			case "bigint":
			case "boolean":
			case "number":
			case "string":
			case "symbol": {
				throw(new TypeError(`Primitive members disallowed.`));
				break;
			};
			default: {
				if (typeof source[Symbol.toPrimitive]) {
					const yieldedPrimitive = source[Symbol.toPrimitive]();
					if (Number.isSafeInteger(yieldedPrimitive)) {
						this.#doWrap(yieldedPrimitive + 1);
						this.#objectToId.set(source, yieldedPrimitive);
						this.#idToObject.set(yieldedPrimitive, source);
						return yieldedPrimitive;
					};
				};
				const assignedId = this.#counter;
				this.#objectToId.set(source, assignedId);
				this.#idToObject.set(assignedId, source);
				this.#doWrap(this.#counter + 1);
				return assignedId;
			};
		};
	};
	/** @param {object|Function|number} handle */
	release(handle) {
		if (source == null) {
			throw(new TypeError(`Non-null members required.`));
		};
		switch (typeof source) {
			case "bigint":
			case "boolean":
			case "string":
			case "symbol": {
				throw(new TypeError(`Primitive members disallowed.`));
				break;
			};
			case "number": {
				const query = this.#idToObject.get(source);
				if (query != null) {
					this.#idToObject.delete(source);
					this.#objectToId.delete(query);
				};
			};
			default: {
				const query = this.#objectToId.get(source);
				if (query != null) {
					this.#idToObject.delete(query);
					this.#objectToId.delete(source);
				};
			};
		};
	};
};