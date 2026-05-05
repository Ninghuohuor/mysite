const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("direction ASCII portrait is bottom anchored and grows upward from scroll progress", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
  const asciiHtml = fs.readFileSync(path.join(root, "assets/projects/ascii-portrait.html"), "utf8");

  assert.match(html, /<div class="direction-cover-stage">\s*<iframe class="direction-ascii-portrait" data-direction-ascii-portrait src="assets\/projects\/ascii-portrait\.html\?v=ascii-scroll-progress-20260503a" title="ASCII portrait of Ninghuohuo" loading="eager"><\/iframe>\s*<div class="direction-single" aria-label="AI focus directions">\s*<div class="direction-copy">/);
  assert.doesNotMatch(html, /data-project-ascii-build/);
  assert.doesNotMatch(html, /class="project-ascii-portrait"/);

  assert.match(css, /\.direction-single\s*{[^}]*position:\s*relative;[^}]*display:\s*block;[^}]*width:\s*100%;[^}]*max-width:\s*none;[^}]*margin:\s*0;/s);
  assert.match(css, /\.direction-ascii-portrait\s*{[^}]*position:\s*fixed;[^}]*left:\s*clamp\(10px, 2\.2vw, 34px\);[^}]*bottom:\s*var\(--direction-ascii-bottom, 0px\);[^}]*width:\s*clamp\(260px, 30vw, 560px\);[^}]*height:\s*min\(84svh, 860px\);[^}]*opacity:\s*var\(--direction-ascii-opacity, 0\);[^}]*transform:\s*none;/s);
  assert.match(css, /\.direction-ascii-portrait\s*{[^}]*filter:\s*invert\(1\);/s);
  assert.doesNotMatch(css, /\.project-ascii-portrait/);
  assert.doesNotMatch(css, /--project-ascii-/);

  assert.doesNotMatch(script, /const initProjectAsciiBuild = \(\) =>/);
  assert.doesNotMatch(script, /runInit\("project ascii build"/);
  assert.doesNotMatch(script, /start-ascii-portrait-build/);
  assert.doesNotMatch(script, /startAsciiPortraitBuild/);
  assert.match(script, /const directionAscii = section\.querySelector\("\[data-direction-ascii-portrait\]"\);/);
  assert.match(script, /const sendDirectionAsciiProgress = \(progress\) => \{/);
  assert.match(script, /directionAscii\.contentWindow\?\.postMessage\(\{ type: "set-ascii-portrait-progress", progress: clampedProgress \}, "\*"\);/);
  assert.match(script, /const directionAsciiBottom = Math\.max\(0, viewportHeight - rect\.bottom\);/);
  assert.match(script, /const directionAsciiActive = rect\.top <= viewportHeight && rect\.bottom >= 0;/);
  assert.match(script, /section\.style\.setProperty\("--direction-ascii-bottom", `\$\{Math\.round\(directionAsciiBottom\)\}px`\);/);
  assert.match(script, /section\.style\.setProperty\("--direction-ascii-opacity", directionAsciiActive \? "\.96" : "0"\);/);
  assert.match(script, /const directionModuleScrollDistance = Math\.max\(0, viewportHeight - rect\.top\);/);
  assert.match(script, /let lastTopicNaturalCompleteDistance = Number\.POSITIVE_INFINITY;/);
  assert.match(script, /lastTopicNaturalCompleteDistance = directionModuleScrollDistance \+ Math\.max\(0, center - revealEnd\);/);
  assert.match(script, /const finalRevealCompleteDistance = viewportHeight \+ maxCoverY;/);
  assert.match(script, /const directionAsciiCompleteDistance = Math\.max\(1, Math\.min\(lastTopicNaturalCompleteDistance, finalRevealCompleteDistance\)\);/);
  assert.match(script, /const directionAsciiProgress = Math\.max\(0, Math\.min\(1, directionModuleScrollDistance \/ directionAsciiCompleteDistance\)\);/);
  assert.match(script, /sendDirectionAsciiProgress\(directionAsciiProgress\);/);
  assert.doesNotMatch(script, /sendDirectionAsciiProgress\(directionTextCompleteProgress\);/);
  assert.match(script, /directionAscii\?\.addEventListener\("load", \(\) => sendDirectionAsciiProgress\(lastDirectionAsciiProgress\)\);/);
  assert.match(script, /topics\.forEach\(\(topic\) => setTopicState\(topic, 1\)\);\s*sendDirectionAsciiProgress\(1\);/s);

  assert.match(asciiHtml, /set-ascii-portrait-progress/);
  assert.match(asciiHtml, /function setAsciiPortraitProgress\(progress\)/);
  assert.match(asciiHtml, /const activeLineIndex = Math\.floor\(clampedProgress \* lines\.length\);/);
  assert.match(asciiHtml, /const buildOrder = order;/);
  assert.match(asciiHtml, /if \(buildOrder < activeLineIndex\) \{/);
  assert.match(asciiHtml, /if \(buildOrder === activeLineIndex && clampedProgress < 1\) \{/);
  assert.match(asciiHtml, /const preserveLineSpace = \(line, finalText\) => \{/);
  assert.match(asciiHtml, /const scrambleCharacters = "\.\:\,;\+\*#%";/);
  assert.match(asciiHtml, /window\.setAsciiPortraitProgress = setAsciiPortraitProgress;/);
  assert.match(asciiHtml, /event\.data\?\.type === 'set-ascii-portrait-progress'/);
  assert.match(asciiHtml, /setAsciiPortraitProgress\(event\.data\.progress\);/);
  assert.doesNotMatch(asciiHtml, /totalBuildDuration/);
  assert.doesNotMatch(asciiHtml, /requestAnimationFrame\(animate\)/);
  assert.doesNotMatch(asciiHtml, /startAsciiPortraitBuild/);
  assert.doesNotMatch(asciiHtml, /start-ascii-portrait-build/);
  assert.doesNotMatch(asciiHtml, /#autostart/);
});
