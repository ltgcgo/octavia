"use strict";

let compArr = function (a, b) {
	let minL = Math.min(a.length, b.length),
	c = a.slice(0, minL),
	d = b.slice(0, minL);
	let result = 0, pointer = 0;
	while (pointer < minL && result == 0) {
		result = Math.sign(c[pointer] - d[pointer]);
		pointer ++;
	};
	return result;
};

let BinaryMatch = function (name = "") {
	this.name = name;
	this.pool = [];
	this.point = function (prefix, insert = false) {
		if (this.pool.length > 0) {
			let bound = this.pool.length, // boundary
			bs = 1 << Math.floor(Math.log2(bound)), // block size
			pp = bs, // position pointer
			ttl = 64; // time to live
			// Binary search
			while (bs >= 1 && ttl >= 0) {
				// Status report
				if (ttl <= 0) {
					throw(new Error("TTL reached."));
				};
				if (pp == bound) {
					pp -= bs;
				} else {
					let result = compArr(prefix, this.pool[pp]);
					switch (result) {
						case 0: {
							ttl = 0;
							break;
						};
						case 1: {
							if (pp + bs <= bound) {
								pp += bs;
							};
							break;
						};
						case -1: {
							if (pp != 0) {
								pp -= bs;
							};
							break;
						};
						default: {
							console.warn(`Unexpected result ${result}.`);
						};
					};
				};
				bs = bs >> 1;
				ttl --;
			};
			// After match
			let match = true;
			if (pp >= this.pool.length) {
				match = false;
			} else {
				let upThis = this;
				this.pool[pp].forEach(function (e, i, a) {
					if (match) {
						if (e != prefix[i]) {
							match = false;
						};
					};
				});
				if (!match && compArr(prefix, this.pool[pp]) > 0) {
					pp ++;
				};
			};
			return (match || insert) ? pp : -1;
		} else {
			return insert ? 0 : -1;
		};
	};
	this.add = function (prefix, data) {
		prefix.data = data;
		this.pool.splice(this.point(prefix, true), 0, prefix);
		return this;
	};
	this.default = function (info) {
		console.warn(`No match in "${this.name || '(unknown)'}" for "${info}". Default action not defined.`);
	};
	this.get = function (prefix) {
		let idx = this.point(prefix);
		if (idx > -1) {
			return this.pool[idx].data;
		} else {
			this.default(prefix);
		};
	};
	this.run = function (prefix, ...additional) {
		let idx = this.point(prefix);
		if (idx > -1) {
			if (prefix.subarray) {
				this.pool[idx].data(prefix.subarray(this.pool[idx].length), ...additional);
			} else {
				this.pool[idx].data(prefix.slice(this.pool[idx].length), ...additional);
			};
		} else {
			this.default(prefix, ...additional);
		};
	};
};

export {
	BinaryMatch
};
