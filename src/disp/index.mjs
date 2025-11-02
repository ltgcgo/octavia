// 2022-2025 (C) Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import MuDisplay from "./disp_mu.mjs";
import ScDisplay from "./disp_sc.mjs";
import Ns5rDisplay from "./disp_n5.mjs";
import Sc8850Display from "./disp_sc8850.mjs";
import QyDisplay from "./disp_qy.mjs";
import PsrDisplay from "./disp_psr.mjs";

if (typeof self?.require !== "undefined") {
	throw(new Error("Environments supporting CommonJS is not supported."));
};

export {
	MuDisplay,
	ScDisplay,
	Ns5rDisplay,
	Sc8850Display,
	QyDisplay,
	PsrDisplay
};
