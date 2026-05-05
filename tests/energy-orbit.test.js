const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("energy section keeps one outer orbit around three centered square images", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const orbitScript = fs.existsSync(path.join(root, "orbit-images.js"))
    ? fs.readFileSync(path.join(root, "orbit-images.js"), "utf8")
    : "";

  assert.match(html, /<script type="module" src="orbit-images\.js"><\/script>/);
  assert.match(html, /<div class="energy-orbit orbit-container" data-energy-orbit><\/div>/);
  assert.match(css, /\.orbit-container\s*{[^}]*position:\s*absolute;[^}]*left:\s*50%;[^}]*top:\s*58%;/s);
  assert.match(css, /\.orbit-container\s*{[^}]*pointer-events:\s*auto;/s);
  assert.match(css, /\.orbit-ring\s*{[^}]*position:\s*absolute;[^}]*inset:\s*0;/s);
  assert.match(css, /\.orbit-core-images\s*{[^}]*position:\s*absolute;[^}]*left:\s*50%;[^}]*top:\s*50%;[^}]*display:\s*flex;/s);
  assert.match(css, /\.orbit-item\s*{[^}]*position:\s*absolute;[^}]*offset-path:\s*path\(var\(--orbit-path\)\);/s);
  assert.match(css, /\.orbit-image\s*{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*contain;/s);
  assert.doesNotMatch(css, /\.orbit-image\s*{[^}]*border-radius:/s);
  assert.doesNotMatch(css, /\.orbit-image\s*{[^}]*box-shadow:/s);
  assert.equal((orbitScript.match(/assets\/energy\/frame-[\w-]+\.(?:jpg|png)/g) || []).length, 5);
  assert.match(orbitScript, /outerOrbitImages\s*=\s*\[[\s\S]*?\];/);
  assert.match(orbitScript, /coreOrbitImages\s*=\s*\[[\s\S]*?\];/);
  assert.equal((orbitScript.match(/outerOrbitImages[\s\S]*?];/)?.[0].match(/assets\/energy\/frame-[\w-]+\.(?:jpg|png)/g) || []).length, 2);
  assert.equal((orbitScript.match(/coreOrbitImages[\s\S]*?];/)?.[0].match(/assets\/energy\/frame-[\w-]+\.(?:jpg|png)/g) || []).length, 3);
  assert.match(orbitScript, /className:\s*"orbit-ring--outer"/);
  assert.doesNotMatch(orbitScript, /className:\s*"orbit-ring--inner"/);
  assert.match(orbitScript, /core\.className\s*=\s*"orbit-core-images"/);
  assert.match(orbitScript, /radiusX:\s*460/);
  assert.match(orbitScript, /radiusY:\s*110/);
  assert.doesNotMatch(orbitScript, /radiusX:\s*280/);
  assert.doesNotMatch(orbitScript, /radiusY:\s*64/);
  assert.match(orbitScript, /rotation:\s*-8/);
  assert.match(orbitScript, /duration:\s*30/);
  assert.match(orbitScript, /itemSize:\s*80/);
  assert.match(orbitScript, /showPath:\s*true/);
  assert.match(orbitScript, /orbitImageLabels/);
  assert.match(orbitScript, /orbit-hover-target/);
  assert.match(orbitScript, /orbit-hover-label/);
  assert.match(orbitScript, /orbit-heart-field/);
  assert.match(orbitScript, /spawnOrbitHeart/);
  assert.match(orbitScript, /pointerenter/);
  assert.match(orbitScript, /pointerleave/);
  assert.match(css, /\.orbit-hover-label\s*{[^}]*position:\s*absolute;[^}]*opacity:\s*0;[^}]*pointer-events:\s*none;/s);
  assert.match(css, /\.orbit-heart\s*{[^}]*position:\s*absolute;[^}]*animation:\s*orbit-heart-float/s);
  assert.match(css, /@keyframes orbit-heart-float/);
  assert.match(orbitScript, /document\.querySelector\("\[data-energy-orbit\]"\)/);
});
