# Fly Leaf
> _Grief is the price we may pay. With flying leaves, sparks, thorns and ember, we may not have to._

> **Warning**
>
> _Fly Leaf_ is not yet ready for prime time. Once its completion reaches a certain milestone, it will become an independent project just like _Rochelle_ and _Seamstress_. Check relevant information before proceeding to incorporate.

🦕 Continuing Deno's web-first APIs without requiring Deno.

This is a best-effort compatibility layer making the global Deno APIs available on multiple runtimes, as well as enforcing a subset of commonly expected web conventions (W3C, WHATWG, WinterTC) onto runtimes that may not conform to such. As the successor of _WingBlade_, even if Deno and all of its successors vanish, this library can make Deno's legacy far outliving originals.

Fly Leaf makes all runtimes report as `Deno 2.9.7`, which is the current compatibility target. If relevant runtime features are provided, unstable Deno features will also be provided without a need for the `--unstable` flag, as that approach isn't feasible on alternative runtimes at all. API documentation **not** yet available on [JSR](https://jsr.io/@ltgc/fly-leaf).

Like the project and want to support it? Learn how in the parent project Octavia ([Codeberg](https://codeberg.org/ltgc/octavia/), [GitHub](https://github.com/ltgcgo/octavia/))!

## Quick Start
Vendoring is the current recommended approach for loading Fly Leaf that sidesteps runtime feature support altogether. All examples below assume the library is vendored under `./libs/fly-leaf@ltgcgo/`.

### Conformance without shims
If you're sure a crashing component is intended for a web-compliant environment without requiring any Deno API, then you can choose to use a simple clean-up script.

- Node.js: `node --import ./libs/fly-leaf@ltgcgo/cleanUp.mjs ...`
- Bun: `bun run --preload ./libs/fly-leaf@ltgcgo/cleanUp.mjs ...`

### Deno globals
If a crashing component expect Deno globals, you can use the Fly Leaf loader. If provided, you can use the `bell ...` (Belladonna) helper instead.

- Node.js: `node --import ./libs/fly-leaf@ltgcgo/loader.mjs ...`
- Bun: `bun run --preload ./libs/fly-leaf@ltgcgo/loader.mjs ...`

### Force import
To make sure Fly Leaf remains available regardless of runtime, likely for debug reasons, you can import Fly Leaf as a whole in your project, or import the required APIs granularly. Apart from vendoring, you can import via direct HTTP(S) imports, import maps, or JSR, whichever is available and convenient.

```js
import * as Leaf from "./libs/fly-leaf@ltgcgo/index.mjs";
```

## Support
### Runtimes
- **Bun**: Planned.
- **Deno**: No-op for the loader.
- **Ende**: A single property assignment for the loader.
- **Javy**: Investigating.
- **Node.js**: Planned.
- **Porffor**: Investigating. Blocked by a lack of documentation.
- **Txiki.js**: Investigating.

### Out-of-scope features
- **Bundling** (`Deno.bundle`). Use an external bundler like ESBuild, tdewolff Minify or SWC, some of which can be directly used on runtimes supporting WebAssembly.
- **HTTP imports**. Unlike `require()` in CommonJS, ESM imports cannot be intercepted at all by solutions like Fly Leaf, as such it is solely up to the runtime to support HTTP imports. If the runtime does not support HTTP imports, you'll have to choose among loading bundles via importer ponyfills, vendoring, or mirroring.
- **KV Store** (`Deno.openKv`). Use the storage APIs or external databases.
- **Node.js-API Native Addon**. Use FFI instead.