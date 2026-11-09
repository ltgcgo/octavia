// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

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
	/** The actual backend behind Fly Leaf.
	*
	* This field is always provided, but made optional to satisfy type checks from the real Deno counterpart. */
	backend?: "Ant"|"Bun"|"Deno"|"Ende"|"Node"|"Porffor"|"Txiki";
	/** The actual JS engine behind the runtime.
	*
	* This field is always provided, but made optional to satisfy type checks from the real Deno counterpart. */
	engine?: "Ant Silver"|"JavaScriptCore"|"LibJS"|"Porffor"|"QuickJS"|"SpiderMonkey"|"V8";
	/** The version of the actual backend behind Fly Leaf.
	*
	* This field is always provided whenever possible, but made optional to satisfy type checks from the real Deno counterpart. */
	release?: string;
	/** The version of Fly Leaf being run.
	*
	* This field is always provided, but made optional to satisfy type checks from the real Deno counterpart. */
	flyLeaf?: string;
	/** When `true`, synchronous versions of the methods are not available, only asynchronous versions are.
	*
	* This field is always provided, but made optional to satisfy type checks from the real Deno counterpart. */
	asyncOnly?: boolean;
	/** The runtime-native versions object. */
	versions?: Record<string, string>|DenoVersion|NodeVersion;
}
/** The Deno version object extended by Fly Leaf. */
export type Version = LeafVersion;
/** The Deno version object extended by Fly Leaf. */
export const version: LeafVersion;

/** The Deno build information object. */
declare interface DenoBuildInfo {
	/** Processor architecture of the current machine in the LLVM format.
	*
	* Fly Leaf permits way more than the original runtime, because it allows Deno code to be run on not just `aarch64` and `x86_64`. */
	arch: "arm"|"armeb"|"aarch64"|"aarch64_be"|"loongarch64"|"mips"|"mipsel"|"mips64"|"mips64el"|"ppc"|"ppcle"|"ppc64"|"ppc64le"|"riscv32"|"riscv32be"|"riscv64"|"riscv64be"|"systemz"|"wasm32"|"x86"|"x86_64";
	/** Operating system ID of the current machine. */
	os: "aix"|"android"|"darwin"|"freebsd"|"illumos"|"linux"|"netbsd"|"openbsd"|"solaris"|"windows";
	/** Unknown attribute that's always false. Set to `boolean` here in case this does not satisfy the real Deno build object. */
	standalone: boolean;
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
	archNormal?: "arm32"|"arm32be"|"arm64"|"arm64be"|"loong64"|"mips"|"mipsle"|"mips64"|"mips64le"|"ppc"|"ppcle"|"ppc64"|"ppc64le"|"riscv32"|"riscv32be"|"riscv64"|"riscv64be"|"s390"|"s390x"|"wasm32"|"x86"|"amd64";
}
/** The Deno build information object extended by Fly Leaf. */
export type BuildInfo = LeafBuildInfo;
/** The Deno build information object extended by Fly Leaf. */
export const build: LeafBuildInfo;

/** A snapshot of the environment variables. */
declare interface LeafEnvSnapshot extends Record<string, string> {}
/** Environment variables. */
declare interface LeafEnv {
	/** Remove an environment variable. */
	delete(key: string): void;
	/** Get the value of an environment variable. */
	get(key: string): string|undefined;
	/** Test if an environment variable exists. */
	has(key: string): boolean;
	/** Set the value of an environment variable. */
	set(key: string, value: string): void;
	/** Take a snapshot of the current environment variables. */
	toObject(): LeafEnvSnapshot;
}
export type Env = LeafEnv;

/** Memory usage summary snapshot. */
declare interface LeafMemoryUsage {
	/** Memory in bytes used to store JS objects by the running instance. */
	external: number;
	/** Total heap size of the running instance in bytes. */
	heapTotal: number;
	/** Used heap size of the running instance in bytes. */
	heapUsed: number;
	/** Resident set size in bytes. Amount of memory actually used by the running instance. */
	rss: number;
}
export type MemoryUsage = LeafMemoryUsage;

