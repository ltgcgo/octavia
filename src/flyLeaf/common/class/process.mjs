// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

export class LeafChildRunStatusModern {
	/** @type {boolean} */
	success;
	/** @type {number} */
	code;
	/** @type {import("../../leaf.full/index.d.mts").LeafSystemSignal} */
	signal;
	/** @param {number} code
	* @param {import("../../leaf.full/index.d.mts").LeafSystemSignal} signal */
	constructor(code, signal) {
		const upThis = this;
		upThis.success = code === 0;
		upThis.code = code;
		upThis.signal = signal;
	};
};

export class LeafCommandOutput extends LeafChildRunStatusModern {
	/** @type {Uint8Array?} */
	#so;
	/** @type {Uint8Array?} */
	#se;
	/** @type {PropertyDescriptorMap} */
	#getters = {
		"stdout": {
			"enumerable": true,
			"configurable": true,
			"get": () => {
				if (this.#so == null) {
					throw(new TypeError("Cannot get 'stdout': 'stdout' is not piped"));
				} else {
					return this.#so;
				}
			}
		},
		"stderr": {
			"enumerable": true,
			"configurable": true,
			"get": () => {
				if (this.#se == null) {
					throw(new TypeError("Cannot get 'stderr': 'stderr' is not piped"));
				} else {
					return this.#se;
				}
			}
		}
	};
	/** @param {number} code
	* @param {import("../../leaf.full/index.d.mts").LeafSystemSignal} signal
	* @param {Uint8Array?} stdout
	* @param {Uint8Array?} stderr */
	constructor(code, signal, stdout, stderr) {
		super(code, signal);
		const upThis = this;
		stdout && (upThis.#so = stdout);
		stderr && (upThis.#se = stderr);
		Object.defineProperties(upThis, upThis.#getters);
	};
};