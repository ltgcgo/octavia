"use strict";

import {ccToPos} from "../state/index.mjs";

const sgCrit = ["MSB", "PRG", "LSB", "NME", "ELC", "DRM"];

let halfHex = function (n) {
	let segA = Math.floor(n / 10), segB = n % 10;
	return `${segA.toString(16)}${segB}`;
};

let VoiceBank = class {
	#bankInfo;
	strictMode = false;
	get(msb = 0, prg = 0, lsb = 0, mode) {
		let sid = [msb, prg, lsb];
		let bankName;
		let bankPoly = 1, bankType = 0, bankDrum;
		let args = Array.from(arguments);
		switch (mode) {
			case "xg": {
				switch (msb) {
					case 0: {
						if (lsb == 126) {
							args[2] = 125; // MU100 Native
						} else if (lsb == 127) {
							args[2] = 0; // MU Basic
						};
						break;
					};
					case 16: {
						if (lsb == 126) {
							args[2] = 0; // MU sampler restore
						};
						break;
					};
					case 32: {
						if (lsb > 125) {
							args[2] = 0; // cc reset
						};
						args[2] += 4; // PLG-150AP redirection
						break;
					};
					case 33:
					case 34: // I guess this is for PF, but I'm not sure
					case 35:
					case 36: {
						if (lsb > 125) {
							args[2] = 0; // cc reset
						};
						args[2] += 5; // PLG-150VL/DX/AN redirection
						break;
					};
					case 79:
					case 80:
					case 81:
					case 82:
					case 83:
					case 84: {
						// 79: PLG-150DR + PLG-150PC redirection
						// 80: PLG-150PF + PLG-150AP redirection
						// 81: PLG-150VL redirection
						// 82: PLG-100SG redirection
						// 83: PLG-150DX redirection
						// 84: PLG-150AN redirection
						args[0] += 16;
					};
					case 95:
					case 96:
					case 97:
					case 98:
					case 99:
					case 100: {
						if (lsb == 126) {
							args[2] = 0; // MU100 Native restore
						};
						break;
					};
					case 48:
					case 64:
					case 126:
					case 127: {
						if (lsb == 126) {
							args[2] = 0; // MU100 Native restore
						};
						break;
					};
				};
				break;
			};
			case "gs":
			case "sc": {
				if (msb == 0 && lsb < 5) {
					args[2] = 0;
				} else if (msb > 125 && lsb < 5 && lsb != 2) {
					// Temporary fix for C/M bank under SC-55 mode
					// SC-88 do care incorrect LSB selection
					args[2] = msb;
					args[0] = 0;
				};
				break;
			};
			case "g2":
			case "sd": {
				if ((msb >> 1) == 40) {
					args[2] |= 16;
				} else if (msb > 95 && msb < 100) {
					args[2] |= 16;
					if (prg >> 4 == 7) {
						args[0] = 96;
					};
				};
				break;
			};
			case "sg": {
				if (msb == 8 && lsb == 0) {
					args[2] = 5;
				};
				break;
			};
			case "s90es": {
				if (lsb < 8) {
					args[2] += 17;
				} else if (lsb < 32) {
					args[2] += 13;
				} else {
					args[2] = (args[2] >> 3) + 19;
				};
				break;
			};
			case "motif": {
				if (lsb < 8) {
					args[2] += 28;
				} else if (lsb < 32) {
					args[2] += 13;
				} else {
					args[2] = (args[2] >> 3) + 19;
				};
				break;
			};
		};
		let ending = " ", sect = `M`, bank = "", useLsb = 0, baseShift = 0;
		// Section test
		switch (args[0]) {
			case 0: {
				switch (args[2]) {
					case 127: {
						if (mode == "xg") {
							sect = "GM-a";
						} else {
							sect = "MT-a";
							bank = "C/M";
						};
						break;
					};
					case 126: {
						if (mode == "xg") {
							sect = "GM-n";
						} else {
							sect = "MT-b";
							bank = "C/M";
						};
						break;
					};
					case 7: {
						sect = "GM-k"; // KAWAI GMega LX
						bank = "GLX";
						break;
					};
					case 5: {
						sect = "SG-a"; // AKAI SG01k
						bank = "000";
						break;
					};
					case 4: {
						if (mode == "gs" || mode == "sc") {
							sect = "GM-a";
							bank = "000";
						} else {
							sect = "SP-l"; // KAWAI GMega SP
							bank = "C/M";
						};
						break;
					};
					case 3:
					case 2:
					case 1: {
						if (mode == "gs" || mode == "sc") {
							sect = "GM-a";
							bank = "000";
						};
						break;
					};
					case 0: {
						sect = "GM-a";
						break;
					};
					default: {
						sect = "y";
						useLsb = 3;
					};
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
			case 32:
			case 33:
			case 34:
			case 35:
			case 36: {
				if (mode == "xg") {
					sect = `${["AP", "VL", "PF", "DX", "AN"][msb & 7]}-${"abcdefgh"[lsb]}`;
					useLsb = 3;
				};
				break;
			};
			case 48: {
				bank = `M${(args[2] >> 3).toString().padStart(2, "0")}`;
				sect = `y${bank}`;
				useLsb = 1;
				break;
			};
			case 56: {
				sect = "GM-b";
				break;
			};
			case 57: {
				sect = ["yDOC", "QY10", "QY20"][args[2] - 112] || "yMxv"; // Yamaha Model Exclusive Voice
				bank = ["DOC", "QY1", "QY2"][args[2] - 112] || "057";
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
				if (args[2] < 17) {
					let kLsb = args[2];
					sect = (kLsb < 10) ? "kP:" : "kC:";
					sect += kLsb % 10;
				} else if (args[2] < 34) {
					sect = ["Pre1", "Pre2", "Pre3", "Pre4", "Usr1", "Usr2", "DrmP", "DrmU", "Plg1", "Plg2", "Plg3", "Pre1", "Pre2", "Pre3", "Pre4", "Pre5", "Pre6"][args[2] - 17];
				} else {
					sect = `Ds`;
				};
				useLsb = 1;
				break;
			};
			case 64: {
				sect = "ySFX";
				bank = "SFX";
				break;
			};
			case 67: {
				sect = "DX:S";
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
			case 95: {
				sect = `${["DR", "PC"][args[2]]}-d`;
				break;
			};
			case 96: {
				sect = args[2] == 106 ? "AP-a" : (args[2] >> 4 == 1 ? "SDg" : "PF");
				if (args[2] > 63) {
					baseShift = 63;
				} else if (args[2] >> 4 == 1) {
					baseShift = 16;
				};
				useLsb = 3;
				break;
			};
			case 97: {
				sect = args[2] >> 4 == 1 ? "SDa" : "VL:";
				useLsb = 3;
				if (args[2] >> 4 == 1) {
					baseShift = 16;
				} else {
					baseShift = 112;
				};
				break;
			};
			case 98: {
				sect = args[2] >> 4 == 1 ? "SDb" : "SG-a";
				useLsb = 3;
				baseShift = 16;
				break;
			};
			case 99: {
				sect = args[2] >> 4 == 1 ? "SDc" : `DX`;
				if (args[2] > 63) {
					baseShift = 63;
				} else if (args[2] >> 4 == 1) {
					baseShift = 16;
				};
				useLsb = 3;
				break;
			};
			case 100: {
				sect = `AN`;
				if (args[2] > 63) {
					baseShift = 63;
				} else if (args[2] >> 4 == 1) {
					baseShift = 16;
				};
				useLsb = 3;
				break;
			};
			case 104:
			case 105:
			case 106:
			case 107: {
				sect = "SDd";
				baseShift = 104;
				break;
			};
			case 121: {
				sect = `GM-${args[2] ? "" : "a"}`;
				useLsb = 3;
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
			sect += `${[msb, lsb, args[0], args[2]][useLsb] - baseShift}`.padStart(4 - sect.length, "0");
		};
		if (bank.length < 3) {
			bank += `${[msb, lsb, args[0], args[2]][useLsb]}`.padStart(3 - bank.length, "0");
		};
		if (mode == "xg") {
			if (msb == 0) {
				// Hijack NS5R GM:y section
				if (args[2] < 100) {
					sect = sect.replace("y0", "y:");
				} else if (args[2] == 125) {
					sect = "y126";
				};
			} else if (msb == 16) {
				// Hijack XG MU2000 sampler
				bankName = `Voice${((args[2] << 7) + args[1] + 1).toString().padStart(3, "0")}`;
				ending = " ";
			} else if (msb == 35) {
				if ((lsb >> 1) == 2) {
					bankName = `DXCH_${(((args[2] & 1) << 7) + prg + 1).toString().padStart(3, "0")}`;
					ending = " ";
				};
			};
		};
		// Internal ID
		let iid = [args[0], args[1], args[2]];
		// Bank read
		while (!(bankName?.length >= 0)) {
			bankName = this.#bankInfo[args[1] || 0][(args[0] << 7) + args[2]]?.name;
			//console.debug("Result of the current round of bank fetch: ", bankName);
			//console.debug(`${args}`);
			if (bankName) {
				let bankObject = this.#bankInfo[args[1] || 0][(args[0] << 7) + args[2]];
				bankPoly = bankObject?.poly || bankPoly;
				bankType = bankObject?.type || bankType;
				bankDrum = bankObject?.drum;
			} else {
				if (!this.strictMode) {
					/* if (mode != "gs" && mode != "ns5r") {
						args[2] = 0;
						ending = "^";
					}; */
					if (args[0] == 0 && args[1] == 0 && args[2] == 0) {
						bankName = "Unloaded";
					} else if (!this.#bankInfo[args[1] || 0][args[0] << 7]) {
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
						} else if (msb < 63) {
							if (args[0] == 0) {
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
							bankName = this.#bankInfo[args[1] || 0][(args[0] << 7) + args[2]]?.name;
							if (bankName) {
								ending = " ";
								let bankObject = this.#bankInfo[args[1] || 0][(args[0] << 7) + args[2]];
								bankPoly = bankObject?.poly || bankPoly;
								bankType = bankObject?.type || bankType;
								bankDrum = bankObject?.drum;
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
		// End ID
		let eid = [args[0], args[1], args[2]];
		if ((mode == "gs" || mode == "sc" || mode == "ns5r") && ending == "^") {
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
				} else if (args[2] < 126) {
					standard = "XG";
				} else if (args[2] == 127) {
					standard = "MT";
				};
				break;
			};
			case 32:
			case 33:
			case 35:
			case 36: {
				if (args[2] > 4) {
					standard = ["AP", "VL", "PF", "DX", "AN"][args[0] - 32];
				} else {
					standard = "GS";
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
				if (args[2] < 17) {
					standard = "KR";
				} else if (args[2] < 34) {
					standard = "ES";
				} else {
					standard = "DS";
				};
				break;
			};
			case 64:
			case 126: {
				standard = "XG";
				break;
			};
			case 67:
			case 99: {
				standard = args[2] >> 4 == 1 ? "SD" : "DX"; // PLG-150DX
				break;
			};
			case 81: {
				standard = "RW";
				break;
			};
			case 95: {
				standard = ["DR", "PC"][args[2]]; // PLG-150DR/PC
				break;
			};
			case 96: {
				standard = args[2] == 106 ? "AP" : (args[2] >> 4 == 1 ? "SD" : "PF");
				break;
			};
			case 97: {
				standard = args[2] >> 4 == 1 ? "SD" : "VL"; // PLG-150VL / SONDIUS-XG
				break;
			};
			case 98: {
				standard = args[2] >> 4 == 1 ? "SD" : "SG"; // PLG-100SG
				break;
			};
			case 100: {
				standard = "AN"; // PLG-150AN
				break;
			};
			case 104:
			case 105:
			case 106:
			case 107: {
				standard = "SD"; // Roland StudioCanvas
				break;
			};
			case 120: {
				standard = "GS";
				break;
			};
			case 121: {
				standard = args[2] ? "G2" : "GM";
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
			poly: bankPoly,
			type: bankType,
			drum: bankDrum,
			iid,
			eid,
			sid,
			ending,
			sect,
			bank,
			standard
		};
	};
	async load(text, allowOverwrite, name = "(internal)") {
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
				if (sig.length < 4) {
					console.debug(`Debugger launched.`);
					debugger;
				};
			} else {
				let msb = 0, prg = 0, lsb = 0, name, poly = 1, type = 0, drum;
				assign.forEach(async function (e1, i1) {
					switch (i1) {
						case sig[0]: {
							msb = parseInt(e1);
							break;
						};
						case sig[1]: {
							prg = parseInt(e1);
							break;
						};
						case sig[2]: {
							lsb = parseInt(e1);
							break;
						};
						case sig[3]: {
							name = e1;
							break;
						};
						case sig[4]: {
							e1 = parseInt(e1)
							if (e1 < 16) {
								poly = e1 + 1;
							} else {
								type = (e1 & 15) + 1;
							};
							break;
						};
						case sig[5]: {
							drum = e1;
							break;
						};
					};
				});
				upThis.#bankInfo[prg] = upThis.#bankInfo[prg] || [];
				let writeArray = upThis.#bankInfo[prg];
				if (!writeArray[(msb << 7) | lsb] || allowOverwrite) {
					let voiceObject = {
						msb,
						prg,
						lsb,
						name,
						poly,
						type,
						drum
					};
					//console.debug(voiceObject);
					writeArray[(msb << 7) | lsb] = voiceObject;
					loadCount ++;
				} else {
					//console.debug(`Skipped overwriting ${msb},${prg},${lsb}: [${upThis.#bankInfo[prg][(msb << 7) | lsb]?.name}] to [${assign[3]}]`);
				};
				allCount ++;
			};
		});
		if (!allowOverwrite) {
			console.debug(`Map "${name}": ${allCount} total, ${loadCount} loaded.`);
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
		type.forEach(async function (e) {
			try {
				await fetch(`./data/bank/${e}.tsv`).then(function (response) {
					//console.debug(`Parsing voice map "${e}".`);
					return response.text();
				}).then((text) => {
					upThis.load(text, false, e);
				});
			} catch (err) {
				console.error(`Failed loading "${e}.tsv".`);
			};
		});
	};
	constructor(...args) {
		this.loadFiles(...args);
	};
};

export {
	VoiceBank
};
