const modifications = [
  {
    short_name: "P",
    name: "Phosphate",
    add: "PO4H3",
    subtract: "H2O",
  },
];

const modifications5prime = [
  {
    short_name: "DP",
    name: "Diphosphate",
    add: "(PO4H3)2",
    subtract: "(H2O)2",
  },
  {
    short_name: "TP",
    name: "Triphosphate",
    add: "(PO4H3)3",
    subtract: "(H2O)3",
  },
  {
    short_name: "Cy5",
    name: "Cyanine 5",
    add: "C37H48N3O4P",
    subtract: "",
  },
];

const modifications3prime = [
  {
    short_name: "Pcyc",
    name: "cyclic Monophosphate",
    add: "PO4H3",
    subtract: "(H2O)2",
  },
];

// formulas of cyclic monophosphate Nucleotides
const cyclicMP = {
  G: "C10H12N5O7P",
  C: "C9H12N3O7P",
  A: "C10H12N5O6P",
  U: "C9H11N2O8P",
};

const reverse = (sequence) => sequence.split("").reverse().join("");

const normalize_sequence = (sequence) =>
  new MolecularFormula(sequence.toUpperCase()).getLongFormula();

const is_normalized_sequence = (sequence) =>
  new RegExp("^[AUGC ]+$").test(sequence);

const is_sequence = (sequence) =>
  is_normalized_sequence(normalize_sequence(sequence));

const get_isotopes = (formula, charge = 0, factor = 1, show_formula = false) =>
  emass
    .calculate(
      new MolecularFormula(formula).subtract({ H: charge }).composition,
      charge
    )
    .map(({ Mass, Abundance }) => ({ Mass, Abundance: Abundance * factor }))
    .map((isotope) => {
      if (show_formula) isotope.formula = new MolecularFormula(formula).formula;
      return isotope;
    });

const get_isotopes_list = (
  formulas,
  charge,
  limit = 0.000001 /* PruneLimit */
) =>
  formulas
    .map((f) =>
      get_isotopes(f.formula || f, f.charge || charge, f.factor, true)
    )
    .reduce((pv, cv) => [...pv, ...cv], [])
    .sort((a, b) => b.Abundance - a.Abundance)
    .filter(({ Abundance }) => Abundance >= limit);

const sum = (array) => array.reduce((pv, cv) => pv + cv, 0);

const get_components = (sequence) =>
  new Proxy(new MolecularFormula(sequence).getComposition(), {
    get: (target, p) => (target.hasOwnProperty(p) ? target[p] : 0),
  });

const get_component = (sequence, component) =>
  get_components(sequence)[component];

const get_length = (sequence) => sum(Object.values(get_components(sequence)));

const gc_content = (sequence) =>
  (get_component(sequence, "G") + get_component(sequence, "C")) /
  get_length(sequence);

function complement(sequence, copy_invalid_chars = true) {
  let complement_pairs = [
    ["G", "C"],
    ["A", "U"],
    ["g", "c"],
    ["a", "u"],
  ];
  let complement_lookup = {
    " ": " ",
    "(": "(",
    ")": ")",
  };
  complement_pairs.forEach((pair) => {
    complement_lookup[pair[0]] = pair[1];
    complement_lookup[pair[1]] = pair[0];
  });

  let sequence_complement_split = [];

  sequence.split("").forEach((nucleotide) => {
    if (Object.keys(complement_lookup).includes(nucleotide)) {
      sequence_complement_split.push(complement_lookup[nucleotide]);
    } else if (copy_invalid_chars) {
      sequence_complement_split.push(nucleotide);
    } else {
      throw new Error("invalid char in sequence");
    }
  });

  return sequence_complement_split.join("");
}

function melting_temperature(sequence) {
  let { A, U, G, C } = get_components(sequence);
  if (get_length(sequence) < 14) {
    // Marmur formula
    return (A + U) * 2 + (G + C) * 4;
  } else {
    // Wallace formula
    return 64.9 + (41 * (G + C - 16.4)) / get_length(sequence);
  }
}

