#!/bin/bash
find ./src -type f | grep -E "\.d\.(m|)ts$" | while IFS= read -r file; do
	echo "Checking \"$file\"..."
	deno check "$file" --config ./deno.json
done
if [ "$1" == "" ]; then
	exit
fi
find ./src -type f | grep -E "/index\.(m|)js$" | while IFS= read -r file; do
	echo "Checking \"$file\"..."
	deno check "$file" --config ./deno.json
done
exit