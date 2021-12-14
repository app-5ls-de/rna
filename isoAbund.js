const all_isotopes = {
  H: {
    Mass: 1.00794,
    Isotopes: [
      {
        Mass: 1.00782503223,
        Abundance: 0.999885,
      },
      {
        Mass: 2.01410177812,
        Abundance: 0.000115,
      },
    ],
  },
  C: {
    Mass: 12.01074,
    Isotopes: [
      {
        Mass: 12,
        Abundance: 0.9893,
      },
      {
        Mass: 13.00335483507,
        Abundance: 0.0107,
      },
    ],
  },
  N: {
    Mass: 14.0067,
    Isotopes: [
      {
        Mass: 14.00307400443,
        Abundance: 0.99636,
      },
      {
        Mass: 15.00010889888,
        Abundance: 0.00364,
      },
    ],
  },
  O: {
    Mass: 15.9994,
    Isotopes: [
      {
        Mass: 15.99491461957,
        Abundance: 0.99757,
      },
      {
        Mass: 16.9991317565,
        Abundance: 0.00038,
      },
      {
        Mass: 17.99915961286,
        Abundance: 0.00205,
      },
    ],
  },
  Na: {
    Mass: 22.98977,
    Isotopes: [
      {
        Mass: 22.989769282,
        Abundance: 1,
      },
    ],
  },
  P: {
    Mass: 30.97376,
    Isotopes: [
      {
        Mass: 30.97376199842,
        Abundance: 1,
      },
    ],
  },
  K: {
    Mass: 39.0983,
    Isotopes: [
      {
        Mass: 38.9637064864,
        Abundance: 0.932581,
      },
      {
        Mass: 39.963998166,
        Abundance: 0.000117,
      },
      {
        Mass: 40.9618252579,
        Abundance: 0.067302,
      },
    ],
  },
};

window.isoAbund = function (element) {
  if (!(element in all_isotopes))
    throw new Error('element "' + element + '" not found');

  return all_isotopes[element];
};
