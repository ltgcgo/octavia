"use strict";

const veryBig = 281474976710655;

import {
	PointEvent,
	RangeEvent,
	TimedEvents
} from "../../libs/lightfelt@ltgcgo/ext/timedEvents.js";

let rawToPool = function (midiJson) {
	let list = new TimedEvents();
	let upThis = this;
	let timeDiv = midiJson.timeDivision,
	tempo = 120,
	tempoChanges = new TimedEvents(),
	pointer = 0,
	pointerOffset = 0;
	// Initiate a default tempo change
	tempoChanges.push(new RangeEvent(0, veryBig, [120, 0]));
	// First pass: get all tempo changes
	midiJson.track.forEach(function (e0) {
		pointer = 0;
		e0.event.forEach(function (e1) {
			pointer += e1.deltaTime;
			if (e1.type == 255 && e1?.metaType == 81) {
				tempo = 60000000 / e1.data;
				let lastChange = tempoChanges[tempoChanges.length - 1];
				if (lastChange) {
					tempoChanges.push(new RangeEvent(pointer, 281474976710655, [tempo, 0]));
				};
			};
		});
	});
	// Sort tempo changes into a correct order
	tempoChanges.fresh();
	// Sets correct ending time.
	tempoChanges.forEach(function (e, i, a) {
		if (i > 0) {
			a[i - 1].end = e.start;
		};
	});
	// Removes changes being too frequent
	let tTempo = 120;
	tempoChanges.forEach(function (e, i, a) {
		if (i > 0) {
			if (e.end == e.start) {
				// Unneeded change
				a.splice(a.indexOf(e), 1);
			} else if (tTempo == e.data[0]) {
				a[i - 1].end = e.end;
				a.splice(a.indexOf(e), 1);
			};
			tTempo = e.data[0];
		};
	});
	// Calculates offsets
	let cOffset = 0, cTempo = 120;
	tempoChanges.forEach(function (e) {
		let cPointer = e.start;
		let curTime = cPointer / cTempo / timeDiv * 60 + cOffset;
		cTempo = e.data[0];
		cOffset = curTime - cPointer / cTempo / timeDiv * 60;
		e.data[1] = cOffset;
	});
	console.debug("All tempo changes: ", tempoChanges);
	// Reset for the second pass
	tempo = 120,
	pointer = 0,
	pointerOffset = 0;
	// Second pass: convert deltaTime into actual time stamps
	midiJson.track.forEach(function (e0, i0) {
		pointer = 0,
		pointerOffset = 0;
		e0.event.forEach(function (e1, i1) {
			pointer += e1.deltaTime;
			// Load the correct tempo changes and offsets
			let changeData = tempoChanges.step(pointer, true)[0];
			if (changeData) {
				tempo = changeData.data[0];
				pointerOffset = changeData.data[1];
			};
			let appendObj = {
				type: e1.type,
				data: e1.data,
				track: i0,
				part: 0
			};
			if (e1.type > 14) {
				appendObj.meta = e1.metaType;
			} else {
				appendObj.part = e1.channel;
			};
			list.push(new PointEvent(pointer / tempo / timeDiv * 60 + pointerOffset, appendObj));
		});
	});
	list.fresh();
	//console.debug("All MIDI events: ", list);
	// Give back the processed events
	return list;
};

export {
	rawToPool
};
