const input_1sequence = crel("#input_1sequence");
const input_1rc = crel("#input_1rc");
const input_1r = crel("#input_1r");
const input_1c = crel("#input_1c");

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
const input_2Tm = crel("#input_2Tm");
const input_2GC = crel("#input_2GC");
const input_2length = crel("#input_2length");

const input_3 = crel("#input_3");
const input_3simplified = crel("#input_3simplified");

const input_4z = crel("#input_4z");
const input_4fwhm = crel("#input_4fwhm");
const input_4mass = crel("#input_4mass");
const input_4avgmass = crel("#input_4avgmass");
const input_4adducts = crel("#input_4adducts");
const table_4body = crel("#table_4body");
const plot_4 = crel("#plot_4");

crel(input_1sequence, {
  on: {
    keypress: (e) => onEnter(e, section1),
    input: section1,
    blur: () => {
      input_1sequence.value = input_1sequence.value.toUpperCase();
    },
  },
});

list_input_2.forEach((element) => {
  crel(element, {
    on: {
      keypress: (e) => onEnter(e, section2),
      input: section2,
    },
  });
});

[input_2g, input_2c, input_2a, input_2u].forEach((element) => {
  crel(element, {
    on: {
      input: () => {
        disable_inputs([input_1sequence, input_1rc, input_1r, input_1c]);
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

[input_4z, input_4fwhm, input_4adducts].forEach((element) => {
  crel(element, {
    on: {
      keypress: (e) => onEnter(e, section3),
      input: section3,
    },
  });
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

  let formula;
  try {
    formula = new MolecularFormula(sequence);
    input_1sequence.classList.remove("is-invalid");
    input_1sequence.parentElement.classList.add("was-validated");
  } catch (error) {
    input_1sequence.classList.add("is-invalid");
    input_1sequence.parentElement.classList.remove("was-validated");
    return;
  }

  let composition = formula.getComposition();
  console.log(composition);

  input_2g.value = composition.G || 0;
  input_2c.value = composition.C || 0;
  input_2a.value = composition.A || 0;
  input_2u.value = composition.U || 0;

  let sequence_split = sequence.split("");
  let sequence_reversed = sequence_split.slice().reverse().join("");
  let sequence_complement;
  let sequence_complement_split = [];

  let complement_pairs = [
    ["G", "C"],
    ["A", "U"],
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

  sequence_split.forEach((nucleotide) => {
    if (Object.keys(complement_lookup).includes(nucleotide)) {
      sequence_complement_split.push(complement_lookup[nucleotide]);
    } else {
      sequence_complement_split.push(nucleotide);
    }
  });
  sequence_complement = sequence_complement_split.join("");
  sequence_reversed_complement = sequence_complement_split
    .slice()
    .reverse()
    .join("");

  input_1rc.value = sequence_reversed_complement;
  input_1r.value = sequence_reversed;
  input_1c.value = sequence_complement;

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

  let formula_Cy5 = "C37H48N3O4P";

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
    G: parseInt(input_2g.value),
    C: parseInt(input_2c.value),
    A: parseInt(input_2a.value),
    U: parseInt(input_2u.value),
  };

  let total_length = Object.values(values).reduce(
    (total, current) => total + current,
    0
  );
  input_2length.value = total_length.toString();
  let gc_content = ((values.G + values.C) / total_length) * 100;
  input_2GC.value = gc_content.toPrecision(3);

  let T_m;
  if (total_length < 14) {
    // Marmur formula
    T_m = (values.A + values.U) * 2 + (values.G + values.C) * 4;
  } else {
    // Wallace formula
    T_m = 64.9 + 41 * ((values.G + values.C - 16.4) / total_length);
  }

  input_2Tm.value = T_m.toPrecision(2);

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
  if (
    !input_3.validity.valid ||
    !input_4z.validity.valid ||
    !input_4fwhm.validity.valid
  )
    return;

  let sequence = input_3.value;
  let charge = -1 * parseInt(input_4z.value) || 0;

  let formula;
  let isotopes;
  try {
    formula = new MolecularFormula(sequence);
    let simplified = formula.getSimplifiedFormula();
    input_3simplified.value = simplified;

    formula.subtract({ H: charge });
    isotopes = emass.calculate(formula.composition, charge);

    input_3.classList.remove("is-invalid");
    input_3.parentElement.classList.add("was-validated");
  } catch (error) {
    input_3.classList.add("is-invalid");
    input_3.parentElement.classList.remove("was-validated");
    return;
  }

  let avgmass = formula.getMass();
  if (charge > 0) avgmass = avgmass / charge;

  let abundances = isotopes.map((isotope) => isotope.Abundance);
  let index_most_abundant = abundances.indexOf(Math.max(...abundances));
  let mass_most_abundant = isotopes[index_most_abundant].Mass;

  input_4mass.value = mass_most_abundant.toPrecision(7);
  input_4avgmass.value = avgmass.toPrecision(7);

  let childs = [];
  for (let i = 0; i < isotopes.length; i++) {
    const isotope = isotopes[i];
    let row;
    childs.push(
      (row = crel.tr(
        crel.th({ scope: "row" }, i.toString()),
        crel.td(isotope.Mass.toPrecision(7)),
        crel.td((isotope.Abundance * 100).toPrecision(3))
      ))
    );
    if (i == index_most_abundant) row.classList.add("text-primary");
  }
  table_4body.replaceChildren(...childs);

  let FWHM = parseFloat(input_4fwhm.value);
  let standardDeviation = FWHM / 2.3548;
  let important_isotopes = isotopes.filter(
    (isotope) => isotope.Abundance > 0.01
  );
  let important_masses = important_isotopes.map((isotope) => isotope.Mass);

  let isotopes_with_adducts = important_isotopes;
  if (input_4adducts.checked) {
    formula.add("K");
    formula.subtract("H");
    isotopes = emass.calculate(formula.composition, charge);

    isotopes.forEach((isotope) => {
      isotope.Abundance *= 0.08;
    });
    isotopes_with_adducts.push(...isotopes);
    formula.subtract("K");
    formula.add("H");

    for (let i = 1; i < 4; i++) {
      formula.add("Na");
      formula.subtract("H");
      isotopes = emass.calculate(formula.composition, charge);

      isotopes.forEach((isotope) => {
        isotope.Abundance *= Math.pow(0.4, i);
      });
      isotopes_with_adducts.push(...isotopes);
    }
  }

  let important_isotopes_with_adducts = isotopes_with_adducts.filter(
    (isotope) => isotope.Abundance > 0.01
  );

  function fn(scope) {
    var x = scope.x;
    let y = 0;

    important_isotopes_with_adducts.forEach((isotope) => {
      y += gaussian(x, isotope.Mass, standardDeviation) * isotope.Abundance;
    });
    return y * 100;
  }

  let range = [
    Math.min(...important_masses) - 3 * standardDeviation,
    Math.max(...important_masses) + 3 * standardDeviation,
  ];
  let d = (range[1] - range[0]) * 0.2;
  range[0] -= d;
  range[1] += d;

  let contentsBounds = plot_4.getBoundingClientRect();
  let width = 800;
  let height = 500;
  let ratio = contentsBounds.width / width;
  width *= ratio;
  height *= ratio;

  let y_padding = 5;
  let y_max = fn({ x: mass_most_abundant });
  let options = {
    target: "#plot_4",
    width,
    height,
    grid: true,
    // disableZoom: true,
    yAxis: {
      domain: [-y_padding, y_max + y_padding],
      label: "%",
    },
    xAxis: {
      label: "[u]",
      domain: range,
    },
    data: [
      {
        graphType: "polyline",
        fn: fn,
      },
    ],
  };

  let instance = functionPlot(options);

  let rect = document
    .getElementsByClassName("function-plot")[0]
    .getElementsByClassName("zoom-and-drag")[0];
  let old_domain = options.yAxis.domain;
  crel(rect, {
    on: {
      pointerout: () => {
        old_domain = options.yAxis.domain;
        options.yAxis.domain = [-y_padding, y_max + y_padding];
        functionPlot(options);
      },
      pointerenter: () => {
        options.yAxis.domain = old_domain;
        functionPlot(options);
      },
    },
  });
}

function gaussian(x, mean, standardDeviation) {
  return Math.exp(
    -Math.pow(x - mean, 2) / (2 * Math.pow(standardDeviation, 2))
  );
}

setTimeout(() => {
  if (input_1sequence.value) {
    section1();
  } else {
    section2();
  }
}, 0);
