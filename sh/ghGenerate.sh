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
tree -ifl | while IFS= read -r file; do
	if [ -f "$file" ]; then
		# Is a file
		if [ "$(echo "$file" | grep -E "$COMPRESS_CRIT")" != "" ]; then
			gzip -9 "$file" && echo "Compressed \"${file}\" with Gzip."
		else
			echo "File \"${file}\" cannot be compressed."
		fi
		if [ -f "$file" ]; then
			rm -v "$file"
		fi
	fi
done
tar cvf ../pages-build-gz.tar *
cd ..
cd ghp-br
tree -ifl | while IFS= read -r file; do
	if [ -f "$file" ]; then
		# Is a file
		if [ "$(echo "$file" | grep -E "$COMPRESS_CRIT")" != "" ]; then
			brotli -v9 "$file"
		else
			echo "File \"${file}\" cannot be compressed."
		fi
		if [ -f "$file" ]; then
			rm -v "$file"
		fi
	fi
done
tar cvf ../pages-build-br.tar *
cd ..
exit