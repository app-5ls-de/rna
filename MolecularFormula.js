// changes compared to the original:
// 1. lines 179-182
// 2. lines 187-192
// 3. lines 89-94

window.MolecularFormula = class MolecularFormula {
  constructor(mf) {
    this.formula = mf.replace(/[⁰¹²³⁴-⁹₀-₉]/g, function (char) {
      return char.charCodeAt(0).toString(16).slice(-1);
    });
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

  addComposition(composition) {
    for (var key in composition) {
      if (!(key in this.composition)) {
        this.composition[key] = composition[key];
      } else {
        this.composition[key] += composition[key];
      }
    }
  }

  subtractComposition(composition) {
    for (var key in composition) {
      if (!(key in this.composition)) {
        continue;
      } else {
        this.composition[key] -= composition[key];
        if (this.composition[key] <= 0) {
          delete this.composition[key];
        }
      }
    }
  }

  add(new_formula) {
    var composition = {};
    if (typeof new_formula === "string") {
      var expanded = this.cleanParantheses(new_formula);
      composition = this.formulaToJson(expanded);
    } else {
      composition = new_formula;
    }
    this.addComposition(composition);
    this.simplifiedFormula = this.createSimplifiedFormula();
    this.formula = this.simplifiedFormula;
  }

  subtract(new_formula) {
    var composition = {};
    if (typeof new_formula === "string") {
      var expanded = this.cleanParantheses(new_formula);
      composition = this.formulaToJson(expanded);
    } else {
      composition = new_formula;
    }
    this.subtractComposition(composition);
    this.simplifiedFormula = this.createSimplifiedFormula();
    this.formula = this.simplifiedFormula;
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
      if (multiplier !== 0) {
        for (var i = 0; i < elemList.length; i++) {
          newPartial += elemList[i][0];
          newPartial += elemList[i][1] * multiplier;
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
