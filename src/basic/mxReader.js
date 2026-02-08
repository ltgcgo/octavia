"use strict";

import MiniSignal from "../../libs/twinkle@ltgcgo/miniSignal.mjs";

let blankFont = new Uint8Array(40);

let shiftIndex = 0, shiftLoading, shiftLoader = setInterval(() => {
	if (shiftLoading) {
		blankFont[shiftIndex] = !blankFont[shiftIndex];
		shiftIndex ++;
		if (shiftIndex > 34) {
			shiftIndex = 0;
		};
	};
}, 1000 / 50);

Uint8Array.prototype.render = function (receiveFunc) {
	let x = 0, y = 0,
	w = this.width || 5, h = this.height || 8;
	for (let i = 0; i < this.length; i ++) {
		receiveFunc(this[i], x, y, this);
		x ++;
		if (x >= w) {
			x = 0;
			y ++;
		};
	};
};

let BitmapMatrix = class BitmapMatrix {
	// Dimensions capped at 4095 by 4095.
	#buffer;
	#cachedFrameSize;
	// #cachedDivisor = 0;
	#isPacked = false; // If the bitmap's encoded as a little-endian packed bit field. Unused.
	#width = 0;
	#height = 0;
	#frames = 0; // How many frames are there in this bitmap resource
	get width() {
		return this.#width;
	};
	set width(e) {};
	get height() {
		return this.#height;
	};
	set height(e) {};
	get frames() {
		return this.#frames;
	};
	set frames(e) {};
	get length() {
		return this.#buffer.length;
	};
	set length(e) {};
	id;
	getFrame(frameId = 0) {
		let upThis = this;
		if (frameId < 0 || frameId > upThis.#frames) {
			throw(new RangeError(`Cannot select frame ${frameId} in a bitmap with ${upThis.#frames} frame(s).`));
		};
		let startIndex = upThis.#cachedFrameSize * frameId;
		return upThis.#buffer.subarray(startIndex, startIndex + upThis.#cachedFrameSize);
	};
	render(receiveFunc, frameId = 0) {
		let frame = this.getFrame(frameId);
		let x = 0, y = 0;
		for (let i = 0; i < frame.length; i ++) {
			receiveFunc(frame[i], x, y, frame);
			x ++;
			if (x >= this.#width) {
				x = 0;
				y ++;
			};
		};
	};
	constructor(width, height, packed = false, buffer) {
		let upThis = this;
		if (buffer) {
			upThis.#buffer = buffer;
			upThis.#isPacked = packed;
		} else {
			throw(new Error("Cannot construct a bitmap matrix with no buffer."));
		};
		if (width <= 0 || width >= 4096) {
			throw(new RangeError(`Width of the bitmap cannot be greater than 4095 or less than 1, received ${width} instead.`));
		} else if (height <= 0 || height >= 4096) {
			throw(new RangeError(`Height of the bitmap cannot be greater than 4095 or less than 1, received ${height} instead.`));
		};
		upThis.#width = width;
		upThis.#height = height;
		upThis.#cachedFrameSize = width * height;
		//upThis.#cachedDivisor = Math.ceil(1048576 / width); // (2 ** 20)
		upThis.#frames = Math.floor(buffer.length / upThis.#cachedFrameSize);
	};
};

