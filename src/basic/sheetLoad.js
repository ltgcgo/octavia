"use strict";

let SheetData = class {
	#conf;
	data = [];
	reset() {
		this.data = [];
	};
	async load(text) {
		let lines = text.split("\n");
		let fields;
		lines.forEach((e, i) => {
			if (e?.length) {
				let cells = e.split("\t");
				cells.forEach((e0, i0, a0) => {
					let data = e0;
					try {
						data = JSON.parse(`"${e0}"`);
					} catch (err) {
						console.warn(`TSV decode failed on line ${i + 1} cell ${i0 + 1}\n${err.message}`);
					};
					a0[i0] = data || undefined;
				});
				if (i) {
					let data = {};
					cells.forEach((e0, i0) => {
						if (fields[i0] && e0) {
							data[fields[i0]] = e0;
						};
					});
					this.data.push(data);
				} else {
					fields = cells;
				};
			};
		});
	};
	constructor(conf) {
		this.#conf = conf;
	};
};

export {
	SheetData
};
