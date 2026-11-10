// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

// Load this script after the Deno global has been made available.
// This script is used to supply polyfills utilising the Deno global.

export function close() {
	Deno.exit();
};

// Storage events may not yet be possible
export const sessionStorage = new (class SessionStorage {
	/** @type {Map<string, string>} */
	#map = new Map();
	#keys = [];
	#populateKeys() {
		this.#keys = [... this.#map.keys()];
	};
	#stringValue(value) {
		if (typeof value !== "string") {
			return `${value}`;
		} else {
			return value;
		};
	};
	get length() {
		return this.#map.size;
	};
	clear() {
		for (const key of this.#keys) {};
	};
	getItem(key) {
		return this.#map.get(this.#stringValue(key)) ?? null;
	};
	key(id) {
		return this.#keys[id];
	};
	removeItem(key) {
		this.#map.delete(this.#stringValue(key));
		this.#populateKeys();
	};
	setItem(key, value) {
		this.#map.set(this.#stringValue(key), this.#stringValue(value));
		this.#populateKeys();
	};
})();