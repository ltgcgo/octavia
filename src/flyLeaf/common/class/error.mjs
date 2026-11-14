// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

export class LeafHostOccupied extends Error {
	name = "AddrInUse";
};

export class LeafHostUnavailable extends Error {
	name = "AddrNotAvailable";
};

export class LeafExisted extends Error {
	name = "AlreadyExists";
};

export class LeafResourceInvalid extends Error {
	name = "BadResource";
};

export class LeafPipeBroken extends Error {
	name = "BrokenPipe";
};

export class LeafResourceBusy extends Error {
	name = "Busy";
};

export class LeafConnAborted extends Error {
	name = "ConnectionAborted";
};

export class LeafConnRefused extends Error {
	name = "ConnectionRefused";
};

export class LeafConnReset extends Error {
	name = "ConnectionReset";
};

export class LeafFsLooped extends Error {
	name = "FilesystemLoop";
};

export class LeafTooManyRedirects extends Error {
	name = "Http";
};

export class LeafInterrupted extends Error {
	name = "Interrupted";
};

export class LeafDataInvalid extends Error {
	name = "InvalidData";
};

export class LeafFolderAsFile extends Error {
	name = "IsADirectory";
};

export class LeafNetworkUnreachable extends Error {
	name = "NetworkUnreachable";
};

export class LeafFileAsFolder extends Error {
	name = "NotADirectory";
};

export class LeafPermNotGranted extends Error {
	name = "NotCapable";
};

export class LeafNotFound extends Error {
	name = "NotFound";
};

export class LeafUnsupported extends Error {
	name = "NotSupported";
};

export class LeafPermDenied extends Error {
	name = "PermissionDenied";
};

export class LeafTimedOut extends Error {
	name = "TimedOut";
};

export class LeafEofUnexpected extends Error {
	name = "UnexpectedEof";
};

export class LeafBlockNeeded extends Error {
	name = "WouldBlock";
};

export class LeafDataUnwritten extends Error {
	name = "WriteZero";
};

export default new (class LeafErrors {
	LeafHostOccupied = LeafHostOccupied;
	AddrInUse = LeafHostOccupied;

	LeafHostUnavailable = LeafHostUnavailable;
	AddrNotAvailable = LeafHostUnavailable;

	LeafExisted = LeafExisted;
	AlreadyExists = LeafExisted;

	LeafResourceInvalid = LeafResourceInvalid;
	BadResource = LeafResourceInvalid;

	LeafPipeBroken = LeafPipeBroken;
	BrokenPipe = LeafPipeBroken;

	LeafResourceBusy = LeafResourceBusy;
	Busy = LeafResourceBusy;

	LeafConnAborted = LeafConnAborted;
	ConnectionAborted = LeafConnAborted;

	LeafConnRefused = LeafConnRefused;
	ConnectionRefused = LeafConnRefused;

	LeafConnReset = LeafConnReset;
	ConnectionReset = LeafConnReset;

	LeafFsLooped = LeafFsLooped;
	FilesystemLoop = LeafFsLooped;

	LeafTooManyRedirects = LeafTooManyRedirects;
	Http = LeafTooManyRedirects;

	LeafInterrupted = LeafInterrupted;
	Interrupted = LeafInterrupted;

	LeafDataInvalid = LeafDataInvalid;
	InvalidData = LeafDataInvalid;

	LeafFolderAsFile = LeafFolderAsFile;
	IsADirectory = LeafFolderAsFile;

	LeafNetworkUnreachable = LeafNetworkUnreachable;
	NetworkUnreachable = LeafNetworkUnreachable;

	LeafFileAsFolder = LeafFileAsFolder;
	NotADirectory = LeafFileAsFolder;

	LeafPermNotGranted = LeafPermNotGranted;
	NotCapable = LeafPermNotGranted;

	LeafNotFound = LeafNotFound;
	NotFound = LeafNotFound;

	LeafUnsupported = LeafUnsupported;
	NotSupported = LeafUnsupported;

	LeafPermDenied = LeafPermDenied;
	PermissionDenied = LeafPermDenied;

	LeafTimedOut = LeafTimedOut;
	TimedOut = LeafTimedOut;

	LeafEofUnexpected = LeafEofUnexpected;
	UnexpectedEof = LeafEofUnexpected;

	LeafBlockNeeded = LeafBlockNeeded;
	WouldBlock = LeafBlockNeeded;

	LeafDataUnwritten = LeafDataUnwritten;
	WriteZero = LeafDataUnwritten;
})();