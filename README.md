# Octavia
🎻 Event-driven multi-standard MIDI state-tracking library.

Made with ❤️ by Lightingale Community. Repository available on [Codeberg](https://codeberg.org/ltgc/octavia/), [GitHub](https://github.com/ltgcgo/octavia/) and [GitLab](https://gitlab.com/ltgc/oss/octavia/).

[![Maintainability](https://api.codeclimate.com/v1/badges/fa5aeaf4ba4c9b2d50e2/maintainability)](https://codeclimate.com/github/ltgcgo/octavia/maintainability)

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