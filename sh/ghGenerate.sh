#!/bin/bash
COMPRESS_CRIT="\.(ass|atom|bin|bm|bmp|conf|css|csv|htm|html|ico|js|json|kar|list|lrc|lst|map|md|mid|mjs|mod|mts|otf|rss|sbv|srt|ssa|svg|trc|ts|tsv|ttf|ttml|txt|vgm|vtt|wasm|webmanifest|xml|ytt)$"

#sudo apt install -y zopfli
sudo apt install -y tree

echo "$(date +"%s")" > build-time.txt
cp -Lrv ghp ghp-gz
cp -Lrv ghp ghp-br
cp -Lrv ghp ghp-base
cd ghp
tar cvhf ../pages-build.tar *
cd ..
#zopfli --i1 -v pages-build.tar
gzip -9v pages-build.tar
rm -v pages-build.tar
cd ghp-base
tree -ifl | while IFS= read -r file; do
	if [ -f "$file" ]; then
		# Is a file
		if [ "$(echo "$file" | grep -E "$COMPRESS_CRIT")" != "" ]; then
			rm -v "$file"
		else
			echo "File \"${file}\" is preserved."
		fi
	fi
done
tar cvf ../pages-build-base.tar *
cd ..
cd ghp-gz
printf "" > ../fileHashes.tsv
tree -ifl | while IFS= read -r file; do
	if [ -f "$file" ]; then
		# Is a file
		if [ "$(echo "$file" | grep -E "$COMPRESS_CRIT")" != "" ]; then
			fileHash="$(sha256sum "${file}" | cut -d' ' -f1)"
			findResult="$(grep -F "${fileHash}	" ../fileHashes.tsv | cut -d '	' -f2)"
			if [ "$findResult" != "" ] ; then
				pathDiff="$(realpath -sm --relative-to="${file}" "${findResult}")"
				echo "Deduplicated: ${file}.gz -> ${pathDiff}.gz"
				ln -s "${pathDiff}.gz" "${file}.gz"
			else
				echo "${fileHash}	$(realpath -s "${file}")" >> ../fileHashes.tsv
				gzip -9 "$file" && echo "Compressed \"${file}\" with Gzip."
			fi
		else
			echo "File \"${file}\" cannot be compressed."
		fi
		if [ -f "$file" ]; then
			rm -v "$file"
		fi
	fi
done
#cat ../fileHashes.tsv
tar cvf ../pages-build-gz.tar *
cd ..
cd ghp-br
printf "" > ../fileHashes.tsv
tree -ifl | while IFS= read -r file; do
	if [ -f "$file" ]; then
		# Is a file
		if [ "$(echo "$file" | grep -E "$COMPRESS_CRIT")" != "" ]; then
			fileHash="$(sha256sum "${file}" | cut -d' ' -f1)"
			findResult="$(grep -F "${fileHash}	" ../fileHashes.tsv | cut -d '	' -f2)"
			if [ "$findResult" != "" ] ; then
				pathDiff="$(realpath -sm --relative-to="${file}" "${findResult}")"
				echo "Deduplicated: ${file}.br -> ${pathDiff}.br"
				ln -s "${pathDiff}.br" "${file}.br"
			else
				echo "${fileHash}	$(realpath -s "${file}")" >> ../fileHashes.tsv
				brotli -v9 "$file"
			fi
		else
			echo "File \"${file}\" cannot be compressed."
		fi
		if [ -f "$file" ]; then
			rm -v "$file"
		fi
	fi
done
#cat ../fileHashes.tsv
tar cvf ../pages-build-br.tar *
cd ..
exit
