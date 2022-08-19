"use strict";

let TimedEvent = class {
	#ranged = false;
	constructor (ranged, start, end, data) {
		this.#ranged = ranged;
		this.start = start;
		this.end = end;
		this.data = data;
	};
	get duration () {
		if (this.ranged) {
			return (this.end - this.start);
		} else {
			return 0;
		};
	};
	get ranged () {
		return this.#ranged;
	};
};
let RangeEvent = class extends TimedEvent {
	constructor (start, end, data) {
		super(true, start, end, data);
	};
};
let PointEvent = class extends TimedEvent {
	constructor (start, data) {
		super(false, start, start, data);
	};
};

let TimedEvents = class extends Array {
	#index = -1;
	constructor() {
		super(...arguments);
	};
	resetIndex(pointer) {
		this.#index = -1;
	};
	fresh() {
		this.sort(function (a, b) {
			if (a.start == b.start) {
				return 0
			} else {
				return (+(a.start > b.start) << 1) - 1;
			};
		});
		this.forEach(function (e, i) {
			e.index = i;
		});
	};
	step(time, allowRepeat = false) {
		// Optimizing required
		let array = [];
		if (allowRepeat) {
			for (let index = 0; index < this.length; index ++) {
				if (this[index].start > time) {
					break;
				} else if (this[index].end < time) {
					continue;
				} else {
					array.push(this[index]);
				};
			};
		} else {
			let rawArray = this.getRange(time - 1, time);
			let upThis = this;
			rawArray.forEach(function (e) {
				if (e.index > upThis.#index) {
					array.push(e);
					upThis.#index = e.index;
				};
			});
		};
		return array;
	};
	getRange(start, end) {
		if (start > end) {
			[start, end] = [end, start];
		};
		// Must optimize
		let array = [];
		let index = -1, chunk = Math.ceil(Math.sqrt(this.length)), working = true;
		for (let c = 0; c < this.length; c += chunk) {
			// Chunk compare
			if (this[c + chunk]) {
				// Previous chunks
				if (index < 0) {
					if (this[c + chunk].start >= start) {
						index = c;
					} ;
				};
			} else {
				// The last chunk
				index = index < 0 ? c : index;
			};
		};
		while (working) {
			if (this[index]?.end < end) {
				if (this[index].start >= start) {
					array.push(this[index]);
				};
			} else {
				working = false;
			}
			index ++;
		};
		return array;
	};
};

export {
	RangeEvent,
	PointEvent,
	TimedEvents
};

/*self.TimedEventsCollection = class extends self.Array {
	#maxAllowedPointSpan = 1;
	#lastTime = 0;
	constructor () {
		super(...arguments);
	};
	resetPointer (pointer) {
		this.forEach(function (e) {
			e.resetPointer(pointer);
		});
	};
	finalize () {
		this.forEach(function (e) {
			e.finalize();
		});
	};
	set pointSpan (value) {
		value = Math.abs(value);
		this.#maxAllowedPointSpan = value;
		this.forEach(function (e) {
			e.pointSpan = value;
		});
		return this.#maxAllowedPointSpan;
	};
	get pointSpan () {
		return this.#maxAllowedPointSpan;
	};
	point (start) {
		// Must optimize
		let array = [], joined = new TimedEvents();
		this.forEach(function (e) {
			if (e.point) {
				array.push(e.point(start));
			};
		});
		array.forEach(function (e) {
			e.forEach(function (e1) {
				joined.push(e1);
			});
		});
		joined.finalize();
		return joined;
	};
	during (start, end) {
		if (start == end) {
			start = this.#lastTime;
		};
		if (start > end) {
			[start, end] = [end, start];
		};
		// Must optimize
		let array = [], joined = new TimedEvents();
		this.forEach(function (e) {
			if (e.during) {
				array.push(e.during(start, end));
			};
		});
		array.forEach(function (e) {
			e.forEach(function (e1) {
				joined.push(e1);
			});
		});
		joined.finalize();
		return joined;
	};
	at (time) {
		return this.during((Math.abs(time - this.#lastTime > this.#maxAllowedPointSpan) ? time - this.#maxAllowedPointSpan : this.#lastTime), time);
	};
};*/
