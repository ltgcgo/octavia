// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

const Deno = self.Deno ?? self.Ende;

export const ChildProcess = Deno.ChildProcess;
export const Command = Deno.Command;

export const kill = Deno.kill;
export const spawn = Deno.spawn;
export const spawnAndWait = Deno.spawnAndWait;
export const spawnAndWaitSync = Deno.spawnAndWaitSync;

// Polyfill not yet implemented.
export const run = Deno.run ?? function run() {};