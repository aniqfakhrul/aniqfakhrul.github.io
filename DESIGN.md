---
name: Nix
description: A compact personal cyber security notebook inspired by early-2000s NirSoft.
colors:
  brand: "#6698ce"
  brand-stroke: "#4b66ab"
  paper: "#ffffff"
  ink: "#161616"
  navy: "#000080"
  link: "#0000cc"
  visited: "#67429a"
  sidebar: "#dce7f6"
  line: "#b7c9e2"
  subtle: "#f2f5fa"
  muted: "#475977"
typography:
  display:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "44px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: '"Times New Roman", Times, serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.35
  metadata:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
  code:
    fontFamily: "Consolas, 'Liberation Mono', monospace"
    fontSize: "12px"
    lineHeight: 1.4
rounded:
  square: "0"
spacing:
  ui-gap: "5px"
  ui-padding: "8px"
  sidebar-padding: "12px"
  content-inset: "20px"
  article-gap: "32px"
components:
  wordmark:
    textColor: "{colors.brand}"
    typography: "{typography.display}"
  compact-button:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.navy}"
    rounded: "{rounded.square}"
    padding: "4px 6px"
    typography: "{typography.metadata}"
  compact-button-hover:
    backgroundColor: "{colors.sidebar}"
  search-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "5px 6px"
    typography: "{typography.label}"
  file-navigation:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.link}"
    typography: "{typography.label}"
  external-link:
    textColor: "{colors.link}"
    size: "17px"
  tag-link:
    textColor: "{colors.link}"
    typography: "{typography.metadata}"
  toc-link:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  toc-link-current:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.navy}"
  folder-table-heading:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.ink}"
    padding: "7px 8px"
---

# Design System: Nix

## Overview

**Creative North Star: "Personal cyber security notebook"**

Nix is a compact, plainspoken reading environment with the early-2000s NirSoft character explicitly selected by the author. A pale-blue navigation area, navy headings, conventional links and a white document canvas establish its identity. Small Arial interface text supports Times New Roman reading copy.

The actual Markdown hierarchy gives the interface its structure. Visual treatment should make browsing files, reading a note, following a reference and searching feel immediate. Preserve source images and their authored context; the system requires no decorative raster imagery.

**Key Characteristics:**

- Compact document density and familiar browser conventions.
- Pale-blue navigation beside a white reading canvas.
- Serif prose with small sans-serif controls and headings.
- Square, flat controls and visible rules.
- Navigation derived from the published Markdown hierarchy.

This records the shipped implementation in `config.yaml`, `src/styles/global.css` and the Astro components. Change global theme settings in `config.yaml`, then refresh these extracted tokens. Page-specific composition belongs in `.impeccable/surfaces/src-pages-slug-astro.md`.

## Colors

The palette combines cool navigation surfaces with strong navy headings and familiar blue links. Frontmatter records the current configured palette; the sidebar token maps to the runtime `--sky` property.

### Primary

- **Navy:** headings, folder names, selected table-of-contents text and control labels.
- **Link Blue:** standard navigation and reference links, caret and keyboard focus.
- **Visited Purple:** visited ordinary links; folder names retain navy.
- **Wordmark Blue / Wordmark Stroke:** the filled and outlined Nix wordmark.

### Neutral

- **White Paper / Reading Ink:** the document canvas and prose.
- **Pale Sidebar Blue:** masthead, sidebar and table headings.
- **Blue Rule:** boundaries, separators and control borders.
- **Subtle Blue-White:** code, quotations, button surfaces and active table-of-contents backgrounds.
- **Muted Slate:** metadata, captions and secondary navigation.

**The Configuration Rule.** Global palette and type settings come from `config.yaml`; templates consume the corresponding custom properties.

## Typography

The frontmatter defines the established roles. The display role belongs to the wordmark, headline to page titles, title to second-level headings, body to reading copy, label to navigation and metadata to dates and supporting links. There are no downloaded font dependencies.

Article prose uses a relaxed line height within the compact shell. Its source headings retain their levels: the implemented h1–h4 scale is (21px, 19px, 17px, 15px), with (1.25) line height. Body-level shell text uses (1.45); article prose uses the body token. Code is monospaced, with horizontally scrollable blocks and subtly filled inline spans. Captions are centered at (0.9em) and muted.

## Layout

The desktop shell is a full-width masthead with a minimum height of (70px), followed by a sidebar and flexible document column. The configured sidebar width is (218px). The document inset is (18px 20px 35px). Article content and its table of contents form a grid of up to (900px) for reading, (145–190px) for the contents list, and a (32px) gap. Folder tables share the (900px) content maximum.

