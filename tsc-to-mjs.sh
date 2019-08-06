#!/bin/bash
cd module
mv core.js core.mjs && mv duplex.js duplex.mjs && mv helpers.js helpers.mjs
sed -i 's/\.js/\.mjs/g' duplex.mjs core.mjs