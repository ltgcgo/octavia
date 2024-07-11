# Octavia
🎻 Event-driven multi-standard MIDI state-tracking library. Working with MIDI should be simple, while faithful and professional.

Made with ❤️ by Lightingale Community.

Visit our repo on [Codeberg](https://codeberg.org/ltgc/octavia/) or [GitHub](https://github.com/ltgcgo/octavia/) for more info. You can also see the [demos in action](https://ltgcgo.github.io/octavia/test/).

> **Warning**
> 
> Octavia may work on Node.js, but support for it is never intended. Apart from browsers, only [Deno](https://deno.land/) is supported, while support for [Javy](https://github.com/bytecodealliance/javy) and [Txiki.js](https://github.com/saghul/txiki.js) are planned. There is no plan to ever support runtimes that offers non-ES compliance with Node.js ecosystem, like Node.js or Bun, and issues raised from those runtimes will be ignored, unless reproducible from other runtimes as well.
> 
> Octavia is only ever published to [Deno Deploy](https://deno.land/x/octavia_deno) and [JSR](https://jsr.io/@ltgc/octavia). If you see Octavia published to other registries, report those fake packages immediately as they may contain malware.

## Files
Only files ending in `.mjs` are meant to be used as a library. Files prefixed with `xp_` are tested to work on Windows XP (Chrome 49 and Firefox 52 ESR).

* `state.mjs`: MIDI processing core.
* `basic.mjs`: The bare minimum to get you started on writing visualizers. Requires `state.mjs`.
* `cambiare.mjs`: Batteries-included full-blown visualizer as a module.
* `micc.mjs`: The streaming assembler and disassembler for standard MIDI files.