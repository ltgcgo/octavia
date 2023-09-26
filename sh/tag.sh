#!/bin/bash
git tag -a "$1" && git push origin "$1"
exit