# Octavia
🎻 The multi-standard MIDI state-tracking library, brought to you by Lightingale Community.

## Why Octavia over others?
* Developed with Firefox and an open Web in mind.
* Behaves like a real MIDI module, doing the heavy-lifting, letting you focus on your goal.
* Supports 8 ports, 128 channels, 512-voice polyphony maximum. More than you'll ever need.
* Built-in support of several standards, multiple plug-in cards, and tons of devices.
* Available in JS (browser and Deno) and Rust (not yet).
* No modification required to run in Tor Browser, Bromite and LibreWolf.
* Wide support of bank mapping and bitmaps via [`midi-db`](https://github.com/ltgcgo/midi-db).

## Supported standard/devices
_See the [MIDI Implementation Chart](docs/implementation.md) and [Supported SysEx instructions](docs/sysex.md)_
* Roland MT-32
* KORG AG-10
* YAMAHA TG (no SysEx)
* YAMAHA XG
* YAMAHA PLG-150AN (no SysEx)
* YAMAHA PLG-150AP (no SysEx)
* YAMAHA PLG-150DR/PC (no SysEx)
* YAMAHA PLG-150DX (no SysEx)
* YAMAHA PLG-150PF (no SysEx)
* YAMAHA PLG-150VL (no SysEx)
* YAMAHA PLG-100SG
* Roland GS
* KORG 05R/W (no SysEx)
* KORG X5DR
* KORG NS5R, KORG NX5R, KORG N1R
* KAWAI GMega
* KAWAI GMega LX
* AKAI SG01k
* CASIO GZ-50M
* ~~ALESIS NanoSynth (no SysEx)~~

## API & more
Please read the [documentation](docs/README.md).

## Examples
Please check out the `/examples/` directory.

## Credits
Please read [CREDITS.md](CREDITS.md).
