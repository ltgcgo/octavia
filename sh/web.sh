#!/bin/bash
#cd test
case "$1" in
	"deno")
		denoServe -p 8010
		;;
	*)
		python3 -m http.server 8010
		;;
esac
exit