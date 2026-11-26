// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

export default new (class CommonStreamConverters {
	buffer(stream) {
		return this.bytes(stream);
	};
	async arrayBuffer(stream) {
		return await (new Response(stream)).arrayBuffer();
	};
	async blob(stream) {
		return await (new Response(stream)).blob();
	};
	async bytes(stream) {
		return await (new Response(stream)).bytes();
	};
	async json(stream) {
		return await (new Response(stream)).json();
	};
	async text(stream) {
		return await (new Response(stream)).text();
	};
})();