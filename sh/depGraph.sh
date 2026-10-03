#!/bin/bash
pathPrefix=""
if [ "$1" != "" ]; then
	pathPrefix="isolated/${1}/"
fi
ls -1 ${pathPrefix}/dist/*.d.mts | while IFS= read -r file; do
	deno run --allow-read --allow-write utils/depGraph/replace.js "$file" "$1"
	if [ -f "${file}.tmp" ]; then
		mv -v "${file}.tmp" "${file}"
	fi
done
echo "Dependency graph applied."
exit