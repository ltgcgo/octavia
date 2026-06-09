// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/** The MIDI message sockets for both local and remote connections.
* @license LGPL-3.0-only
* @module cc.ltgc.octavia.bridge
*/

/** Retrieves messages from the master line in. */
export function getBridge(): BroadcastChannel;

/** Retrieves messages from the master line out. */
export function getBridgeOut(): BroadcastChannel;
