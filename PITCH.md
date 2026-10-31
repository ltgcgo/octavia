# Octavia
No native Web MIDI API support from the JS runtime? This should not be the reason it cannot support sequenced music. As a web-compliant ESM, **Octavia** is an evolving toolchain for sequenced music slowly developed for years, with browsers and **Deno** as its first-class targets. **No LLM-generated code is involved**.

Not sure what it can be used for or its capabilities? Give its [online demos](https://gh.ltgc.cc/octavia/test/) a try! If you like it, don't hesitate to star it on [Codeberg](https://codeberg.org/ltgc/octavia/) or [GitHub](https://github.com/ltgcgo/octavia).

As of today, feature highlights include:
- [Octavia MICC](https://jsr.io/@ltgc/octavia/doc/micc/~/MICC): The file parsing, serialisation, and conversion component.
  - Asynchronous, WHATWG stream-native. Peak memory consumption, minimised.
  - Low-level by default, parsed info available via opt-in. No need to choose sides.
  - Stringent validation, no silent failure upon corruption.
  - Access to various vendor extensions. Not just regular `MThd` and `MTrk`, get Yamaha XF chunks and MUSEQ layouts as well!
  - No need to rewrite your libraries just yet. Updated and more capable shims for [Colxi's parser](https://jsr.io/@ltgc/octavia/doc/miccCompat/~/ColxiMIDIParser) are available _without_ code from originals.
- [Octavia Lyre](https://jsr.io/@ltgc/octavia/doc/state/~/OctaviaDevice): The 2nd-gen thin emulator, tracking the state of an idealised synth _with no sound_.
  - Full MIDI 1.0 support, with [wide MIDI standards support coverage](https://kb.ltgc.cc/octavia/impl/mode.html). Besides the well known MT-32, GM, GM2, XG (Yamaha MU2000EX, PSR-740) and GS (Roland SC-8850), Octavia also supports plugin boards like PLG-VL (Sondius XG), and lesser known de-facto standards like X5, NS5R, SD, PA and more.
  - Some MIDI event programming errors are common. Don't let them sneak past you, let Octavia Lyre spot them directly.
  - Not just 16 MIDI 1.0 parts. 16 ports, 256 parts and 768 max polyphony. Multi-port or even multi-device compositions are not a problem.
  - Got SysEx-based firmware updates, but want to check if the firmware image is full? No problem, extraction support for MU (MU50-2000EX), SC-8850 and QY100 built-in!

## Footnotes
> When posting to platforms like Discord with support for subtext, remove this section header and this blockquote, and replace `-` with `-#`.

- Why "sequenced music" instead of "MIDI"? Because support for tracker music modules is also being developed alongside MIDI.
- SoundFonts are not supported. Custom sound banks for several physical synths are supported natively.