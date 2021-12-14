const reverse = (sequence) => sequence.split("").reverse().join("");
const normalize_sequence = (sequence) =>
  new MolecularFormula(sequence.toUpperCase()).getLongFormula();
const is_normalized_sequence = (sequence) =>
  new RegExp("^[AUGC ]+$").test(sequence);
const is_sequence = (sequence) =>
  is_normalized_sequence(normalize_sequence(sequence));

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
