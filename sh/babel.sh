#!/bin/bash
# Use this script AFTER everything finished building.
cat conf/babelTargets.txt | while IFS= read -r target; do
	realTarget="./dist/${target}"
	if [ -f "$realTarget" ]; then
		echo "Now building \"${target}\" ..."
		deno run --allow-read --allow-write utils/babel/build.js "dist/${target}"
	else
		echo "Target \"${target}\" does not exist."
	fi
done
exit