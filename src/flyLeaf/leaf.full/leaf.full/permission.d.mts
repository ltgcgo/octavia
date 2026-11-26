// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

import type {
	LeafPermDetails,
	LeafPermStatus
} from "../../leaf.async/leaf.async/permission.d.mts";

/** The Deno permissions API, which is based on the web [permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) but adapted for non-browser uses.
*
* - On Deno derivatives with native permissions support, this is [pass-through](https://docs.deno.com/api/deno/permissions/#Deno.Permissions).
* - On other runtimes with permissions support, this follows their behaviour.
* - On runtimes with no permissions support, everything is granted at startup, then subject to limited emulation whenever available. */
export class LeafPermissions {
	/** Query the current status of a permission.
	*
	* Do note that `request` will not emit prompts on already granted permissions, so there's no need to chain queries before requests. */
	query(details: LeafPermDetails): Promise<LeafPermStatus>;
	/** The synchronous variant of `query`. */
	querySync(details: LeafPermDetails): LeafPermStatus;
	/** If the permission hasn't been granted, prompt to request then resolves to the result. */
	request(details: LeafPermDetails): Promise<LeafPermStatus>;
	/** The synchronous variant of `request`. */
	requestSync(details: LeafPermDetails): LeafPermStatus;
	/** Revoke a permission. */
	revoke(details: LeafPermDetails): Promise<LeafPermStatus>;
	/** The synchronous variant of `revoke`. */
	revokeSync(details: LeafPermDetails): LeafPermStatus;
}
export type Permissions = LeafPermissions;

/** The Deno permissions API, which is based on the web [permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) but adapted for non-browser uses.
*
* - On Deno derivatives with native permissions support, this is [pass-through](https://docs.deno.com/api/deno/permissions/#Deno.Permissions).
* - On other runtimes with permissions support, this follows their behaviour.
* - On runtimes with no permissions support, everything is granted at startup, then subject to limited emulation whenever available. */
export const permissions: LeafPermissions;