"use strict";

{
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
	self.RangeEvent = class extends TimedEvent {
		constructor (start, end, data) {
			super(true, start, end, data);
		};
	};
	self.PointEvent = class extends TimedEvent {
		constructor (start, data) {
			super(false, start, start, data);
		};
	};
};

self.TimedEvents = class extends self.Array {
	#maxAllowedPointSpan = 1;
	#lastTime = 0;
	#lastShown = [];
	constructor () {
		super(...arguments);
	};
	resetPointer (pointer) {
		this.#lastTime = 0;
		this.#lastShown = [];
	};
	finalize () {
		this.sort(function (a, b) {
			if (a.start == b.start) {
				return 0
			} else {
				return (+(a.start > b.start) << 1) - 1;
			};
		});
		this.forEach(function (e, i) {
			if (!e.id) {
				e.id = i;
			};
			if (!e.uid) {
				e.uid = Math.floor(Math.random() * 4294967296);
			};
		})
	};
	set pointSpan (value) {
		value = Math.abs(value);
		this.#maxAllowedPointSpan = value;
		return value;
	};
	get pointSpan () {
		return this.#maxAllowedPointSpan;
	};
	point (start) {
		// Must optimize
		let array = new TimedEvents();
		for (let index = 0; index < this.length; index ++) {
			if (this[index].start <= start && this[index].end > start) {
				array.push(this[index]);
			};
		};
		return array;
	};
	during (start, end) {
		if (start == end) {
			start = this.#lastTime;
		};
		if (start > end) {
			[start, end] = [end, start];
		};
		// Must optimize
		let array = new TimedEvents();
		for (let index = 0; index < this.length; index ++) {
			if (this[index].start > end) {
				break;
			} else if (this[index].end < start) {
				continue;
			} else {
				if (this.#lastShown.indexOf(this[index]) == -1 || this[index].ranged) {
					array.push(this[index]);
					this.#lastShown.push(this[index]);
				};
			};
		};
		return array;
	};
	at (time) {
		return this.during((Math.abs(time - this.#lastTime > this.#maxAllowedPointSpan) ? time - this.#maxAllowedPointSpan : this.#lastTime), time);
	};
};
self.TimedEventsCollection = class extends self.Array {
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
};
