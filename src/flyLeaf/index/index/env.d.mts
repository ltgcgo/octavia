// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/** The vanilla Deno version object. */
declare interface DenoVersion {
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
declare interface NodeVersion {
	/** Node.js-native module version. */
	acorn?: string;
	/** Node.js-native module version. */
	ada?: string;
	/** Ant-native module version. */
	ant?: string;
	/** Node.js-compatible module version. */
	ares: string;
	/** Node.js-foreign module version. */
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
	/** Ant-native module version. */
	libffi?: string;
	/** Node.js-compatible module version. */
	llhttp?: string;
	/** Ant-native module version. */
	lmdb?: string;
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
	/** Ant-native module version. */
	pcre2?: string;
	/** Ant-native module version. */
	skim?: string;
	/** Ant-native module version. */
	silver?: string;
	/** Node.js-native module version. */
	simdutf?: string;
	/** Ant-native module version. */
	simdjson?: string;
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
	/** Ant-native module version. */
	utf8proc?: string;
	/** Node.js-compatible module version. */
	uv: string;
	/** Bun-native module version. */
	uwebsockets?: string;
	/** Node.js-native module version. */
	uvwasi?: string;
	/** Node.js-compatible module version. */
	v8: string;
	/** Ant-native module version. */
	wamr?: string;
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
declare interface LeafVersion extends DenoVersion {
	/** The actual backend behind Fly Leaf. */
	backend: "Ant"|"Bun"|"Deno"|"Ende"|"Node"|"Porffor"|"Txiki";
	/** The actual JS engine behind the runtime. */
	engine: "Ant Silver"|"JavaScriptCore"|"LibJS"|"Porffor"|"QuickJS"|"SpiderMonkey"|"V8";
	/** The version of Fly Leaf being run. */
	flyLeaf: string;
	/** When `true`, synchronous versions of the methods are not available, only asynchronous versions are. */
	asyncOnly: boolean;
	/** The runtime-native versions object. */
	versions: Record<string, string>|DenoVersion|NodeVersion;
}
/** The Deno version object extended by Fly Leaf. */
export const version: LeafVersion;

/** The Deno build information object. */
declare interface DenoBuildInfo {
	/** Processor architecture of the current machine in the LLVM format. */
	arch: "arm"|"armeb"|"aarch64"|"aarch64_be"|"loongarch64"|"mips"|"mipsel"|"mips64"|"mips64el"|"ppc"|"ppcle"|"ppc64"|"ppc64le"|"riscv32"|"riscv32be"|"riscv64"|"riscv64be"|"systemz"|"wasm32"|"x86"|"x86_64";
	/** Operating system ID of the current machine. */
	os: "aix"|"android"|"darwin"|"freebsd"|"linux"|"netbsd"|"openbsd"|"windows";
	/** Unknown attribute that's always false. */
	standalone: false;
	/** Compile target specifier in the LLVM format.
	* - For `darwin`, valid configurations include `aarch64-apple-darwin` and `x86_64-apple-darwin`.
	* - For `windows`, valid configurations include `aarch64-pc-windows` and `x86_64-pc-windows`.
	* - Compiled executables on other operating systems may use their own conventions. */
	target: string;
	/** Target device vendor of the current runtime.
	- `apple`: Exclusive to `darwin`.
	- `linux`: Exclusive to `android` (Termux). Not guaranteed.
	- `pc`: Exclusive to `windows`. */
	vendor: "apple"|"linux"|"pc"|"unknown";
	/** Additional build information that may or may not be present. Some runtimes like Deno may report `gnu` here, but do not treat it as guaranteed. */
	env?: string;
}
/** The Deno build information object extended by Fly Leaf. */
declare interface LeafBuildInfo extends DenoBuildInfo {
	/** The processor architecture of the current machine in LTGC format. */
	archNormal: "arm32"|"arm32be"|"arm64"|"arm64be"|"loong64"|"mips"|"mipsle"|"mips64"|"mips64le"|"ppc"|"ppcle"|"ppc64"|"ppc64le"|"riscv32"|"riscv32be"|"riscv64"|"riscv64be"|"s390"|"s390x"|"wasm32"|"x86"|"amd64";
}
/** The Deno build information object extended by Fly Leaf. */
export const build: LeafBuildInfo;

/** The command line arguments passed to the runtime. */
export const args: string[];