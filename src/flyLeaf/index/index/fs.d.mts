// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

import type {
	WrappedAbortSignal
} from "./conventions.d.mts";
import type {
	LeafSeekMode,
    LeafSetRawOptions
} from "./io.d.mts";

export interface LeafDirEntry {
	/**  */
	name: string;
	/**  */
	isDirectory: boolean;
	/**  */
	isFile: boolean;
	/**  */
	isSymlink: boolean;
}

export interface LeafFileInfo {
	/**  */
	atime?: Date;
	/**  */
	birthtime?: Date;
	/**  */
	blksize?: number;
	/**  */
	blocks?: number;
	/**  */
	ctime?: Date;
	/**  */
	dev: number;
	/**  */
	gid?: number;
	/**  */
	ino?: number;
	/**  */
	isBlockDevice?: boolean;
	/**  */
	isCharDevice?: boolean;
	/**  */
	isDirectory: boolean;
	/**  */
	isFifo?: boolean;
	/**  */
	isFile: boolean;
	/**  */
	isSocket?: boolean;
	/**  */
	isSymlink: boolean;
	/**  */
	mode?: number;
	/**  */
	mtime?: Date;
	/**  */
	nlink?: number;
	/**  */
	rdev?: number;
	/**  */
	size: number;
	/**  */
	uid?: number;
}

export interface LeafFsEvent {
	/**  */
	flag?: "rescan";
	/**  */
	kind: "access"|"create"|"modify"|"remove"|"rename"|"other"|"any";
	/**  */
	path: string[];
}

export class LeafFsFile {
	/**  */
	readable: ReadableStream<Uint8Array>;
	/**  */
	writable: WritableStream<Uint8Array>;
	/**  */
	close(): void;
	/**  */
	isTerminal(): boolean;
	/**  */
	lock(exclusive?: boolean): Promise<void>;
	/**  */
	lockSync(exclusive?: boolean): void;
	/**  */
	read(buffer: Uint8Array): Promise<number|null>;
	/**  */
	readSync(buffer: Uint8Array): number|null;
	/**  */
	seek(offset: number|bigint, whence: LeafSeekMode): Promise<number>;
	/**  */
	seekSync(offset: number|bigint, whence: LeafSeekMode): number;
	/**  */
	setRaw(mode: boolean, options?: LeafSetRawOptions): void;
	/**  */
	stat(): Promise<LeafFileInfo>;
	/**  */
	statSync(): LeafFileInfo;
	/**  */
	sync(): Promise<void>;
	/**  */
	syncData(): Promise<void>;
	/**  */
	syncDataSync(): Promise<void>;
	/**  */
	syncSync(): Promise<void>;
	/**  */
	truncate(size?: number): Promise<void>;
	/**  */
	truncateSync(size?: number): void;
	/**  */
	tryLock(exclusive?: boolean): void;
	/**  */
	tryLockSync(exclusive?: boolean): void;
	/**  */
	unlock(): Promise<void>;
	/**  */
	unlockSync(): Promise<void>;
	/**  */
	utime(atime: number|Date, mtime: number|Date): Promise<void>;
	/**  */
	utimeSync(atime: number|Date, mtime: number|Date): void;
	/**  */
	write(buffer: Uint8Array): Promise<number>;
	/**  */
	writeSync(buffer: Uint8Array): number;
}

export interface LeafMakeTempOptions {
	/**  */
	dir?: string;
	/**  */
	prefix?: string;
	/**  */
	suffix?: string;
}

export interface LeafMkdirOptions {
	/**  */
	mode?: number;
	/**  */
	recursive?: boolean;
}

export interface LeafOpenOptions {
	/**  */
	append?: boolean;
	/**  */
	create?: boolean;
	/**  */
	createNew?: boolean;
	/**  */
	mode?: number;
	/**  */
	read?: boolean;
	/**  */
	truncate?: boolean;
	/**  */
	write?: boolean;
}

declare type LeafReadFileOptions = WrappedAbortSignal;

export interface LeafRemoveOptions {
	/**  */
	recursive?: boolean;
}

export interface LeafSymlinkOptions {
	/**  */
	type: "file"|"dir"|"junction";
}

export interface LeafWriteFileOptions extends WrappedAbortSignal {
	/**  */
	append?: boolean;
	/**  */
	create?: boolean;
	/**  */
	createNew?: boolean;
	/**  */
	mode?: number;
	/**  */
	read?: boolean;
	/**  */
	truncate?: boolean;
	/**  */
	write?: boolean;
}