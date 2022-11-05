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

let MxFont40 = class {
	#fonts = [];
	async loadFile(fileSrc) {
		let upThis = this;
		console.debug(`Requested font file from "${fileSrc}".`);
		(await (await fetch(fileSrc)).text()).split("\n").forEach(async function (e, i) {
			if (i > 0 && e?.length > 0) {
				let arr = e.split("\t");
				let bm = new Uint8Array(40);
				Array.from(arr[1]).forEach(function (e, i) {
					let verOff = i % 2 ? 4 : 0,
					horOff = Math.floor(i / 2),
					proxy = parseInt(e, 16), dp = 3;
					while (proxy > 0 || dp >= 0) {
						let pos = (verOff + dp) * 5 + horOff;
						bm[pos] = proxy & 1;
						proxy = proxy >> 1;
						dp --;
					};
				});
				upThis.#fonts[parseInt(arr[0], 16)] = bm;
			};
		});
		shiftLoading = false;
	};
	constructor(fileSrc) {
		shiftLoading = true;
		this.loadFile(fileSrc);
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

export {
	MxFont40,
	MxBm256
};
