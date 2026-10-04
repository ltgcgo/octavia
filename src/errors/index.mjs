// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

// Generic errors.
const ConditionalError = class extends Error {
	name = "ConditionalError";
};
const IncompleteError = class extends RangeError {
	name = "IncompleteError";
};
const StateError = class extends Error {
	name = "StateError";
};

// Incompletion errors.
const IncompleteDataSizeError = class extends IncompleteError {
	name = "IncompleteDataSizeError";
};
const IncompleteDeltaTimeError = class extends IncompleteError {
	name = "IncompleteDeltaTimeError";
};
const IncompleteMetaTypeError = class extends IncompleteError {
	name = "IncompleteMetaTypeError";
};
const IncompleteStatusByteError = class extends IncompleteError {
	name = "IncompleteRunningStatusError";
};

// State errors.
const MIDIStateError = class extends StateError {
	name = "MIDIStateError";
};
const MIDIStateErrorSysEx = class extends MIDIStateError {
	name = "MIDIStateError";
};

export {
	ConditionalError,
	IncompleteError,
	StateError,

	IncompleteDataSizeError,
	IncompleteDeltaTimeError,
	IncompleteMetaTypeError,
	IncompleteStatusByteError,

	MIDIStateError,
	MIDIStateErrorSysEx
};