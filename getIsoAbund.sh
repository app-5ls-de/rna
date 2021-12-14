#!/bin/sh
echo "let isotopes = " > isoAbund.js
curl 'https://cdn.jsdelivr.net/gh/emptyport/isotope-abundances@6188cb99aa7a501ed23aa0d6170e0a6460b8b99f/ISOTOPES.json' | jq '{H,C,N,O,Na,P,K}' >> isoAbund.js
#echo ";\n\nwindow.isoAbund = function (element) {\nif (!(element in isotopes)) return {};\n\nreturn isotopes[element];\n};" >> isoAbund.js

cat << EOF >> isoAbund.js

window.isoAbund = function (element) {
if (!(element in isotopes)) return {};

return isotopes[element];
};
EOF

prettier --write isoAbund.js
