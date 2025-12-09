# Octavia MIDI Library - Security Vulnerability Test Vectors

This document contains various attack vectors and test cases to validate the security of the Octavia MIDI library. These are designed to help identify potential vulnerabilities before they can be exploited.

## 1. SysEx Message Processing Attacks

### 1.1 Buffer Overflow via Excessive SysEx Length

**Attack Description:** Send a SysEx message with an extremely large length value that could cause buffer overflow during processing.

**Test Case 1: Oversized SysEx Data**
```javascript
// SysEx start (0xF0), manufacturer ID, large data block, SysEx end (0xF7)
const attackVector1 = new Uint8Array([
    0xF0, 0x43, 0x10, 0x4C, 0x00, 0x00, 0x7E, 0x00,
    ...new Array(65536).fill(0x7F), // Excessive data
    0xF7
]);
```

**Test Case 2: Missing SysEx Terminator**
```javascript
// SysEx without proper termination could cause unbounded reads
const attackVector2 = new Uint8Array([
    0xF0, 0x43, 0x10, 0x4C, 0x00, 0x00, 0x7E, 0x00,
    ...new Array(1000).fill(0x7F)
    // Missing 0xF7 terminator
]);
```

**Test Case 3: Nested SysEx Messages**
```javascript
// Attempting to nest SysEx messages
const attackVector3 = new Uint8Array([
    0xF0, 0x43, 0x10, 0x4C,
    0xF0, 0x41, 0x10, // Another SysEx start inside
    0x00, 0x00, 0x7E, 0x00,
    0xF7, 0xF7
]);
```

### 1.2 Malformed GS/XG/GM SysEx Exploits

**Test Case 4: GS Reset with Invalid Checksum**
```javascript
// Roland GS reset with intentionally wrong checksum
const attackVector4 = new Uint8Array([
    0xF0, 0x41, 0x10, 0x42, 0x12, // GS header
    0x40, 0x00, 0x7F, 0x00, 0x41, // Address + data + WRONG checksum
    0xF7
]);
```

**Test Case 5: XG Mode Change Flood**
```javascript
// Rapidly switching between XG modes to cause state corruption
const attackVector5 = [];
for (let i = 0; i < 1000; i++) {
    attackVector5.push(...[
        0xF0, 0x43, 0x10, 0x4C, 0x00, 0x00, 0x7E, 0x00, 0xF7, // XG reset
        0xF0, 0x41, 0x10, 0x42, 0x12, 0x40, 0x00, 0x7F, 0x00, 0x41, 0xF7 // GS reset
    ]);
}
```

**Test Case 6: Out-of-Range Bank MSB/LSB**
```javascript
// XG system with out-of-range bank values
const attackVector6 = new Uint8Array([
    0xF0, 0x43, 0x10, 0x4C, // XG header
    0x08, 0x00, 0xFF, 0xFF, // MSB/LSB at maximum values
    0x00, 0xF7
]);
```

## 2. MIDI File Parsing Attacks

### 2.1 Variable Length Value (VLV) Integer Overflow

**Test Case 7: Maximum VLV Value**
```javascript
// VLV encoding with maximum possible value (could overflow)
const attackVector7 = new Uint8Array([
    0xFF, 0xFF, 0xFF, 0x7F // Maximum 4-byte VLV
]);
```

**Test Case 8: Infinite VLV Loop**
```javascript
// VLV with continuation bits that never end
const attackVector8 = new Uint8Array([
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
    // All bytes have continuation bit set
]);
```

### 2.2 Malformed MIDI Track Chunks

**Test Case 9: Negative Track Length**
```javascript
// MIDI file with negative/overflow track length
const attackVector9 = new Uint8Array([
    0x4D, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // Header length
    0x00, 0x01, // Format 1
    0x00, 0x02, // 2 tracks
    0x01, 0xE0, // Division
    0x4D, 0x54, 0x72, 0x6B, // "MTrk"
    0xFF, 0xFF, 0xFF, 0xFF  // Negative/huge track length
]);
```

**Test Case 10: Track with No End-of-Track Meta Event**
```javascript
// Track without proper FF 2F 00 termination
const attackVector10 = new Uint8Array([
    0x4D, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06,
    0x00, 0x00, 0x00, 0x01, 0x01, 0xE0,
    0x4D, 0x54, 0x72, 0x6B,
    0x00, 0x00, 0x00, 0x10, // Track length
    0x00, 0x90, 0x3C, 0x64, // Note on
    0x00, 0x80, 0x3C, 0x00  // Note off (but no end-of-track)
]);
```

