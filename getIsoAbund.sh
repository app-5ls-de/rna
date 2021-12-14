#!/bin/sh
echo "let isotopes = " > isoAbund.js
curl 'https://cdn.jsdelivr.net/npm/isotope-abundances@2.0.4/ISOTOPES.json' | jq '{H,C,N,O,Na,P,K}' >> isoAbund.js

cat << EOF >> isoAbund.js

window.isoAbund = function (element) {
if (!(element in isotopes)) return {};

return isotopes[element];
};
EOF

prettier --write isoAbund.js
