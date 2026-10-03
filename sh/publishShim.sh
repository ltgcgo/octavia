#!/bin/bash
#echo "Building..."
#shx build
if [ ! -f "$(which tree)" ]; then
	if [ -f "$(which doas)" ]; then
		doas apt install -y tree
	elif [ -f "$(which sudo)" ]; then
		sudo apt install -y tree
	else
		apt install -y tree
	fi
fi
echo "Constructing isolates..."
ln -s ../../dist isolated/midi-parser-ecosystem/dist
ln -s ../../libs isolated/midi-parser-ecosystem/libs
cp dist/miccCompat.mjs isolated/midi-parser-ecosystem/
cp dist/miccCompat.d.mts isolated/midi-parser-ecosystem/
echo "Applying dependency graphs..."
shx depGraph midi-parser-ecosystem
echo "Tree structure for the isolates:"
tree isolated
echo "Preparing for neutral registries..."
echo "Publishing to JSR..."
deno publish --allow-dirty --config isolated/midi-parser-ecosystem/deno.json
echo "Preparing for Node registries..."
cd isolated/midi-parser-ecosystem
npm pack
if [ "$NPM_AUTH_TOKEN" != "" ]; then
	echo "Publishing to NPM..."
	if [ "$(grep -E '\B"version": "[0-9]+\.[0-9]+(|\.0)"' package.json)" != "" ]; then
		#echo "//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}" > ~/.npmrc
		npm publish *.tgz --provenance --access public
	else
		echo "NPM publishing skipped. NPM will only have non-patch versions to be kept out-of-date."
	fi
fi
if [ "$CODEBERG_AUTH_TOKEN" != "" ]; then
	echo "Publishing to Codeberg..."
	echo "//codeberg.org/api/packages/ltgc/npm/:_authToken=${CODEBERG_AUTH_TOKEN}" > ~/.npmrc
	echo "registry=https://codeberg.org/api/packages/ltgc/npm/" >> ~/.npmrc
	npm publish *.tgz --access public
fi
if [ "$GITHUB_AUTH_TOKEN" != "" ]; then
	echo "Publishing to GitHub..."
	echo "//npm.pkg.github.com/:_authToken=${GITHUB_AUTH_TOKEN}" > ~/.npmrc
	echo "registry=https://npm.pkg.github.com" >> ~/.npmrc
	sed -i "s/\"@ltgc\//\"@ltgcgo\//" package.json
	npm publish *.tgz --provenance --access public
fi
cd ../..
exit