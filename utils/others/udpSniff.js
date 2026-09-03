"use strict";

import {
	bufferToDHex
} from "../../src/state/utils.js";

const udpServer = Deno.listenDatagram({
	"transport": "udp",
	"port": 6667,
	"hostname": "127.0.0.1"
});

(async () => {
	for await (const rx of udpServer) {
		/** @type {Uint8Array} */
		const data = rx[0];
		/** @type {Deno.Addr} */
		const addr = rx[1];
		console.debug(bufferToDHex(data, 128));
	};
})();
