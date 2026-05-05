const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("energy particle background uses the reference count and spread", () => {
  const particlesScript = fs.readFileSync(path.join(root, "particles-bg.js"), "utf8");

  assert.match(particlesScript, /particleCount:\s*200/);
  assert.match(particlesScript, /particleSpread:\s*20/);
  assert.match(particlesScript, /speed:\s*0\.1/);
  assert.match(particlesScript, /particleBaseSize:\s*100/);
});
