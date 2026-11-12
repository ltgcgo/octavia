// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import {
	SysMemLinuxLines
} from "../../common/class/matchers.mjs";
import {
	toByteIEC
} from "../../common/method/size.mjs";
import {
	LeafSystemMemoryInfo
} from "../../common/class/systemInfo.mjs";

import NodeChildProcess from "node:child_process";
import NodeFs from "node:fs";
import NodeOs from "node:os";
import NodeProcess from "node:process";

export function systemMemoryInfo() {
	const sysMemInfo = new LeafSystemMemoryInfo(
		NodeOs.totalmem()
	);
	const initFreeMem = NodeOs.freemem();
	sysMemInfo.available = initFreeMem;
	sysMemInfo.free = initFreeMem;
	try {
		switch (NodeOs.platform()) {
			case "android":
			case "linux": {
				const linuxMemStat = NodeFs.readFileSync("/proc/meminfo", {
					"encoding": "utf-8"
				});
				for (const result of linuxMemStat.matchAll(SysMemLinuxLines)) {
					const groups = result?.groups;
					if (!groups) continue;
					switch (groups.field) {
						case "Buffers": {
							sysMemInfo.buffers = toByteIEC(groups.value, groups.unit);
							break;
						};
						case "MemAvailable": {
							sysMemInfo.available = toByteIEC(groups.value, groups.unit);
							break;
						};
						case "MemFree": {
							sysMemInfo.free = toByteIEC(groups.value, groups.unit);
							break;
						};
						case "SwapFree": {
							sysMemInfo.swapFree = toByteIEC(groups.value, groups.unit);
							break;
						};
						case "SwapTotal": {
							sysMemInfo.swapTotal = toByteIEC(groups.value, groups.unit);
							break;
						};
						default: {
							//console.debug(groups);
						};
					};
				};
				break;
			};
			case "cygwin":
			case "win32": {
				sysMemInfo.available = 0;
				let failure = true, bubbledError, chosenPwSh;
				let rawSwapResult;
				for (const psName of ["powershell.exe", "pwsh.exe"]) {
					try {
						const {
							stdout,
							error,
							status,
							stderr
						} = NodeChildProcess.spawnSync(
							psName,
							["-NonInteractive", "-NoProfile", "-Command", "-"],
							{
								"windowsHide": true,
								"shell": true,
								"timeout": 500,
								"encoding": "utf-8",
								"input": `(Get-CimInstance -ClassName Win32_PageFileUsage | Select-Object AllocatedBaseSize, CurrentUsage) | ConvertTo-Json -Compress`
							}
						);
						if (error) throw(error);
						if (status !== 0) throw(new Error(stderr));
						chosenPwSh = psName;
						rawSwapResult = stdout;
						failure = false;
						bubbledError = undefined;
						break;
					} catch (err) {
						bubbledError = err;
					};
				};
				if (failure) {
					throw(bubbledError ?? new Error(`Failed PowerShell execution.`));
				};
				const parsedMiBObject = JSON.parse(rawResult);
				const swapTotal = toByteIEC(parsedMiBObject["AllocatedBaseSize"], "MiB");
				sysMemInfo.swapTotal = swapTotal;
				sysMemInfo.swapFree = swapTotal - (toByteIEC(parsedMiBObject["CurrentUsage"], "MiB") || 0);
				break;
			};
		};
	} catch (err) {
		if (parseInt(NodeProcess.env["VERGILIUS_PRINT_TRACE"]) > 0) {
			console.error(err);
		};
	};
	return sysMemInfo;
};