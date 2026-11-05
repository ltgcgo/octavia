// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import LeafBuildInfo from "../../common/class/buildInfo.mjs";

const Deno = self.Deno ?? self.Ende;

export const build = new LeafBuildInfo(
	Deno.build.os,
	Deno.build.arch,
	Deno.build.vendor,
	Deno.build.target
);

export const addSignalListener = Deno.addSignalListener;
export const args = Deno.args;
export const chdir = Deno.chdir;
export const cwd = Deno.cwd;
export const execPath = Deno.execPath;
export const exit = Deno.exit;
export const gid = Deno.gid;
export const hostname = Deno.hostname;
export const loadavg = Deno.loadavg;
export const mainModule = Deno.mainModule;
export const memoryUsage = Deno.memoryUsage;
export const noColor = Deno.noColor;
export const osRelease = Deno.osRelease;
export const osUptime = Deno.osUptime;
export const pid = Deno.pid;
export const ppid = Deno.ppid;