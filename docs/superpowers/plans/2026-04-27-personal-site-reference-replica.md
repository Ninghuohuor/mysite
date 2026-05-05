# Personal Site Reference Replica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static personal portfolio homepage that recreates the provided reference screenshot's visual structure with placeholder content.

**Architecture:** Create a framework-free static site with one HTML entry point, one stylesheet, one tiny enhancement script, and one Node-based structural test. The HTML carries semantic sections matching the screenshot; CSS handles the editorial black/white layout and responsive collage behavior.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js built-in test runner.

---

### Task 1: Structural Test

**Files:**
- Create: `tests/site-structure.test.js`

- [ ] **Step 1: Write the failing structural test**

Create `tests/site-structure.test.js`:

```js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("homepage exposes the reference replica section structure", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

  assert.match(html, /<link rel="stylesheet" href="styles\.css">/);
  assert.match(html, /<script src="script\.js" defer><\/script>/);
  assert.match(html, /Brag Zone/i);
  assert.match(html, /Selected Projects/i);
  assert.match(html, /Born in Brazil/i);
  assert.match(html, /Agencies & Clients/i);
  assert.match(html, /This is not finished/i);
  assert.equal((html.match(/class="project-tile/g) || []).length, 7);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/site-structure.test.js`

Expected: FAIL with `ENOENT` because `index.html` does not exist yet.

### Task 2: Static Site Files

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `script.js`

- [ ] **Step 1: Implement the HTML structure**

Create `index.html` with the complete semantic page: top bar, header, hero spacer, manifesto, brag zone, selected projects, biography, experience, and footer. Include seven `.project-tile` elements.

- [ ] **Step 2: Implement the reference-inspired stylesheet**

Create `styles.css` with global typography, black/white section bands, oversized manifesto type, rigid project collage grid, narrow bio/experience rows, and mobile breakpoints.

- [ ] **Step 3: Add tiny progressive enhancement**

Create `script.js` to toggle expanded biography rows and scroll to top from the footer control.

- [ ] **Step 4: Run the structural test and verify it passes**

Run: `node --test tests/site-structure.test.js`

Expected: PASS.

### Task 3: Browser Verification

**Files:**
- No source changes expected unless visual issues are found.

- [ ] **Step 1: Serve the site locally**

Run: `python3 -m http.server 4173`

Expected: local server available at `http://localhost:4173`.

- [ ] **Step 2: Inspect in the in-app browser**

Open `http://localhost:4173`, capture desktop and mobile screenshots, and check that the neon bar, black manifesto, project collage, bio section, experience rows, and footer render without blank areas or incoherent overlap.

- [ ] **Step 3: Fix visual issues and rerun checks**

If the browser check reveals layout overlap, missing images, or broken responsive behavior, update `styles.css` and repeat the structural test plus browser inspection.
