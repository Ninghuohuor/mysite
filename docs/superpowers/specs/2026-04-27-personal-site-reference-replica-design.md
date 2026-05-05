# Personal Site Reference Replica Design

## Goal

Build a static personal website that closely recreates the visual style and long-scroll structure of the provided reference screenshot while using placeholder text and placeholder imagery.

## Visual Direction

The site uses a stark editorial portfolio style: mostly black and white, sharp section boundaries, very small navigation text, a thin neon green announcement bar, oversized bold manifesto text, unrounded image grids, sparse biography blocks, and a black contact footer. The layout should feel dense and deliberate rather than decorative.

## Page Structure

1. Full-screen hero page containing the top neon bar, minimal header, and tall pale gray opening field.
2. Black manifesto section with large white copy and italic emphasis that scrolls over the sticky hero.
3. White testimonial section labeled "BRAG ZONE" with a centered quote block.
4. Black selected projects section with a rigid collage image grid.
5. White biography section with small copy, accordion-like rows, and two portrait placeholders.
6. White experience section with client intro copy, role list rows, and a thin logo strip.
7. Black footer with a large closing prompt and contact links.

## Technical Design

This will be a framework-free static site in the current empty directory. `index.html` owns semantic content and placeholder copy. `styles.css` owns the reference-style composition, typography, spacing, black/white sections, responsive collage grid, and mobile behavior. `script.js` provides tiny progressive enhancement for the biography accordion rows and footer back-to-top control.

## Testing

A lightweight Node test will inspect the generated files and assert the expected document structure, stylesheet/script links, key section labels, and repeated project tiles. Browser verification will confirm the page renders at desktop and mobile sizes without obvious text overlap or blank visual sections.

## Out of Scope

No CMS, routing, animation system, analytics, contact form backend, or final personal copy is included. Placeholder images and copy are acceptable for this pass.
