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

const adducts = [
  {
    add: "Na",
    subtract: "H",
    factor: 0.4,
  },
  {
    add: "K",
    subtract: "H",
    factor: 0.08,
  },
];

const reverse = (sequence) => sequence.split("").reverse().join("");

const normalize_sequence = (sequence) =>
  new MolecularFormula(sequence.toUpperCase()).getLongFormula();

const is_normalized_sequence = (sequence) =>
  new RegExp("^[AUGC ]+$").test(sequence);

const is_sequence = (sequence) =>
  MolecularFormula.isValid(sequence) &&
  is_normalized_sequence(normalize_sequence(sequence));

const get_isotopes = (formula, charge = 0, factor = 1, show_formula = false) =>
  new MolecularFormula(formula).contains("H" + charge)
    ? emass
        .calculate(
          new MolecularFormula(formula).subtract({ H: charge }).composition,
          charge
        )
        .map(({ Mass, Abundance }) => ({ Mass, Abundance: Abundance * factor }))
        .map((isotope) => {
          if (show_formula)
            isotope.formula = new MolecularFormula(formula).formula;
          return isotope;
        })
    : new Error("charge is too high");

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

const get_formula = (sequence) =>
  Object.keys(get_components(sequence))
    .reduce(
      (formula, key) =>
        formula.add(cyclicMP[key], get_component(sequence, key)),
      new MolecularFormula("")
    )
    // remove last cyclic Phosphate
    .subtract("PO4H3")
    .add("(H2O)2)");

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

function create_derivates(
  base_formula,
  derivate_rules,
  limit = 0.000001 /* PruneLimit */,
  base_factor = 1,
  depth = Infinity
) {
  // null cases:
  // 1. depth == 0
  // 2. factor < limit
  // 3. base_formula does not contain derivate_rule.subtract

  let formulas = [{ formula: base_formula, factor: base_factor }];
  if (depth == 0) return formulas;

  derivate_rules.forEach(({ add, subtract, factor }) => {
    let f = base_factor * factor;
    let mf = new MolecularFormula(base_formula); // create copy

    if (!mf.contains(subtract)) return;
    if (f < limit) return;

    let formula = mf.add(add).subtract(subtract).formula;
    formulas.push(
      ...create_derivates(formula, derivate_rules, limit, f, depth - 1)
    );
  });

  return formulas;
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

function plot_isotopes(isotopes, target, FWHM = 0.05) {
  let standardDeviation = FWHM / 2.3548;

  let gaussians = isotopes.map(({ Mass, Abundance }) => ({
    height: Abundance * 100,
    mean: Mass,
    standardDeviation,
  }));

  const gaussian = (x, mean, standardDeviation) =>
    Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(standardDeviation, 2)));

  const fn = (scope) =>
    gaussians.reduce(
      (pv, { height, mean, standardDeviation }) =>
        pv + gaussian(scope.x, mean, standardDeviation) * height,
      0
    );

  const expand = (range, factor) => [
    range[0] - (range[1] - range[0]) * factor,
    range[1] + (range[1] - range[0]) * factor,
  ];

  let y_max = gaussians.reduce(
    (pv, { mean }) => Math.max(pv, fn({ x: mean })),
    0
  );

  let yDomain = expand([0, y_max], 0.05);

  let xDomain = expand(
    [
      gaussians.reduce((pv, { mean }) => Math.min(pv, mean), 0) -
        3 * standardDeviation,
      gaussians.reduce((pv, { mean }) => Math.max(pv, mean), 0) -
        3 * standardDeviation,
    ],
    0.1
  );

  let yAxis = {
    label: "%",
    domain: yDomain,
  };
  let xAxis = {
    label: "[u]",
    domain: xDomain,
  };

  let contentsBounds = target.getBoundingClientRect();
  let width = 800;
  let height = 500;
  let ratio = contentsBounds.width / width;
  width *= ratio;
  height *= ratio;

  let options = {
    target,
    width,
    height,
    grid: true,
    xAxis,
    yAxis,
    data: [
      {
        graphType: "polyline",
        fn,
      },
    ],
  };

  let instance = functionPlot(options);

  return instance;
  /*
  let rect = target
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
  }); */
}
