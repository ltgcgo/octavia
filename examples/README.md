# Octavia Examples

This directory contains examples demonstrating how to use the Octavia MIDI library.

## GM2 Reset Example

The GM2 reset example shows how to send a General MIDI Level 2 (GM2) reset message to reset a MIDI device to its GM2 default state.

### Files

- **gm2-reset.html** - Interactive HTML example with visual demonstration
- **gm2-reset.js** - JavaScript module with reusable functions

### Quick Start

#### Using the HTML Example

1. Open `gm2-reset.html` in a web browser
2. Click the "Send GM2 Reset" button to see the message structure
3. Review the code examples and documentation

#### Using the JavaScript Module

```javascript
// Import the Octavia state module
import OctaviaState from '../dist/state.mjs';

// Import the GM2 reset functions
import { sendGM2Reset } from './examples/gm2-reset.js';

// Create a new Octavia instance
const octavia = new OctaviaState();

// Send GM2 reset
sendGM2Reset(octavia);
```

### GM2 Reset Message Structure

The GM2 reset is a Universal Non-Realtime SysEx message:

```
F0 7E 7F 09 03 F7
```

**Breakdown:**
- `F0` - SysEx start byte
- `7E` - Universal Non-Realtime message
- `7F` - Device ID (7F = all devices)
- `09` - Sub-ID #1 (General MIDI message)
- `03` - Sub-ID #2 (GM2 System On)
- `F7` - SysEx end byte

### Related Reset Messages

**GM Reset (Level 1):** `F0 7E 7F 09 01 F7`

**System Init/Turn Off:** `F0 7E 7F 09 02 F7`

### How It Works

When you send a GM2 reset message using Octavia:

1. The message is sent via `octavia.sendCmd()` with type 15 (SysEx)
2. Octavia processes the Universal Non-Realtime SysEx (0x7E)
3. The GM message handler (0x09) recognizes sub-ID 0x03 as GM2 reset
4. The device switches to GM2 mode and resets to default settings
5. Octavia logs "MIDI reset: GM2" to the console

### More Information

For more details about Octavia and MIDI standards, see:
- [Octavia Documentation](https://kb.ltgc.cc/octavia/)
- [Supported SysEx Instructions](https://kb.ltgc.cc/octavia/support/sysex.html)
- [Main Repository](https://github.com/ltgcgo/octavia/)
