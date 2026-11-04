"use strict";

// Barebones verification on runtimes without `--preload` or `--import`.

await import("../loader/index.mjs");
await import("./version.mjs");