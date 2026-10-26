// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	gaussSum
} from "../utils/arithmetic.mjs";

// Deterministic mapping between tracker and MIDI, from 0-64 ticks per row to the fixed mapped 64 MIDI ticks.
const TrackerTickMapping = new Array(65),
tickMappingsBuffer = new Uint8Array(2080); // (1+64)×(64÷2)

{
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
};

export {
	TrackerTickMapping
};