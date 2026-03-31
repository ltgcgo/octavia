// 2022-2026 (C) Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

let SeamstressChunk = class SeamstressChunk {
	id = 0;
	type = null;
	offset = 0;
	data = null;
	context = null;
};

let SeamstressStrictWriter = class SeamstressStrictWriter {};

let Seamstress = class Seamstress {
	static MASK_ENDIAN = 1;
	static MASK_LENGTH = 2;
	static MASK_PADDED = 4;
	static MASK_TYPE = 8;
	static ENDIAN_B = 0;
	static ENDIAN_L = 1;
	static LENGTH_VLV = 0;
	static LENGTH_U32 = 2;
	static TYPE_VLV = 0;
	static TYPE_4CC = 8;
	headerSize = 0;
	readStream(stream) {};
	readChunks(stream) {};
	writeStrict(headerSerializer) {};
	writeChunks(serializedHeader) {};
	getMapFromStream(stream) {};
};

export {
	Seamstress,
	SeamstressStrictWriter
}
