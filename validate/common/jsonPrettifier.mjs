"use strict";

import {
	BinaryString
} from "../../libs/rochelle@ltgcgo/binaryString.mjs";
import {
	bufferToDHex
} from "../../src/state/utils.js";

export default function jsonPrettifier(k, v) {
	switch (typeof v) {
		case "boolean":
		case "number":
		case "string": {
			return v;
			break;
		};
		case "bigint": {
			return `${v?.toString()}n`;
			break;
		};
		case "function": {
			return `${v?.name || "<anonymous>"}() {}`;
			break;
		};
		case "symbol": {
			return v.toString();
			break;
		};
		default: {
			switch (v?.constructor) {
				case BinaryString: {
					return {
						"label": v.label,
						"text": v.text
					};
				};
				case Promise: {
					return `[object Promise]`;
				};
				case TextDecoder:
				case TextEncoder: {
					return `[object ${v.constructor.name}: ${v.encoding}]`;
				};
				case Uint8Array:
				case Uint8ClampedArray: {
					return `(${v.length} B) ${bufferToDHex(v, 128)}`;
				};
				default: {
					return v;
				};
			};
		};
	};
};