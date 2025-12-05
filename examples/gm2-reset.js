/**
 * GM2 Reset Example for Octavia
 * 
 * This example demonstrates how to send a GM2 (General MIDI Level 2) 
 * reset message using the Octavia MIDI library.
 * 
 * GM2 Reset is a Universal Non-Realtime SysEx message that resets a 
 * MIDI device to its GM2 default state.
 */

// Import the Octavia state module
// Uncomment the following line when using in a real project:
// import OctaviaState from '../dist/state.mjs';

/**
 * Sends a GM2 reset SysEx message
 * 
 * The GM2 reset message structure:
 * F0 7E 7F 09 03 F7
 * 
 * Breakdown:
 * - F0: SysEx start byte
 * - 7E: Universal Non-Realtime message
 * - 7F: Device ID (7F = all devices)
 * - 09: Sub-ID #1 (General MIDI message)
 * - 03: Sub-ID #2 (GM2 System On)
 * - F7: SysEx end byte
 * 
 * @param {Object} octavia - An instance of OctaviaState
 */
function sendGM2Reset(octavia) {
	// Create the GM2 reset SysEx message
	const gm2ResetMessage = new Uint8Array([
		0xF0, // SysEx start
		0x7E, // Universal Non-Realtime
		0x7F, // Device ID (all devices)
		0x09, // Sub-ID #1 (General MIDI)
		0x03, // Sub-ID #2 (GM2 System On)
		0xF7  // SysEx end
	]);
	
	// Send the message using sendCmd
	octavia.sendCmd({
		type: 15,  // Type 15 indicates a SysEx message
		track: 0,  // Track number (0 for default)
		data: gm2ResetMessage
	});
	
	console.log('GM2 reset sent successfully!');
	console.log('Device should now be in GM2 mode with default settings.');
}

/**
 * Sends a GM (General MIDI Level 1) reset SysEx message
 * 
 * @param {Object} octavia - An instance of OctaviaState
 */
function sendGMReset(octavia) {
	// GM Reset: F0 7E 7F 09 01 F7
	const gmResetMessage = new Uint8Array([
		0xF0, // SysEx start
		0x7E, // Universal Non-Realtime
		0x7F, // Device ID (all devices)
		0x09, // Sub-ID #1 (General MIDI)
		0x01, // Sub-ID #2 (GM System On)
		0xF7  // SysEx end
	]);
	
	octavia.sendCmd({
		type: 15,
		track: 0,
		data: gmResetMessage
	});
	
	console.log('GM reset sent successfully!');
}

/**
 * Sends a System Init/Turn Off message
 * 
 * @param {Object} octavia - An instance of OctaviaState
 */
function sendSystemInit(octavia) {
	// Init/Turn Off: F0 7E 7F 09 02 F7
	const initMessage = new Uint8Array([
		0xF0, // SysEx start
		0x7E, // Universal Non-Realtime
		0x7F, // Device ID (all devices)
		0x09, // Sub-ID #1 (General MIDI)
		0x02, // Sub-ID #2 (Init/Turn Off)
		0xF7  // SysEx end
	]);
	
	octavia.sendCmd({
		type: 15,
		track: 0,
		data: initMessage
	});
	
	console.log('System init/turn off sent successfully!');
}

/**
 * Example usage:
 * 
 * // 1. Import the Octavia state module
 * import OctaviaState from '../dist/state.mjs';
 * 
 * // 2. Create a new Octavia instance
 * const octavia = new OctaviaState();
 * 
 * // 3. Send GM2 reset
 * sendGM2Reset(octavia);
 * 
 * // Or send GM reset (Level 1)
 * sendGMReset(octavia);
 * 
 * // Or send system init
 * sendSystemInit(octavia);
 */

// Export functions for use in other modules
// Uncomment when using as a module:
// export { sendGM2Reset, sendGMReset, sendSystemInit };

// For browser usage without modules:
if (typeof window !== 'undefined') {
	window.OctaviaGM2Example = {
		sendGM2Reset,
		sendGMReset,
		sendSystemInit
	};
}
