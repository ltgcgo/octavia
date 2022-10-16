"use strict";

import {
	jsonConvert,
	getBridge
} from "../bridge/index.mjs";

(async function () {
	self.midiAccess = await navigator.requestMIDIAccess({"sysex": true, "software": true});
	self.jsonConvert = jsonConvert;
	self.midiLine = getBridge();
})();
