#!/bin/bash
COMPRESS_CRIT="\.(ass|atom|bin|bm|bmp|conf|css|csv|htm|html|ico|js|json|kar|list|lrc|lst|map|md|mid|mjs|mod|mts|otf|rss|sbv|srt|ssa|svg|trc|ts|tsv|ttf|ttml|txt|vgm|vtt|wasm|webmanifest|xml|ytt)$"

#sudo apt install -y zopfli
sudo apt install -y tree

echo "$(date +"%s")" > build-time.txt
cp -Lr ghp ghp-raw
cd ghp-raw
printf "" > ../fileHashes.tsv
tree -ifl | while IFS= read -r file; do
	if [ -f "$file" ]; then
		# Is a file
		fileHash="$(sha256sum "${file}" | cut -d' ' -f1)"
		findResult="$(grep -F "${fileHash}	" ../fileHashes.tsv | cut -d '	' -f2)"
		if [ "$findResult" != "" ] ; then
			pathDiffRaw="$(realpath -Lsm --relative-to="${file}" "${findResult}")"
			pathDiff="${pathDiffRaw/\.\.\//}"
			echo "Deduplicated: ${file} -> ${pathDiff} (${findResult})"
			rm "${file}"
			ln -s "${pathDiff}" "${file}"
		else
			echo "${fileHash}	$(realpath -s "${file}")" >> ../fileHashes.tsv
		fi
	fi
done
tar cvf ../pages-build.tar *
cd ..
#zopfli --i1 -v pages-build.tar
gzip -9v pages-build.tar
rm -v pages-build.tar 2>/dev/null
rm -r ghp-raw
cp -Lr ghp ghp-base
cd ghp-base
printf "" > ../fileHashes.tsv
tree -ifl | while IFS= read -r file; do
	if [ -f "$file" ]; then
		# Is a file
		if [ "$(echo "$file" | grep -E "$COMPRESS_CRIT")" != "" ]; then
			rm "$file"
		else
			echo "File \"${file}\" is preserved."
		fi
	fi
done
tree -ifld | while IFS= read -r folder; do
	if [ -d "$folder" ]; then
		rmdir -pv "$folder" 2>/dev/null
	fi
done
tar cf ../pages-build-base.tar *
cd ..
rm -rv ghp-base
cp -Lr ghp ghp-gz
cd ghp-gz
printf "" > ../fileHashes.tsv
tree -ifl | while IFS= read -r file; do
	if [ -f "$file" ]; then
		# Is a file
		if [ "$(echo "$file" | grep -E "$COMPRESS_CRIT")" != "" ]; then
			fileHash="$(sha256sum "${file}" | cut -d' ' -f1)"
			findResult="$(grep -F "${fileHash}	" ../fileHashes.tsv | cut -d '	' -f2)"
			if [ "$findResult" != "" ] ; then
				pathDiffRaw="$(realpath -Lsm --relative-to="${file}" "${findResult}")"
				pathDiff="${pathDiffRaw/\.\.\//}"
				echo "Deduplicated: ${file}.gz -> ${pathDiff}.gz (${findResult})"
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
tar cf ../pages-build-gz.tar *
cd ..
rm -rv ghp-gz
cp -Lr ghp ghp-br
cd ghp-br
printf "" > ../fileHashes.tsv
tree -ifl | while IFS= read -r file; do
	if [ -f "$file" ]; then
		# Is a file
		if [ "$(echo "$file" | grep -E "$COMPRESS_CRIT")" != "" ]; then
			fileHash="$(sha256sum "${file}" | cut -d' ' -f1)"
			findResult="$(grep -F "${fileHash}	" ../fileHashes.tsv | cut -d '	' -f2)"
			if [ "$findResult" != "" ] ; then
				pathDiffRaw="$(realpath -Lsm --relative-to="${file}" "${findResult}")"
				pathDiff="${pathDiffRaw/\.\.\//}"
				echo "Deduplicated: ${file}.br -> ${pathDiff}.br (${findResult})"
				ln -s "${pathDiff}.br" "${file}.br"
			else
				echo "${fileHash}	$(realpath -s "${file}")" >> ../fileHashes.tsv
				brotli -v9j "$file"
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
tar cf ../pages-build-br.tar *
cd ..
rm -rv ghp-br
exit
