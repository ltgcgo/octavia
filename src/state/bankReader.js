"use strict";

import {ccToPos} from "../state/index.mjs";

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

let halfHex = function (n) {
	let segA = Math.floor(n / 10), segB = n % 10;
	return `${segA.toString(16)}${segB}`;
};

let VoiceBank = class {
	#bankInfo;
	strictMode = false;
	get(msb = 0, prg = 0, lsb = 0, mode) {
		let bankName;
		let args = Array.from(arguments);
		switch (mode) {
			case "xg": {
				if (msb == 32 || msb == 33) {
					args[2] += 4; // PLG-150AP + PLG150VL redirection
				} else if (msb == 80) {
					args[0] = 96; // PLG-150PF + PLG-150AP redirection
				} else if (msb == 81) {
					args[0] = 97; // PLG-150VL redirection
				} else if (msb == 82) {
					args[0] = 98; // PLG-100SG redirection
				};
			};
			case "gs": {
				if ((msb == 0) && lsb < 5) {
					args[2] = 0;
				};
				break;
			};
			case "sg": {
				if (msb == 8 && lsb == 0) {
					args[2] = 5;
				};
				break;
			};
		};
		let ending = " ", sect = `M`, useLsb = false, baseShift = 0;
		// Section test
		switch (args[0]) {
			case 0: {
				if (args[2] == 127) {
					sect = "MT-a";
				} else if (args[2] == 126) {
					sect = "MT-b";
				} else if (args[2] == 7) {
					sect = "GM-k"; // KAWAI GMega LX
				} else if (args[2] == 5) {
					sect = "SG-a"; // AKAI SG01k
				} else if (args[2] == 4) {
					sect = "SP-l"; // KAWAI GMega SP
				} else if (args[2] == 0) {
					sect = "GM-a";
				} else if (mode == "gs" && args[2] < 5) {
					sect = "GM-a";
				} else {
					sect = "y";
					useLsb = true;
				};
				break;
			};
			case 8: {
				if (mode == "sg") {
					sect = "GM-s";
				} else {
					sect = "r:";
				};
				break;
			};
			case 48: {
				sect = `yM${(args[2] >> 3).toString().padStart(2, "0")}`;
				useLsb = true;
				break;
			};
			case 56: {
				sect = "GM-b";
				break;
			};
			case 61:
			case 120: {
				sect = "rDrm";
				break;
			};
			case 62: {
				sect = "kDrm";
				break;
			};
			case 63: {
				let kLsb = args[2];
				sect = (kLsb < 10) ? "kP:" : "kC:";
				sect += kLsb % 10;
				break;
			};
			case 64: {
				sect = "ySFX";
				break;
			};
			case 80:
			case 81:
			case 82:
			case 83: {
				sect = `Prg${"UABC"[args[0] - 80]}`;
				break;
			};
			case 88:
			case 89:
			case 90:
			case 91: {
				sect = `Cmb${"UABC"[args[0] - 88]}`;
				break;
			};
			case 96: {
				sect = (args[2] == 106 ? "AP-a" : "PF");
				if (args[2] > 63) {
					baseShift = 63;
				};
				useLsb = true;
				break;
			};
			case 97: {
				sect = "VL:";
				useLsb = true;
				baseShift = 112;
				break;
			};
			case 98: {
				sect = "SG-a";
				break;
			};
			case 121: {
				sect = "GM-";
				useLsb = true;
				break;
			};
			case 122: {
				sect = "lDrm";
				break;
			};
			case 126: {
				sect = "yDrS";
				break;
			};
			case 127: {
				if (args[2] == 127) {
					sect = "rDrm";
				} else {
					sect = "yDrm";
				};
				break;
			};
			default: {
				if (args[0] < 48) {
					sect = "r:";
				} else {
					sect = "M";
				};
			};
		};
		if (sect.length < 4) {
			sect += `${(useLsb ? lsb : msb) - baseShift}`.padStart(4 - sect.length, "0");
		};
		// Bank read
		while (!(bankName?.length >= 0)) {
			bankName = this.#bankInfo[args[1] || 0][(args[0] << 7) + args[2]];
			if (!bankName) {
				if (!this.strictMode) {
					/* if (mode != "gs" && mode != "ns5r") {
						args[2] = 0;
						ending = "^";
					}; */
					if (!this.#bankInfo[args[1] || 0][args[0] << 7]) {
						if (msb == 48) {
							args[0] = 0;
							args[2] = 0;
							ending = "!";
						} else if (msb == 62) {
							args[1] --;
							ending = " ";
							if (args[1] < 1 && !bankName?.length) {
								args[0] = 0;
								ending = "!";
							};
						} else if (msb < 64) {
							if (mode == "xg" && msb == 16) {
									bankName = `Voice${(lsb * 128 + prg + 1).toString().padStart(3, "0")}`;
									ending = " ";
							} else if (args[0] == 0) {
								args[2] = 0;
								ending = "^";
							} else {
								if (args[2] < 1) {
									args[0] = 0;
									ending = "*";
								} else {
									args[2] --; // Descending bank search
								};
							};
						} else if (msb == 80) {
							bankName = `PrgU:${prg.toString().padStart(3, "0")}`;
							ending = "!";
						} else if (msb == 88) {
							bankName = `CmbU:${prg.toString().padStart(3, "0")}`;
							ending = "!";
						} else if (msb == 121) {
							bankName = `GM2Vox0${lsb}`;
							ending = "#";
						} else if (msb == 122) {
							if (args[1] == 32) {
								args[1] == 0;
							} else {
								args[1] %= 7;
							};
							bankName = this.#bankInfo[args[1] || 0][(args[0] << 7) + args[2]];
							if (bankName) {
								ending = " ";
							} else {
								bankName = "";
								ending = "*";
							};
						} else if (args[1] == 0) {
							bankName = `${msb.toString().padStart(3, "0")} ${prg.toString().padStart(3, "0")} ${lsb.toString().padStart(3, "0")}`;
							ending = "!";
						} else {
							if (args[0] == 0) {
								args[2] = 0;
								ending = "^";
							} else if (args[2] > 0) {
								args[2] --;
							} else if (args[1] > 0) {
								args[1] = 0;
								ending = "!";
							} else {
								args[0] = 0;
								ending = "?";
							};
						};
					} else {
						if (args[0] == 0) {
							args[2] = 0;
							ending = "^";
						} else if (args[2] < 1) {
							args[0] = 0;
							ending = "*";
						} else {
							args[2] --; // Descending bank search
							ending = "^";
						};
					};
				} else {
					bankName = "";
					ending = "?";
				};
			};
		};
		if ((mode == "gs" || mode == "ns5r") && ending == "^") {
			ending = " ";
		};
		if (msb == 127 && ending == "^") {
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
				} else if (args[2] == 5 || args[2] == 7) {
					standard = "KG";
				} else if (args[2] < 120) {
					standard = "XG";
				} else if (args[2] == 127) {
					standard = "MT";
				};
				break;
			};
			case 48: {
				standard = "MU"; // MU-100 Native
				break;
			};
			case 56: {
				standard = "AG";
				break;
			};
			case 61:
			case 80:
			case 83:
			case 88:
			case 89:
			case 91: {
				standard = "AI";
				break;
			};
			case 62:
			case 82:
			case 90: {
				standard = "XD";
				break;
			};
			case 63: {
				standard = "KR";
			};
			case 64:
			case 126: {
				standard = "XG";
				break;
			};
			case 81: {
				standard = "RW";
				break;
			};
			case 96: {
				standard = args[2] == 106 ? "AP" : "PF";
				break;
			};
			case 97: {
				standard = "VL"; // PLG-150VL / SONDIUS-XG
				break;
			};
			case 98: {
				standard = "SG"; // PLG-100SG
				break;
			};
			case 120: {
				standard = "GS";
				break;
			};
			case 121: {
				standard = "G2";
				break;
			};
			case 122: {
				standard = "KG";
				break;
			};
			case 127: {
				standard = args[2] == 127 ? "MT" : (prg == 0 ? "GM" : "XG");
				break;
			};
			default: {
				if (args[0] < 48) {
					if (args[0] == 16 && mode == "xg") {
						standard = "XG";
					} else {
						standard = "GS";
					};
				};
			};
		};
		return {
			name: bankName || `${halfHex(msb || 0)} ${halfHex(prg || 0)} ${halfHex(lsb || 0)}`,
			ending,
			sect,
			standard
		};
	};
	async load(text, allowOverwrite, name) {
		let upThis = this;
		let sig = []; // Significance
		let loadCount = 0, allCount = 0;
		text.split("\n").forEach(function (e, i) {
			let assign = e.split("\t"), to = [];
			if (i == 0) {
				assign.forEach(function (e0, i0) {
					sig[sgCrit.indexOf(e0)] = i0;
				});
				//console.debug(`Bank map significance: ${sig}`);
			} else {
				assign.forEach(async function (e1, i1) {
					if (i1 > 2) {
						upThis.#bankInfo[to[sig[1]]] = upThis.#bankInfo[to[sig[1]]] || [];
						if (!upThis.#bankInfo[to[sig[1]]][(to[sig[0]] << 7) + to[sig[2]]]?.length || allowOverwrite) {
							upThis.#bankInfo[to[sig[1]]][(to[sig[0]] << 7) + to[sig[2]]] = assign[3];
							loadCount ++;
						} else {
							//console.debug(`Skipped overwriting ${to[sig[0]]},${to[sig[1]]},${to[sig[2]]}: [${upThis.#bankInfo[to[sig[1]]][(to[sig[0]] << 7) + to[sig[2]]]}] to [${assign[3]}]`);
						};
						allCount ++;
					} else {
						to.push(parseInt(assign[i1]));
					};
				});
			};
		});
		if (!allowOverwrite) {
			console.debug(`Map "${name || "(internal)"}": ${allCount} total, ${loadCount} loaded.`);
		};
	};
	clearRange(options) {
		let prg = options.prg != undefined ? (options.prg.constructor == Array ? options.prg : [options.prg, options.prg]) : [0, 127],
		msb = options.msb != undefined ? (options.msb.constructor == Array ? options.msb : [options.msb, options.msb]) : [0, 127],
		lsb = options.lsb != undefined ? (options.lsb.constructor == Array ? options.lsb : [options.lsb, options.lsb]) : [0, 127];
		for (let cMsb = msb[0]; cMsb <= msb[1]; cMsb ++) {
			let precalMsb = cMsb << 7;
			for (let cLsb = lsb[0]; cLsb <= lsb[1]; cLsb ++) {
				let precalBnk = precalMsb + cLsb;
				for (let cPrg = prg[0]; cPrg <= prg[1]; cPrg ++) {
					delete this.#bankInfo[cPrg][precalBnk];
				};
			};
		};
	};
	init() {
		this.#bankInfo = [];
		for (let prg = 0; prg < 128; prg ++) {
			this.#bankInfo.push([""]);
		};
	};
	async loadFiles(...type) {
		this.init();
		let upThis = this;
		type.forEach(async function (e, i) {
			await fetch(`./data/bank/${e}.tsv`).then(function (response) {
				//console.debug(`Parsing voice map "${e}".`);
				return response.text();
			}).then((text) => {
				upThis.load(text, false, e);
			});
		});
	};
	constructor(...args) {
		this.loadFiles(...args);
	};
};

export {
	VoiceBank
};