## 3. State Management Attacks

### 3.1 Memory Exhaustion via Voice/Bank Loading

**Test Case 11: Excessive Voice Bank Loads**
```javascript
// Load thousands of custom voice banks to exhaust memory
const attackVector11 = [];
for (let i = 0; i < 10000; i++) {
    attackVector11.push(...[
        0xF0, 0x43, 0x10, 0x4C, 0x08, i & 0x7F, (i >> 7) & 0x7F,
        ...new Array(100).fill(0x40),
        0xF7
    ]);
}
```

**Test Case 12: Rapid Channel Mode Switching**
```javascript
// Rapidly switch channel between melodic/drum modes
const attackVector12 = [];
for (let ch = 0; ch < 16; ch++) {
    for (let i = 0; i < 1000; i++) {
        attackVector12.push(...[
            0xB0 + ch, 0x00, 0x00, // Bank MSB = 0 (melodic)
            0xB0 + ch, 0x00, 0x78  // Bank MSB = 120 (drums)
        ]);
    }
}
```

### 3.2 Invalid State Transitions

**Test Case 13: Channel Receive from Invalid Channel**
```javascript
// NS5R: Set channel to receive from out-of-range channel
const attackVector13 = new Uint8Array([
    0xF0, 0x42, 0x30, 0x01, 0x00, 
    0xFF, // Invalid receive channel (>15)
    0xF7
]);
```

**Test Case 14: RPN/NRPN Race Condition**
```javascript
// Interleave RPN and NRPN without proper data entry
const attackVector14 = new Uint8Array([
    0xB0, 0x65, 0x00, // RPN MSB
    0xB0, 0x63, 0x01, // NRPN LSB (mixed!)
    0xB0, 0x64, 0x00, // RPN LSB
    0xB0, 0x62, 0x02, // NRPN MSB (mixed!)
    0xB0, 0x06, 0x40  // Data entry (ambiguous target)
]);
```

## 4. Effect Processing Attacks

### 4.1 Invalid Effect Type Selection

**Test Case 15: Out-of-Range Effect Type**
```javascript
// XG effect type beyond valid range
const attackVector15 = new Uint8Array([
    0xF0, 0x43, 0x10, 0x4C, 0x02, 0x01, 0x00,
    0xFF, // Invalid effect type
    0xF7
]);
```

**Test Case 16: Effect Parameter Type Confusion**
```javascript
// GS: Set effect parameters for non-existent effect
const attackVector16 = new Uint8Array([
    0xF0, 0x41, 0x10, 0x42, 0x12,
    0x40, 0x01, 0x30, // Effect address
    0x7F, // Max value on all params
    0x7F, 0x7F, 0x7F, 0x7F,
    0x00, 0xF7
]);
```

## 5. Display/Screen Buffer Attacks

### 5.1 Screen Buffer Overrun

**Test Case 17: SC-8850 Partial Screen Dump Overflow**
```javascript
// SC-8850 screen dump with out-of-bounds offset
const attackVector17 = new Uint8Array([
    0xF0, 0x41, 0x10, 0x45, 0x12,
    0x50, 0x00, 0xFF, 0xFF, // Bundle 255, offset 255 (OOB)
    ...new Array(200).fill(0x7F),
    0xF7
]);
```

**Test Case 18: Letter Display Injection**
```javascript
// Attempt to inject control characters into display
const attackVector18 = new Uint8Array([
    0xF0, 0x42, 0x30, 0x08, 0x00, 0x00,
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, // Control chars
    0x1B, 0x5B, 0x32, 0x4A, // ANSI escape sequence
    0xF7
]);
```

## 6. Checksum Bypass Attacks

### 6.1 Roland Checksum Manipulation

**Test Case 19: GS Checksum Collision**
```javascript
// Find values that produce same checksum
function gsChecksum(data) {
    let sum = 0;
    data.forEach(b => { sum += b; sum &= 127; });
    return (~sum + 1) & 127;
}

// Craft messages with same checksum but different data
const attackVector19a = new Uint8Array([
    0xF0, 0x41, 0x10, 0x42, 0x12,
    0x40, 0x00, 0x00, 0x00, // Legit data
    gsChecksum([0x40, 0x00, 0x00, 0x00]),
    0xF7
]);

const attackVector19b = new Uint8Array([
    0xF0, 0x41, 0x10, 0x42, 0x12,
    0x40, 0x00, 0x00, 0x7F, // Different data, same checksum
    gsChecksum([0x40, 0x00, 0x00, 0x7F]),
    0xF7
]);
```

