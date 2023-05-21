# SysEx Instructions
## Supported SysEx Instructions
* ✓: Supported
* -: Partially supported
* ✕: Not supported
* ?: Unknown
* (blank): N/A

### Mutual instructions
|                 | GM | GM2 | MT-32 | XG | GS | 05R/W | X5D | NS5R | GMega | GMega LX | SG-01 | GZ-50M |
| --------------- | -- | --- | ----- | -- | -- | ----- | --- | ---- | ----- | -------- | ----- | ------ |
| System reset    | ✓  | ✓   | ✓     | ✓  | ✓  |       |     |      | ✓     | ✓        | ✓     |        |
| Master setup    | ✓  | ✓   | ✓     | ✓  | ✓  |       |     | ✓    | ✓     | ✓        |       |        |
| Reverb setup    |    | ✕   |       | ✓  | ✓  |       |     |      | ✓     | ✓        | ✓     | ✓      |
| Chorus setup    |    | ✕   |       | ✓  | ✓  |       |     |      | ✓     | ✓        | ✓     | ✓      |
| Variation setup |    | ?   |       | ✓  | ✓  |       |     |      |       |          |       |        |
| Part setup      |    | ?   |       | ✓  | ✓  | ✓     | ✓   | ✓    | ✓     | ✓        |       |        |
| Equalizer       |    |     |       | ✓  | ✓  |       |     |      |       |          |       |        |
| EFX / insertion |    |     |       | -  | ✓³ |       |     | -    |       |          |       |        |
| Bitmap display¹ |    |     |       | ✓  | ✓  |       |     | ✓    |       |          |       |        |
| Text display²   |    |     | ✓     | ✓  | ✓  |       |     | ✓    |       |          |       |        |
| Drum setup      |    | ?   | ✕     | ✕  | ✕  | ✕     | ✕   | ✕    | ✕     | ✕        |       |        |

1. Support in GS is called "frame draw", and with multi-page support.
2. Called "letter display" in XG, and "text insert" in GS.
3. GS only has "delay" effect occupying the space of variation setup.

### Device-specific instructions
#### Roland MT-32
* Temporary Patch Setup
* ~~Temporary Drum Setup~~
* Temporary Timbre Setup
* Device Patch Setup
* Device Timbre Setup
* Patch Memory Write
* Timbre Memory Write
* System

#### Yamaha MU1000
* ~~A/D Part Setup~~
* ~~A/D Mono/Stereo~~
* System

#### Yamaha PLG-100SG
* ~~Master Setup~~
* ~~Part Setup~~
* PhoneSEQ Setup
* ~~Lyrics Information Setup~~

#### Yamaha PLG-150DX
* ~~Master Setup~~
* ~~Part Setup~~
* ~~DX Voice Param~~
* ~~DX Voice Additional Param~~

#### Yamaha PLG-150VL
* ~~Master Setup~~
* ~~Current Voice Parameters~~
* Part Setup

#### Roland SC-88
* Single/dual Mode

#### KORG X5D
* All Program Dump
* All Combi Dump
* Extended Multi Dump

#### KORG NS5R
* Mode Switch
* All Program Dump
* All Combi Dump
* Extended Multi Dump
