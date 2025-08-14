#!/bin/bash
#cd test
cd ..
runner=
if [ "$1" == "" ]; then
	if [ -f "$(which caddy)" ]; then
		runner=caddy
	elif [ -f "$(which python3)"; then
		runner=python
	fi
else
	runner=$1
fi
case "$runner" in
	"caddy")
		caddy run -c "${SOURCE_DIR}/nix/dev.Caddyfile"
		;;
	"deno")
		denoServe -p 8010
		;;
	"py" | "python" | *)
		python3 -m http.server 8010
		;;
esac
exit