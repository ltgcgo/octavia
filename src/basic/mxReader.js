"use strict";

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

let MxFont40 = class {
	#fonts = [];
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
				upThis.#fonts[codePoint] = bm;
				loadCount ++;
			};
		});
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
};
let MxFont176 = class {
	#fonts = [];
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
				upThis.#fonts[codePoint] = bm;
				loadCount ++;
			};
		});
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
};
let MxBm256 = class {
	#bm = {};
	async loadFile(fileSrc) {
		let upThis = this;
		console.debug(`Requested fixed 256 bitmap file from "${fileSrc}".`);
		(await (await fetch(fileSrc)).text()).split("\n").forEach(function (e, i) {
			if (i > 0 && e?.length > 0) {
				let arr = e.split("\t");
				if (arr[1][0] != "@") {
					let bm = new Uint8Array(256);
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
					upThis.#bm[arr[0]] = bm;
				} else {
					upThis.#bm[arr[0]] = upThis.#bm[arr[1].slice(1)];
				};
			};
		});
	};
	constructor(fileSrc) {
		this.loadFile(fileSrc);
	};
	getBm(rscNme) {
		return this.#bm[rscNme]?.slice();
	};
};
let MxBmDef = class {
	#bm = {};
	async loadFile(fileSrc) {
		let upThis = this;
		console.debug(`Requested pre-defined bitmap file from "${fileSrc}".`);
		(await (await fetch(fileSrc)).text()).split("\n").forEach(function (e, i) {
			if (i > 0 && e?.length > 0) {
				let arr = e.split("\t");
				if (arr[1][0] != "@") {
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
					bm.width = bmWidth;
					bm.height = bmHeight;
					upThis.#bm[arr[0]] = bm;
					//console.debug(`W:${bmWidth} H:${bmHeight} L:${bm.length} ${arr[0]}`);
				} else {
					upThis.#bm[arr[0]] = upThis.#bm[arr[1].slice(1)];
				};
			};
		});
		self.mxDef = upThis;
	};
	constructor(fileSrc) {
		this.loadFile(fileSrc);
	};
	getBm(rscNme) {
		return this.#bm[rscNme];
	};
};

export {
	MxFont40,
	MxFont176,
	MxBm256,
	MxBmDef
};
