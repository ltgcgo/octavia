#!/bin/bash
echo -e "\033[1;37mLightingale Hyacinth\033[0m"
mkdir -p dist
#mkdir -p proxy
# Remove the dev files
rm -r dist/*.css 2> /dev/null
rm -r dist/*.js 2> /dev/null
rm -r dist/*.map 2> /dev/null
rm -r dist/*.mjs 2> /dev/null
rm -r dist/*.ts 2> /dev/null
rm -r dist/*.mts 2> /dev/null
# Using esbuild to build all JS files
#esbuild --bundle src/index.js --outfile=dist/index.js --minify --sourcemap
#esbuild --bundle src/index.js --target=es6 --outfile=dist/index.es6.js --minify --sourcemap
if [ -d "./css" ]; then
	echo -e "\033[1;34mBuilding\033[0m: CSS."
	if [ ! -f "$(which lightningcss)" ]; then
		echo -e "\033[1;33mWarning\033[0m: LightningCSS is not available. May yield unexpected results."
	fi
	ls -1 css | while IFS= read -r dir ; do
		if [ -f "css/${dir}/index.css" ] ; then
			echo "Building CSS target \"${dir}\"..."
			shx skin $dir --minify $1 > /dev/null
		fi
	done
#else
#	echo "No CSS targets available."
fi
if [ -d "./web" ]; then
	echo -e "\033[1;34mBuilding\033[0m: HTML."
	ls -1 web | while IFS= read -r dir ; do
		if [ -f "web/${dir}/index.htm" ] ; then
			echo "Building HTML target \"${dir}\"..."
			shx page $dir > /dev/null
		fi
	done
#else
#	echo "No HTML targets available."
fi
substRules='s/{var /{let /g;s/}var /}let /g;s/;var /;let /g;s/(var /(let /g;s/var /"use strict";let /'
if [ -d "./src" ]; then
	echo -e "\033[1;34mBuilding\033[0m: JS."
	ls -1 src | while IFS= read -r dir ; do
		if [ -f "src/${dir}/index.js" ] ; then
			echo "Building JS target \"${dir}\"..."
			shx live $dir --minify $1 > /dev/null
			sed -zi "$substRules" "dist/${dir}.js"
			if [ -f "src/${dir}/index.d.ts" ] ; then
				cp "src/${dir}/index.d.ts" "dist/${dir}.d.ts"
			fi
		fi
		if [ -f "src/${dir}/index.mjs" ] ; then
			echo "Building JS module \"${dir}\"..."
			shx live $dir --minify $1 > /dev/null
			sed -zi "$substRules" "dist/${dir}.mjs"
			if [ -f "src/${dir}/index.d.mts" ] ; then
				cp "src/${dir}/index.d.mts" "dist/${dir}.d.mts"
			fi
		fi
	done
#else
#	echo "No JS targets availeble."
fi
echo -e "\033[1;32mBuilding finished.\033[0m"
#rm -rv proxy/*.map
# Finalizing most builds
#ls -1 src | while IFS= read -r dir ; do
	#if [ -f "src/${dir}/prefixer.js" ] ; then
		#cat src/${dir}/prefixer.js > dist/${dir}.js
	#fi
	#if [ -f "proxy/${dir}.js" ] ; then
		#cat proxy/${dir}.js >> dist/${dir}.js
	#fi
#done
# Node specific
#mkdir -p proxy/node
#mv dist/node.js proxy/node/index.js
#rm proxy/node.js
exit
