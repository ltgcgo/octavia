// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/** The vanilla Deno version object. */
declare class DenoVersion {
	/** The version of Deno Fly Leaf is posing as. */
	deno: string;
	/** If running on Ende, the version of Ende. */
	ende?: string;
	/** The version of TypeScript Fly Leaf is posing as. If the runtime does not have TypeScript support, this field is undefined. */
	typescript?: string;
	/** The version of V8 of the runtime.
	*
	* Presence of this field does not indicate the runtime being based on V8, as some V8-free runtimes like Bun sets this field regardless. */
	v8?: string;
}
/** The Node.js-compatible version object. */
declare class NodeVersion {
	/** Node.js-native module version. */
	acorn?: string;
	/** Node.js-native module version. */
	ada?: string;
	/** Node.js-compatible module version. */
	ares: string;
	/** Bun-native module version. */
	boringssl?: string;
	/** Bun-native module version. */
	bun?: string;
	/** Node.js-compatible module version. */
	brotli?: string;
	/** Node.js-native module version. */
	cjs_module_lexer?: string;
	/** Node.js-compatible module version. */
	cldr?: string;
	/** Deno-native module version. */
	deno?: string;
	/** Node.js-compatible module version. */
	icu?: string;
	/** Node.js-native module version. */
	http_parser?: string;
	/** Bun-native module version. */
	libarchive?: string;
	/** Bun-native module version. */
	libdeflate?: string;
	/** Node.js-compatible module version. */
	llhttp?: string;
	/** Bun-native module version. */
	lolhtml?: string;
	/** Bun-native module version. */
	lshpack?: string;
	/** Bun-native module version. */
	mimalloc?: string;
	/** Node.js-compatible module version. */
	modules: string;
	/** Node.js-compatible module version. */
	napi?: string;
	/** Node.js-compatible module version. */
	nghttp2?: string;
	/** Node.js-compatible module version. */
	nghttp3?: string;
	/** Node.js-compatible module version. */
	ngtcp2?: string;
	/** Node.js-compatible module version. */
	node: string;
	/** Node.js-compatible module version. */
	openssl: string;
	/** Bun-native module version. */
	picohttpparser?: string;
	/** Node.js-native module version. */
	simdutf?: string;
	/** Node.js-compatible module version. */
	sqlite?: string;
	/** Bun-native module version. */
	tinycc?: string;
	/** Deno-native module version. */
	typescript?: string;
	/** Node.js-native module version. */
	tz?: string;
	/** Node.js-compatible module version. */
	unicode?: string;
	/** Bun-native module version. */
	usockets?: string;
	/** Node.js-compatible module version. */
	uv: string;
	/** Bun-native module version. */
	uwebsockets?: string;
	/** Node.js-native module version. */
	uvwasi?: string;
	/** Node.js-compatible module version. */
	v8: string;
	/** Bun-native module version. */
	webkit?: string;
	/** Bun-native module version. */
	zig?: string;
	/** Node.js-compatible module version. */
	zlib: string;
	/** Node.js-compatible module version. */
	zstd?: string;
}
/** The Deno version object extended by Fly Leaf. */
export class LeafVersion extends DenoVersion {
	/** The actual backend behind Fly Leaf. */
	backend: "Bun" | "Deno" | "Ende" | "Node" | "Porffor" | "Txiki";
	/** The actual JS engine behind the runtime. */
	engine: "JavaScriptCore" | "LibJS" | "Porffor" | "QuickJS" | "SpiderMonkey" | "V8";
	/** The version of Fly Leaf being run. */
	flyLeaf: string;
	/** The runtime-native versions object. */
	versions: Record<string, string> | DenoVersion | NodeVersion;
}
/** The extended  */
export const version: LeafVersion;