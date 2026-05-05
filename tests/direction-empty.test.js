const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("direction section renders the split feature image and scroll copy", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const featureMatch = html.match(/<section class="direction-image-panel" aria-label="我关注的方向大图">([\s\S]*?)<\/section>/);
  const sectionMatch = html.match(/<section class="brag-zone" id="direction" aria-labelledby="direction-title">([\s\S]*?)<\/section>/);

  assert.ok(featureMatch, "direction feature image should be split into its own section");
  assert.ok(sectionMatch, "direction section should remain");
  assert.match(featureMatch[1], /<figure class="direction-feature">/);
  assert.match(featureMatch[1], /assets\/direction\/direction-studio-workspace\.png/);
  assert.match(featureMatch[1], /alt="Working on a laptop in a plant-filled studio"/);
  assert.equal((html.match(/data-direction-collage-image/g) || []).length, 1);
  assert.match(
    sectionMatch[1],
    /<h1 id="direction-title"><span aria-hidden="true">↘<\/span> 我关注的方向<\/h1>/
  );
  assert.match(sectionMatch[1], /<div class="direction-cover-stage">/);
  assert.match(sectionMatch[1], /data-direction-ascii-portrait/);
  assert.match(sectionMatch[1], /<div class="direction-single" aria-label="AI focus directions">/);
  assert.equal((sectionMatch[1].match(/class="direction-topic"/g) || []).length, 5);
  assert.match(sectionMatch[1], /AI产品与增长/);
  assert.match(sectionMatch[1], /AI自动化工作流/);
  assert.match(sectionMatch[1], /AI一人公司变现项目/);
  assert.match(sectionMatch[1], /AI 内容与个人品牌/);
  assert.match(sectionMatch[1], /AI变现逆向拆解/);
  assert.doesNotMatch(sectionMatch[1], /direction-collage/);
  assert.doesNotMatch(html, /data-card-swap/);
  assert.doesNotMatch(html, /direction-card/);
});

test("direction split styles keep the feature image independent from scroll copy", () => {
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

  assert.match(css, /\.direction-image-panel\s*{[^}]*position:\s*relative;[^}]*z-index:\s*1;[^}]*min-height:\s*200svh;/s);
  assert.match(css, /\.direction-feature\s*{[^}]*position:\s*sticky;[^}]*top:\s*0;[^}]*height:\s*100svh;/s);
  assert.match(css, /\.direction-feature img\s*{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*cover;/s);
  assert.match(css, /\.direction-cover-stage\s*{[^}]*position:\s*sticky;[^}]*top:\s*0;[^}]*height:\s*100svh;/s);
  assert.match(css, /\.direction-ascii-portrait\s*{[^}]*position:\s*fixed;[^}]*bottom:\s*var\(--direction-ascii-bottom, 0px\);/s);
  assert.match(script, /const directionAscii = section\.querySelector\("\[data-direction-ascii-portrait\]"\);/);
  assert.match(script, /postMessage\(\{ type: "set-ascii-portrait-progress", progress: clampedProgress \}, "\*"\)/);
  assert.doesNotMatch(css, /\.direction-collage\s*{/);
  assert.doesNotMatch(css, /\.card-swap-container/);
  assert.doesNotMatch(css, /\.direction-card/);
  assert.doesNotMatch(script, /initCardSwap/);
  assert.doesNotMatch(script, /data-card-swap/);
  assert.doesNotMatch(script, /direction-card/);
  assert.doesNotMatch(script, /runInit\("card swap"/);
});
