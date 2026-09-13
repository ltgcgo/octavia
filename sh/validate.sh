#!/bin/bash
if [ "$(command -v deno 2>/dev/null)" != "" ]; then
	deno test --allow-all validate/*.js
elif [ "$(command -v node 2>/dev/null)" != "" ]; then
	node --test validate/*.js
else
	echo "No JS runtime detected."
	exit 1
fi
exit