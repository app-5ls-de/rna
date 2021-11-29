const input_1sequence = crel("#input_1sequence");
const input_1rc = crel("#input_1rc");

const input_2g = crel("#input_2g");
const input_2c = crel("#input_2c");
const input_2a = crel("#input_2a");
const input_2u = crel("#input_2u");
const input_2Cy5 = crel("#input_2Cy5");
const input_2noP = crel("#input_2noP");
const input_2Pcyc = crel("#input_2Pcyc");
const input_2P23 = crel("#input_2P23");
const list_input_2 = [
  input_2g,
  input_2c,
  input_2a,
  input_2u,
  input_2Cy5,
  input_2noP,
  input_2Pcyc,
  input_2P23,
];

const input_3 = crel("#input_3");

const input_4mass = crel("#input_4mass");
const input_4avgmass = crel("#input_4avgmass");
const input_4simplified = crel("#input_4simplified");

crel(input_1sequence, {
  on: {
    keypress: (e) => onEnter(e, section1),
    input: section1,
  },
});

list_input_2.forEach((element) => {
  crel(element, {
    on: {
      keypress: (e) =>
        onEnter(e, () => disable_inputs([input_1sequence], section2)),
      input: () => {
        disable_inputs([input_1sequence], section2);
      },
    },
  });
});

crel(input_3, {
  on: {
    keypress: (e) =>
      onEnter(e, () =>
        disable_inputs([...list_input_2, input_1sequence], section3)
      ),
    input: () => {
      disable_inputs([...list_input_2, input_1sequence], section3);
    },
  },
});

function onEnter(e, callback) {
  if (e.keyCode == 13) {
    callback();
    return false;
  }
  return true;
}

function disable_inputs(inputs, callback) {
  inputs.forEach((element) => {
    element.disabled = true;
  });

  if (callback) callback();
}

function section1() {
  if (!input_1sequence.validity.valid) return;

  let sequence = input_1sequence.value.toUpperCase();
  let formula = new MolecularFormula(sequence);
  let composition = formula.getComposition();
  console.log(composition);

  input_2g.value = composition.G || 0;
  input_2c.value = composition.C || 0;
  input_2a.value = composition.A || 0;
  input_2u.value = composition.U || 0;

  let nucleotides_reverse = sequence.split("").reverse();
  let nucleotides_reverse_complement = [];

  let complement_pairs = {
    G: "C",
    C: "G",
    A: "U",
    U: "A",
    ")": "(",
    "(": ")",
    " ": " ",
  };

  let invalid_chars = false;
  nucleotides_reverse.forEach((nucleotide) => {
    if (Object.keys(complement_pairs).includes(nucleotide)) {
      nucleotides_reverse_complement.push(complement_pairs[nucleotide]);
    } else {
      invalid_chars = true;
    }
  });
  if (!invalid_chars) {
    input_1rc.value = nucleotides_reverse_complement.join("");
  } else {
    input_1rc.value = "";
  }

  section2();
}

function section2() {
  if (
    !input_2g.validity.valid ||
    !input_2c.validity.valid ||
    !input_2a.validity.valid ||
    !input_2u.validity.valid
  )
    return;

  let formula_Cy5 = "C37H49N3O4P";

  let formulas_Pcyc = {
    G: "C10H12N5O7P",
    C: "C9H12N3O7P",
    A: "C10H12N5O6P",
    U: "C9H11N2O8P",
  };

  let formulas_noP = {};
  Object.keys(formulas_Pcyc).forEach((nucleotide) => {
    let formula = new MolecularFormula(formulas_Pcyc[nucleotide]);
    formula.subtract("PO3");
    formula.add("OH");
    formulas_noP[nucleotide] = formula.getFormula();
  });

  let formulas_P235 = {};
  Object.keys(formulas_Pcyc).forEach((nucleotide) => {
    let formula = new MolecularFormula(formulas_Pcyc[nucleotide]);
    formula.add("OH2");
    formulas_P235[nucleotide] = formula.getFormula();
  });

  let prefix = "";
  let result = "";
  let suffix = "";
  let values = {
    G: input_2g.value,
    C: input_2c.value,
    A: input_2a.value,
    U: input_2u.value,
  };

  let last_non_zero;
  for (const nucleotide in values) {
    if (Object.hasOwnProperty.call(values, nucleotide)) {
      if (values[nucleotide] > 0) last_non_zero = nucleotide;
    }
  }

  if (input_2noP.checked) {
    if (last_non_zero) {
      values[last_non_zero] -= 1;
      suffix = " (" + formulas_noP[last_non_zero] + ")";
    }
  } else if (input_2P23.checked) {
    if (last_non_zero) {
      values[last_non_zero] -= 1;
      suffix = " (" + formulas_P235[last_non_zero] + ")";
    }
  }

  if (input_2Cy5.checked) {
    if (last_non_zero) {
      prefix = "(" + formula_Cy5 + ") ";
    }
  }

  if (values.G > 0) {
    result += "(" + formulas_Pcyc.G + ")";
    if (values.G > 1) result += values.G;
    result += " ";
  }

  if (values.C > 0) {
    result += "(" + formulas_Pcyc.C + ")";
    if (values.C > 1) result += values.C;
    result += " ";
  }

  if (values.A > 0) {
    result += "(" + formulas_Pcyc.A + ")";
    if (values.A > 1) result += values.A;
    result += " ";
  }

  if (values.U > 0) {
    result += "(" + formulas_Pcyc.U + ")";
    if (values.U > 1) result += values.U;
    result += " ";
  }
  result = result.trim();

  input_3.value = prefix + result + suffix;
  section3();
}

function section3() {
  if (!input_3.validity.valid) return;

  let sequence = input_3.value;
  let formula = new MolecularFormula(sequence);
  let simplified = formula.getSimplifiedFormula();
  let isotopes = emass.calculate(formula.composition, 0);
  let avgmass = formula.getMass();
  let mass = isotopes[0].Mass;
  input_4mass.value = mass;
  input_4avgmass.value = avgmass;
  input_4simplified.value = simplified;
}
