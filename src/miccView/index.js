"use strict";

import {
	Alpine
} from "../../libs/alpine@alpinejs/alpine.min.js";
import {
	$e,
	$a
} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import {
	bufferFrom,
	bufferTo
} from "../state/utils/bufferIo.mjs";
import {
	bufferToDHex
} from "../state/utils.js";

(async () => {
	Alpine.start();
})();