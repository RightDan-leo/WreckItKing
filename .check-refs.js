const fs = require("fs");
const code = fs.readFileSync(".syntax-check.js", "utf8");

const defined = new Set();
for (const m of code.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)) defined.add(m[1]);
for (const m of code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);

const builtins = new Set([
    "if", "for", "while", "switch", "catch", "function", "return", "typeof",
    "Math", "Number", "String", "Array", "Object", "Map", "Set", "JSON",
    "parseFloat", "parseInt", "setTimeout", "clearTimeout", "setInterval",
    "requestAnimationFrame", "addEventListener", "console", "isNaN", "Boolean",
    "Date", "performance", "document", "window", "THREE", "nipplejs",
    "localStorage", "Promise", "encodeURIComponent", "AudioContext"
]);

const called = new Set();
for (const m of code.matchAll(/(^|[^\w$.])([A-Za-z_$][\w$]*)\s*\(/gm)) called.add(m[2]);

const missing = [...called].filter(name => !defined.has(name) && !builtins.has(name));
console.log("MISSING CALLS:", missing.length ? missing.join(", ") : "(none)");

const usedIdentifiers = new Set();
for (const m of code.matchAll(/(^|[^\w$.'"])([A-Za-z_$][\w$]*)/gm)) usedIdentifiers.add(m[2]);
const unusedFunctions = [...defined].filter(name => {
    const uses = code.split(new RegExp(`\\b${name}\\b`)).length - 1;
    return uses <= 1;
});
console.log("POSSIBLY UNUSED:", unusedFunctions.length ? unusedFunctions.join(", ") : "(none)");
