#!/bin/bash
export BACKENDS=browserleaks.com
export DEBUGGER=1
export FOLLOW_REDIR=1
export FORCE_OUT_TLS=plain
export STRIP_HEADERS_UP=Sec-Fetch-User,Sec-Fetch-Site,Sec-Fetch-Mode,Sec-Fetch-Dest
export STRIP_HEADERS=expect-ct,nel,report-to
export SET_HEADERS_UP=upgrade-insecure-requests=1
export SET_HEADERS=x-cloudhop-debug=experimental
export HEALTH_MAX_TRIES=4
export HEALTH_CRITERIA=loose
export MASK_UA=noBracket
export MASK_IP=spoof
export MATCH_LANG=en-US,en,*
export TIMEOUT_MS=4000
export IDLE_SHUTDOWN=0
deno run --allow-net --allow-env dist/deno.js
exit