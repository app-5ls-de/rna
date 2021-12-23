const input_1sequence = crel("#input_1sequence");
const output_1rc = crel("#output_1rc");
const output_1r = crel("#output_1r");
const output_1c = crel("#output_1c");

const input_modification3prime = crel("#input_modification3prime");
const input_modification5prime = crel("#input_modification5prime");
const output_2Tm = crel("#output_2Tm");
const output_2GC = crel("#output_2GC");
const output_2length = crel("#output_2length");

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

[input_4z, input_4fwhm, input_4adducts].forEach((element) => {
  crel(element, {
    on: {
      keypress: (e) => onEnter(e, section3),
      input: section1,
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

[
  [input_modification5prime, [...modifications, ...modifications5prime]],
  [input_modification3prime, [...modifications, ...modifications3prime]],
].map(([input_element, modifications_list]) => {
  modifications_list.forEach((modification) => {
    input_element.appendChild(
      crel(
        "option",
        { value: modification.short_name },
        modification.short_name
      )
    );
  });
});

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

  if (input_modification3prime.value) {
    let modifier = [...modifications, ...modifications3prime].find(
      (x) => x.short_name == input_modification3prime.value
    );
    formula.add(modifier.add).subtract(modifier.subtract);
  }

  if (input_modification5prime.value) {
    let modifier = [...modifications, ...modifications5prime].find(
      (x) => x.short_name == input_modification5prime.value
    );
    formula.add(modifier.add).subtract(modifier.subtract);
  }

  output_3formula.value = formula.formula;

  output_2length.value = get_length(sequence).toString();
  output_2GC.value = (gc_content(sequence) * 100).toPrecision(3);
  output_2Tm.value = melting_temperature(sequence).toPrecision(2);

  let charge = -1 * parseInt(input_4z.value) || 0;

  let isotopes = get_isotopes(formula, charge);

  let most_abundant = isotopes.reduce((pv, cv) =>
    pv.Abundance > cv.Abundance ? pv : cv
  );

  output_4mass.value = most_abundant.Mass.toPrecision(7);
  output_4avgmass.value = get_avgmass(isotopes).toPrecision(7);

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
    if (isotope.Abundance == most_abundant.Abundance)
      row.classList.add("text-primary");
  }
  table_4body.replaceChildren(...childs);

  let FWHM = parseFloat(input_4fwhm.value);
  let isotopes_with_adducts = get_isotopes_list(
    create_derivates(formula, adducts, 0.01),
    charge
  );
  plot_isotopes(isotopes_with_adducts, plot_4, FWHM);
  return;
}
