const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("runtime initialization is isolated so one module cannot break anchor recovery", () => {
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

  assert.match(script, /const runInit = \(name, init\) => \{/);
  assert.match(script, /try \{\s*init\(\);\s*\} catch \(error\) \{/s);
  assert.match(script, /console\.error\(`\[init:\$\{name\}\] failed`, error\);/);
  assert.match(script, /runInit\("direction topic motion", initDirectionTopicMotion\);/);
  assert.doesNotMatch(script, /runInit\("project ascii build"/);
  assert.doesNotMatch(script, /runInit\("project spiral"/);
  assert.doesNotMatch(script, /runInit\("project curtain"/);
  assert.match(script, /runInit\("anchor scroll", initAnchorScroll\);/);
});

test("split direction image removes scroll state coupling", () => {
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

  assert.doesNotMatch(script, /const initProjectCurtain = \(\) => \{/);
  assert.doesNotMatch(script, /const initDirectionReveal = \(\) => \{/);
  assert.doesNotMatch(script, /--direction-project-reveal-y/);
  assert.doesNotMatch(script, /--direction-reveal-y/);
  assert.doesNotMatch(script, /is-project-reveal-active/);
  assert.doesNotMatch(script, /is-under-principles-reveal/);
});

test("initial hash navigation is corrected after dynamic layout settles", () => {
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

  assert.match(script, /const syncHashTarget = \(behavior = "auto"\) => \{/);
  assert.match(script, /window\.setTimeout\(\(\) => scrollToHashTarget\(hash, "auto"\), 160\);/);
  assert.match(script, /window\.setTimeout\(\(\) => scrollToHashTarget\(hash, "auto"\), 520\);/);
  assert.match(script, /window\.addEventListener\("hashchange", \(\) => syncHashTarget\("smooth"\)\);/);
  assert.match(script, /window\.addEventListener\("load", \(\) => syncHashTarget\("auto"\), \{ once: true \}\);/);
});

test("projects section is static and does not own the ASCII portrait", () => {
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

  assert.doesNotMatch(script, /const initProjectAsciiBuild = \(\) =>/);
  assert.doesNotMatch(script, /const initProjectSpiral = \(\) =>/);
  assert.doesNotMatch(script, /data-project-ascii-build/);
  assert.match(script, /data-direction-ascii-portrait/);
  assert.doesNotMatch(script, /data-project-spiral/);
  assert.doesNotMatch(script, /project-spiral-arrow/);
  assert.doesNotMatch(script, /activationScrollY/);
  assert.doesNotMatch(css, /project-spiral/);
  assert.doesNotMatch(css, /--project-spiral-/);
  assert.match(css, /\.project-static-stage\s*{[^}]*position:\s*relative;/s);
  assert.match(css, /\.project-static-section\s*{[^}]*margin-top:\s*-100svh;/s);
  assert.match(css, /\.project-collage\s*{/);
  assert.match(css, /@keyframes project-marquee-scroll\s*{/);
  assert.doesNotMatch(css, /\.project-static-stage\s*{[^}]*position:\s*sticky;/s);
  assert.doesNotMatch(script, /const startLine = viewportHeight \* 0\.12/);
  assert.doesNotMatch(script, /const hasScrolledPastInitialState = rect\.top <= startLine;/);
  assert.doesNotMatch(script, /const syncProgressToScroll = \(\) => \{/);
  assert.doesNotMatch(script, /stage\.style\.setProperty\("--project-stage-y"/);
  assert.doesNotMatch(script, /--project-stage-y/);
  assert.doesNotMatch(script, /const scrollRange = Math\.max\(1, section\.offsetHeight\);/);
  assert.doesNotMatch(script, /const scrollDistance = Math\.max\(0, -rect\.top\);/);
  assert.doesNotMatch(script, /targetProgress = startIndex \+ scrollProgress/);
  assert.doesNotMatch(script, /const autoDelay = 2500;/);
  assert.doesNotMatch(script, /const triggerArrowPush = \(\) => \{/);
  assert.doesNotMatch(script, /const applyProgressStep = \(direction\) => \{/);
  assert.doesNotMatch(script, /const stepProgress = async \(direction\) => \{/);
  assert.doesNotMatch(script, /window\.setTimeout\(async \(\) => \{/);
  assert.doesNotMatch(script, /await stepProgress\(1\);/);
  assert.doesNotMatch(script, /const directionRect = directionSection\?\.getBoundingClientRect\(\);/);
  assert.doesNotMatch(script, /const directionCurtainBottom = directionRect \? directionRect\.bottom : rect\.top \+ viewportHeight;/);
  assert.doesNotMatch(script, /const hasClearedDirectionCurtain = directionCurtainBottom <= viewportHeight \* 0\.28;/);
  assert.doesNotMatch(script, /const shouldStart = hasScrolledPastInitialState && rect\.bottom > endLine;/);
  assert.doesNotMatch(script, /setStarted\(shouldStart\)/);
  assert.doesNotMatch(script, /start-ascii-portrait-build/);
  assert.match(script, /postMessage\(\{ type: "set-ascii-portrait-progress"/);
});

test("projects section no longer preserves animated spiral state", () => {
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

  assert.doesNotMatch(script, /^\s*targetProgress = startIndex;/m);
  assert.doesNotMatch(script, /^\s*progress = startIndex;/m);
  assert.doesNotMatch(script, /^\s*completedSteps = 0;/m);
  assert.doesNotMatch(script, /stopAutoScroll/);
  assert.doesNotMatch(script, /startAutoScroll/);
  assert.doesNotMatch(script, /let hasStarted = false;\s*let completedSteps = 0;/);
  assert.doesNotMatch(script, /setStarted\(shouldStart\)/);
  assert.doesNotMatch(script, /is-tail-pinned/);
});
