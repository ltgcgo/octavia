"use strict";

// Only for the bundled versions.
export const safeImport = async function (url) {
	try {
		const module = await import(url);
		console.debug(`Using URL import for: "${url}"`);
		return module;
	} catch (err) {
		const resp = await fetch(url);
		const blobObject = await resp.blob();
		const objectUrl = URL.createObjectURL(blobObject);
		try {
			const module = await import(objectUrl);
			console.debug(`Using blob import for: "${url}"`);
			return module;
		} catch (err) {
			URL.revokeObjectURL(objectUrl);
			const module = await import(`data:text/javascript,${
				encodeURIComponent(
					await blobObject.text()
				)
			}`);
			console.debug(`Using data text import for: "${url}"`);
			return module;
		};
	};
};