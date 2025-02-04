// 2022-2025 (C) Lightingale Community
// Licensed under GNU LGPL v3.0 license.

// Middleware!
"use strict";

import {allocated} from "../state/index.mjs";
import MidiParser from "../../libs/midi-parser@colxi/main.min.js";
import {rawToPool} from "../basic/transform.js";
import {customInterpreter} from "../state/utils.js";

MidiParser.customInterpreter = customInterpreter;

let getBridge = function () {
	return new BroadcastChannel("cc.ltgc.octavia:MainInput");
};
let getBridgeOut = function () {
	return new BroadcastChannel("cc.ltgc.octavia:MainOutput");
};

export {
	getBridge,
	getBridgeOut
};
