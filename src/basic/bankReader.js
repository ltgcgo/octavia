"use strict";

const sgCrit = ["MSB", "PRG", "LSB"];
const modeIdx = [
	"??",
	"GM",
	"GS",
	"XG",
	"MT",
	"AI",
	"AG",
	"XD",
	"RW"
];

let VoiceBank = class {
	#bankInfo = [];
	get(msb = 0, prg = 0, lsb = 0, mode) {
		let bankName;
		let args = Array.from(arguments);
		if (mode == "gs") {
			if ((msb == 0) && lsb != 0) {
				args[2] = 0;
			};
		};
		if (args[0] == 127 && args[2] == 0) {
			if (args[1] > 111 && args[1] < 127) {
				args[1] = 0;
			};
		};
		if (args[0] == 0) {
			if (args[2] > 111 && args[2] < 120) {
				args[2] = 0;
			};
		};
		let ending = " ";
		while (!(bankName?.length > 0)) {
			bankName = this.#bankInfo[args[1] || 0][(args[0] << 7) + args[2]];
			if (!bankName) {
				args[2] = 0;
				ending = "^";
				if (!this.#bankInfo[args[1] || 0][args[0] << 7]) {
					args[0] = 0;
					ending = "*";
				};
			};
		};
		if (mode == "gs" && ending == "^") {
			ending = " ";
		};
		if (ending != " ") {
			if (self.debugMode) {
				bankName = "";
			};
		};
		let standard = "??";
		switch (args[0]) {
			case 0: {
				if (args[2] == 0) {
					standard = "GM";
				} else if (args[2] < 120) {
					standard = "XG";
				} else if (args[2] == 127) {
					standard = "MT";
				};
				break;
			};
			case 56: {
				standard = "AG";
				break;
			};
			case 61:
			case 83: {
				standard = "AI";
				break;
			};
			case 62:
			case 82: {
				standard = "XD";
				break;
			};
			case 81: {
				standard = "RW";
				break;
			};
			case 64:
			case 121:
			case 126: {
				standard = "XG";
				break;
			};
			case 127: {
				standard = lsb == 127 ? "MT" : (prg == 0 ? "GM" : "XG");
				break;
			};
			case 120: {
				standard = "GS";
			};
			default: {
				if (args[0] < 40) {
					standard = "GS";
				};
			};
		};
		return {
			name: bankName || (msb || 0).toString().padStart(3, "0") + " " + (prg || 0).toString().padStart(3, "0") + " " + (lsb || 0).toString().padStart(3, "0"),
			ending,
			standard
		};
	};
	load(text) {
		let upThis = this;
		let sig = []; // Significance
		text.split("\n").forEach(function (e, i) {
			let assign = e.split("\t"), to = [];
			if (i == 0) {
				assign.forEach(function (e0, i0) {
					sig[sgCrit.indexOf(e0)] = i0;
				});
				console.info(`Bank map significance: ${sig}`);
			} else {
				assign.forEach(function (e1, i1) {
					if (i1 > 2) {
						upThis.#bankInfo[to[sig[1]]] = upThis.#bankInfo[to[sig[1]]] || [];
						upThis.#bankInfo[to[sig[1]]][(to[sig[0]] << 7) + to[sig[2]]] = assign[3];
					} else {
						to.push(parseInt(assign[i1]));
					};
				});
			};
		});
	};
	async loadFiles(...type) {
		this.#bankInfo = [];
		let upThis = this;
		for (let c = 0; c < type.length; c ++) {
			await fetch(`./data/bank/${type[c]}.tsv`).then(function (response) {
				console.info(`Parsing voice map: ${type[c]}`);
				return response.text()
			}).then(function (text) {
				upThis.load.call(upThis, text);
			});
		};
	};
	constructor(...args) {
		this.loadFiles(...args);
	};
};

export {
	VoiceBank
};
