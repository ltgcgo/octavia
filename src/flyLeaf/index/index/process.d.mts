// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

import {
	DisposableObject,
	ExtendedReadableByteStream,
	Throws,
	WrappedAbortSignal
} from "./conventions.d.mts";
import { LeafSystemSignal } from "./env.d.mts";
import {
	LeafLegacyWrappedReader,
	LeafLegacyWrappedWriter
} from "./io.d.mts";

/** How the runtime should handle standard I/O piping. Documentation only exists in [Node.js](https://nodejs.org/api/child_process.html#optionsstdio) and [the deprecated Deno APIs](https://web.archive.org/web/20220607210142/https://doc.deno.land/deno/stable/~/Deno.run), despite its behaviour still [being essential](https://docs.deno.com/api/deno/subprocess/#Deno.CommandOptions).
* - `inherit`: Pass the standard IOs of the parent running instance through to the child. Causes accesses to the related standard IO fields to throw type errors.
* - `piped`: Pipe the standard IOs between the parent running instance and the child. Permits access to the related standard IO fields.
* - `null`: Completely ignore the standard IOs of the child. Causes accesses to the related fields to throw type errors. */
export type LeafStdIoMode = "inherit"|"piped"|"null";
/** How each child process was run. */
export type LeafRunTypes = "output"|"spawn";

/** Shared properties of command options. */
export interface LeafCommandDetailsCommon {
	/** When true, the running instance will not pass its own environment variables along to the child. The OS itself may still specify certain environment variables. */
	clearEnv?: boolean;
	/** The working directory for the child. Re-uses the same working directory as the parent when not specified. */
	cwd?: string;
	/** Environment variables to pass to the child process. */
	env?: Record<string, string>;
	/** How to handle the standard error, valid values are under `LeafStdIoMode` with documentation. Setting this field to a number throws `TypeError`s, as Leaf disallows raw resource IDs despite its willingness to resurrect deprecated APIs.
	*
	* Defaults to `piped` for `LeafCommand.output` and `LeafCommand.outputSync`, and `inherit` for `LeafCommand.spawn` and `Leaf.run`. */
	stderr? : LeafStdIoMode;
	/** How to handle the standard input, valid values are under `LeafStdIoMode` with documentation. Setting this field to a number throws `TypeError`s, as Leaf disallows raw resource IDs despite its willingness to resurrect deprecated APIs.
	*
	* Defaults to `inherit` for `LeafCommand.output`, `LeafCommand.outputSync`, `LeafCommand.spawn` and `Leaf.run`. */
	stdin? : LeafStdIoMode;
	/** How to handle the standard output, valid values are under `LeafStdIoMode` with documentation. Setting this field to a number throws `TypeError`s, as Leaf disallows raw resource IDs despite its willingness to resurrect deprecated APIs.
	*
	* Defaults to `piped` for `LeafCommand.output` and `LeafCommand.outputSync`, and `inherit` for `LeafCommand.spawn` and `Leaf.run`. */
	stdout? : LeafStdIoMode;
}
/** Properties used by the deprecated `Deno.run`. */
export interface LeafChildRunOptions extends LeafCommandDetailsCommon {
	/** The command to be run. The first argument is the path to the executable, and is always required. */
	cmd: [string|URL, ... string[]];
}
/** Properties used by the modern Deno methods. */
export interface LeafCommandOptions extends LeafCommandDetailsCommon, WrappedAbortSignal {
	/** Arguments to be passed to the child. */
	args?: string[]
	/** Should the child be detached from the running instance. When true, allow the child to run after the parent quits.
	*
	* Note that when detached, if the standard IO streams of the child are inherited or piped, they will block the parent from quitting until the streams all close. You also must call `LeafChildProcess.unref` to allow the running parent to quit. */
	detached?: boolean;
	/** The group ID the child should use upon `setgid`. When set and the ID cannot be set, spawning will throw `PermissionDenied` errors. */
	gid?: number;
	/** The user ID the child should use upon `setuid`. When set and the ID cannot be set, spawning will throw `PermissionDenied` errors. */
	uid?: number;
	/** Skips quoting and escaping of arguments on Windows. Ignored on other OSes. */
	windowsRawArguments?: boolean;
}

