// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

export type LeafPermName = "env"|"ffi"|"import"|"net"|"read"|"run"|"sys"|"write";
export type PermissionName = LeafPermName;

export type LeafPermState = "denied"|"granted"|"prompt";
export type PermissionState = LeafPermState;

/** System information permission choices. A few potentially ambiguous entries are explained.
* - `ca`: Certificate authority (store).  */
declare type LeafSystemPermChoices = "ca"|"cpus"|"getPriority"|"gid"|"homedir"|"hostname"|"loadavg"|"networkInterfaces"|"osRelease"|"osUptime"|"setPriority"|"statfs"|"systemMemoryInfo"|"uid"|"umask"|"username";

/** Environment variable access details. Gating emulation on runtimes with no native support is possible. */
export interface LeafEnvPermDetails {
	/** Permission type. */
	name: "env";
	/** Associated environment variable key. */
	variable?: string;
}
export type EnvPermissionDescriptor = LeafEnvPermDetails;

declare interface LeafPermDetailsWithHost {
	/** Associated hostname of the permission, in the form of `<hostname>[:<port>]`. */
	path?: string|URL;
}

declare interface LeafPermDetailsWithPath {
	/** Associated scoped path of the permission. Depending on the exact type of permission, this can specify exact files. */
	path?: string|URL;
}

/** FFI access details. */
export interface LeafFfiPermDetails extends LeafPermDetailsWithPath {
	/** Permission type. */
	name: "ffi";
}
export type FfiPermissionDescriptor = LeafFfiPermDetails;

/** Import access details. Gating on runtimes with no native support is impossible, and revocations are no-ops. */
export interface LeafImportPermDetails extends LeafPermDetailsWithHost {
	/** Permission type. */
	name: "import";
}
export type ImportPermissionDescriptor = LeafImportPermDetails;

/** Egress network access details. */
export interface LeafNetworkPermDetails extends LeafPermDetailsWithHost {
	/** Permission type. */
	name: "net";
}
export type NetPermissionDescriptor = LeafNetworkPermDetails;

/** Read access details. */
export interface LeafReadPermDetails extends LeafPermDetailsWithPath {
	/** Permission type. */
	name: "read";
}
export type ReadPermissionDescriptor = LeafReadPermDetails;

/** Command execution access details. Granted command execution permissions are virtually equivalent to granted global access, so treat this very cautiously. */
export interface LeafRunPermDetails {
	/** Permission type. */
	name: "run";
	/** Associated scoped path of allowed binary executions, can be scoped to specific executables. */
	command?: string|URL;
}
export type RunPermissionDescriptor = LeafRunPermDetails;

/** System information access details. Gating emulation on runtimes with no native support is possible. */
export interface LeafSystemPermDetails {
	/** Permission type. */
	name: "sys";
	/** The specific items of scoped permissions. */
	kind?: LeafSystemPermChoices;
}
export type SysPermissionDescriptor = LeafSystemPermDetails;

/** Write access details. */
export interface LeafWritePermDetails extends LeafPermDetailsWithPath {
	/** Permission type. */
	name: "write";
}
export type WritePermissionDescriptor = LeafWritePermDetails;

/** Access details. */
export type LeafPermDetails = LeafEnvPermDetails|LeafFfiPermDetails|LeafImportPermDetails|LeafNetworkPermDetails|LeafReadPermDetails|LeafRunPermDetails|LeafSystemPermDetails|LeafWritePermDetails;
export type PermissionDescriptor = LeafPermDetails;