### 6.2 KORG Packing Exploits

**Test Case 20: Korg 7-bit Packing Overflow**
```javascript
// Malformed KORG packed data
const attackVector20 = new Uint8Array([
    0xF0, 0x42, 0x30, 0x76, 0x00,
    0xFF, // Overlay mask with invalid bits
    0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F,
    0xF7
]);
```

## 7. Resource Exhaustion Attacks

### 7.1 Polyphony Flooding

**Test Case 21: Maximum Voice Allocation**
```javascript
// Attempt to allocate all 512 voices simultaneously
const attackVector21 = [];
for (let ch = 0; ch < 16; ch++) {
    for (let note = 0; note < 128; note++) {
        attackVector21.push(0x90 + ch, note, 0x7F); // Note on
    }
}
```

**Test Case 22: Continuous Pitch Bend Flood**
```javascript
// Flood pitch bend changes to cause CPU exhaustion
const attackVector22 = [];
for (let i = 0; i < 100000; i++) {
    attackVector22.push(
        0xE0, i & 0x7F, (i >> 7) & 0x7F
    );
}
```

### 7.2 Event Queue Overflow

**Test Case 23: Delta Time Zero Flood**
```javascript
// MIDI file with thousands of events at deltaTime 0
const events = [];
for (let i = 0; i < 50000; i++) {
    events.push(
        0x00, // Delta time = 0
        0x90, 0x3C, 0x40 // Note on
    );
}
```

## 8. Encoding/Decoding Attacks

### 8.1 ASCII64 Decoder Exploit

**Test Case 24: Invalid ASCII64 Characters**
```javascript
// X5D voice name with invalid ASCII64 encoding
const attackVector24 = new Uint8Array([
    0xF0, 0x36, 0x41,
    0xFF, 0xFF, 0xFF, 0xFF, // Invalid ASCII64
    0xF7
]);
```

### 8.2 Text Encoding Confusion

**Test Case 25: Multi-Encoding Attack**
```javascript
// Send text in multiple encodings to trigger decoder fallback issues
const attackVector25 = new Uint8Array([
    0xF0, 0x41, 0x10, 0x45, 0x12, 0x40, 0x01, 0x00,
    0xFF, 0xFE, // UTF-16 BOM
    0xC0, 0x80, // Invalid UTF-8
    0x80, 0x81, // Invalid ISO-8859-15
    0xF7
]);
```

## 9. Type Confusion Attacks

### 9.1 Drum/Melodic Mode Confusion

**Test Case 26: Simultaneous Drum and Melodic Messages**
```javascript
// Send drum and melodic messages to same channel simultaneously
const attackVector26 = new Uint8Array([
    0xB0, 0x00, 0x00, // Bank MSB = 0 (melodic)
    0x99, 0x24, 0x7F, // Drum note (channel 10)
    0xB0, 0x00, 0x78, // Bank MSB = 120 (drums)
    0x90, 0x3C, 0x7F  // Melodic note (channel 1)
]);
```

**Test Case 27: Bank/Program Race Condition**
```javascript
// Rapidly alternate bank and program changes
const attackVector27 = [];
for (let i = 0; i < 1000; i++) {
    attackVector27.push(
        0xB0, 0x00, i & 0x7F, // Bank MSB
        0xC0, (i >> 1) & 0x7F, // Program
        0xB0, 0x20, (i >> 2) & 0x7F // Bank LSB
    );
}
```

## 10. Multi-Mode/Bulk Dump Attacks

### 10.1 Mode Mismatch Exploits

**Test Case 28: Cross-Mode Contamination**
```javascript
// Send XG dump while in GS mode
const attackVector28 = new Uint8Array([
    0xF0, 0x41, 0x10, 0x42, 0x12, 0x40, 0x00, 0x7F, 0x00, 0x41, 0xF7, // GS reset
    0xF0, 0x43, 0x10, 0x4C, 0x08, 0x00, 0x00, // XG bulk dump header
    ...new Array(1000).fill(0x40),
    0xF7
]);
```

**Test Case 29: Incomplete Bulk Dump**
```javascript
// Start bulk dump but never finish
const attackVector29 = new Uint8Array([
    0xF0, 0x64, 0x0E, 0x00, // CS6x bulk dump start
    ...new Array(500).fill(0x40)
    // Missing dump end marker
]);
```

