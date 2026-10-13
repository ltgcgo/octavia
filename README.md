# Octavia
> **Warning**
>
> While using AI to help understand the codebase is allowed, using AI to contribute without knowledge is strictly forbidden for this project. People using AI models to contribute without understanding will be banned. Read [AGENT.md](AGENT.md) for further details.

🎻 Event-driven multi-standard MIDI tool chain. State tracking, parsing, serializing.

Made with ❤️ by Lightingale Community. Repository available on [Codeberg](https://codeberg.org/ltgc/octavia/) and [GitHub](https://github.com/ltgcgo/octavia/).

[![Maintainability](https://api.codeclimate.com/v1/badges/fa5aeaf4ba4c9b2d50e2/maintainability)](https://codeclimate.com/github/ltgcgo/octavia/maintainability).

> **Warning**
>
> Due to a critical bug affecting the SysEx interpretation flow (#55), Octavia Lyre is planned to have a major rewrite. The rewrite may happen at any time once version 0.5.2 is fully released.
>
> **If you're accessing the online version, it is advised to [use the stable branch instead](https://gh.ltgc.cc/octavia-stable/) in case of a massive break.** If you can see the address bar already at `/octavia-stable/` or you're running a local development build, ignore the warning.

> **Warning**
>
> Octavia may work on Node.js, but support for it is never first-class, since we _do not bootlick_ any single runtime. As this module is web-compliant standard ESM, to use on Node.js, a minimal web-compliant shim is required. Please check for the minimal import script from _Fly Leaf_, or the "de-Node" experiment in Octavia. Except via compatibility layers, there is no plan to ever put runtimes that offers non-ES compliance on first-class support.
>
> Apart from browsers, only [Deno](https://deno.land/) is supported, while support for [Javy](https://github.com/bytecodealliance/javy) and [Txiki.js](https://github.com/saghul/txiki.js) are planned. Octavia is only ever published to [JSR](https://jsr.io/@ltgc/octavia), with only its compatibility layers published to NPMJS to help transition off Node.js ecosystems. If you see Octavia fully published to other registries, report those fake packages immediately as they may contain malware.

## What is Octavia?
The current MIDI landscape is a dumpster fire, at least in the FOSS world. Only proprietary software solutions respect existing MIDI standards, while the FOSS ecosystem largely ignores or even violates the conventions, with TiMidity as the single exception. Octavia, born out of being fed up by the existing antics exhibited by existing FOSS solutions, aims to reach full compliance with existing MIDI standards (MT-32, GM, XG, GS, GM2 and etc.), while exposing simple yet powerful interfaces for developers to build upon.

With Octavia, no longer will you worry about either standard compliance or non-standard environment extensions. Just focus on building what's important, be it visualizers, state browsers, event routers or even realtime event translators, Octavia's got your back. Feel free to test Octavia's capabilities with all available demos.

## Why Octavia?
- Free, libre and open-source, licensed under GNU LGPL v3.0.
- Available as _web-compliant JS_ (standard ESM; browser and Deno) with TypeScript declarations.
- Beyond a capable runtime, standard ECMAScript, and web-compliance, _assumes nothing about the environment_.
- Comparatively stringent compliance of existing established standards.
- Developed with Firefox and open Web in mind, _not just bootlicking Chromium and V8_. Independent browsers like Servo and Ladybird are irregularly tested as well.
- _No modification required_ to run in hardened forks of browsers, like Tor Browser, Cromite and LibreWolf.

### Octavia Lyre
- Supports 16 ports, 256 channels, 768-voice polyphony maximum. More than you'll ever need.
- Keep your focus on building what matters, as Lyre behaves like a real MIDI module, taking over the heavy-lifting for you.
- Built-in support for multiple plug-in cards, various established standards, and tons of other devices, with instrument data backed by [Octavia Scroll](https://github.com/ltgcgo/midi-db).
- Emits warnings when MIDI programming errors are spotted, reducing chances of faulty programming.

### Octavia MICC
- Your parser and serialiser should not fight against or omit information from you, while assisting and leaving you alone whenever needed. We endured the pain for years before, now you shouldn't have to.
- You choose to either keep close to the metal or get the abstraction you need. Unlike most MIDI parser libraries, this library doesn't alienate either.
- (WIP) Relatively hands-off text decoding and port allocation. No need to bother with headaches like this when you don't want to, unlike most MIDI parser libraries.
- (WIP) Unlike most music-related parser libraries, don't get restricted by synchronous buffers, MIDI 1.0, Standard MIDI Files, or even MIDI. The world is vast, your project's coverage should be too without much headache.
- (WIP) Don't stop at merely parsing, get serialisation and conversion as well, mostly for free!

## Supported targets
Octavia offers support to a wide range of targets, most of them being either GM-compliant or having strong historical importance. Read the [support page](https://kb.ltgc.cc/octavia/support/target.html) for more information.

To have a general idea of how MIDI is implemented, refer to the [MIDI Implementation Chart](https://kb.ltgc.cc/octavia/support/implementation.html) and [Supported SysEx instructions](https://kb.ltgc.cc/octavia/support/sysex.html).

## Dev talks
We've been hosting places to handle development discussions! If you don't have a GitHub account, or just prefer to report bugs or give suggestions in a more casual way, feel free to chat with us with links below!

- Fediverse (Mastodon): [@lightingale@fosstodon.org](https://fosstodon.org/@lightingale)
- Telegram channel: [@ltgc_t](https://t.me/s/ltgc_t)
- Telegram group chat: [Click to join](https://t.me/+0I30mcOPTSQ0ZGIx)

## Credits
Please read [CREDITS.md](CREDITS.md).

## API & more
Please read the [documentation](https://kb.ltgc.cc/octavia/).

## Examples
If it exists, please check out the `/examples/` directory.

## Contribute
You can help with Octavia's development, by doing any of the following, or more...
- Test Octavia, whether under production environment or not.
- Write anything utilizing Octavia's API.
- Report any bugs you find.
- Submit feature requests.
- Participate in programming (read the docs for further info).
- Reward the developers some donation.
- Spread the word about Octavia.

## Stargazers over time
[![Stargazers over time](https://starchart.cc/ltgcgo/octavia.svg?variant=adaptive)](https://starchart.cc/ltgcgo/octavia)
