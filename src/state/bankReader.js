"use strict";

import {ccToPos} from "../state/index.mjs";

const sgCrit = ["MSB", "PRG", "LSB", "NME", "ELC", "DRM", "LVL", "VXP"];

const noVoxStdPool = {
	"krs": "KR",
	"s90es": "ES",
	"motif": "ES"
};
const noVoxCatPool = {
	"krs": "Kr",
	"s90es": "SE",
	"motif": "ME"
};
const allowedStandards = {
	"g2": new Set("gm,GM,g2,G2".split(",")),
	"xg": new Set()
};
for (let e of "XG,MU,AN,AP,DR,DX,PC,PF,SG,VL".split(",")) {
	allowedStandards.xg.add(e);
	allowedStandards.xg.add(e.toLowerCase());
};

let halfHex = function (n) {
	let segA = Math.floor(n / 10), segB = n % 10;
	return `${segA.toString(16)}${segB}`;
};

let VoiceBank = class {
	HINT_XG_MUBASIC = 0; // 127
	HINT_XG_MU100 = 1; // 126
	HINT_XG_PSR = 2; // 125
	#bankInfo;
	get bankInfo() {
		return this.#bankInfo;
	};
	strictMode = false;
	get(msb = 0, prg = 0, lsb = 0, mode, hint = 0) {
		let sid = [msb, prg, lsb];
		let bankName;
		let bankPoly = 1, bankType = 0, bankDrum, bankLevel, bankVoice;
		let args = Array.from(arguments);
		switch (mode) {
			case "xg": {
				switch (msb) {
					case 0: {
						if (hint === 2) {
							if (lsb >> 4 === 7) {
								args[2] += 16; // 112~127 - 128~143
							} else if (lsb >> 3 === 13) {
								args[2] += 40; // 104~111 - 144-151
							};
						} else {
							switch (lsb) {
								case 127: {
									args[2] = 0; // MU Basic
									break;
								};
							};
						};
						break;
					};
					case 16: {
						if (lsb === 126) {
							args[2] = 0; // MU sampler restore
						};
						break;
					};
					case 32: {
						if (lsb > 125) {
							args[2] = 0; // cc reset
						};
						args[2] += 4; // PLG150-AP redirection
						break;
					};
					case 33: {
						if (lsb > 125 || lsb === 3) {
							args[2] = 0; // cc reset
						};
						args[2] += 5; // PLG150-VL redirection
						break;
					};
					case 34: // I guess this is for PF, but I'm not sure
					case 35:
					case 36: {
						if (lsb > 125) {
							args[2] = 0; // cc reset
						};
						args[2] += 5; // PLG150-DX/AN redirection
						break;
					};
					case 79:
					case 80:
					case 81:
					case 82:
					case 83:
					case 84: {
						// 79: PLG150-DR + PLG150-PC redirection
						// 80: PLG150-PF + PLG150-AP redirection
						// 81: PLG150-VL redirection
						// 82: PLG100-SG redirection
						// 83: PLG150-DX redirection
						// 84: PLG150-AN redirection
						args[0] += 16;
					};
					case 95:
					case 96:
					case 97:
					case 98:
					case 99:
					case 100: {
						if (lsb === 126) {
							args[2] = 0; // MU100 Native restore
						};
						break;
					};
					case 48:
					case 64:
					case 126:
					case 127: {
						if (lsb === 126) {
							if (msb === 127 && prg === 0) {} else {
								args[2] = 0; // MU100 Native restore
							};
						};
						break;
					};
					case 121: {
						switch (lsb) {
							case 126: {
								args[2] = 0;
								break;
							};
							case 16: {
								args[2] = 15;
								break;
							};
							default: {
								args[2] = args[2] & 15;
							};
						};
						break;
					};
				};
				break;
			};
			case "gs":
			case "sc": {
				if (msb === 0 && lsb < 5) {
					//args[2] = 0;
					args[0] = 49;
				} else if (msb < 128 && msb > 125 && lsb < 5 && lsb !== 2) {
					// Temporary fix for C/M bank under SC-55 mode
					// SC-88 do care incorrect LSB selection
					args[2] = msb;
					args[0] = 49;
				};
				break;
			};
			case "mt32": {
				if (msb === 0) {
					args[0] = 49;
				};
				break;
			};
			case "sd": {
				switch (msb) {
					case 121: {
						args[0] = 96;
						break;
					};
					case 120: {
						args[0] = 104;
						break;
					};
				};
				if ((args[0] >> 1) === 40) {
					args[2] |= 16;
				} else if (args[0] > 95 && args[0] < 100) {
					args[2] |= 16;
					if (prg >> 4 === 7) {
						args[0] = 96;
					};
				};
				break;
			};
			case "pa": {
				switch (msb) {
					case 120: {
						if (lsb == 64) {
							args[2] = 2;
						} else {
							args[2] = 1;
						};
						break;
					};
					case 121: {
						switch (lsb) {
							case 127: {
								args[2] = 79;
								break;
							};
							default: {
								args[2] = (args[2] & 63) + 32;
							};
						};
						break;
					};
				};
				break;
			};
			case "g2": {
				// Should only be present under SD mode
				// However before non-resetting mode switches are available
				// This is the only way
				if ((msb >> 1) === 40) {
					args[2] |= 16;
				} else if (msb > 95 && msb < 100) {
					args[2] |= 16;
					if (prg >> 4 === 7) {
						args[0] = 96;
					};
				};
				break;
			};
			case "sg": {
				if (msb === 8 && lsb === 0) {
					args[2] = 5;
				};
				break;
			};
			case "05rw":
			case "x5d": {
				if (msb && msb < 56) {
					args[0] = 56;
				};
				break;
			};
			case "s90es":
			case "motif":
			case "an1x":
			case "cs1x":
			case "cs6x": {
				if (msb === 0) {
					break;
				};
				switch (msb) {
					case 63: {
						// native
						switch (mode) {
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
							case "cs1x": {
								switch (lsb >> 1) {
									case 0:
									case 1:
									case 2:
									case 3:
									case 4:
									case 5:
									case 6:
									case 7:
									case 8:
									case 9:
									case 10: {
										args[2] += 34;
										break;
									};
									case 32: {
										args[2] = 34 + ((lsb & 1) << 2);
										break;
									};
									case 33: {
										args[2] = 47 + ((lsb & 1) << 2);
										break;
									};
									case 61: {
										args[2] = 34 + ((lsb & 1) << 2);
										break;
									};
									case 62: {
										args[2] = 47 + ((lsb & 1) << 2);
										break;
									};
								};
								break;
							};
						};
						break;
					};
					case 32: {
						if (lsb > 125) {
							args[2] = 0; // cc reset
						};
						args[2] += 4; // PLG150-AP redirection
						break;
					};
					case 33: {
						if (lsb > 125 || lsb === 3) {
							args[2] = 0; // cc reset
						};
						args[2] += 5; // PLG150-VL redirection
						break;
					};
					case 34: // I guess this is for PF, but I'm not sure
					case 35:
					case 36: {
						if (lsb > 125) {
							args[2] = 0; // cc reset
						};
						args[2] += 5; // PLG150-DX/AN redirection
						break;
					};
					case 79:
					case 80:
					case 81:
					case 82:
					case 83:
					case 84: {
						// 79: PLG150-DR + PLG150-PC redirection
						// 80: PLG150-PF + PLG150-AP redirection
						// 81: PLG150-VL redirection
						// 82: PLG100-SG redirection
						// 83: PLG150-DX redirection
						// 84: PLG150-AN redirection
						args[0] += 16;
					};
					case 95:
					case 96:
					case 97:
					case 98:
					case 99:
					case 100: {
						if (lsb === 126) {
							args[2] = 0; // MU100 Native restore
						};
						break;
					};
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
						//if (mode === "xg") {
							sect = "GM-a";
						/*} else {
							sect = "MT-a";
							bank = "C/M";
						};*/
						break;
					};
					case 126: {
						// if (mode === "xg") {
							sect = "GM-n";
						/*} else {
							sect = "MT-b";
							bank = "C-M";
						}; */
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
						if (mode === "gs" || mode === "sc") {
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
						if (mode === "gs" || mode === "sc") {
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
				if (mode === "sg") {
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
				if (mode === "xg") {
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
			case 49: {
				if (args[2] >> 1 === 63) {
					sect = `MT-${"ba"[args[2] & 1]}`;
					bank = `C${"-/"[args[2] & 1]}M`;
				} else {
					sect = "GM-a";
					bank = "000";
				};
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
			case 128: {
				sect = "rDrm";
				break;
			};
			case 120: {
				sect = "gDrm";
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
				} else if (args[2] < 55) {
					let sectParam = args[2] - 34;
					if (sectParam > 12) {
						sectParam --;
					};
					switch (lsb >> 1) {
						case 32:
						case 33: {
							sect = `Pr${lsb - 63}U`;
							break;
						};
						case 61:
						case 62: {
							sect = `Pr${lsb - 121}U`;
							break;
						};
						default: {
							sect = args[2] === 46 ? "PrDr" : `Pr${(sectParam >> 2) + 1}${String.fromCharCode(65 + (sectParam & 3))}`;
						};
					};
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
				sect = args[2] === 106 ? "AP-a" : (args[2] >> 4 === 1 ? "SDg" : "PF");
				if (args[2] > 63) {
					baseShift = 63;
				} else if (args[2] >> 4 === 1) {
					baseShift = 16;
				};
				useLsb = 3;
				break;
			};
			case 97: {
				sect = args[2] >> 4 === 1 ? "SDa" : "VL:";
				useLsb = 3;
				if (args[2] >> 4 === 1) {
					baseShift = 16;
				} else {
					baseShift = 112;
				};
				break;
			};
			case 98: {
				sect = args[2] >> 4 === 1 ? "SDb" : "SG-a";
				useLsb = 3;
				baseShift = 16;
				break;
			};
			case 99: {
				sect = args[2] >> 4 === 1 ? "SDc" : `DX`;
				if (args[2] > 63) {
					baseShift = 63;
				} else if (args[2] >> 4 === 1) {
					baseShift = 16;
				};
				useLsb = 3;
				break;
			};
			case 100: {
				sect = `AN`;
				if (args[2] > 63) {
					baseShift = 63;
				} else if (args[2] >> 4 === 1) {
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
				sect = `GM${args[2] ? "" : "-a"}`;
				useLsb = 1;
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
				if (args[2] === 127) {
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
			bank += `${[msb, lsb, msb, lsb][useLsb]}`.padStart(3 - bank.length, "0");
		};
		if (mode === "xg") {
			if (msb === 0) {
				// Hijack NS5R GM:y section
				if (args[2] < 100) {
					sect = sect.replace("y0", "y:");
				} else if (args[2] === 125) {
					sect = "y126";
				};
			} else if (msb === 16) {
				// Hijack XG MU2000 sampler
				bankName = `Voice${((args[2] << 7) + args[1] + 1).toString().padStart(3, "0")}`;
				ending = " ";
			} else if (msb === 35) {
				if ((lsb >> 1) === 2) {
					bankName = `DXCH_${(((args[2] & 1) << 7) + prg + 1).toString().padStart(3, "0")}`;
					ending = " ";
				};
			};
		};
		// Internal ID
		let iid = [args[0], args[1], args[2]];
		// Bank read
		while (!(bankName?.length >= 0)) {
			bankName = this.#bankInfo[args[1] || 0][(args[0] << 8) + args[2]]?.name;
			//console.debug("Result of the current round of bank fetch: ", bankName);
			//console.debug(`${args}`);
			if (bankName) {
				let bankObject = this.#bankInfo[args[1] || 0][(args[0] << 8) + args[2]];
				bankPoly = bankObject?.poly || bankPoly;
				bankType = bankObject?.type || bankType;
				bankDrum = bankObject?.drum;
				bankLevel = bankObject?.level;
				bankVoice = bankObject?.voice;
			} else {
				if (!this.strictMode) {
					/* if (mode !== "gs" && mode !== "ns5r") {
						args[2] = 0;
						ending = "^";
					}; */
					if (args[0] === 0 && args[1] === 0 && args[2] === 0) {
						bankName = "Unloaded";
					} else if (!this.#bankInfo[args[1] || 0][args[0] << 8]) {
						if (msb === 48) {
							args[0] = 0;
							args[2] = 0;
							ending = "!";
						} else if (msb === 62) {
							args[1] --;
							ending = " ";
							if (args[1] < 1 && !bankName?.length) {
								args[0] = 0;
								ending = "!";
							};
						} else if (msb < 63) {
							if (args[0] === 0) {
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
						} else if (msb === 80) {
							bankName = `PrgU:${prg.toString().padStart(3, "0")}`;
							ending = "!";
						} else if (msb === 88) {
							bankName = `CmbU:${prg.toString().padStart(3, "0")}`;
							ending = "!";
						} else if (msb === 121) {
							bankName = `GM2Vox0${lsb}`;
							ending = "#";
						} else if (msb === 122) {
							if (args[1] === 32) {
								args[1] === 0;
							} else {
								args[1] %= 7;
							};
							bankName = this.#bankInfo[args[1] || 0][(args[0] << 8) + args[2]]?.name;
							if (bankName) {
								ending = " ";
								let bankObject = this.#bankInfo[args[1] || 0][(args[0] << 8) + args[2]];
								bankPoly = bankObject?.poly || bankPoly;
								bankType = bankObject?.type || bankType;
								bankDrum = bankObject?.drum;
								bankLevel = bankObject?.level;
							} else {
								bankName = "";
								ending = "*";
							};
						} else if (args[1] === 0) {
							bankName = `${msb.toString().padStart(3, "0")} ${prg.toString().padStart(3, "0")} ${lsb.toString().padStart(3, "0")}`;
							ending = "!";
						} else {
							if (args[0] === 0) {
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
						if (args[0] === 0) {
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
		switch (ending) {
			case "^": {
				// No LSB match
				switch (mode) {
					case "gs":
					case "sc":
					case "ns5r": {
						ending = " ";
						break;
					};
					case "xg": {
						if (lsb === 126 || lsb === 152) {
							ending = " ";
						};
						break;
					};
				};
				if (msb === 127) {
					ending = " ";
				};
				break;
			};
			case "*": {
				// No PC match
				break;
			};
			case "!": {
				// No MSB match
				break;
			};
			case "?": {
				// Failure
				break;
			};
		};
		let standard = "??";
		switch (args[0]) {
			case 0: {
				if (args[2] === 0) {
					standard = "GM";
				} else if (args[2] === 5 || args[2] === 7) {
					standard = "KG";
				} else if (args[2] < 144) {
					standard = "XG";
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
			case 49: {
				if (args[2] >> 1 === 63) {
					standard = "MT";
				} else if (args[2] < 5) {
					standard = "GM";
				};
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
				} else if (args[2] < 55) {
					standard = "CS";
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
				standard = args[2] >> 4 === 1 ? "SD" : "DX"; // PLG150-DX
				break;
			};
			case 81: {
				standard = "RW";
				break;
			};
			case 95: {
				standard = ["DR", "PC"][args[2]]; // PLG150-DR/PC
				break;
			};
			case 96: {
				standard = args[2] === 106 ? "AP" : (args[2] >> 4 === 1 ? "SD" : "PF");
				break;
			};
			case 97: {
				standard = args[2] >> 4 === 1 ? "SD" : "VL"; // PLG150-VL / SONDIUS-XG
				break;
			};
			case 98: {
				standard = args[2] >> 4 === 1 ? "SD" : "SG"; // PLG100-SG
				break;
			};
			case 100: {
				standard = "AN"; // PLG150-AN
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
				standard = prg === 0 ? "GM" : (["G2", "PA", "PA"][args[2]] ?? "G2");
				break;
			};
			case 128: {
				standard = prg === 0 ? "GM" : "GS";
				break;
			};
			case 121: {
				standard = args[2] ? ["G2", "XG", "PA", "PA", "PA"][args[2] >> 4] : "GM";
				break;
			};
			case 122: {
				standard = "KG";
				break;
			};
			case 127: {
				standard = args[2] === 127 ? "MT" : (prg === 0 ? "GM" : "XG");
				break;
			};
			default: {
				if (args[0] < 48) {
					if (args[0] === 16 && mode === "xg") {
						standard = "XG";
					} else {
						standard = "GS";
					};
				};
			};
		};
		switch (mode) {
			// Strict mode matching
			case "xg": {
				let tMsb = 0, tLsb = 0, tStd = "GM", silenced = false, replace = false;
				if (allowedStandards.xg.has(standard) || allowedStandards.g2.has(standard)) {
					if (ending !== " ") {
						//console.debug(`${ending},${standard}`);
						if (msb >> 4 === 6) {
							// Is this ever going to be reached?
							replace = true;
						} else {
							silenced = true;
						};
					} else if (iid[2] !== eid[2]) {
						if (msb === 81) {
							if (lsb >> 3 === 14) {
								tMsb = 97, tLsb = 112;
								replace = true, tStd = "VL";
							} else if (lsb >> 3 === 15) {
								silenced = true;
							};
						} else if (msb === 97) {
							replace = true;
						};
					};
				} else {
					if (msb >> 4 === 6) {
						replace = true;
					} else {
						silenced = true;
					};
				};
				if (replace && msb === 0 && lsb === 0) {
					tLsb = [0, 126, 152][hint];
				};
				if (silenced) {
					bankName = "Silence";
					ending = "?";
					standard = "??";
				} else if (replace) {
					let bankObject = this.#bankInfo[prg][(tMsb << 8) | tLsb];
					standard = tStd;
					bankName = bankObject?.name;
					bankPoly = bankObject?.poly || bankPoly;
					bankType = bankObject?.type || bankType;
					bankDrum = bankObject?.drum;
					bankLevel = bankObject?.level;
					bankVoice = bankObject?.voice;
					ending = "^";
				};
				break;
			};
		};
		// Additional error handling
		if (ending !== " ") {
			switch (mode) {
				case "krs":
				case "s90es":
				case "motif": {
					bankName = "";
					standard = noVoxStdPool[mode];
					ending = "?";
					break;
				};
				case "g2": {
					bankName = "GM2 Ext?";
					ending = "?";
					break;
				};
				case "pa": {
					if (ending === "^") {
						bankName = "Unknown";
						ending = "?";
					};
					break;
				};
				case "xg": {
					if (ending !== "^") {
						switch (msb) {
							case 120:
							case 127:
							case 126: {
								bankName = "SilntKit";
								break;
							};
							default: {
								bankName = "Silence";
							};
						};
						ending = "?";
					};
					break;
				};
				default: {
					if (self.debugMode) {
						bankName = "";
						ending = "?";
					};
				};
			};
		};
		if (ending === "?") {
			bankPoly = 0;
		};
		/*
		Invalid voice names:
		- GM2 Ext?
		- Unknown
		- Silence
		*/
		return {
			name: bankName || `${noVoxCatPool[mode] || mode.toUpperCase()}${halfHex(msb || 0)}${halfHex(prg || 0)}${halfHex(lsb || 0)}`,
			poly: bankPoly,
			type: bankType,
			drum: bankDrum,
			level: bankLevel,
			voice: bankVoice,
			iid,
			eid,
			sid,
			hint,
			ending,
			sect,
			bank,
			standard,
			mode
		};
	};
	async load(text, allowOverwrite, name = "(internal)", priority) {
		let upThis = this;
		let sig = []; // Significance
		let loadCount = 0, allCount = 0, prioCount = 0;
		text.split("\n").forEach(function (e, i) {
			let assign = e.split("\t"), to = [];
			if (i === 0) {
				assign.forEach(function (e0, i0) {
					sig[sgCrit.indexOf(e0)] = i0;
				});
				//console.debug(`Bank map significance: ${sig}`);
				if (sig.length < 4) {
					console.debug(`Debugger launched.`);
					debugger;
				};
			} else {
				let msb = 0, prg = 0, lsb = 0, name, poly = 1, type = 0, level, drum, voice;
				assign.forEach(function (e1, i1) {
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
							e1 = parseInt(e1);
							if (e1 < 16) {
								poly = e1 + 1;
							} else {
								type = (e1 & 15) + 1;
								poly = type;
							};
							break;
						};
						case sig[5]: {
							drum = e1;
							break;
						};
						case sig[6]: {
							if (typeof e1 === "string") {
								level = parseInt(e1);
							};
							break;
						};
						case sig[7]: {
							voice = e1;
							break;
						};
					};
				});
				upThis.#bankInfo[prg] = upThis.#bankInfo[prg] || [];
				let writeArray = upThis.#bankInfo[prg];
				let voiceObject = {
					msb,
					prg,
					lsb,
					name,
					poly,
					type,
					drum,
					level,
					voice,
					priority
				};
				/*if (loadCount > 889 && loadCount < 910) {
					console.debug(e);
					console.debug(voiceObject);
				};*/
				let overwriteByPriority = false;
				if (priority < writeArray[(msb << 8) | lsb]?.priority) {
					overwriteByPriority = true;
					prioCount ++;
				};
				if (!writeArray[(msb << 8) | lsb] || overwriteByPriority || allowOverwrite) {
					/*if (msb === 63 && lsb === 32) {
						console.debug(`Voice object written to voice pool.`);
					};*/
					writeArray[(msb << 8) | lsb] = voiceObject;
					loadCount ++;
				} else {
					//console.debug(`Skipped overwriting ${msb},${prg},${lsb}: [${upThis.#bankInfo[prg][(msb << 8) | lsb]?.name}] to [${assign[3]}]`);
				};
				allCount ++;
			};
		});
		if (!allowOverwrite) {
			console.debug(`Map: From "${name}", ${allCount} total, ${loadCount} loaded (${loadCount - prioCount} + ${prioCount}).`);
		};
	};
	clearRange(options) {
		let prg = options.prg !== undefined ? (options.prg.constructor === Array ? options.prg : [options.prg, options.prg]) : [0, 127],
		msb = options.msb !== undefined ? (options.msb.constructor === Array ? options.msb : [options.msb, options.msb]) : [0, 127],
		lsb = options.lsb !== undefined ? (options.lsb.constructor === Array ? options.lsb : [options.lsb, options.lsb]) : [0, 127];
		for (let cMsb = msb[0]; cMsb <= msb[1]; cMsb ++) {
			let precalMsb = cMsb << 8;
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
			try {
				upThis.load(await (await fetch(`./data/bank/${e}.tsv`)).text(), false, e, i);
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
	VoiceBank,
	allowedStandards
};
