const espree = require("espree");
const fs = require("fs");
let file = fs.readFileSync("./test.js", "utf8");
let astTree = espree.parse(file, {ecmaFeatures: {jsx: true}, ecmaVersion: "latest", sourceType: "module", range: true});

console.log(JSON.stringify(astTree));