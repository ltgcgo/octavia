// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

import type {
	Throws
} from "../leaf.async/conventions.d.mts";
import type {
	LeafCommand as LeafCommandAsync,
	LeafCommandOptions,
	LeafCommandOutput
} from "../leaf.async/process.d.mts";

/** Declaration of a reusable command. */
export class LeafCommand<T extends LeafCommandOptions> extends LeafCommandAsync<T> {
	/** The synchronous variant of `output`.
	*
	* Standard input cannot be set to piped mode, or this method will throw immediately. */
	outputSync(): T["stdin"] extends "piped" ? Throws<TypeError, never> : LeafCommandOutput<"output", T>;
}
/** Declaration of a reusable command. */
export const Command: typeof LeafCommand;

/** The synchronous variant of `spawnAndWait`. */
export function spawnAndWaitSync<T extends LeafCommandOptions>(command: string|URL, options?: T): LeafCommandOutput<"output", T>;
/** The synchronous variant of `spawnAndWait`. */
export function spawnAndWaitSync<T extends LeafCommandOptions>(command: string|URL, args: string[], options?: Omit<T, "args">): LeafCommandOutput<"output", T>;