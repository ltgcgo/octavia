# Targets
## Supported targets
### General support table
The following list of targets have their support by Octavia status presented in a table. A target can be a **m**odel, a **p**lugin board, a **l**ineup, or a **s**tandard.

A supported standard may also have a list of specific target models listed.

For specific SysEx support range, refer to [Supported SysEx Instructions](./sysex.md);

| Vendor | Target    | Type | Bank | SysEx |
| ------ | --------- | ---- | ---- | ----- |
| MMA    | GM        | S    | ✓    | ✓     |
| MMA    | GM2       | S    | ✓    | ✓     |
| Roland | MT-32     | S    | ✓    | ✓     |
| Roland | GS        | S    | ✓    | ✓     |
| YAMAHA | TG        | L    | ✓    | ✓     |
| YAMAHA | XG¹       | S    | ✓    | ✓     |
| YAMAHA | PLG-150AN | P    | ✓    | ✕     |
| YAMAHA | PLG-150AP | P    | ✓    | ✕     |
| YAMAHA | PLG-150DR | P    | ✓    | ✕     |
| YAMAHA | PLG-150DX | P    | ✓    | ✕     |
| YAMAHA | PLG-150PC | P    | ✓    | ✕     |
| YAMAHA | PLG-150PF | P    | ✓    | ✕     |
| YAMAHA | PLG-150VL | P    | ✓    | ✓     |
| YAMAHA | PLG-100SG | P    | ✓    | ✓     |
| KORG   | AG-10     | M    | ✓    | ✓     |
| KORG   | 05R/W     | L    | ✓    | ✓     |
| KORG   | X5DR      | L    | ✓    | ✓     |
| KORG   | NS5R/NX5R | L    | ✓    | ✓     |
| KAWAI  | GMega     | L    | ✓    | ✓     |
| KAWAI  | GMega LX  | M    | ✓    | ✓     |
| AKAI   | SG01k     | M    | ✓    | ✓     |
| CASIO  | GZ-50M    | M    | ✓    | ✓     |
| ALESIS | NanoSynth | M    | ✕    | ✕     |

1. Octavia implements XG level 3.0 or later, and XG version 2.0 or later.

### Specific targets
#### Roland MT-32
| Target  | Type | Status |
| ------- | ---- | ------ |
| MT-32   | M    | ✓      |
| MT-100  | M    | -      |
| CM-32L  | M    | ✓      |
| CM-32LN | M    | -      |
| CM-64   | M    | -      |
| CM-500  | M    | -      |
| LAPC-I  | M    | -      |
| LAPC-N  | M    | -      |
| RA-50   | M    | -      |
| E-20    | M    | -      |

#### Roland GS
| Target    | Type | Status |
| --------- | ---- | ------ |
| CM-300    | M    | ✓      |
| SC-55     | L    | ✓      |
| SC-88     | L    | ✓      |
| SC-88 Pro | L    | ✓      |
| SC-8850   | L    | ✓      |
| SD-20     | M    | -      |
| SD-35     | M    | -      |
| SD-50     | M    | -      |
| SD-80     | M    | -      |
| SD-90     | M    | -      |
| SK-50     | L    | -      |

#### Yamaha TG
| Target | Type | Status |
| ------ | ---- | ------ |
| TG55   | M    | -      |
| TG33   | M    | -      |
| TG77   | M    | -      |
| TG100  | M    | -      |
| TG500  | M    | -      |
| TG300  | M    | ✓      |

#### Yamaha XG
| Target      | Type | Status |
| ----------- | ---- | ------ |
| DBXG50      | M    | ✓      |
| DBXG51      | M    | ✓      |
| DBXG60      | M    | -      |
| MU5         | M    | ✓      |
| MU80        | M    | ✓      |
| MU50        | M    | ✓      |
| MU90        | L    | ✓      |
| MU10        | M    | ✓      |
| MU100       | L    | ✓      |
| MU15        | M    | ✓      |
| MU128       | L    | ✓      |
| MU1000      | L    | ✓      |
| MU2000      | L    | ✓      |
| MU500       | M    | ✓      |
| QY700       | M    | ✓      |
| QY70        | M    | ✓      |
| QY100       | M    | ✓      |
| SW60XG      | M    | -      |
| SW1000XG    | M    | -      |
| S-YXG50     | M    | ✓      |
| S-YXG70     | M    | ✓      |
| S-YXG100    | M    | ✓      |
| S-YXG2006LE | M    | ✓      |
