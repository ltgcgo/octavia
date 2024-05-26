# Octavia
🎻 Event-driven multi-standard MIDI state-tracking library. Working with MIDI should be simple, while faithful and professional.

Made with ❤️ by Lightingale Community.

Visit our repo on [Codeberg](https://codeberg.org/ltgc/octavia/) or [GitHub](https://github.com/ltgcgo/octavia/) for more info. You can also see the [demos in action](https://ltgcgo.github.io/octavia/test/).

Octavia may work on Node.js, but support for it is never intended. Apart from browsers, only [Deno](https://deno.land/) and [Javy](https://github.com/bytecodealliance/javy) are supported.

## Files
Only files ending in `.mjs` are meant to be used as a library. Files prefixed with `xp_` are tested to work on Windows XP (Chrome 49 and Firefox 52 ESR).

* `state.mjs`: MIDI processing core.
* `basic.mjs`: The bare minimum to get you started on writing visualizers. Requires `state.mjs`.
* `cambiare.mjs`: Batteries-included full-blown visualizer as a module.