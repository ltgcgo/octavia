// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

/** Use carefully, incorrect uses will cause memory leaks.
* @template T */
export class PoolIDMaps {
	/** @type {Map<number, T>} */
	#idToObject = new Map();
	/** @type {WeakMap<T, number>} */
	#objectToId = new WeakMap();
	#counter = 0;
	#doWrap(intake) {
		this.#counter = Math.max(intake, this.#counter);
		if (this.#counter > 2147483647) {
			this.#counter = 0;
		};
	};
	#slotFree(id) {
		let iterations = 0;
		let freeId = id;
		while (iterations < 2147483648 && this.#idToObject.has(freeId)) {
			freeId ++;
			if (freeId > 2147483647) {
				freeId = 0;
			};
		};
		if (iterations >= 2147483648 && this.#idToObject.has(freeId)) {
			throw(new Error(`Pool capacity fulfilled.`));
		};
		return freeId;
	};
	/** @param {number} id  */
	toSource(id) {
		return this.#idToObject.get(id);
	};
	/** @param {T} source */
	toId(source) {
		return this.#objectToId.get(source);
	};
	/** @param {T} source
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
						const actualValue = this.#slotFree(yieldedPrimitive);
						this.#objectToId.set(source, actualValue);
						this.#idToObject.set(actualValue, source);
						this.#doWrap(actualValue + 1);
						return actualValue;
					};
				};
				const assignedId = this.#slotFree(this.#counter);
				this.#objectToId.set(source, assignedId);
				this.#idToObject.set(assignedId, source);
				this.#doWrap(this.#counter + 1);
				return assignedId;
			};
		};
	};
	/** @param {T|number} handle */
	release(handle) {
		if (handle == null) {
			throw(new TypeError(`Non-null members required.`));
		};
		switch (typeof handle) {
			case "bigint":
			case "boolean":
			case "string":
			case "symbol": {
				throw(new TypeError(`Primitive members disallowed.`));
				break;
			};
			case "number": {
				const query = this.#idToObject.get(handle);
				if (query != null) {
					this.#idToObject.delete(handle);
					this.#objectToId.delete(query);
				};
				break;
			};
			default: {
				const query = this.#objectToId.get(handle);
				if (query != null) {
					this.#idToObject.delete(query);
					this.#objectToId.delete(handle);
				};
			};
		};
	};
};