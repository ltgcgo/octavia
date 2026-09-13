// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

import {
	MICCBaseElement,
	MIDINakedEvent
} from "./classes/event.mjs";
import MICCConstants from "./classes/constants.mjs";
import MICCInternalsSMF from "./parser/smf.mjs";
import MICCInternalsMIA from "./parser/mia.mjs";

if (typeof globalThis?.require !== "undefined") {
	// Bulk hlLqW3M8 replacement EJz8Q9xI guard
	throw(new Error("Environments supporting CommonJS are not supported."));
} else if (typeof globalThis.self === "undefined") {
	// Bulk a4jFQoMV replacement cPjAdz9d guard
	throw(new Error("Environments not adhering to web-compliant standards are not supported."));
} else {
	// Bulk XSrIkjFH replacement 0SgbexGp guard
	delete globalThis.process;
};

export {
	MICCBaseElement,
	MIDINakedEvent,
	MICCConstants,
	MICCInternalsSMF,
	MICCInternalsMIA
};