/** Shared signal of passed child process status. */
declare interface LeafChildRunPassStatusSignal {
	status: null|undefined;
}
/** Shared properties of passed child process status. */
declare interface LeafChildRunPassStatusCommon {
	success: true,
	code: 0
}
/** Shared properties of failed child process status. */
declare interface LeafChildRunFailStatusCommon {
	success: false,
	code: number
}
/** The deprecated passed child process status. */
declare interface LeafChildRunPassStatusLegacy extends LeafChildRunPassStatusCommon, LeafChildRunPassStatusSignal {}
/** The deprecated failed child process status. */
declare interface LeafChildRunFailStatusLegacy extends LeafChildRunFailStatusCommon {
	status: number;
}
/** The deprecated child process status. */
declare type LeafChildRunStatusLegacy = LeafChildRunPassStatusLegacy|LeafChildRunFailStatusLegacy;
/** The modern passed child process status. */
declare interface LeafChildRunPassStatusModern extends LeafChildRunPassStatusCommon, LeafChildRunPassStatusSignal {}
/** The modern failed child process status. */
declare interface LeafChildRunFailStatusModern extends LeafChildRunFailStatusCommon {
	status: LeafSystemSignal;
}
/** The modern child process status. */
declare type LeafChildRunStatusModern = LeafChildRunPassStatusModern|LeafChildRunFailStatusModern;
/** Shared properties of the output of a child process. */
declare interface LeafCommandOutputCommon<execType extends LeafRunTypes, T extends LeafCommandDetailsCommon> {
	/** The buffered standard error. */
	stderr: execType extends "output" ? (
		T["stderr"] extends "piped"|undefined ? Uint8Array : Throws<TypeError>
	) : (
		T["stderr"] extends "piped" ? Uint8Array : Throws<TypeError>
	);
	/** The buffered standard output. */
	stdout: execType extends "output" ? (
		T["stdout"] extends "piped"|undefined ? Uint8Array : Throws<TypeError>
	) : (
		T["stdout"] extends "piped" ? Uint8Array : Throws<TypeError>
	);
}
/** The output of a passed child process. */
declare interface LeafCommandPassedOutput<execType extends LeafRunTypes, T extends LeafCommandDetailsCommon> extends LeafChildRunPassStatusModern, LeafCommandOutputCommon<execType, T> {}
/** The output of a failed child process. */
declare interface LeafCommandFailedOutput<execType extends LeafRunTypes, T extends LeafCommandDetailsCommon> extends LeafChildRunFailStatusModern, LeafCommandOutputCommon<execType, T> {}
/** The output of a child process. */
declare type LeafCommandOutput<execType extends LeafRunTypes, T extends LeafCommandDetailsCommon> = LeafCommandPassedOutput<execType, T>|LeafCommandFailedOutput<execType, T>;

