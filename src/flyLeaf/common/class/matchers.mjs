// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

export const TargetExtractLLVM = /^(?<arch>(\w|\d|[_])+)-(?<vendor>(\w|\d|[_])+)-(?<os>(\w|\d|[_])+)(-(?<env>(\w|\d|[_\-])+))?/m;
export const NavigatorExtract = /(^|[ ]+)(?<name>(\w|\d|[.])+)\/(?<version>(\d|\w|[\-_])+([. ](\d|\w|[\-_])+)*)?( \((?<descriptor>(\w|\d|[ .:;\-_])+)\))?/m;