# Audio Effects
## Audio effects
Octavia supports tracking a range of audio effects applied on supported targets. For maximum compatibility, Octavia has seven available slots reserved for effect sends, which correspond to reverb, chorus, variation and four insertions in order.

Each slot isn't dedicated to what that slot is primarily used for, but rather allocated and controlled by the CC registers they are assigned to by default (cc91, cc93, cc94, cc16-19). For example, the variation slot (cc94) is taken away by delay effects when in GS mode, while the reverb and chorus slot could be taken away by any effect desired in X5DR or NS5R mode.

Due to varied setups, each effect also isn't just bound to the CC registers they are assigned to. They can also listen on other CC registers, or even multiple if they wish.

## Comparison table
### Singular effect
#### Reverb
| Yamaha XG | GS Reverb | GS Insertion | KORG AI² |
| --------- | --------- | ------------ | -------- |
| Hall (1, 2, M, L) | Hall (1, 2) | Hall (1, 2) | Hall (normal, <br>ensemble, concert) |
| Room (1-3, S, M, L) | Room (1-3) | Room (1, 2) | Room (normal, <br>large) |
| Stage (1, 2) | | Stage (1, 2) | Stage |
| Plate (XG, GM) | Plate | | Plate (wet, dry) |
| Delay (LCR, LR) | Delay | Delay (stereo) | Delay (stereo) |
| Echo | | | |
| Cross Delay | Panning Delay | Delay (3-tap, 4-tap, <br>mod, 3D, trem.c.) | Delay (cross, dual, tap 1-3) |
| Early Reflection <br>(1, 2) | | | Early Reflection <br>(1-3) |
| Gate (forward, reverse) | | Gate (forward, reverse, <br>sweep 1-2) | |
| White Room | | | |
| Tunnel | | | |
| Canyon | | | |
| Basement | | | |
| Karaoke (1, 2, 3) | | | |
| | | | Spring |
#### Chorus
| Yamaha XG | GS Chorus | GS Insertion | KORG AI² |
| --------- | --------- | ------------ | -------- |
#### Delay
| Yamaha XG | GS Delay | GS Insertion | KORG AI² |
| --------- | --------- | ------------ | -------- |
#### Miscellaneous
| Yamaha XG | GS Insertion | KORG AI² |
| --------- | ------------ | -------- |
### Dual effect
#### Mutual
* X: Yamaha XG
* G: Roland GS
* A: KORG AI²

|     | Rev | Cho | Ovr | Dst | Enh | Fln | Dly | Rot | Phs | Amp | Cmp | AWa |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Rev |     |     |     |     |     |     | A   |     |     |     |     |     |
| Cho |     |     | G   | G   | G   | G   | GA  |     |     |     |     |     |
| Ovr |     | G   | G   |     |     | G   | XGA | XG  | G   |     |     | XG  |
| Dst |     | G   |     |     |     | G   | XGA | X   |     |     | X   | X   |
| Enh |     | G   |     |     |     | G   | G   |     |     |     |     |     |
| Fln |     | G   | G   | G   | G   |     | GA  |     |     |     |     |     |
| Dly | A   | GA  | XGA | XGA | G   | GA  | A   | A   | A   |     |     |     |
| Rot |     |     | XG  | X   |     |     | A   | X   |     | X   |     |     |
| Phs |     |     | G   |     |     |     | A   |     |     |     |     |     |
| Amp |     |     |     |     |     |     |     | X   |     |     |     |     |
| Cmp |     |     |     | X   |     |     |     |     |     |     |     |     |
| AWa |     |     | XG  | X   |     |     |     |     |     |     |     |     |