### 10.2 Checksum Bypass in Dumps

**Test Case 30: NS5R Multi Dump with Bad Checksum**
```javascript
// NS5R multi dump with intentionally wrong checksum
const attackVector30 = new Uint8Array([
    0xF0, 0x42, 0x30, 0x35,
    ...new Array(100).fill(0x40),
    0x00, // Wrong checksum (should be calculated)
    0xF7
]);
```

## 11. Integer Overflow/Underflow

### 11.1 Pitch Calculation Overflow

**Test Case 31: Extreme Pitch Bend Range**
```javascript
// Set pitch bend range to maximum
const attackVector31 = new Uint8Array([
    0xB0, 0x65, 0x00, // RPN MSB
    0xB0, 0x64, 0x00, // RPN LSB (pitch bend range)
    0xB0, 0x06, 0x7F, // Data entry MSB = 127 semitones
    0xB0, 0x26, 0x7F, // Data entry LSB = max cents
    0xE0, 0x7F, 0x7F  // Maximum pitch bend up
]);
```

**Test Case 32: Fine Tune Accumulation**
```javascript
// Accumulate fine tune adjustments to cause overflow
const attackVector32 = [];
for (let i = 0; i < 1000; i++) {
    attackVector32.push(...[
        0xF0, 0x43, 0x10, 0x4C, 0x08, 0x00, 0x03,
        0x7F, 0x7F, // Maximum positive fine tune
        0xF7
    ]);
}
```

## 12. Path Traversal (if file loading exists)

### 12.1 Bank File Path Injection

**Test Case 33: Relative Path in Bank Load** (if applicable)
```javascript
// If the library loads external bank files
const attackVector33 = "../../../etc/passwd";
const attackVector34 = "..\\..\\..\\windows\\system32\\config\\sam";
```

## Testing Methodology

For each attack vector:

1. **Setup**: Initialize the Octavia state tracker
2. **Execute**: Send the attack vector through the MIDI processing pipeline
3. **Monitor**: Check for:
   - Uncaught exceptions
   - Memory leaks
   - Infinite loops/hangs
   - Invalid state transitions
   - Buffer overruns
   - CPU exhaustion
4. **Validate**: Ensure graceful error handling

## Example Test Runner

```javascript
async function testAttackVector(name, vector) {
    console.log(`Testing: ${name}`);
    
    try {
        const octavia = new OctaviaDevice();
        
        // Monitor resource usage
        const startTime = Date.now();
        const startMem = performance.memory?.usedJSHeapSize || 0;
        
        // Send attack vector
        if (vector instanceof Uint8Array) {
            octavia.send(vector);
        } else if (Array.isArray(vector)) {
            vector.forEach(byte => octavia.send([byte]));
        }
        
        // Check for hangs
        const elapsed = Date.now() - startTime;
        if (elapsed > 5000) {
            console.warn(`⚠️  ${name}: Took ${elapsed}ms (possible DoS)`);
        }
        
        // Check for memory leaks
        const memUsed = (performance.memory?.usedJSHeapSize || 0) - startMem;
        if (memUsed > 10 * 1024 * 1024) {
            console.warn(`⚠️  ${name}: Used ${memUsed / 1024 / 1024}MB (possible leak)`);
        }
        
        console.log(`✓ ${name}: Handled gracefully`);
        
    } catch (err) {
        console.error(`✗ ${name}: ${err.message}`);
        console.error(err.stack);
    }
}
```

## Expected Security Properties

The library should:

1. ✅ **Never crash** on malformed input
2. ✅ **Bound all buffers** to prevent overflow
3. ✅ **Validate all lengths** before allocation
4. ✅ **Check array bounds** before access
5. ✅ **Validate checksums** where specified
6. ✅ **Limit resource usage** (voices, memory, CPU)
7. ✅ **Handle mode mismatches** gracefully
8. ✅ **Sanitize text input** for display
9. ✅ **Prevent integer overflow** in calculations
10. ✅ **Timeout infinite loops** in parsing

## Severity Classification

- **Critical**: Memory corruption, code execution, crashes
- **High**: DoS, memory exhaustion, infinite loops
- **Medium**: State corruption, incorrect behavior
- **Low**: Warning messages, graceful degradation

---

**Note**: These attack vectors are for security testing purposes only. Use responsibly to improve the library's robustness.
