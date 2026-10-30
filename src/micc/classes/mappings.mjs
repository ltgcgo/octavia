// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	gaussSum
} from "../utils/arithmetic.mjs";

// Deterministic mapping between tracker and MIDI, from 0-96 ticks per row to the fixed mapped 96 MIDI ticks.
const trackerTicks = 96,
TrackerTickMapping = new Array(trackerTicks + 1),
tickMappingsBuffer = new Uint8Array(gaussSum(1, 1, trackerTicks));

const PaulaPeriodTable = new Uint16Array(6 << 4);

{
	// Tracker/MIDI tick mappings.
	for (let i = 0; i < TrackerTickMapping.length; i ++) {
		const targetValueTPR = i > 0 ? i : 1;
		const bufferEndPos = gaussSum(1, 1, targetValueTPR);
		const currentTable = tickMappingsBuffer.subarray(bufferEndPos - targetValueTPR, bufferEndPos);
		const divisionFactor = 1 / currentTable.length;
		for (let trackerTick = 0; trackerTick < currentTable.length; trackerTick ++) {
			currentTable[trackerTick] = Math.round(64 * trackerTick * divisionFactor);
		};
		//console.debug(currentTable);
		TrackerTickMapping[i] = currentTable;
	};
	for (let i = 0; i < PaulaPeriodTable.length; i ++) {
		PaulaPeriodTable[i] = Math.round(906.88 * Math.pow(2, -i / 96));
	};
	PaulaPeriodTable[24] --;
	PaulaPeriodTable[40] --;
	PaulaPeriodTable[48] --;
	PaulaPeriodTable[49] --;
	PaulaPeriodTable[56] --;
	PaulaPeriodTable[64] --;
	PaulaPeriodTable[72] --;
	PaulaPeriodTable[80] --;
	console.debug(PaulaPeriodTable);
};

export {
	TrackerTickMapping
};