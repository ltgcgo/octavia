#!/bin/bash
COMPRESS_CRIT="\.(bin|bm|bmp|conf|css|csv|htm|html|ico|js|json|kar|list|lst|map|md|mid|mjs|mod|otf|svg|tsv|ttf|vgm|wasm|webmanifest|xml)$"

sudo apt install -y zopfli tree

echo "$(date +"%s")" > build-time.txt
cp -Lrv ghp ghp-gz
cp -Lrv ghp ghp-br
cd ghp
tar cvhf ../pages-build.tar *
cd ..
zopfli --i1 -v pages-build.tar
rm -v pages-build.tar
cd ghp-gz
tree -ifl | grep -E "${COMPRESS_CRIT}" | while IFS= read -r file; do
	zopfli --i1 "$file"
	if [ -f "$file" ]; then
		rm -v "$file"
	fi
done
tar cvf ../pages-build-gz.tar *
cd ..
cd ghp-br
tree -ifl | grep -E "${COMPRESS_CRIT}" | while IFS= read -r file; do
	brotli -vq 11 "$file"
	if [ -f "$file" ]; then
		rm -v "$file"
	fi
done
tar cvf ../pages-build-br.tar *
cd ..
exit