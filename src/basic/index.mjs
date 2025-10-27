// 2022-2025 (C) Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {CustomEventSource} from "../../libs/lightfelt@ltgcgo/ext/customEvents.js";
import {dnToPos, allocated, overrides, effectSlots} from "../state/index.mjs";
import MidiParser from "../../libs/midi-parser@colxi/main.min.js";
import {rawToPool} from "./transform.js";
import {
	arrayCompare,
	customInterpreter
} from "../state/utils.js";
import TextReader from "../../libs/rochelle@ltgcgo/textRead.mjs";
import DSVParser from "../../libs/rochelle@ltgcgo/dsvParse.mjs";

MidiParser.customInterpreter = customInterpreter;

const eventPassThru = (source, sink, type) => {
	source.addEventListener(type, (ev) => {
		sink.dispatchEvent(type, ev.data);
	});
};
const nameFromPath = (path) => {
	let nameArray = path.split("/");
	return nameArray[nameArray.length - 1] || nameArray[nameArray.length - 2] || "(remote)";
};

let RootDisplay = class extends CustomEventSource {
	device;
	#midiPool;
	#mapList = {};
	#efxList = [];
	#propList = new Map();
	#titleName = "";
	#metaRun = [];
	#noteEvents = [];
	#mimicStrength = new Uint8ClampedArray(allocated.ch);
	#beforeStrength = new Uint8ClampedArray(allocated.ch);
	#chLastNoteAt = new Uint32Array(allocated.ch);
	#chLastNoteExhausted = new Uint32Array(allocated.ch);
	// Used to provide tempo, tSig and bar information
	#noteBInt = 0.5;
	#noteTempo = 120;
	#noteNomin = 4;
	#noteDenom = 4;
	#noteBarOffset = 0;
	#noteTime = 0;
	// A cache for providing fast poly calculation
	#voiceCache = new Array(allocated.ch);
	#polyCache = new Uint8Array(allocated.ch);
	// Recursion guard
	#getCachedInstanceCount = 0;
	msActive = 200;
	msFrame = 100;
	msExhaust = 300;
	smoothAttack = 0;
	smoothDecay = 0;
	reset() {
		let upThis = this;
		// Dispatching the event
		upThis.dispatchEvent("reset");
		// Clearing all MIDI instructions up
		upThis.#midiPool?.resetIndex();
		// And set all controllers to blank
		upThis.device.init();
		// Clear titleName
		upThis.#titleName = "";
		// Timing info reset;
		upThis.#noteBInt = 0.5;
		upThis.#noteTempo = 120;
		upThis.#noteNomin = 4;
		upThis.#noteDenom = 4;
		upThis.#noteBarOffset = 0;
		upThis.#noteTime = 0;
		upThis.dispatchEvent("tempo", upThis.#noteTempo);
		upThis.dispatchEvent("title", upThis.#titleName);
		upThis.dispatchEvent("tsig", upThis.getTimeSig());
	};
	init() {
		this.reset();
		this.#midiPool = undefined;
	};
	async loadFile(blob) {
		this.#midiPool = rawToPool(MidiParser.parse(new Uint8Array(await blob.arrayBuffer())));
	};
	async loadMap(text, overwrite, priority, name = "(internal)") {
		// Load the voice ID to voice name map
		let upThis = this;
		let loadCount = 0, allCount = 0, prioCount = 0;
		let fields = 0, fieldId, fieldNme;
		text.split(`\n`).forEach((e, i) => {
			if (!e) {
				return;
			};
			let a = e.split(`\t`);
			if (i) {
				if (!fields) {
					return;
				};
				let id = "", name = "";
				a.forEach((e0, i0) => {
					switch (i0) {
						case fieldId: {
							id = e0;
							break;
						};
						case fieldNme: {
							name = e0;
							break;
						};
					};
				});
				let overwriteByPriority = false;
				if (upThis.#mapList[id]?.priority > priority) {
					overwriteByPriority = true;
					prioCount ++;
				};
				if (!upThis.#mapList[id] || overwriteByPriority || overwrite) {
					upThis.#mapList[id] = {
						name,
						priority
					};
					loadCount ++;
				} else {
					self.debugMode && console.debug(`Voice "${name}" (${id}) seems to be in conflict with (${upThis.#mapList[id]}).`);
				};
				allCount ++;
			} else {
				a.forEach((e0, i0) => {
					switch (e0) {
						case "ID": {
							fieldId = i0;
							fields ++;
							break;
						};
						case "Name": {
							fieldNme = i0;
							fields ++;
							break;
						};
						default: {
							console.debug(`Unknown map field: ${e0}`);
						};
					};
				});
			};
		});
		console.debug(`Voice names: From "${name}", ${allCount} total, ${loadCount} loaded (${loadCount - prioCount} + ${prioCount}).`);
		upThis?.device.forceVoiceRefresh();
	};
	async loadMapPaths(paths) {
		let upThis = this;
		paths.forEach(async (e, i) => {
			// Lower the index, higher the priority
			upThis.loadMap(await (await fetch(e)).text(), 0, i, nameFromPath(e));
		});
	};
	async loadEfx(text, overwrite) {
		// Load the EFX map
		let upThis = this;
		let loadCount = 0, allCount = 0;
		let fieldMsb, fieldLsb, fieldNme;
		text.split(`\n`).forEach((e, i) => {
			if (!e) {
				return;
			};
			if (i) {
				let id = 0, name;
				e.split(`\t`).forEach((e0, i0) => {
					switch(i0) {
						case fieldMsb: {
							id |= ((parseInt(e0, 16) & 255) << 8);
							break;
						};
						case fieldLsb: {
							id |= (parseInt(e0, 16) & 255);
							break;
						};
						case fieldNme: {
							name = e0;
							break;
						};
					};
				});
				if (!upThis.#efxList[id] || overwrite) {
					upThis.#efxList[id] = name;
					//console.debug(`0x${id.toString(16)}    ${name}`);
					loadCount ++;
				} else {
					self.debugMode && console.debug(`EFX ID 0x${id.toString(16).padStart(4, "0")} (${name}) seems to be in conflict.`);
				};
				allCount ++;
			} else {
				e.split(`\t`).forEach((e0, i0) => {
					switch(e0) {
						case "MSB": {
							fieldMsb = i0;
							break;
						};
						case "LSB": {
							fieldLsb = i0;
							break;
						};
						case "Name": {
							fieldNme = i0;
							break;
						};
						default: {
							console.debug(`Unknown EFX field: ${e0}`);
						};
					};
				});
			};
		});
		console.debug(`EFX: ${allCount} total, ${loadCount} loaded.`);
		for (let i = 0; i < effectSlots.length; i ++) {
			let hidden = false, id = upThis.device.getEffectType(i);
			if (id[0] === 0 && id[1] >> 4 === 15) {
				hidden = true;
			};
			upThis.dispatchEvent(`efx${effectSlots[i]}`, {id, hidden});
		};
	};
	async loadModels(text, overwrite) {
		// Load the model ID map
		let upThis = this;
		let loadCount = 0, allCount = 0;
	};
	async loadStyles(text, overwrite) {
		// Load the style ID map
		let upThis = this;
		let loadCount = 0, allCount = 0;
	};
	async loadProps(stream, overwrite, priority = 0, name = "(internal)") {
		// Load the voice properties
		let upThis = this;
		let loadCount = 0, allCount = 0, prioCount = 0;
		for await (let entry of DSVParser.parseObjects(DSVParser.DATA_TEXT | DSVParser.TYPE_TSV, TextReader.line(stream))) {
			if (typeof entry?.voiceId !== "string") {
				continue;
			};
			allCount ++;
			if (
				!(upThis.#propList.has(entry.voiceId) || upThis.#propList.get(entry.voiceId)?.priority <= priority) ||
				overwrite
			) {
				if (Object.keys(entry).length < 2) {
					continue;
				};
				if (upThis.#propList.get(entry.voiceId)?.priority > priority) {
					prioCount ++;
				};
				entry.priority = priority;
				if (upThis.handleProp) {
					await upThis.handleProp(entry);
				};
				upThis.#propList.set(entry.voiceId, entry);
				//console.debug(entry);
				loadCount ++;
			} else {
				console.debug(`Tried to write a pre-existing entry "${entry.voiceId}" on entry ${allCount}.`);
			};
		};
		console.debug(`Voice properties: From "${name}", ${allCount} total, ${loadCount} loaded (${loadCount - prioCount} + ${prioCount}).`);
	};
	async loadPropsPaths(paths) {
		let upThis = this;
		paths.forEach(async (e, i) => {
			let nameArray = e.split("/");
			upThis.loadProps((await fetch(e)).body, 0, i, nameFromPath(e));
		});
	};
	/*handleProp(entry) {
		// This is a method that should be overriden!
	};*/
	switchMode(modeName, forced = false) {
		this.device.switchMode(modeName, forced);
	};
	getMode() {
		return this.device.getMode();
	};
	getVoice() {
		return this.device.getVoice(...arguments);
	};
	getChVoice(ch) {
		return this.device.getChVoice(ch);
	};
	refreshCachedChVoice(ch, forcedRefreshObject) {
		let upThis = this,
		voice = forcedRefreshObject ?? upThis.device.getChVoice(ch),
		cachedVoice = upThis.#voiceCache[ch],
		refresh = true;
		upThis.#getCachedInstanceCount ++;
		if (!forcedRefreshObject) {
			switch (upThis.device.getChMode(ch)) {
				case "xg": {
					if (upThis.device.getChType(ch) > 0 && upThis.device.getChPrimitive(ch, 1) !== 126) {
						switch (voice.ending) {
							case "!":
							case "?": {
								refresh = false;
								cachedVoice.refreshFailure = true;
								console.debug("Cached voice persisted due to invalid drum kit.");
								break;
							};
						};
					};
					break;
				};
				case "gs":
				case "sc": {
					if (voice.ending !== " ") {
						if (voice.sid[2] === 1) {
							voice.name = "Silence";
							voice.refreshFailure = true;
							console.debug("Cached voice nullified due to invalid SC-55 voice.");
						} else {
							refresh = false;
							cachedVoice.refreshFailure = true;
							console.debug("Cached voice persisted due to invalid GS voice.");
							//console.info(new Error());
						};
					};
					break;
				};
			};
		};
		if (refresh) {
			upThis.#voiceCache[ch] = voice;
			upThis.#polyCache[ch] = voice.poly ?? 1;
			if (upThis.#getCachedInstanceCount > 1) {
				console.debug(`Bubbling prevented at instance #${upThis.#getCachedInstanceCount}.`);
			} else {
				upThis.dispatchEvent("cachedvoice", {"part": ch});
			};
			upThis.#getCachedInstanceCount --;
			return voice;
		} else {
			upThis.#getCachedInstanceCount --;
			return cachedVoice;
		};
	};
	getCachedChVoice(ch) {
		let upThis = this,
		cachedVoice = upThis.#voiceCache[ch],
		updatedVoice = upThis.device?.getChPrimitives(ch, true);
		//console.debug(0);
		if (cachedVoice && upThis.device?.getChCvnIsWritten(ch) === 0) {
			switch (cachedVoice.ending) {
				case "?":
				case "!": {
					//console.debug(1);
					return upThis.refreshCachedChVoice(ch, undefined);
					break;
				};
				default: {
					if (
						arrayCompare(cachedVoice.sid, updatedVoice)[1] !== 0
						|| cachedVoice.name === "Unloaded"
					) {
						//console.debug(2);
						return upThis.refreshCachedChVoice(ch);
					} else {
						//console.debug(3);
						return cachedVoice;
					};
				};
			};
		} else {
			//console.debug(4);
			return upThis.refreshCachedChVoice(ch);
		};
	};
	getChPrimitive(ch, component, useSubDb) {
		return this.device.getChPrimitive(ch, component, useSubDb);
	};
	getChPrimitives(ch, useSubDb) {
		return this.device.getChPrimitives(ch, useSubDb);
	};
	getMapped(id) {
		return this.#mapList[id]?.name || id;
	};
	getEfx(data) {
		let [msb, lsb] = data;
		let id = (msb << 8) | lsb;
		return this.#efxList[id] || `0x${id.toString(16).padStart(4, "0")}`;
	};
	getVoxBm(voiceObject) {
		// Get voice bitmap
		if (!voiceObject) {
			throw(new Error("Voice object must be valid"));
		};
		let upThis = this;
		if (!upThis.voxBm) {
			throw(new Error("Voice bitmap repository isn't yet initialized"));
		};
		let result = upThis.voxBm.getBm(voiceObject.name);
		if (!result) {
			switch (voiceObject.mode) {
				case "xg": {
					switch (voiceObject.sid[0]) {
						case 0:
						case 80:
						case 81:
						case 83:
						case 84:
						case 96:
						case 97:
						case 99:
						case 100: {
							result = upThis.voxBm.getBm(upThis.getVoice(overrides.bank0, voiceObject.sid[1], overrides.bank0, voiceObject.mode).name);
							break;
						};
					};
					break;
				};
				case "g2":
				case "sd": {
					switch (voiceObject.sid[0]) {
						case 96:
						case 97:
						case 98:
						case 99: {
							result = upThis.voxBm.getBm(upThis.getVoice(overrides.bank0, voiceObject.sid[1], overrides.bank0, voiceObject.mode).name);
							break;
						};
						case 104:
						case 105:
						case 106:
						case 107: {
							result = upThis.voxBm.getBm(upThis.getVoice(120, voiceObject.sid[1], overrides.bank0, voiceObject.mode).name);
							break;
						};
					};
					break;
				};
				case "gs":
				case "sc":
				case "k11":
				case "sg":
				case "gm": {
					switch (voiceObject.sid[0]) {
						case 120: {
							break;
						};
						case 122:
						case 127: {
							result = upThis.voxBm.getBm(upThis.getVoice(120, voiceObject.sid[1], 0, voiceObject.mode).name);
							break;
						};
						default: {
							result = upThis.voxBm.getBm(upThis.getVoice(0, voiceObject.sid[1], 0, voiceObject.mode).name);
						};
					};
					break;
				};
				default: {
					switch (voiceObject.sid[0]) {
						case 56: {
							result = upThis.voxBm.getBm(upThis.getVoice(0, voiceObject.sid[1], 0, voiceObject.mode).name);
							break;
						};
					};
				};
			};
		};
		if (!result) {
			result = upThis.voxBm.getBm(upThis.getVoice(voiceObject.sid[0], voiceObject.sid[1], 0, voiceObject.mode).name);
		};
		return result;
	};
	getChBm(ch, voiceObject) {
		// Get part bitmap
		let upThis = this;
		voiceObject = voiceObject ?? upThis.getChVoice(ch);
		let data = upThis.getVoxBm(voiceObject);
		if (!data) {
			if (!upThis.sysBm) {
				return;
			};
			switch (voiceObject.mode) {
				case "xg": {
					switch (voiceObject.sid[0]) {
						case 126: {
							if (voiceObject.sid[1] >> 1 === 56) {
								data = upThis.sysBm.getBm("cat_smpl");
							};
							break;
						};
						case 16: {
							data = upThis.sysBm.getBm("cat_smpl");
							break;
						};
						case 64:
						case 67: {
							data = upThis.sysBm.getBm("cat_sfx");
							break;
						};
						case 32:
						case 33:
						case 34:
						case 35:
						case 36:
						case 48:
						case 82: {
							data = upThis.sysBm.getBm("cat_xg");
							break;
						};
					};
					break;
				};
				default: {
					switch (voiceObject.sid[0]) {
						case 63:
						case 32:
						case 33:
						case 34:
						case 35:
						case 36:
						case 48:
						case 82: {
							data = upThis.sysBm.getBm("cat_mex");
							break;
						};
					};
				};
			};
		};
		if (!data) {
			if (upThis.device.getChType(ch)) {
				data = upThis.sysBm.getBm("cat_drm");
			} else {
				data = upThis.sysBm.getBm("no_vox");
			};
		};
		return data;
	};
	getChBmState(part, frames = 1) {
		// 0 for inactive, animations loop from 1 to the maximum frame
		let upThis = this;
		let elapsed = Math.floor(upThis.#noteTime * 1000) - upThis.getChLastNoteExhausted(part);
		if (upThis.getChLastNoteExhausted(part) <= 0) {
			return 0;
		};
		if (elapsed < upThis.msActive) {
			frames -= 1; // First frame is used for the inactive state
			if (frames < 1) {
				return 0;
			};
			return Math.floor(elapsed / upThis.msFrame) % frames + 1;
		};
		return 0;
	};
	getProps(voiceObject) {
		let upThis = this;
		let props, lastEid, loopGuard = 0, sourceObject = voiceObject;
		while (
			loopGuard < 8 &&
			(
				props === undefined ||
				props === null
			) &&
			(
				!lastEid?.constructor ||
				lastEid instanceof Array &&
				(
					lastEid[1] !== voiceObject.eid[1] ||
					lastEid[2] !== voiceObject.eid[2]
				)
			)
		) {
			lastEid = voiceObject.eid;
			if (typeof voiceObject.voice !== "string") {
				//console.debug(`No voice ID defined for "${voiceObject.name}" (${voiceObject.eid.join(" ")}).`);
				continue;
			};
			if (upThis.#propList.has(voiceObject.voice)) {
				props = upThis.#propList.get(voiceObject.voice);
			} else {
				voiceObject = upThis.getVoice(lastEid[0], lastEid[2] === 0 ? 0 : lastEid[1], lastEid[2] === 0 ? 0 : lastEid[2] - 1);
			};
		};
		if (!props && loopGuard === 8) {
			console.info(`Voice property fetching failed for "${voiceObject.name}" (${voiceObject.eid.join(" ")}).`);
		};
		return props;
	};
	get noteProgress() {
		return this.#noteTime / this.#noteBInt;
	};
	get noteOverall() {
		return (this.noteProgress - this.#noteBarOffset) * this.#noteDenom / 4;
	};
	get noteBar() {
		return Math.floor(this.noteOverall / this.#noteNomin);
	};
	get noteBeat() {
		let beat = this.noteOverall % this.#noteNomin;
		if (beat < 0) {
			beat += this.#noteNomin;
		};
		return beat;
	};
	get noteOffset() {
		return this.#noteBarOffset;
	};
	getTimeSig() {
		return [this.#noteNomin, this.#noteDenom];
	};
	getTempo() {
		return this.#noteTempo;
	};
	getPool() {
		return this.#midiPool;
	};
	getChCachedVoiceRaw(part) {
		return this.#voiceCache[part];
	};
	getChLastNoteAt(part) {
		return this.#chLastNoteAt[part];
	};
	getChLastNoteExhausted(part) {
		//console.debug(this.#chLastNoteExhausted[part]);
		return this.#chLastNoteExhausted[part];
	};
	eachVoice(iter, all = false) {
		let upThis = this;
		for (let i = 0; i < upThis.#voiceCache.length; i ++) {
			if (all || upThis.device?.getChActive(i)) {
				iter(upThis.#voiceCache[i], i, upThis.#voiceCache);
			};
		};
	};
	sendCmd(raw) {
		this.device.runJson(raw);
	};
	render(time) {
		if (time > this.#noteTime) {
			this.#noteTime = time;
		};
		let events = this.#midiPool?.step(time) || [];
		let extraPoly = 0, extraPolyEC = 0,
		notes = new Set(), noteVelo = {};
		let extraNotes = []; // Should be visualized before the final internal state!
		let upThis = this;
		let metaReplies = [];
		// Reset strength for a new frame
		upThis.device.getStrength().forEach((e, i) => {
			upThis.#beforeStrength[i] = e;
		});
		upThis.device.newStrength();
		events.forEach(function (e) {
			let raw = e.data;
			let reply = upThis.device.runJson(raw);
			switch (reply?.reply) {
				case "meta": {
					metaReplies.push(reply);
					break;
				};
			};
			if (reply?.reply) {
				delete reply.reply;
			};
		});
		while (upThis.#noteEvents.length > 0) {
			let raw = upThis.#noteEvents.shift(),
			noteEnc = (raw.part << 7) | raw.note;
			//console.debug(raw);
			if (raw.state) {
				notes.add(noteEnc);
				noteVelo[noteEnc] = raw.velo;
			} else {
				if (notes.has(noteEnc)) {
					extraNotes.push({
						part: raw.part,
						note: raw.note,
						velo: noteVelo[noteEnc],
						state: upThis.device.NOTE_SUSTAIN // OctaviaDevice.NOTE_SUSTAIN
					});
					extraPoly ++;
					extraPolyEC	+= upThis.#polyCache[raw.part];
				};
			};
		};
		if (metaReplies?.length > 0) {
			upThis.dispatchEvent("meta", metaReplies);
		};
		// Pass params to actual displays
		let chInUse = upThis.device.getActive(); // Active channels
		let chKeyPr = []; // Pressed keys and their pressure
		let chPitch = upThis.device.getPitch(); // All pitch bends
		let chContr = upThis.device.getCcAll(); // All CC values
		let chProgr = upThis.device.getProgram(); // All program values
		let chType = upThis.device.getChTypes(); // All channel types
		let chExt = [];
		// Mimic strength variation
		let writeStrength = upThis.device.getStrength();
		writeStrength.forEach(function (e, i, a) {
			a[i] = Math.max(upThis.#beforeStrength[i], e);
			let diff = a[i] - upThis.#mimicStrength[i];
			if (diff >= 0) {
				// cc73 = 0, atkPower = 4
				// cc73 = 127, atkPower = 0.25
				let atkPower = 4 * (0.25 ** (upThis.device.getChCc(i, 73) / 64));
				upThis.#mimicStrength[i] += Math.ceil(diff - (diff * (upThis.smoothAttack ** atkPower)));
			} else {
				let rlsPower = 4 * (0.25 ** (upThis.device.getChCc(i, 72) / 64));
				upThis.#mimicStrength[i] += Math.floor(diff - (diff * (upThis.smoothDecay ** rlsPower)));
			};
		});
		let curPoly = 0, curPolyEC = 0;
		chInUse.forEach(function (e, i) {
			if (e) {
				chKeyPr[i] = upThis.device.getVel(i);
				chExt[i] = upThis.device.getExt(i);
				curPoly += chKeyPr[i].size;
				curPolyEC += chKeyPr[i].size * upThis.#polyCache[i];
			};
		});
		let repObj = {
			extraPoly,
			extraPolyEC,
			extraNotes,
			curPoly,
			curPolyEC,
			chInUse,
			chKeyPr,
			chPitch,
			chProgr,
			chContr,
			chType,
			chExt,
			eventCount: events.length,
			title: upThis.#titleName,
			bitmap: upThis.device.getBitmap(),
			letter: upThis.device.getLetter(),
			texts: upThis.device.getTexts(),
			master: upThis.device.getMaster(),
			mode: upThis.device.getMode(),
			strength: upThis.#mimicStrength.slice(),
			velo: writeStrength,
			rpn: upThis.device.getRpn(),
			tSig: upThis.getTimeSig(),
			tempo: upThis.getTempo(),
			noteBar: upThis.noteBar,
			noteBeat: upThis.noteBeat,
			ace: upThis.device.getAce(),
			rawVelo: upThis.device.getStrength(),
			rawStrength: upThis.device.getRawStrength(),
			rawPitch: upThis.device.getRawPitch(),
			efxSink: upThis.device.getEffectSink()
		};
		return repObj;
	};
	constructor(device, atk = 0.5, dcy = 0.5) {
		super();
		let upThis = this;
		upThis.smoothAttack = atk;
		upThis.smoothDecay = dcy;
		upThis.device = device;
		upThis.addEventListener("meta", function (raw) {
			raw?.data?.forEach(function (e) {
				(upThis.#metaRun[e.meta] || console.debug).call(upThis, e.meta, e.data);
			});
		});
		// This is asking for trouble
		eventPassThru(upThis.device, upThis, "mode");
		eventPassThru(upThis.device, upThis, "mastervolume");
		eventPassThru(upThis.device, upThis, "channelactive");
		eventPassThru(upThis.device, upThis, "channelmin");
		eventPassThru(upThis.device, upThis, "channelmax");
		eventPassThru(upThis.device, upThis, "portrange");
		eventPassThru(upThis.device, upThis, "portstart");
		eventPassThru(upThis.device, upThis, "channelreset");
		eventPassThru(upThis.device, upThis, "channeltoggle");
		eventPassThru(upThis.device, upThis, "screen");
		eventPassThru(upThis.device, upThis, "metacommit");
		eventPassThru(upThis.device, upThis, "voice");
		eventPassThru(upThis.device, upThis, "pitch");
		eventPassThru(upThis.device, upThis, "note");
		eventPassThru(upThis.device, upThis, "reset");
		eventPassThru(upThis.device, upThis, "banklevel");
		eventPassThru(upThis.device, upThis, "efxreverb");
		eventPassThru(upThis.device, upThis, "efxchorus");
		eventPassThru(upThis.device, upThis, "efxdelay");
		eventPassThru(upThis.device, upThis, "efxinsert0");
		eventPassThru(upThis.device, upThis, "efxinsert1");
		eventPassThru(upThis.device, upThis, "efxinsert2");
		eventPassThru(upThis.device, upThis, "efxinsert3");
		eventPassThru(upThis.device, upThis, "efxinsert4");
		eventPassThru(upThis.device, upThis, "partefxtoggle");
		eventPassThru(upThis.device, upThis, "chmode");
		upThis.addEventListener("note", function ({data}) {
			upThis.#noteEvents.push(data);
			//console.debug(data);
			if (data.state === 3) { // Which ever state that's invoked on note presses
				let msTime = Math.floor(upThis.#noteTime * 1000);
				upThis.#chLastNoteAt[data.part] = msTime;
				if (msTime - upThis.#chLastNoteExhausted[data.part] >= upThis.msExhaust) {
					upThis.#chLastNoteExhausted[data.part] = msTime;
				};
			};
		});
		upThis.addEventListener("voice", ({data}) => {
			upThis.refreshCachedChVoice(data.part);
		});
		upThis.addEventListener("reset", ({data}) => {
			upThis.#polyCache.fill(1);
			upThis.#chLastNoteAt.fill(0);
			upThis.#chLastNoteExhausted.fill(0);
		});
		upThis.#polyCache.fill(1);
		upThis.#metaRun[3] = function (type, data) {
			if (upThis.#titleName?.length < 1) {
				upThis.#titleName = data;
				upThis.dispatchEvent("title", upThis.#titleName);
			};
		};
		upThis.#metaRun[81] = function (type, data) {
			let noteProgress = upThis.noteProgress;
			// Change tempo
			let lastBInt = upThis.#noteBInt || 0.5;
			upThis.#noteTempo = 60000000 / data;
			upThis.#noteBInt = data / 1000000;
			upThis.#noteBarOffset += noteProgress * (lastBInt / upThis.#noteBInt) - noteProgress;
			upThis.dispatchEvent("tempo", upThis.#noteTempo);
		};
		upThis.#metaRun[88] = function (type, data) {
			//let noteProgress = upThis.noteProgress;
			//let noteOverall = upThis.noteOverall;
			let curBar = upThis.noteBar;
			let curBeat = upThis.noteBeat;
			// Change time signature
			let oldNomin = upThis.#noteNomin;
			let oldDenom = upThis.#noteDenom;
			upThis.#noteNomin = data[0];
			upThis.#noteDenom = 1 << data[1];
			//let metroClick = 24 * (32 / data[3]) / data[2];
			let targetBar = Math.round(curBar + curBeat / oldNomin);
			if (oldNomin !== upThis.#noteNomin) {
				upThis.#noteBarOffset -= targetBar * (upThis.#noteNomin - oldNomin) * (4 / upThis.#noteDenom);
			};
			if (oldDenom !== upThis.#noteDenom) {
				console.debug(`${curBar}/${curBeat}`);
				if (oldDenom < upThis.#noteDenom) {
					upThis.#noteBarOffset += targetBar * (upThis.#noteDenom - oldDenom) * (oldDenom / upThis.#noteDenom);
				} else {
					upThis.#noteBarOffset += targetBar * (upThis.#noteDenom - oldDenom) * (upThis.#noteDenom / oldDenom);
				};
			};
			upThis.dispatchEvent("tsig", upThis.getTimeSig());
		};
		upThis.addEventListener("metacommit", ({data}) => {
			switch (data.type) {
				case "KarTitle":
				case "EORTitle": {
					if (upThis.#titleName?.length < 1) {
						upThis.#titleName = data.data;
						upThis.dispatchEvent("title", upThis.#titleName);
					};
					break;
				};
			};
		});
	};
};

export {
	RootDisplay,
	dnToPos,
	allocated
};
