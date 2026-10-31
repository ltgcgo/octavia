# Octavia
Even if the JavaScript runtime itself doesn't support the Web MIDI API natively, that should not be the reason it cannot have support sequenced music. **Octavia** is an evolving toolchain for sequenced music slowly developed for years, with browsers and **Deno** as its first-class targets, released as web-compliant ESM. **No LLM-generated code is involved**.

Give its [online demos](https://gh.ltgc.cc/octavia/test/) a try! If you like the project, don't hesitate to star it on [Codeberg](https://codeberg.org/ltgc/octavia/) or [GitHub](https://github.com/ltgcgo/octavia).

As of today, feature highlights include:
- [Octavia MICC](https://jsr.io/@ltgc/octavia/doc/micc/~/MICC): The file parsing, serialisation, and conversion component.
  - WHATWG Stream-native, asynchronous by nature. Peak memory consumption, minimised.
  - Low-level access by default, but parsed info is also available via opt-in. No need to choose sides.
  - Stringent validation. If a file is malformed, it should not fail silently.
  - Low-level access to various vendor extensions. Not just regular `MThd` and `MTrk`, get Yamaha XF chunks and MUSEQ layouts as well!
  - No need to rewrite your libraries just yet. Up-to-date, validated and more capable shims for [the abandoned Colxi parser](https://jsr.io/@ltgc/octavia/doc/miccCompat/~/ColxiMIDIParser) are available.
- [Octavia Lyre](https://jsr.io/@ltgc/octavia@0.0.11-pre.1+b.3/doc/state/~/OctaviaDevice): The 2nd-gen thin emulator, tracking the state of an idealised synth _with no sound_.
  - Full MIDI 1.0 support, with [wide MIDI standards support coverage](https://kb.ltgc.cc/octavia/impl/mode.html). Besides the well known MT-32, GM, GM2, XG (Yamaha MU2000EX) and GS (Roland SC-8850), Octavia also supports plugin boards like PLG-VL (Sondius XG), and lesser known de-facto standards like X5, NS5R, SD, PA and more.
  - Some MIDI event programming errors are common. Don't let them sneak past you, let Octavia Lyre spot them directly.
  - Not just 16 MIDI 1.0 parts, but full 16 ports, with 256 parts and 768 max polyphony. Multi-port or even multi-device compositions are not a problem.
  - Got SysEx-based firmware updates, but want to check if the firmware image is full? No problem, extraction support for MU (MU50-2000EX), SC-8850 and QY100 built-in!

-# Why "sequenced music" instead of "MIDI"? Octavia is also developing support for tracker music modules, not just MIDI.
-# SoundFonts are not supported. Custom sound banks for several physical synths are supported natively.