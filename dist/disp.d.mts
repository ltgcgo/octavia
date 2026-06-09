// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/** Bundled visualisers in the form of LCD screens, available as a module.
* @license LGPL-3.0-only
* @module cc.ltgc.octavia.disp
*/

import type {
	FocusedPartDisplay
} from "./basic.d.mts";

/** The recreated LCD screen of the Yamaha MU lineup, matching MU2000. Recommended for all non-PSR XG visualisations. */
export class MuDisplay extends FocusedPartDisplay {
	/** If the 2-pixel-wide strength metres are affected by panning. */
	isMetreAffectedByPan: boolean;
	/** If contrast support is enabled. Enabling contrast support disables pixel transition blurring. Defaults to `false`. */
	isLcdContrastEnabled: boolean;
	constructor();
}

/** The recreated LCD screen of KORG NS5R. Recommended for all KORG AG, X5 and N5 visualisations. */
export class Ns5rDisplay extends FocusedPartDisplay {
	/** If contrast support is enabled. Enabling contrast support disables pixel transition blurring. Defaults to `true`. */
	isLcdContrastEnabled: boolean;
	constructor(conf: {
		/** When `true`, the pixels will transition smoothly. */
		useBlur?: boolean;
	});
}

/** The recreated LCD screen of the lower-end Yamaha PSR lineup, matching PSR-170. Recommended for PSR XG visualisations. */
export class PsrDisplay extends FocusedPartDisplay {
	constructor();
}

/** The recreated LCD screen of the Yamaha QY lineup, matching QY100. Recommended for song visualisations targeting QY, or containing chord, style pattern or YMCS section data. */
export class QyDisplay extends FocusedPartDisplay {
	constructor();
}

/** The recreated LCD screen of the Roland SoundCanvas lineup, matching SC-88 Pro. Recommended for all GS visualisations. */
export class ScDisplay extends FocusedPartDisplay {
	constructor(conf: {
		/** When `true`, the pixels will transition smoothly. */
		useBlur?: boolean;
	});
}

/** The recreated LCD screen of the Roland SoundCanvas lineup, matching SC-8850. Recommended for all GS visualisations. */
export class Sc8850Display extends FocusedPartDisplay {
	constructor(conf: {
		/** When `true`, the pixels will transition smoothly. */
		useBlur?: boolean;
	});
}
