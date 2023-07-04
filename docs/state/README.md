# state.mjs API
All constants and interfaces documented here are guaranteed to work, and very likely not subject to further changes.

## Constants
### MIDI modes
Octavia is compatible with a range of modes on MIDI synthesizers. A list of supported modes to their respective keys is available below.

* `?`: The default "nothing" mode. Octavia will try to detect the correct mode.
* `gm`: General MIDI mode.
* `gs`: Roland GS mode.
* `xg`: Yamaha XG mode. Compatible with TG-100 and TG-300.
* `g2`: General MIDI Level 2 mode.
* `mt32`: Roland MT-32 mode.
* `ns5r`: KORG NS5R mode. Compatible with NX5R, and has limited compatibility with KORG N1R and N5.
* `x5d`: KORG X5D(R) mode. Compatible with AG-10.
* `05rw`: KORG 05R/W and KORG X5 mode. Compatible with AG-10.
* `krs`: KORG KROSS 2 mode.
* `k11`: Kawai GMega and Kawai K11 mode.
* `sg`: Akai SG mode.

### MIDI event types
* `8`: Note off
* `9`: Note on
* `10`: Note aftertouch, a.k.a. polyphonic aftertouch
* `11`: Channel controller change
* `12`: Channel program change
* `13`: Channel aftertouch
* `14`: Channel pitch bend
* `15`: System exclusive message

### `allocated`
### `ccToPos`

## Interfaces
### `OctaviaDevice`
