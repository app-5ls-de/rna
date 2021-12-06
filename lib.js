function complement(sequence, ignore_invalid_chars = true) {
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
    } else if (ignore_invalid_chars) {
      sequence_complement_split.push(nucleotide);
    } else {
      throw new Error("invalid char in sequence");
    }
  });

  return sequence_complement_split.join("");
}

function reverse(sequence) {
  return sequence.split("").reverse().join("");
}
