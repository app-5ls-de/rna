#!/bin/sh
echo "const all_isotopes = " > isoAbund.js
curl 'https://cdn.jsdelivr.net/npm/isotope-abundances@2.0.4/ISOTOPES.json' | jq '{H,C,N,O,Na,P,K}' >> isoAbund.js

cat << EOF >> isoAbund.js

window.isoAbund = function (element) {
  if (!(element in all_isotopes))
    throw new Error('element "' + element + '" not found');

  return all_isotopes[element];
};
EOF

prettier --write isoAbund.js
