#!/bin/bash
#echo "Building..."
#shx build
echo "Constructing isolates..."
ln -s ../../dist isolated/midi-parser-ecosystem/dist
ln -s ../../libs isolated/midi-parser-ecosystem/libs
ln -s ../../dist/miccCompat.mjs isolated/midi-parser-ecosystem/
ln -s ../../dist/miccCompat.d.mts isolated/midi-parser-ecosystem/
echo "Preparing for neutral registries..."
echo "Publishing to JSR..."
deno publish --allow-dirty --config isolated/midi-parser-ecosystem/deno.json
echo "Preparing for Node registries..."
cd isolated/midi-parser-ecosystem
if [ "$NPM_AUTH_TOKEN" != "" ]; then
	echo "Publishing to NPM..."
	echo "//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}" > ~/.npmrc
	npm publish --provenance --access public
fi
if [ "$GITHUB_AUTH_TOKEN" != "" ]; then
	echo "Publishing to GitHub..."
	echo "//npm.pkg.github.com/:_authToken=${GITHUB_AUTH_TOKEN}" > ~/.npmrc
	echo "@ltgcgo:registry=https://npm.pkg.github.com" >> ~/.npmrc
	sed -i "s/\"@ltgc\//\"@ltgcgo\//" package.json
	npm publish --provenance --access public
fi
cd ../..
exit