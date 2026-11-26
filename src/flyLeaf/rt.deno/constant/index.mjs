// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

const Deno = self.Deno ?? self.Ende;

export const SeekMode = Deno.SeekMode;
export const LeafSeekMode = SeekMode;

export const consoleSize = Deno.consoleSize;
export const inspect = Deno.inspect;
export const stderr = Deno.stderr;
export const stdin = Deno.stdin;
export const stdout = Deno.stdout;