At (1100px) and below, the table of contents follows the article in normal flow, using two columns and a bounded scroll area. At (760px) and below, the sidebar becomes a collapsible section above the document, the masthead minimum is (62px), the wordmark is (38px), and main padding becomes (15px 13px 27px). The contents list becomes one column. Mobile navigation rows have a (30px) minimum height; the search field uses (16px) text and (8px) padding. With JavaScript unavailable, native disclosures keep navigation accessible and reading remains available.

Long labels wrap. Images shrink within the article while preserving aspect ratio; code and wide Markdown tables scroll inside their own boundaries. Print removes navigation and supporting chrome and uses a single reading column.

## Elevation & Depth

The system is flat. Pale surfaces, thin borders, dotted tree guides and selected-row fills establish grouping. There are no floating panel or card shadows. The wordmark has a small highlight and outline; the file glyph uses a repeated line shadow as drawing geometry. Neither is a surface-elevation token. Changes of state are immediate, and reduced-motion preferences disable transitions and animation.

## Shapes

Controls, code blocks, tables and quotation panels use square corners. One-pixel rules separate regions. Folder and file glyphs use small rectangular CSS geometry, and folder disclosures use a boxed plus/minus. External-link and search icons are inline SVG. Tags remain ordinary text links with a hash prefix.

## Components

### Buttons and search

Compact utility buttons use subtle fill, navy text, a blue-rule border and pale-blue hover. The sidebar search is a white square field with an adjacent magnifier submit button. Results remain within the sidebar as linked titles and short excerpts, followed by compact pagination and clear actions. A shared visible keyboard focus treatment uses a link-colored (2px) outline with (2px) offset. Disabled buttons dim and show a wait cursor.

### File navigation

Native disclosures express the real nested folder hierarchy. Each folder name is a link that opens its page and expands the disclosure. When already viewing that folder, clicking its name toggles it without reloading the page. The plus/minus toggles it independently. Current files use a pale-blue selected fill and bold text. Current folders are bold, hover fills rows, and dotted guides connect nested levels. Index filenames and `.md` extensions are hidden in the explorer. There is no synthetic content-root wrapper or separate primary menu. Folders start collapsed, controlled by `content.defaultExpandedFolders` in `config.yaml`. Folder expansion chosen during browsing is remembered when browser storage is available; changing configured defaults starts a fresh saved state.

### Article and references

An article begins with its title, compact metadata, source link and optional plain tag links. A thin rule separates that header from the source-rendered Markdown. Images retain their source assets, and image captions center underneath. Markdown tables, quotations and code use restrained fills and rules. Backlinks form a small linked list after the article when present.

### Table of contents

The desktop list sticks near the top of the viewport, with indentation reflecting heading depth. As the reader scrolls, the current section becomes navy, bold and underlined over a subtle fill, marked with `aria-current="location"`. The preceding section stays active through long content. Only the sticky contents panel scrolls to keep its active link visible; this behavior never moves the reader's document. Ordinary anchor links remain usable without the enhancement.

### Folder fallback table

A folder with a published index shows that authored page. Otherwise, a compact two-column File / Added table lists published Markdown descendants, newest added first. Descendant index pages appear under their relative folder labels. Dates use small muted sans-serif text, tabular numerals and a fixed (112px) column. Horizontal rules and subtle row hover support scanning; long file paths wrap. Empty folders display a brief text state.

### Header external links

Configured GitHub, X and RSS icons render as labeled inline SVG links. A missing or unknown icon displays the configured text label. Targets have minimum dimensions of (24px), increasing to (30px) on mobile. Their labels remain available to assistive technology.

## Do's and Don'ts

### Do:

- **Do** preserve the compact NirSoft-inspired pale-blue, navy and white identity.
- **Do** retain Times New Roman reading copy and Arial interface text.
- **Do** derive navigation and authored pages from the published Markdown hierarchy.
- **Do** keep keyboard focus visible and native reading and disclosure behavior usable.
- **Do** preserve source images and center their captions.
- **Do** use `config.yaml` for global site, content and theme settings.

### Don't:

- **Don't** introduce a separate primary menu, a visible content-root wrapper or invented topic folders.
- **Don't** replace source-authored index pages with a custom marketing homepage.
- **Don't** turn plain tags or document regions into pill controls or floating cards.
- **Don't** replace familiar links with decorative action treatments.
- **Don't** introduce decorative imagery or animation as a new visual identity.
