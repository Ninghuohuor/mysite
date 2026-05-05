const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("principles sequence uses scroll-driven slides with native decay cards", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
  const principlesHtml = html.slice(
    html.indexOf('<section class="selected-projects" id="principles"'),
    html.indexOf('<section class="brag-zone" id="direction"')
  );

  assert.match(script, /const initPrinciplesDecayCards = \(\) =>/);
  assert.match(script, /querySelectorAll\("\[data-principles-decay-card\]"\)/);
  assert.match(script, /dataset\.principlesDecayDisplacement = "true"/);
  assert.match(script, /maxDisplacement/);
  assert.match(script, /movementBound/);
  assert.match(script, /window\.gsap\.set/);
  assert.match(script, /runInit\("principles decay cards", initPrinciplesDecayCards\)/);
  assert.match(script, /const initPrinciplesScroll = \(\) =>/);
  assert.match(script, /querySelector\("\[data-principles-scroll-stage\]"\)/);
  assert.match(script, /--principles-flow-y/);
  assert.match(script, /runInit\("principles scroll", initPrinciplesScroll\)/);
  assert.doesNotMatch(script, /principles-person-meta/);
  assert.doesNotMatch(script, /updatePersonMeta\(activeIndex\)/);
  assert.doesNotMatch(script, /const slideDuration = 4200;/);
  assert.doesNotMatch(script, /showSlide\(activeIndex \+ 1/);
  assert.doesNotMatch(script, /const initPrinciplesDecayStacks = \(\) =>/);
  assert.doesNotMatch(script, /className = "principles-decay-stack"/);
  assert.doesNotMatch(script, /data-principles-decay-stack-card/);
  assert.doesNotMatch(script, /runInit\("principles decay stacks", initPrinciplesDecayStacks\)/);
  assert.doesNotMatch(script, /createStack/);
  assert.doesNotMatch(script, /card-rotate/);
  assert.doesNotMatch(script, /refreshStackJitter/);

  assert.doesNotMatch(css, /\.content\s*{/);
  assert.match(css, /\.principles-scroll-stage\s*{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*z-index:\s*2;/s);
  assert.match(css, /\.principles-track\s*{[^}]*display:\s*grid;[^}]*row-gap:\s*clamp\(280px, 30vh, 460px\);[^}]*transform:\s*translate3d\(0, var\(--principles-flow-y, 0px\), 0\);/s);
  assert.match(css, /\.principles-slide\s*{[^}]*position:\s*relative;[^}]*opacity:\s*1;[^}]*visibility:\s*visible;/s);
  assert.match(css, /\.principles-copy\s*{[^}]*position:\s*relative;[^}]*margin-left:\s*50%;[^}]*width:\s*clamp\(240px, 24vw, 360px\);/s);
  assert.match(css, /\.principles-photo-card\s*{[^}]*position:\s*absolute;[^}]*right:\s*clamp\(73px, calc\(55px \+ 2\.25vw\), 85px\);[^}]*top:\s*0;[^}]*width:\s*clamp\(105px, 12vw, 195px\);/s);
  assert.match(css, /\.principles-quote\s*{[^}]*gap:\s*clamp\(12px, 1\.3vw, 22px\);[^}]*font-size:\s*clamp\(24px, 1\.65vw, 34px\);[^}]*font-weight:\s*700;/s);
  assert.match(css, /\.principles-quote-zh\s*{[^}]*font-size:\s*inherit;/s);
  assert.doesNotMatch(css, /\.principles-decay-card\s*{/);
  assert.doesNotMatch(css, /\.principles-decay-stack\s*{/);
  assert.doesNotMatch(css, /\.principles-decay-stack-card\s*{/);
  assert.doesNotMatch(css, /\.principles-person-meta/);
  assert.doesNotMatch(css, /\.principles-controls/);
  assert.doesNotMatch(css, /\.principles-progress-button/);
  assert.doesNotMatch(css, /@keyframes principles-progress-fill/);
  assert.doesNotMatch(css, /\.stack-container/);
  assert.doesNotMatch(css, /\.card-rotate/);

  assert.match(principlesHtml, /class="principles-scroll-stage" data-principles-scroll-stage aria-label="People and principles scroll sequence"/);
  assert.equal((principlesHtml.match(/class="principles-slide/g) || []).length, 7);
  assert.equal((principlesHtml.match(/data-principles-slide/g) || []).length, 7);
  assert.equal((principlesHtml.match(/class="principles-photo-card" data-principles-decay-card/g) || []).length, 7);
  assert.equal((principlesHtml.match(/data-principles-decay-displacement/g) || []).length, 0);
  assert.equal((principlesHtml.match(/id="principles-decay-filter-/g) || []).length, 0);
  assert.equal((principlesHtml.match(/data-principles-stack-source/g) || []).length, 0);
  assert.doesNotMatch(principlesHtml, /principles-progress/);
  assert.doesNotMatch(principlesHtml, /principles-slide is-active/);
  assert.doesNotMatch(script, /personMetaRole/);
  assert.doesNotMatch(script, /document\.createElement\("small"\)/);
});
