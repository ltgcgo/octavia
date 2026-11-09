// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

/** Overlay descriptors of additional properties to apply to the exported object. */
export const _leaf_overlay_: PropertyDescriptorMap;
/** Apply the overlay descriptors to the target object in-place. */
export function _leaf_apply_<T>(ingest: T, overlays: PropertyDescriptorMap, overwrite?: boolean): T;
/** Apply the overlay descriptors to a copy of the target object.
*
* To make glob Leaf imports fully functional, follow the example below.
*
* ```js
* import * as LeafRaw from "./example.mjs";
* const Leaf = LeafRaw._leaf_yield_(LeafRaw, LeafRaw._overlay_);
* ``` */
export function _leaf_yield_<T>(ingest: T, overlays: PropertyDescriptorMap, overwrite?: boolean): T;

import * as env from "./index/env.d.mts";
import * as fs from "./index/fs.d.mts";
import * as io from "./index/io.d.mts";
import * as process from "./index/process.d.mts";

declare const _LeafExport_:
	typeof env &
	typeof fs &
	typeof io &
	typeof process;
export default _LeafExport_;
export const Deno = _LeafExport_;

export * from "./index/env.d.mts";
export * from "./index/fs.d.mts";
export * from "./index/io.d.mts";
export * from "./index/process.d.mts";