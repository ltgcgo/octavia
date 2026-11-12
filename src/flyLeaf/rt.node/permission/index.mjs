// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import {
	LeafPermStatus as LeafPermStatusI,
	LeafPermissionsBaseline
} from "../../common/class/permission.mjs";

export const LeafPermStatus = LeafPermStatusI;
export const PermissionStatus = LeafPermStatus;
export const LeafPermissions = LeafPermissionsBaseline;
export const Permissions = LeafPermissions;

export const permissions = new LeafPermissions();