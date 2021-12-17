window.MolecularFormula = class MolecularFormula {
  constructor(mf) {
    if (mf instanceof MolecularFormula) {
      this.formula = mf.formula;
    } else {
      this.formula = mf.replace(/[⁰¹²³⁴-⁹₀-₉]/g, function (char) {
        return char.charCodeAt(0).toString(16).slice(-1);
      });
    }
    var expanded = this.cleanParantheses(this.formula);
    this.composition = this.formulaToJson(expanded);
    this.simplifiedFormula = this.createSimplifiedFormula();
  }

  getMass() {
    var mass = 0.0;
    for (var key in this.composition) {
      mass += isoAbund(key)["Mass"] * this.composition[key];
    }
    return mass;
  }

  getFormula() {
    return this.formula;
  }

  getComposition() {
    return this.composition;
  }

  getSimplifiedFormula() {
    return this.simplifiedFormula;
  }

  getExpanded() {
    return this.cleanParantheses(this.formula);
  }

  getLongFormula() {
    var expanded = this.getExpanded();
    var elemList = this.createElemList(expanded);
    return elemList.reduce((pv, [atom, count]) => pv + atom.repeat(count), ""); // atom count
  }

  addComposition(composition, multiplier = 1) {
    if (!Number.isInteger(multiplier)) throw new Error("invalid multiplier");

    for (var key in composition) {
      if (!(key in this.composition)) {
        this.composition[key] = composition[key] * multiplier;
      } else {
        this.composition[key] += composition[key] * multiplier;
      }
    }
  }

  subtractComposition(composition, multiplier = 1, only_if_possible = false) {
    if (!Number.isInteger(multiplier)) throw new Error("invalid multiplier");

    for (var key in composition) {
      if (composition[key] == 0) continue;
      if (!(key in this.composition)) {
        if (only_if_possible) throw new Error("subtraction is not possible");
        console.info(
          'Tried to remove "' + key + '" from "' + this.formula + '"'
        );
        continue;
      } else {
        this.composition[key] -= composition[key] * multiplier;
        if (this.composition[key] <= 0) {
          if (this.composition[key] < 0)
            if (only_if_possible)
              throw new Error("subtraction is not possible");
          console.info(
            'Tried to remove "' + key + '" from "' + this.formula + '"'
          );
          delete this.composition[key];
        }
      }
    }
  }

  add(new_formula, multiplier) {
    var composition = {};
    if (typeof new_formula === "string") {
      var expanded = this.cleanParantheses(new_formula);
      composition = this.formulaToJson(expanded);
    } else {
      composition = new_formula;
    }
    this.addComposition(composition, multiplier);
    this.simplifiedFormula = this.createSimplifiedFormula();
    this.formula = this.simplifiedFormula;

    return this;
  }

  subtract(new_formula, multiplier, only_if_possible) {
    var composition = {};
    if (typeof new_formula === "string") {
      var expanded = this.cleanParantheses(new_formula);
      composition = this.formulaToJson(expanded);
    } else {
      composition = new_formula;
    }
    this.subtractComposition(composition, multiplier, only_if_possible);
    this.simplifiedFormula = this.createSimplifiedFormula();
    this.formula = this.simplifiedFormula;

    return this;
  }

  createSimplifiedFormula() {
    var formula = "";
    for (var key in this.composition) {
      if (this.composition.hasOwnProperty(key)) {
        if (this.composition[key] !== 0) {
          formula += key;
          if (this.composition[key] !== 1) {
            formula += this.composition[key];
          }
        }
      }
    }
    return formula;
  }

  createComposition(elemList) {
    var json = {};
    for (var i = 0; i < elemList.length; i++) {
      var atom = elemList[i][0];
      var count = parseInt(elemList[i][1]);
      if (!(atom in json)) {
        json[atom] = count;
      } else {
        json[atom] += count;
      }
    }
    return json;
  }

  createElemList(formula) {
    var l = formula.split("");
    var currentElem = "";
    var currentCount = "";
    var elemList = [];

    for (var i = 0; i < l.length; i++) {
      if (currentElem.length > 0 && this.isUpperCase(l[i])) {
        if (currentCount.length === 0) {
          currentCount = "1";
        }
        elemList.push([currentElem, currentCount]);
        currentElem = "";
        currentCount = "";
      }

      if (currentElem.length === 0 && this.isUpperCase(l[i])) {
        currentElem = l[i];
      }

      if (currentElem.length === 1 && this.isLowerCase(l[i])) {
        currentElem += l[i];
      }

      if (currentElem.length > 0 && this.isNumber(l[i])) {
        currentCount += l[i];
      }
    }
    if (currentCount.length === 0) {
      currentCount = "1";
    }
    elemList.push([currentElem, currentCount]);
    return elemList;
  }

  getParanthesisGroups(formula) {
    var openIndex = [];
    var groups = [];

    for (var i = 0; i < formula.length; i++) {
      var c = formula[i];
      if (c === "(") {
        openIndex.push(i);
      }
      if (c === ")") {
        groups.push([openIndex.pop(), i]);
      }
    }
    return groups;
  }

  cleanParantheses(formula) {
    if (!formula.includes("(")) {
      return formula;
    } else {
      var innerGroup = this.getParanthesisGroups(formula)[0];
      var startIndex = innerGroup[0];
      var stopIndex = innerGroup[1];

      var c = "";
      var i = 1;
      while (this.isNumber(formula[stopIndex + i])) {
        c += formula[stopIndex + i];
        i++;
      }
      var multiplier = 1;
      if (c.length !== 0) {
        multiplier = parseInt(c);
      }
      var partial = formula.substring(startIndex + 1, stopIndex);

      var elemList = this.createElemList(partial);
      var newPartial = "";
      if (partial.length > 0 && !this.isNumber(partial)) {
        if (multiplier !== 0) {
          for (var i = 0; i < elemList.length; i++) {
            newPartial += elemList[i][0];
            newPartial += elemList[i][1] * multiplier;
          }
        }
      }

      var replacePart = "(" + partial + ")";
      replacePart += c;
      var newFormula = formula.replace(replacePart, newPartial);
      return this.cleanParantheses(newFormula);
    }
  }

  formulaToJson(formula) {
    if (formula.length === 0) {
      return {};
    }
    var elemList = this.createElemList(formula);
    return this.createComposition(elemList);
  }

  contains(formula) {
    let composition = new MolecularFormula(formula).composition;

    for (var key in composition) {
      if (!(key in this.composition)) return false;
      if (this.composition[key] < composition[key]) return false;
    }
    return true;
  }

  isLowerCase(c) {
    return c === c.toLowerCase() && c !== c.toUpperCase();
  }

  isUpperCase(c) {
    return c === c.toUpperCase() && c !== c.toLowerCase();
  }

  isNumber(c) {
    return /^\d+$/.test(c);
  }
};

MolecularFormula.isValid = function (formula) {
  try {
    new MolecularFormula(formula);
    return true;
  } catch (e) {
    return false;
  }
};