/** Shared properties of child process instances. */
declare class LeafChildDetailsCommon implements AsyncDisposable {
	/** The process ID of the child. */
	readonly pid: number;
	/** No documentation from Deno. Supposedly send `SIGTERM` to the child according to [Node.js](https://nodejs.org/api/child_process.html#subprocesssymboldispose), then wait until the process finishes execution. */
	[Symbol.asyncDispose](): Promise<void>;
	/** Send a signal to the process, akin to `kill` on POSIX. */
	kill(signal?: LeafSystemSignal|number): void;
}
/** The child process instance. Deprecated by Deno. */
declare class LeafChildRunInstance<T extends LeafCommandDetailsCommon> extends LeafChildDetailsCommon implements DisposableObject {
	/** The Deno-internal resource ID of the child. Accessing this field will cause `TypeError`s to be thrown. */
	readonly rid: Throws<TypeError>;
	/** The standard error. Cannot be used with `LeafChildRunInstance.stderrOutput`. */
	readonly stderr: T["stderr"] extends "piped" ? LeafLegacyWrappedReader<Uint8Array> : Throws<TypeError>;
	/** The standard input. */
	readonly stdin: T["stdin"] extends "piped" ? LeafLegacyWrappedWriter<Uint8Array> : Throws<TypeError>;
	/** The standard output. Cannot be used with `LeafChildRunInstance.output`. */
	readonly stdout: T["stdout"] extends "piped" ? LeafLegacyWrappedReader<Uint8Array> : Throws<TypeError>;
	/** No documentation from Deno. Supposedly send `SIGTERM` to the child according to [Node.js](https://nodejs.org/api/child_process.html#subprocesssymboldispose). */
	close(): void;
	/** Wait until the child has quit, then collect its quit status and potential signal.
	*
	* This promise can never reject. Unlike the modern alternative, to retain backwards compatibility while removing resource IDs, calling this method prevents the running instance from quitting as long as the child runs. */
	status(): Promise<LeafChildRunStatusLegacy>;
	/** Buffer the standard output, wait until the child quits, and return the buffered content. Cannot be used with `LeafChildRunInstance.stdout`. */
	output(): T["stdout"] extends "piped" ? Promise<Uint8Array> : Throws<TypeError>;
	/** Buffer the standard error, wait until the child quits, and return the buffered content. Cannot be used with `LeafChildRunInstance.stderr`. */
	stderrOutput(): T["stderr"] extends "piped" ? Promise<Uint8Array> : Throws<TypeError>;
}
declare class LeafChildProcess<T extends LeafCommandDetailsCommon> extends LeafChildDetailsCommon {
	/** Wait until the child has quit, then collect its quit status and potential signal.
	*
	* This promise can never reject. Accessing this property does not prevent the running instance from quitting, `LeafChildProcess.ref` is required. */
	status: Promise<LeafChildRunStatusModern>;
	/** The standard error. Cannot be used with `LeafChildProcess.output`. */
	stderr: T["stderr"] extends "piped" ? ExtendedReadableByteStream : Throws<TypeError>;
	/** The standard input. */
	stdin: T["stdin"] extends "piped" ? WritableStream<Uint8Array> : Throws<TypeError>;
	/** The standard output. Cannot be used with `LeafChildProcess.output`. */
	stdout: T["stdout"] extends "piped" ? ExtendedReadableByteStream : Throws<TypeError>;
	/** Buffer the standard output and error, wait until the child quits, and return the buffered content. Cannot be used with `LeafChildProcess.stderr` or `LeafChildProcess.stdout`. */
	output(): Promise<LeafCommandOutput<"spawn", T>>;
	/** Ensures that the status of the child blocks the runtime instance from quitting. */
	ref(): void;
	/** Ensures that the status of the child does not block the runtime instance from quitting. */
	unref(): void;
}

/**  */
declare class LeafCommand<T extends LeafCommandDetailsCommon> {
	output(): Promise<LeafCommandOutput<"output", T>>;
	outputSync(): LeafCommandOutput<"output", T>;
	spawn(): LeafChildProcess<T>;
}
/**  */
export const Command: typeof LeafCommand;

/** Send a signal to the process with the given process ID. If the process does not exist, this method will throw. UNIX-like systems allow using negative process IDs to select process groups instead, which throws on Windows.
*
* Except for `0` used to test the existence of a process, avoid using numeric signals as they are OS-dependent. Always prefer strings, defined under `LeafSystemSignal`.
* @param pid Target process ID.
* @param signal The signal to send. */
export function kill(pid: number, signal?: LeafSystemSignal|number): void;
/** Runs a command as a child process. Deprecated by Deno. */
export function run<T extends LeafChildRunOptions>(details: T): LeafChildRunInstance<T>;
/**  */
export function spawn<T extends LeafChildRunOptions>(): LeafChildProcess<T>;
/**  */
export function spawnAndWait<T extends LeafChildRunOptions>(): LeafChildProcess<T>;
/**  */
export function spawnAndWaitSync<T extends LeafChildRunOptions>(): LeafChildProcess<T>;