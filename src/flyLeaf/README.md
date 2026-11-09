# Fly Leaf
> _Grief is the price we may pay. With flying leaves, sparks, thorns and ember, we may not have to._

> **Warning**
>
> _Fly Leaf_ is not yet ready for prime time. Once its completion reaches a certain milestone, it will become an independent project just like _Rochelle_ and _Seamstress_. Check relevant information before proceeding to incorporate.

🦕 Continuing Deno's web-first APIs without requiring Deno.

This is a best-effort compatibility layer making the global Deno APIs available on multiple runtimes, as well as enforcing a subset of commonly expected web conventions (W3C, WHATWG, WinterTC) onto runtimes that may not conform to such. As the successor of _WingBlade_, even if Deno and all of its successors vanish, this library can make Deno's legacy far outliving originals. _Fly Leaf_ also makes runtime switching trivial, especially when waiting for security exploits to be patched on the primary runtime.

_Fly Leaf_ makes all runtimes report as `Deno 2.9.8`, which is the current compatibility target. If relevant runtime features are provided, unstable Deno features will also be provided without a need for the `--unstable` flag, as that approach isn't feasible on alternative runtimes at all. API documentation **not** yet available on [JSR](https://jsr.io/@ltgc/fly-leaf).

Like the project and want to support it? Learn how in the parent project Octavia ([Codeberg](https://codeberg.org/ltgc/octavia/), [GitHub](https://github.com/ltgcgo/octavia/))!

## Quick Start
Vendoring is the current recommended approach for loading _Fly Leaf_ that sidesteps runtime feature support altogether. All examples below assume the library is vendored under `./libs/fly-leaf@ltgcgo/`.

### Conformance without shims
If you're sure a crashing component is intended for a web-compliant environment without requiring any Deno API or runtime-specific API, you can choose to use the conformance script without Fly Leaf.

- Node.js: `node --import ./libs/fly-leaf@ltgcgo/vergilius.mjs ...`
- Ant: `ant --preload ./libs/fly-leaf@ltgcgo/vergilius.mjs ...`
- Bun: `bun run --preload ./libs/fly-leaf@ltgcgo/vergilius.mjs ...`

### Deno globals
The Fly Leaf loader can be used if a component expects Deno globals. If provided in releases, you can use the `bell ...` (Belladonna) helper instead.

- Node.js: `node --import ./libs/fly-leaf@ltgcgo/loader.mjs ...`
- Deno: `deno run --preload ./libs/fly-leaf@ltgcgo/loader.mjs ...`
- Ende: `ende run --preload ./libs/fly-leaf@ltgcgo/loader.mjs ...`
- Ant: `ant --preload ./libs/fly-leaf@ltgcgo/loader.mjs ...`
- Bun: `bun run --preload ./libs/fly-leaf@ltgcgo/loader.mjs ...`

All supported runtimes set `Deno.version.backend` and `Deno.version.engine`. For a list of valid values, see the [runtimes](#runtimes) section below.

Runtimes may not actually execute the loader in the context of REPL, so debug with caution.

### Force import
To make sure _Fly Leaf_ remains available regardless of runtime, likely for debug reasons, you can import _Fly Leaf_ as a whole in your project, or import the required APIs granularly. Apart from vendoring, you can import via direct HTTP(S) imports, import maps, or JSR, whichever is available and convenient.

```js
// Glob import...
import * as Leaf from "./libs/fly-leaf@ltgcgo/index.mjs";
// Or default import. (recommended)
import Leaf from "./libs/fly-leaf@ltgcgo/index.mjs";
```

## Support
#### Variants
Fly Leaf offers two separate variants of the same Deno API. Unless absolutely needed, it's generally recommended to use the async-only variant.

- [ ] Async-only: When both the synchronous and the asynchronous versions of the same API exist, subject to runtime feature availability, this Fly Leaf variant implements only the asynchronous versions. This allows Fly Leaf to support more runtimes and use more runtime-native features.
  - [ ] Bun: `BunFile` for files, `Bun.serve` for HTTP servers, and `Bun.spawn` for processes.
- [x] Full: This version offers the entire collection of in-scope Deno APIs, subject to runtime feature availability.

### Runtimes
- [**Ant**](https://antjs.org/): WIP.
  - Requires a `TextDecoder` polyfill/ponyfill. Will largely be unneeded after Ant 17, when this line will get removed.
  - Avoid inlining script preloads via importing due to race conditions, use the demonstrated proper `--preload` feature instead.
  - Ant does not support test running. Use other supported runtimes instead.
- [~~a-Shell `JSC`~~](https://github.com/holzschu/a-shell/blob/master/man/man1/jsc.1): Out of scope. Basic FS access, insufficient platform APIs.
- [Boa](https://github.com/boa-dev/boa): Investigating.
- [**Bun**](https://bun.sh/): WIP.
- [**Deno**](https://deno.land/): Supported.
- [**Ende**](https://ende.sh/): Supported.
  - `Deno.version.deno` set to the Deno version targeted by _Fly Leaf_.
- Generic browser: Async-only. Blocked by various fundamentally missing APIs, subject to runtime feature availability.
- Generic WinterTC: Async-only. Blocked by various fundamentally missing APIs, subject to runtime feature availability.
- [~~Javy~~](https://github.com/bytecodealliance/javy): Out of scope. Insufficient platform APIs.
- [Kiesel](https://kiesel.dev/): Investigating.
- [**Node.js**]: WIP.
- [**Porffor**](https://porffor.dev/): WIP.
  - Porffor does not support test running. Use other supported runtimes instead.
- [~~Steve's Den~~](https://github.com/stevefan1999-personal/den): Out of scope. Insufficient documentation, and the `den:*` import scheme is the exact thing Fly Leaf avoids, despite being older than _Ende_.
- [Txiki.js](https://txikijs.org/): Investigating.

| S | A | Runtime | `backend` | `engine` | IMM |
| - | - | ------- | --------- | -------- | --- |
| ✓ | ✓ | Ant | `Ant` | `Ant Silver` | 15.1+ |
| ✓ | ✓ | Bun | `Bun` | `JavaScriptCore` | 0.6+ |
| ✓ | ✓ | Deno | `Deno` | `V8` | 1.0+ |
| ✓ | ✓ | Ende | `Ende` | `V8` | 20261014+ |
| ✓ | ✓ | Node.js | `Node` | `V8` | 22.18+, 24.2+ |
| ✓ | ✓ | Porffor | `Porffor` | `Porffor` | alpha 20+ |

### Additional features
#### Deno
These are the features deprecated by the Deno runtime. Fly Leaf re-implements all of the ones listed below, with the remaining deprecated APIs completely absent.
- [`Deno.run()`](https://web.archive.org/web/20220629065958/https://doc.deno.land/deno/stable/~/Deno.RunOptions)

Any deprecated feature that relies on resource IDs will not be re-implemented.

#### Web
- [ ] `TextDecoder` polyfill
- [ ] `TextEncoder` polyfill
- [ ] `Uint8Array.fromBase64` polyfill (provided via Rochelle)
- [ ] `Uint8Array.fromHex` polyfill (provided via Rochelle)
- [ ] `Uint8Array.prototype.toBase64` polyfill (provided via Rochelle)
- [ ] `Uint8Array.prototype.toHex` polyfill (provided via Rochelle)

## Out-of-scope
### Deno features
- **Bundling** (`Deno.bundle`), for now. Use an external bundler like _ESBuild_, _tdewolff Minify_ or _SWC_, some of which can be directly used on runtimes supporting WebAssembly. May be reversed in the future with optional ESBuild interfacing.
- **Cloud hosting**. _Fly Leaf_ is a compatibility layer, not a hosting provider.
- **HTTP imports**. Unlike `require()` in CommonJS, ESM imports cannot be intercepted at all by solutions like _Fly Leaf_, as such it is solely up to the runtime to support HTTP imports. If the runtime does not support HTTP imports, you'll have to choose among loading bundles via importer ponyfills, vendoring, or registry mirroring.
  - This also means that _Fly Leaf_ is unable to block runtime-native imports like `node:` and `npm:`. If you want to be absolutely certain your codebase does not rely on Node.js, please use _Ende_ with or without _Fly Leaf_.
- `import.meta` polyfilling. `import.meta` need native runtime support, as _Fly Leaf_ is purely unable to modify the entire `import.meta` object.
  - `import.meta.main`: Check the `IMM` column in the runtime table. Any older version will cause projects relying on its value being truthy break (e.g. ESBuild Deno CLI).
- **Jupyter Notebook**, for now. Until the separate module is ready, please use dedicated Jupyter integration frameworks/libraries.
- **KV Store** (`Deno.openKv`), for now. Use the storage APIs or external databases. May be reversed in the future.
- **Linter** (`Deno.lint`). Use external language servers like _Deno_, _Ende_, `typescript-language-server`, `vstls` or ESLint.
- **Node.js-API Native Addon**. Use FFI or WASM instead.
- **Permissions**. Without native runtime enforcement, permissions checks are likely bypassed easily, as such _Fly Leaf_ does not attempt to perform permission gating and report everything as green-lit instead. If the non-Deno-compatible runtime does offer permission gating, _Fly Leaf_ will bridge it.
- **Sandbox**. Use proper sandboxes, like containers on `runsc`, Sysbox and Bubblewrap instead. _Fly Leaf_ is not and should not be used as a sandbox out-of-the-box. On runtimes like Ende where runtime-native globals can be fully replaced, _Fly Leaf_ can allow _Minuette_-like safer interception **after modification**.
  - `Object.entries` may be used to bypass _Fly Leaf_ restrictions.
  - `Object.getOwnPropertyDescriptor` may be used to bypass _Fly Leaf_ restrictions.
- **Telemetry**. Deno relied on Node.js compatibility to interact with OpenTelemetry via `npm:@opentelemetry`, and its own documentation telemetry APIs are incomplete.
- **TypeScript**. Fly Leaf is not a TypeScript transpiler, use runtimes with native TypeScript support, external bundlers, or TypeScript transpilers instead.