/** System memory statistics summary snapshot. */
declare interface LeafSystemMemoryInfo {
	/** An estimation in bytes of how much RAM capacity is available for new processes without swapping.
	*
	* Unlike `cached` or `free`, this field also considers page cache, and the fact that not all reclaimable RAM will be reclaimed. */
	available: number;
	/** Memory capacity occupied by kernel buffers in bytes. */
	buffers: number;
	/** Memory capacity occupied by page cache and slabs in bytes. */
	cached: number;
	/** Vacant RAM capacity in bytes. */
	free: number;
	/** Total RAM capacity in bytes. */
	total: number;
	/** Vacant swap capacity in bytes. */
	swapFree: number;
	/** Total swap capacity in bytes. */
	swapTotal: number;
}
export type SystemMemoryInfo = LeafSystemMemoryInfo;

/** Valid system signals. Windows does not support signals, as such only a subset of the emulated signals will be available. */
declare type LeafSystemSignal = "SIGABRT"|"SIGALRM"|"SIGBREAK"|"SIGBUS"|"SIGCHLD"|"SIGCONT"|"SIGEMT"|"SIGFPE"|"SIGHUP"|"SIGILL"|"SIGINFO"|"SIGINT"|"SIGIO"|"SIGKILL"|"SIGPIPE"|"SIGPOLL"|"SIGPROF"|"SIGPWR"|"SIGQUIT"|"SIGSEGV"|"SIGSTKFLT"|"SIGSTOP"|"SIGSYS"|"SIGTERM"|"SIGTRAP"|"SIGTSTP"|"SIGTTIN"|"SIGTTOU"|"SIGUNUSED"|"SIGURG"|"SIGUSR1"|"SIGUSR2"|"SIGVTALRM"|"SIGWINCH"|"SIGXCPU"|"SIGXFSZ";
export type Signal = LeafSystemSignal;

/** Register the system signal receiver with the given one. Certain OSes only implement a subset of these signals, and certain OSes like Windows rely on emulation.
*
* Be cautious about replacing certain signal receivers. Like `SIGTERM`, as just like on Node.js, the runtime may not be able to quit the normal way. */
export function addSignalListener(signal: LeafSystemSignal, receiver: () => void): void;
/** Command line arguments passed to the running instance. */
export const args: string[];
/** Change the current working directory. */
export function chdir(folder: string|URL): void;
/** Get the current working directory. */
export function cwd(): string;
/** Interact with environment variables. */
export const env: LeafEnv;
/** Get the path to the current running executable. */
export function execPath(): string;
/** Quit the running instance. If `exitCode` is specified, the exit code will be set to the value.
*
* Unlike what's claimed by the official documentation, when `exitCode` is not supplied, the actual implementation will use `Deno.exitCode` instead. */
export function exit(exitCode?: number): never;
/** The exit code of the running instance.
*
* Due to fundamental limitations, this does **not** work with glob imports without applying the overlay, or with granular imports at all. Use `Deno.exit()` instead if not using the runtime global, the default export, or the overlay-applied global. */
export let exitCode: number;
/** Get the group ID of the current running executable. Certain OSes like Windows return `null` instead. */
export function gid(): number|null;
/** Get the hostname of the current device. */
export function hostname(): string;
/** Get the averaged system load factor of the past minute, past 5 minutes and past 15 minutes. */
export function loadavg(): [number, number, number];
/** URL to the entrypoint. */
export const mainModule: string;
/** Summarise a snapshot of the memory usage of the current running instance. */
export function memoryUsage(): LeafMemoryUsage;
/** Reflects [`NO_COLOR`](https://no-color.org/). When `true`, the environment should not use ANSI colours. */
export const noColor: boolean;
/** Get the OS release version string. Equivalent to `uname -r` on POSIX. */
export function osRelease(): string;
/** Get the total system uptime in seconds. */
export function osUptime(): number;
/** Process ID of the current running instance. */
export const pid: number;
/** Parent process ID of the current running instance. */
export const ppid: number;
/** Ensure the given schedule ID returned by `setInterval` or `setTimeout` block the event loop from finishing. */
export function refTimer(scheduleId: number): void;
/** Unregister the system signal receiver with the given one. Certain OSes only implement a subset of these signals, and certain OSes like Windows rely on emulation. */
export function removeSignalListener(signal: LeafSystemSignal, receiver: () => void): void;
/** Summarise a snapshot of the memory usage statistics of the OS. */
export function systemMemoryInfo(): LeafSystemMemoryInfo;
/** Get the user ID of the current running executable. Certain OSes like Windows return `null` instead. */
export function uid(): number|null;
/** Ensure the given schedule ID returned by `setInterval` or `setTimeout` does not the event loop from finishing. */
export function unrefTimer(scheduleId: number): void;