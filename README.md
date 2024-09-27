# Octavia
🎻 Event-driven multi-standard MIDI state-tracking library.

Made with ❤️ by Lightingale Community. Repository available on [Codeberg](https://codeberg.org/ltgc/octavia/) and [GitHub](https://github.com/ltgcgo/octavia/).

[![Maintainability](https://api.codeclimate.com/v1/badges/fa5aeaf4ba4c9b2d50e2/maintainability)](https://codeclimate.com/github/ltgcgo/octavia/maintainability)

> **Warning**
>
> Due to a critical bug affecting the SysEx processing flow (#55), Octavia is planned to have a major rewrite. The rewrite may happen at any time once version 0.5.2 is fully released.
>
> **If you're accessing the online version, it is advised to [use the stable branch instead](https://gh.ltgc.cc/octavia-stable/) in case of a massive break.** If you can see the address bar already at `/octavia-stable/` or you're running a local development build, ignore the warning.

> **Warning**
>
> Octavia may work on Node.js, but support for it is never intended. Apart from browsers, only [Deno](https://deno.land/) is supported, while support for [Javy](https://github.com/bytecodealliance/javy) and [Txiki.js](https://github.com/saghul/txiki.js) are planned. There is no plan to ever support runtimes that offers non-ES compliance with Node.js ecosystem, like Node.js or Bun, and issues raised from those runtimes will be ignored, unless reproducible from other runtimes as well.
>
> Octavia is only ever published to [Deno Deploy](https://deno.land/x/octavia_deno) and [JSR](https://jsr.io/@ltgc/octavia). If you see Octavia published to other registries, report those fake packages immediately as they may contain malware.

## What is Octavia?
The current MIDI landscape is a dumpster fire, at least in the FOSS world. Only proprietary software solutions respect existing MIDI standards, while the FOSS ecosystem largely ignores or even violates the conventions, with TiMidity as the single exception. Octavia, born out of being fed up by the existing antics exhibited by existing FOSS solutions, aims to reach full compliance with existing MIDI standards (MT-32, GM, XG, GS, GM2 and etc.), while exposing simple yet powerful interfaces for developers to build upon.

With Octavia, no longer will you worry about standard compliance. Just focus on building what's important, be it visualizers, state browsers, event routers or even realtime event translators, Octavia's got your back. Feel free to test Octavia's capabilities with all available demos.

## Why Octavia over others?
* Free, libre and open-source, under GNU LGPL v3.0.
* Developed with Firefox and an open Web in mind.
* Compliant to existing standards.
* Behaves like a real MIDI module, doing most of the heavy-lifting for you.
* Supports 8 ports, 128 channels, 512-voice polyphony maximum. More than you'll ever need.
* Built-in support for multiple plug-in cards and tons of other devices.
* Emits warnings when MIDI programming errors are spotted, reducing chances of faulty programming.
* Available in JS (browser and Deno).
* No modification required to run in hardened forks of browsers, like Tor Browser, Cromite and LibreWolf.
* Wide support of bank mapping and bitmaps via [`midi-db`](https://github.com/ltgcgo/midi-db).

## Supported targets
Octavia offers support to a wide range of targets, most of them being either GM-compliant or having strong historical importance. Read the [support page](https://kb.ltgc.cc/octavia/support/target.html) for more information.

To have a general idea of how MIDI is implemented, refer to the [MIDI Implementation Chart](https://kb.ltgc.cc/octavia/support/implementation.html) and [Supported SysEx instructions](https://kb.ltgc.cc/octavia/support/sysex.html).

## Dev talks
We've been hosting places to handle development discussions! If you don't have a GitHub account, or just prefer to report bugs or give suggestions in a more casual way, feel free to chat with us with links below!

* Fediverse (Mastodon): [@lightingale@fosstodon.org](https://fosstodon.org/@lightingale)
* Telegram channel: [@ltgc_t](https://t.me/s/ltgc_t)
* Telegram group chat: [Click to join](https://t.me/+0I30mcOPTSQ0ZGIx)

## Credits
Please read [CREDITS.md](CREDITS.md).

## API & more
Please read the [documentation](https://kb.ltgc.cc/octavia/).

## Examples
Please check out the `/examples/` directory.

## Contribute
You can help with Octavia's development, by doing any of the following, or more...
* Test Octavia, whether under production environment or not.
* Write anything utilizing Octavia's API.
* Report any bugs you find.
* Submit feature requests.
* Participate in programming (read the docs for further info).
* Reward the developers some donation.
* Spread the word about Octavia.

## Stargazers over time
[![Stargazers over time](https://starchart.cc/ltgcgo/octavia.svg?variant=adaptive)](https://starchart.cc/ltgcgo/octavia)
