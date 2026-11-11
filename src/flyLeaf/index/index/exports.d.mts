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

export type * from "./permission.d.mts";
export * from "./permission.d.mts";
export type * from "./env.d.mts";
export * from "./env.d.mts";
export type * from "./fs.d.mts";
export * from "./fs.d.mts";
export type * from "./io.d.mts";
export * from "./io.d.mts";
export type * from "./process.d.mts";
export * from "./process.d.mts";