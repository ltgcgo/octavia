#!/bin/bash
# shx Standard Utility
printf "[1;37mGit Commit Signing"
case "$1" in
	"gpg" | "" )
		echo ": GnuPG[0m"
		echo "Below is a list of locally available keys."
		printf "\n"
		gpg --list-secret-keys --keyid-format=long
		echo "Please select a key for you to sign commits. Leave it blank to stop future signing."
		read -p "Key ID (without type): " keyId
		if [ "$keyId" == "" ]; then
			git config --unset gpg.format
			git config --unset user.signingkey
			git config commit.gpgsign false
			echo "Future commits will no longer be signed."
		else
			git config --unset gpg.format
			git config user.signingkey "$keyId"
			git config commit.gpgsign true
			echo "Future commits will be signed with ${keyId}."
		fi
		;;
	"ssh" )
		echo ": SSH[0m"
		echo "Please paste the path to your SSH private key below."
		echo "Blank or non-existent files to stop future signing."
		read -p "Path to SSH key: " sshPath
		if [ -f "$sshPath" ]; then
			git config gpg.format ssh
			git config user.signingkey "$sshPath"
			git config commit.gpgsign true
			echo "Future commits will be signed with the SSH private key."
		else
			git config --unset gpg.format
			git config --unset user.signingkey
			git config commit.gpgsign false
			echo "File not found. Future commits will no longer be signed."
		fi
		;;
	*)
		echo "[0m"
		echo "[1;31mError[0m: Unrecognized key type. Only \"gpg\" and \"ssh\" are supported."
		;;
esac
exit