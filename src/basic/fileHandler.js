// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

export default class BlobHandler {
	#registered = new Map();
	attachDrop(el) {};
	detachDrop(el) {};
	async handleBlob(blob) {};
	setExtMime(ext, mime) {};
	aliasMime(main, leaf) {};
	handleMime(mime, func) {};
};