let MxFont40 = class MxFont40 {
	#fonts = [];
	loaded = new MiniSignal();
	async load(text, allowOverwrite = false, source = "(internal)") {
		let upThis = this;
		let loadCount = 0, allCount = 0;
		console.debug(`Font "${source || "(internal)"}": loading started.`);
		text.split("\n").forEach(function (e, i) {
			if (i > 0 && e?.length > 0) {
				let arr = e.split("\t");
				let codePoint = parseInt(arr[0], 16);
				allCount ++;
				if (upThis.#fonts[codePoint] && !allowOverwrite) {
					return;
				};
				let bm = new Uint8Array(40);
				Array.from(arr[1]).forEach(async function (e, i) {
					let verOff = (i & 1) ? 4 : 0,
					horOff = i >> 1,
					proxy = parseInt(e, 16), dp = 3;
					while (proxy > 0 || dp >= 0) {
						let pos = (verOff + dp) * 5 + horOff;
						bm[pos] = proxy & 1;
						proxy = proxy >> 1;
						dp --;
					};
				});
				bm.width = 5;
				bm.height = 8;
				upThis.#fonts[codePoint] = bm;
				loadCount ++;
			};
		});
		if (!upThis.loaded.finished) {
			upThis.loaded.finish();
		};
		console.debug(`Font "${source || "(internal)"}": ${allCount} total, ${loadCount} loaded.`);
	};
	async loadFile(fileSrc, allowOverwrite = false) {
		let upThis = this;
		console.debug(`Requested font file from "${fileSrc}".`);
		await upThis.load(await (await fetch(fileSrc)).text(), allowOverwrite, fileSrc);
		shiftLoading = false;
	};
	constructor(...fileSrc) {
		shiftLoading = true;
		(async () => {
			// Loading order is now enforced
			for (let i = 0; i < fileSrc.length; i ++) {
				await this.loadFile(fileSrc[i]);
			};
		})();
	};
	getCP(codePoint) {
		return this.#fonts[codePoint];
	};
	getStr(codePoint) {
		let arr = [],
		upThis = this;
		Array.from(codePoint).forEach(function (e) {
			arr.push(upThis.#fonts[e.charCodeAt(0)] || upThis.#fonts[32] || blankFont);
		});
		return arr;
	};
	keys() {
		return Object.keys(this.#fonts);
	};
	data(key) {
		return this.#fonts[key];
	};
};
let MxFont176 = class MxFont176 {
	#fonts = [];
	loaded = new MiniSignal();
	async load(text, allowOverwrite = false, source = "(internal)") {
		let upThis = this;
		let loadCount = 0, allCount = 0;
		console.debug(`Font "${source || "(internal)"}": loading started.`);
		text.split("\n").forEach(function (e, i) {
			if (i > 0 && e?.length > 0) {
				let arr = e.split("\t");
				let codePoint = parseInt(arr[0], 16);
				allCount ++;
				if (upThis.#fonts[codePoint] && !allowOverwrite) {
					return;
				};
				let bm = new Uint8Array(176);
				Array.from(arr[1]).forEach(async function (e, i) {
					let verOff = (i & 3) << 2,
					horOff = i >> 2,
					proxy = parseInt(e, 16), dp = 3;
					while (proxy > 0 || dp >= 0) {
						let pos = (verOff + dp) * 11 + horOff;
						bm[pos] = proxy & 1;
						proxy = proxy >> 1;
						dp --;
					};
				});
				bm.width = 11;
				bm.height = 16;
				upThis.#fonts[codePoint] = bm;
				loadCount ++;
			};
		});
		if (!upThis.loaded.finished) {
			upThis.loaded.finish();
		};
		console.debug(`Font "${source || "(internal)"}": ${allCount} total, ${loadCount} loaded.`);
	};
	async loadFile(fileSrc, allowOverwrite = false) {
		let upThis = this;
		console.debug(`Requested font file from "${fileSrc}".`);
		await upThis.load(await (await fetch(fileSrc)).text(), allowOverwrite, fileSrc);
		shiftLoading = false;
	};
	constructor(...fileSrc) {
		shiftLoading = true;
		(async () => {
			// Loading order is now enforced
			for (let i = 0; i < fileSrc.length; i ++) {
				await this.loadFile(fileSrc[i]);
			};
		})();
	};
	getCP(codePoint) {
		return this.#fonts[codePoint];
	};
	getStr(codePoint) {
		let arr = [],
		upThis = this;
		Array.from(codePoint).forEach(function (e) {
			arr.push(upThis.#fonts[e.charCodeAt(0)] || upThis.#fonts[32] || blankFont);
		});
		return arr;
	};
	keys() {
		return Object.keys(this.#fonts);
	};
	data(key) {
		return this.#fonts[key];
	};
};
let MxBm256 = class MxBm256 {
	#bm = {};
	loaded = new MiniSignal();
	async load(text) {
		let upThis = this;
		text.split("\n").forEach(function (e, i) {
			if (i > 0 && e?.length > 0) {
				let arr = e.split("\t");
				if (arr[1][0] !== "@") {
					let bm = new Uint8Array(256 << ((arr[1].length >> 6)) - 1);
					Array.from(arr[1]).forEach(function (e, i) {
						let iOff = i * 4,
						proxy = parseInt(e, 16), dp = 3;
						while (proxy > 0 || dp >= 0) {
							let pos = iOff + dp;
							bm[pos] = proxy & 1;
							proxy = proxy >> 1;
							dp --;
						};
					});
					bm.width = 16;
					bm.height = 16;
					upThis.#bm[arr[0]] = bm;
				} else {
					upThis.#bm[arr[0]] = upThis.#bm[arr[1].slice(1)];
				};
			};
		});
		if (!upThis.loaded.finished) {
			upThis.loaded.finish();
		};
	};
	async loadFile(fileSrc) {
		let upThis = this;
		console.debug(`Requested fixed 256 bitmap file from "${fileSrc}".`);
		await upThis.load(await (await fetch(fileSrc)).text());
	};
	constructor(...fileSrc) {
		(async () => {
			for (let i = 0; i < fileSrc.length; i ++) {
				await this.loadFile(fileSrc[i]);
			};
		})();
	};
	getBm(rscNme) {
		return this.#bm[rscNme]?.slice();
	};
	keys() {
		return Object.keys(this.#bm);
	};
	data(key) {
		return this.#bm[key];
	};
};
let MxBmDef = class MxBmDef {
	#bm = {};
	loaded = new MiniSignal();
	async load(text) {
		let upThis = this;
		text.split("\n").forEach(function (e, i) {
			if (i > 0 && e?.length > 0) {
				let arr = e.split("\t");
				if (arr[1][0] !== "@") {
					let bmWidth = parseInt(arr[1].slice(0, 4), 16),
					bmHeight = parseInt(arr[1].slice(4, 8), 16);
					let bm = new Uint8Array(bmWidth * bmHeight);
					Array.from(arr[1]).slice(8).forEach(function (e, i) {
						let iOff = i * 4,
						proxy = parseInt(e, 16), dp = 3;
						while (proxy > 0 || dp >= 0) {
							let pos = iOff + dp;
							if (pos <= bm.length) {
								bm[pos] = proxy & 1;
								proxy = proxy >> 1;
							};
							dp --;
						};
					});
					upThis.#bm[arr[0]] = new BitmapMatrix(bmWidth, bmHeight, false, bm);
					upThis.#bm[arr[0]].id = arr[0];
					//console.debug(`W:${bmWidth} H:${bmHeight} L:${bm.length} ${arr[0]}`);
				} else {
					upThis.#bm[arr[0]] = upThis.#bm[arr[1].slice(1)];
				};
			};
		});
		if (!upThis.loaded.finished) {
			upThis.loaded.finish();
		};
	};
	async loadFile(fileSrc) {
		let upThis = this;
		console.debug(`Requested pre-defined bitmap file from "${fileSrc}".`);
		await upThis.load(await (await fetch(fileSrc)).text());
		self.mxDef = upThis;
	};
	constructor(...fileSrc) {
		(async () => {
			for (let i = 0; i < fileSrc.length; i ++) {
				await this.loadFile(fileSrc[i]);
			};
		})();
	};
	getBm(rscNme) {
		return this.#bm[rscNme];
	};
	keys() {
		return Object.keys(this.#bm);
	};
	data(key) {
		return this.#bm[key];
	};
};

export {
	BitmapMatrix,
	MxFont40,
	MxFont176,
	MxBm256,
	MxBmDef
};
