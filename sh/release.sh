#!/bin/bash
shx build
shx babel
cd dist
zip -r9v "sourceMaps.zip" basic.mjs cambiare.mjs chord.mjs disp.mjs errors.mjs miccCompat.mjs micc.mjs state.mjs xp_basic.mjs xp_state.mjs
cd ..
shx commit
exit