// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { FactorIECByte } from "../constant/size.mjs";

export function toByteIEC(value, unit) {
	if (typeof value === "string") {
		value = parseFloat(value);
	};
	if (!Number.isFinite(value)) {
		throw(new RangeError(`Invalied value, must be finite.`));
	};
	const unitQuery = FactorIECByte[unit];
	if (typeof unitQuery !== "number") {
		throw(new RangeError(`Invalied unit "${unit}".`));
	};
	return value * unitQuery;
};