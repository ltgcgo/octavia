// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/** Shared error objects across Octavia.
* @license LGPL-3.0-only
* @module cc.ltgc.octavia.errors
*/

// Generic errors.

/** Certain conditions have not been met. */
export class ConditionalError extends Error {}
/** Supplied data is not complete. */
export class IncompleteError extends RangeError {}
/** Target state is not valid. */
export class StateError extends Error {}

// Errors specific to Octavia.

// Incompletions.
/** Supplied information denoting data sizes is not complete. */
export class IncompleteDataSizeError extends IncompleteError {}
/** Supplied delta time data is not complete. */
export class IncompleteDeltaTimeError extends IncompleteError {}
/** Supplied meta type is not complete. */
export class IncompleteMetaTypeError extends IncompleteError {}
/** Supplied status byte is not complete. */
export class IncompleteStatusByteError extends IncompleteError {}
// Invalid states.
/** The target MIDI state is not valid. */
export class MIDIStateError extends StateError {}
/** The target MIDI SysEx state is not valid. */
export class MIDIStateErrorSysEx extends StateError {}