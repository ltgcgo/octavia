#!/bin/bash
if [ "$1" == "" ]; then
	echo "Available targets:"
	find ./validate -type f | grep -E "\.[Jj][Ss]$" | while IF= read -r file; do
		echo "- ${file/\.\/validate\//}"
	done
	exit
fi
if [ -f "./validate/$1" ]; then
	if [ "$(command -v deno 2>/dev/null)" != "" ]; then
		deno test --allow-all "./validate/$1"
	elif [ "$(command -v node 2>/dev/null)" != "" ]; then
		node --test "./validate/$1"
	else
		echo "No JS runtime detected."
		exit 1
	fi
else
	echo "Test \"$1\" not found."
fi
exit