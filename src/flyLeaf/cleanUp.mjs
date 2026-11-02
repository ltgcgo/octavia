// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

// The final step to clean Node.js up. Do not run during API initialisation!

if (!globalThis.self) globalThis.self = globalThis;
if (self.global) delete self.global;
if (self.Buffer) delete self.Buffer;
