// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { _leaf_copyTo_, _leaf_yield_ } from "../../common/util/overlay.mjs";

const Deno = self.Deno ?? self.Ende;

export const errors = _leaf_copyTo_(new (class LeafErrors {})(), Deno.errors);

errors.LeafHostOccupied = errors.AddrInUse;
errors.LeafHostUnavailable = errors.AddrNotAvailable;
errors.LeafExisted = errors.AlreadyExists;
errors.LeafResourceInvalid = errors.BadResource;
errors.LeafPipeBroken = errors.BrokenPipe;
errors.LeafResourceBusy = errors.Busy;
errors.LeafConnAborted = errors.ConnectionAborted;
errors.LeafConnRefused = errors.ConnectionRefused;
errors.LeafConnReset = errors.ConnectionReset;
errors.LeafFsLooped = errors.FilesystemLoop;
errors.LeafTooManyRedirects = errors.Http;
errors.LeafInterrupted = errors.Interrupted;
errors.LeafDataInvalid = errors.InvalidData;
errors.LeafFolderAsFile = errors.IsADirectory;
errors.LeafNetworkUnreachable = errors.NetworkUnreachable;
errors.LeafFileAsFolder = errors.NotADirectory;
errors.LeafPermNotGranted = errors.NotCapable;
errors.LeafNetworkDisconnected = errors.NotConnected;
errors.LeafNotFound = errors.NotFound;
errors.LeafUnsupported = errors.NotSupported;
errors.LeafPermDenied = errors.PermissionDenied;
errors.LeafTimedOut = errors.TimedOut;
errors.LeafEofUnexpected = errors.UnexpectedEof;
errors.LeafBlockNeeded = errors.WouldBlock;
errors.LeafDataUnwritten = errors.WriteZero;