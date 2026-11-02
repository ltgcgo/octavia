// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";
import "../common/init.mjs";

import versionObject from "./env/version.mjs";
import {LeafFsFile} from "./fs/handle.mjs";

export const FsFile = LeafFsFile;
export const version = versionObject;

export * from "./fs/handle.mjs";
export * from "./fs/meta.mjs";
export * from "./fs/data.mjs";