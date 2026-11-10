// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

/** @template T
* @extends {T} */
const LeafCopiedView = class LeafCopiedView {};

/** Copy the properties from the source to the target in-place.
* @template T
* @param {T} target
* @param {Record<string, any>} source
* @returns {T} */
export function _leaf_copyTo_(target, source, overwrite = false) {
	for (const key in source) {
		const oldValue = target[key];
		if (overwrite || (!Object.hasOwn(target, key) && oldValue == null)) {
			target[key] = source[key];
		};
	};
	return target;
};

/** Apply the overlays to the object in-place.
* @template T
* @param {T} ingest
* @param {PropertyDescriptorMap} overlays
* @returns {T} */
export function _leaf_apply_(ingest, overlays = {}, overwrite = false) {
	for (const overlayKey in overlays) {
		const overlay = overlays[overlayKey];
		const oldValue = ingest[overlayKey];
		console.debug(`Applied: ${overlayKey}`);
		if (overwrite || (!Object.hasOwn(ingest, overlayKey) && oldValue == null)) {
			Object.defineProperty(ingest, overlayKey, overlay);
		};
	};
	return ingest;
};

/** Copy the properties and apply the overlays to a new object.
* @template T
* @param {T} ingest
* @param {PropertyDescriptorMap} overlays
* @returns {T} */
export function _leaf_yield_(ingest, overlays = {}, overwrite = false) {
	const newObject = new LeafCopiedView();
	for (const key in ingest) {
		//console.debug(self.process ? "yes" : "no");
		//console.debug(self.process?.nextTick);
		const descriptor = Object.getOwnPropertyDescriptor(ingest, key);
		if (descriptor != null) {
			//console.debug(`Copied (tunnel): ${key}`);
			Object.defineProperty(newObject, key, descriptor);
		} else {
			const value = ingest[key];
			//console.debug(`Copied (value): ${key}`);
			if (value === overlays) continue;
			newObject[key] = value;
		};
	};
	_leaf_apply_(newObject, overlays, overwrite);
	return newObject;
};
