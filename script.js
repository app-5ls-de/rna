const input_1sequence = crel("#input_1sequence");
const output_1rc = crel("#output_1rc");
const output_1r = crel("#output_1r");
const output_1c = crel("#output_1c");

const input_2Cy5 = crel("#input_2Cy5");
const input_2_3_noP = crel("#input_2_3_noP");
const input_2_3_Pcyc = crel("#input_2_3_Pcyc");
const input_2_3_P23 = crel("#input_2_3_P23");
const list_input_2 = [input_2Cy5, input_2_3_noP, input_2_3_Pcyc, input_2_3_P23];
const output_2Tm = crel("#output_2Tm");
const output_2GC = crel("#output_2GC");
const output_2length = crel("#output_2length");

const input_3 = crel("#input_3");
const output_3formula = crel("#output_3formula");

const input_4z = crel("#input_4z");
const input_4fwhm = crel("#input_4fwhm");
const output_4mass = crel("#output_4mass");
const output_4avgmass = crel("#output_4avgmass");
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
      keypress: (e) => onEnter(e, section1),
      input: section1,
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
  input_1sequence.setCustomValidity(
    is_sequence(input_1sequence.value) ? "" : "not valid"
  );

  if (!input_1sequence.validity.valid) return;

  let sequence = input_1sequence.value.toUpperCase();

  output_1rc.value = reverse(complement(sequence));
  output_1r.value = reverse(sequence);
  output_1c.value = complement(sequence);

  let formula = get_formula(sequence);

  let modifier3prime = {
    add: "",
    subtract: "",
  };
  if (input_2_3_Pcyc.checked) {
    modifier3prime = [...modifications, ...modifications3prime].find(
      (x) => x.short_name == "Pcyc"
    );
  } else if (input_2_3_P23.checked) {
    modifier3prime = [...modifications, ...modifications3prime].find(
      (x) => x.short_name == "P"
    );
  }

  formula.add(modifier3prime.add).subtract(modifier3prime.subtract);

  let modifier5prime = {
    add: "",
    subtract: "",
  };
  if (input_2Cy5.checked) {
    modifier5prime = [...modifications, ...modifications5prime].find(
      (x) => x.short_name == "Cy5"
    );
  }
  formula.add(modifier5prime.add).subtract(modifier5prime.subtract);

  output_3formula.value = formula.formula;

  output_2length.value = get_length(sequence).toString();
  output_2GC.value = (gc_content(sequence) * 100).toPrecision(3);
  output_2Tm.value = melting_temperature(sequence).toPrecision(2);

  let charge = -1 * parseInt(input_4z.value) || 0;

  //let formula;
  let isotopes = get_isotopes(formula, charge);

  let avgmass = formula.getMass();
  if (charge > 0) avgmass = avgmass / charge - 1;

  console.log(avgmass, get_avgmass(isotopes), get_avgmass2(formula, charge));

  let abundances = isotopes.map((isotope) => isotope.Abundance);
  let index_most_abundant = abundances.indexOf(Math.max(...abundances));
  let mass_most_abundant = isotopes[index_most_abundant].Mass;

  output_4mass.value = mass_most_abundant.toPrecision(7);
  output_4avgmass.value = avgmass.toPrecision(7);

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
  if (input_1sequence.value) section1();
}, 0);
