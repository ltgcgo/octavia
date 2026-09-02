#!/bin/bash
find ./src -type f | grep -E "\.d\.(m|)ts$" | while IFS= read -r file; do
	echo "Checking \"$file\"..."
	deno check "$file"
done
exit