#!/bin/bash
ls -1 dist/*.d.mts | while IFS= read -r file; do
	echo deno run --allow-read --allow-write utils/depGraph/replace.js "$file"
	if [ -f "${file}.tmp" ]; then
		mv -v "${file}.tmp" "${file}"
	fi
done
echo "Dependency graph applied."
exit