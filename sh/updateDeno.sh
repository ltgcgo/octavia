#!/bin/bash
cd deno
cat ../conf/denoDeps.txt | while IFS= read -r depLine; do
	IFS=" " read -ra depSrc <<< $depLine
	case "${depSrc[0]}" in
		"dir")
			printf "Directory: ${depSrc[1]}... "
			mkdir -p "${depSrc[1]}"
			echo "OK."
			;;
		*)
			printf "Downloading \"${depSrc[0]}\" from \"${depSrc[1]}\"... "
			curl -Lso "${depSrc[0]}" "${depSrc[1]}"
			echo "OK."
			;;
	esac
done
echo "Deno dependency fetching complete."
exit
