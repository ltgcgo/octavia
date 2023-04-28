#!/bin/bash
#rm -rv dist/${1:default}*
inject=" "
prepend=" "
append=" "
buildOpt=" "
format="iife"
ext="js"
if [ -e "src/${1:-default}/inject.js" ] ; then
	inject="--inject:src/${1:-default}/inject.js"
fi
if [ -e "src/${1:-default}/buildOpt.txt" ] ; then
	buildOpt="$(cat src/${1:-default}/buildOpt.txt)"
fi
if [ -e "src/${1:-default}/prefix.js" ] ; then
	prepend="--prepend:src/${1:-default}/prefix.js"
fi
if [ -e "src/${1:-default}/affix.js" ] ; then
	append="--append:src/${1:-default}/affix.js"
fi
if [ -e "src/${1:-default}/.node" ] ; then
	platform="--platform=node"
fi
if [ -e "src/${1:-default}/.cjs" ] ; then
	format="cjs"
fi
if [ -e "src/${1:-default}/index.mjs" ] ; then
	format="esm"
	ext="mjs"
fi
esbuild --bundle src/${1:-default}/index.${ext} $platform $prepend $append $inject $buildOpt --format=$format --charset=utf8 --outfile=dist/${1:-default}.${ext} ${2:---minify-whitespace --minify-syntax --sourcemap --watch} $3
#cat proxy/${1:-default}.js
exit