declare type LeafPermEntryChoices = "inherit"|boolean;
/** Permission detail definitions in contexts like workers and tests. Permissions granted by runtime instances does not signal actual access, as host environments like OSes may impost additional restrictions.
*
* On runtimes with no native permissions gating, unless explicitly specified with possible limited emulation needed by certain contexts, everything will be granted due to a lack of supporting mechanism.
* - If an entry is set to `"inherit"`, the current permission entry will be inherited.
* - If an entry is set to `true`, the global access on that entry will be requested.
* - If an entry is set to `false`, the global access on that entry will be revoked. */
export interface LeafPermRequest {
	/** Access to environment variables. Array elements specify specific environment variables.
	*
	* Gating emulation on runtimes with no native support is possible. */
	env: LeafPermEntryChoices|string[];
	/** Access to Foreign Functions Interface. */
	ffi: LeafPermEntryChoices|(string|URL)[];
	/** Access to imports. Array elements specify requested domains.
	*
	* Gating on runtimes without native support is impossible, and revocations are no-ops. */
	import: LeafPermEntryChoices|string[];
	/** Access to network egress. Array elements specify requested hostnames in the `<hostname>[:port]` format. */
	net: LeafPermEntryChoices|string[];
	/** Access to reads. Array elements specify requested file paths. */
	read: LeafPermEntryChoices|string[];
	/** Access to command executions. Array elements specify requested executable paths.
	*
	* Granted command execution permissions are virtually equivalent to granted global access, so treat this very cautiously. */
	run: LeafPermEntryChoices|string[];
	/** Access to system information. Array elements specify requested system information entries.
	*
	* Gating emulation on runtimes with no native support is possible. */
	sys: LeafPermEntryChoices|LeafSystemPermChoices[];
	/** Access to writes. Array elements specify requested file paths. */
	write: LeafPermEntryChoices|string[];
}
export type PermissionOptionsObject = LeafPermRequest;

/** Options defining permissions in contexts like workers and tests. */
export type LeafPermOptions = LeafPermRequest|"inherit"|"none";
export type PermissionOptions = LeafPermOptions;

/** Which events are supported by `LeafPermStatus`. */
export interface LeafPermStatusEvents {
	/** Upon permission status changes. */
	change: Event;
}
export type PermissionStatusEventMap = LeafPermStatusEvents;

/** Status of a permission. */
export class LeafPermStatus extends EventTarget {
	/** When a specific permission has been changed. */
	onchange?: ((this: LeafPermStatus, ev: LeafPermStatusEvents["change"]) => any) | null;
	/** When `true`, the permission is only granted partially as a subscope of the defined scope. */
	readonly partial: boolean;
	/** State of the requested permission */
	readonly state: LeafPermState;
	addEventListener<eventType extends keyof LeafPermStatusEvents>(
		type: eventType,
		handler: (
			this: LeafPermStatus,
			ev: LeafPermStatusEvents[eventType]
		)=>any|EventListenerOrEventListenerObject,
		options?: AddEventListenerOptions|boolean
	): void;
	removeEventListener<eventType extends keyof LeafPermStatusEvents>(
		type: eventType,
		handler: (
			this: LeafPermStatus,
			ev: LeafPermStatusEvents[eventType]
		)=>any|EventListenerOrEventListenerObject,
		options?: EventListenerOptions|boolean
	): void;
}
export type PermissionStatus = LeafPermStatus;

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

/** Individual synchronous hooks communicating with the native runtime. */
declare type LeafPermHookMethodSync = (details: LeafPermDetails) => LeafPermStatus;
/** Individual asynchronous hooks communicating with the native runtime. */
declare type LeafPermHookMethodAsync = (details: LeafPermDetails) => Promise<LeafPermStatus>;
declare type LeafPermHookMethodBoth = [LeafPermHookMethodSync, LeafPermHookMethodAsync|undefined];
/** Collection of communication hooks. */
declare type LeafPermRuntimeHookMapBoth = Map<LeafPermName, LeafPermHookMethodBoth>;
/** Communication hooks by type. */
declare type LeafPermRuntimeTypeHooksBoth = Record<"query"|"request"|"revoke", LeafPermHookMethodBoth>;
/** Collection of typed communication hooks. */
declare type LeafPermRuntimeHooksBoth = Record<LeafPermName, LeafPermRuntimeTypeHooksBoth>;

/** The Deno permissions API, which is based on the web [permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) but adapted for non-browser uses.
*
* - On Deno derivatives with native permissions support, this is [pass-through](https://docs.deno.com/api/deno/permissions/#Deno.Permissions).
* - On other runtimes with permissions support, this follows their behaviour.
* - On runtimes with no permissions support, everything is granted at startup, then subject to limited emulation whenever available. */
export const permissions: LeafPermissions;