// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

const MICCInternalsTempo = class MICCInternalsTempo {
	static fromMPQN(mpqn = 500000) {
		return 60000000 / mpqn;
	};
	static toMPQN(tempo = 120) {
		return 60000000 / tempo;
	};
	static fromTracker(rows = 4, tickSpeed = 6, definedTempo = 125) {
		return 24 * definedTempo / (rows * tickSpeed);
	};
};

export {
	MICCInternalsTempo
};