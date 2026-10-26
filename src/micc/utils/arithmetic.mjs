// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

// sum = a + (a + k * 1) + (a + k * 2) + ... + (a + k * (size - 1))
const gaussSum = (start = 0, diff = 1, size = 1) => {
	return (start * 2 + diff * (size - 1)) * (size / 2);
};

export {
	gaussSum
};