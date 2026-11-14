// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

/** Deno-specific errors. */
export namespace errors {
	/** Thrown when attempting to listen on an occuplied address and port combination. */
	export class LeafHostOccupied extends Error {
		/** Name of the error. */
		name: "AddrInUse";
	}
	export type AddrInUse = LeafHostOccupied;
	/** Thrown when the OS errors out with `EADDRNOTAVAIL`. */
	export class LeafHostUnavailable extends Error {
		/** Name of the error. */
		name: "AddrNotAvailable";
	}
	export type AddrNotAvailable = LeafHostUnavailable;
	/** Thrown when creating a resource already existed. */
	export class LeafExisted extends Error {
		/** Name of the error. */
		name: "AlreadyExists";
	}
	export type AlreadyExists = LeafExisted;
	/** Thrown when the underlying IO resource is closed or invalid. */
	export class LeafResourceInvalid extends Error {
		/** Name of the error. */
		name: "BadResource";
	}
	export type BadResource = LeafResourceInvalid;
	/** Thrown when a stream cannot write to the resource and the stream pipe breaks.
	*
	* Examples include the runtime writing to `stdout` or `stderr`, while the OS cannot actually write to the designated resources. */
	export class LeafPipeBroken extends Error {
		/** Name of the error. */
		name: "BrokenPipe";
	}
	export type BrokenPipe = LeafPipeBroken;
	/** Thrown when the resource is blocked by another ongoing process. */
	export class LeafResourceBusy extends Error {
		/** Name of the error. */
		name: "Busy";
	}
	export type Busy = LeafResourceBusy;
	/** Thrown when the OS errors out with `ECONNABORTED`. */
	export class LeafConnAborted extends Error {
		/** Name of the error. */
		name: "ConnectionAborted";
	}
	export type ConnectionAborted = LeafConnAborted;
	/** Thrown when the OS reports that the connection has been refused. */
	export class LeafConnRefused extends Error {
		/** Name of the error. */
		name: "ConnectionRefused";
	}
	export type ConnectionRefused = LeafConnRefused;
	/** Thrown when the OS reports that the connection has been reset.
	*
	* This can happen normally over the network due to premature connection shutdowns. Or also abnormally, if the stateful socket goes through a network with DPI-based censorship systems that [injects bidirectional resets](https://en.wikipedia.org/wiki/TCP_reset_attack). */
	export class LeafConnReset extends Error {
		/** Name of the error. */
		name: "ConnectionReset";
	}
	export type ConnectionReset = LeafConnReset;
	/** Thrown when resolving too many symbolic links. */
	export class LeafFsLooped extends Error {
		/** Name of the error. */
		name: "FilesystemLoop";
	}
	export type FilesystemLoop = LeafFsLooped;
	/** Thrown when too many redirects were encountered during resource imports.
	*
	* If the original Deno documentation is to be believed, Fly Leaf cannot throw this error at all. Deno itself doesn't throw this error either despite their own documentation. */
	export class LeafTooManyRedirects extends Error {
		/** Name of the error. */
		name: "Http";
	}
	export type Http = LeafTooManyRedirects;
	/** Thrown when the OS errors out with `EINTR`. */
	export class LeafInterrupted extends Error {
		/** Name of the error. */
		name: "Interrupted";
	}
	export type Interrupted = LeafInterrupted;
	/** Thrown when an action returned unusable data. */
	export class LeafDataInvalid extends Error {
		/** Name of the error. */
		name: "InvalidData";
	}
	export type InvalidData = LeafDataInvalid;
	/** Thrown when trying to treat a folder like a file-like entity. */
	export class LeafFolderAsFile extends Error {
		/** Name of the error. */
		name: "IsADirectory";
	}
	export type IsADirectory = LeafFolderAsFile;
	/** Thrown when the socket cannot reach the remote host. */
	export class LeafNetworkUnreachable extends Error {
		/** Name of the error. */
		name: "NetworkUnreachable";
	}
	export type NetworkUnreachable = LeafNetworkUnreachable;
	/** Thrown when trying to treat a file-like entity like a folder. */
	export class LeafFileAsFolder extends Error {
		/** Name of the error. */
		name: "NotADirectory";
	}
	export type NotADirectory = LeafFileAsFolder;
	/** Thrown when the relevant runtime permissions has not been granted. */
	export class LeafPermNotGranted extends Error {
		/** Name of the error. */
		name: "NotCapable";
	}
	export type NotCapable = LeafPermNotGranted;
	/** Thrown when the OS errors out with no network connectivity.
	*
	* This can happen with poor network connectivity, or in regions with abnormally stringent network censorship. */
	export class LeafNetworkDisconnected extends Error {
		/** Name of the error. */
		name: "NotConnected";
	}
	export type NotConnected = LeafNetworkDisconnected;
	/** Thrown when the OS reports the file-like entity as not found.
	*
	* While the actual Deno runtime may sometimes throw `undefined` errors in certain cases, Fly Leaf throws `LeafNotFound` instead per documentation. */
	export class LeafNotFound extends Error {
		/** Name of the error. */
		name: "NotFound";
	}
	export type NotFound = LeafNotFound;
	/** Thrown when Leaf cannot currently perform an action. */
	export class LeafUnsupported extends Error {
		/** Name of the error. */
		name: "NotSupported";
	}
	export type NotSupported = LeafUnsupported;
	/** Thrown when the OS determined the runtime to not have sufficient permissions. */
	export class LeafPermDenied extends Error {
		/** Name of the error. */
		name: "PermissionDenied";
	}
	export type PermissionDenied = LeafPermDenied;
	/** Thrown when the OS determined the IO has timed out.
	*
	* This can happen normally both on the machine and over the network. Or abnormally, if the socket goes through a network with DPI-based censorship systems that drops/blackholes packets. */
	export class LeafTimedOut extends Error {
		/** Name of the error. */
		name: "TimedOut";
	}
	export type TimedOut = LeafTimedOut;
	/** Thrown when End-of-File was encountered when reading from a resource. */
	export class LeafEofUnexpected extends Error {
		/** Name of the error. */
		name: "UnexpectedEof";
	}
	export type UnexpectedEof = LeafEofUnexpected;
	/** Thrown when a non-blocking API is used when the OS needs to block to complete. */
	export class LeafBlockNeeded extends Error {
		/** Name of the error. */
		name: "WouldBlock";
	}
	export type WouldBlock = LeafBlockNeeded;
	/** Thrown when no bytes were written to an IO buffer. */
	export class LeafDataUnwritten extends Error {
		/** Name of the error. */
		name: "WriteZero";
	}
	export type WriteZero = LeafDataUnwritten;
}