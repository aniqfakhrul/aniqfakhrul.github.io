# Nix

An Obsidian-friendly, static Astro blog with compact NirSoft-inspired styling. The archives Git submodule is the sole content source. It is checked out as `content/` at the blog root. The explorer shows its contents directly, without a `content` or `archives` wrapper or a separate primary menu.

## Run

Requires Node.js 24 (see `.nvmrc`) and Git.

```sh
git clone --recurse-submodules git@github.com:aniqfakhrul/aniqfakhrul.github.io.git
cd aniqfakhrul.github.io
npm ci
npm run dev
```

Development uses port 4321 and watches Markdown and attachments for changes. Restart `npm run dev` after editing `config.yaml`. For production behavior including full-text search:

```sh
npm run build
npm run preview
```

Open http://127.0.0.1:4323. The preview serves the generated site; `--dev` disables the preview server's file cache so rebuilds are visible. The deployed output is static HTML. Pages come from Markdown. When a folder has no published index, its page lists all published Markdown files within it and its subfolders, newest added first. There are no custom home, all-writing, or search pages. Search results appear in the sidebar.

## Configure

Edit **`config.yaml`**, then rebuild. No template changes are needed for:

- `site`: title (currently **Nix**), author, description, tagline, site URL, language and header links. Each link accepts `label`, `url`, and an optional `icon` (`github`, `x`, or `rss`). Omitted or unknown icons display the label as text. These also drive document titles, metadata, RSS, sitemap, robots.txt, favicon, and footer.
- `content`: vault directory, `defaultExpandedFolders` (currently `[]`, so all folders start collapsed), date locale, and timezone. To open selected folders by default, list their vault-relative paths, including any parent folders. Changing this list resets previously saved expansion state; choices made while browsing are then remembered.
- `source`: repository and branch used by “View Markdown” links.
- `theme`: sidebar width, body/article/navigation/heading sizes, font stacks, and the main color palette.

Settings are validated at build time. The vault's root `index.md` owns `/`. If it is absent, `_index.md` owns `/`. The same rule applies inside folders: `Research/index.md` owns `/Research/`, and `Research/Example.md` owns `/Research/Example/`. If both index forms exist, `index.md` takes priority and `_index.md` keeps its explicit `/_index/` path. There is no generated homepage to override either. Markdown titles remain the titles written in their own frontmatter.

This is configured for a root-domain GitHub user site. A custom domain can use `site.url`; a repository subpath needs additional base-path routing work. Changing the actual submodule repository or branch requires updating `.gitmodules` as well; `source` controls source links, not Git's checkout metadata.

## Write in Obsidian

Open `content/` as your Obsidian vault. Add or edit `.md` files inside it. A new folder such as `CVEs/`, `Projects/`, or `Research/` will appear automatically when it contains a published note. There are no hardcoded topic folders.

```text
content/                      # Archives Git submodule; hidden mount point
  cheatsheets/                # Visible top-level folder
    Active Directory/
      adcs/
        ESC1.md
  posts/
  _index.md
  certifications.md
  presentations.md
```

Names, capitalization and nesting are preserved; `.md` extensions are hidden in the explorer. A folder with `index.md` opens that page and expands when its name is clicked. `_index.md` is supported as a fallback. Without either index, clicking the name opens the date-sorted file listing and expands the folder. Clicking the name again while viewing that folder toggles it closed or open without reloading the page; this state is remembered. Index files are hidden from the explorer, and the disclosure marker still toggles a folder independently. Hidden directories (`.obsidian`, `.git`), symlinks, unpublished notes, and attachment-only folders are omitted from the reader's tree.

Frontmatter is optional:

```yaml
---
title: My research note
date: 2026-09-06
description: A short description for listings and feeds.
tags: [active-directory, research]
aliases: [Short name]
draft: false
---
```

`draft: true` or `publish: false` excludes the note from pages, navigation, search, backlinks and RSS. Boolean values and quoted strings both work. Tags may be written with or without the leading `#`; duplicates are merged. A note whose frontmatter is not valid YAML is withheld and reported by file name, so one typo never stops the rest of the site from building. Only attachments referenced by published notes are copied. Draft flags control this website; files committed to a public repository remain accessible in GitHub.

A frontmatter date is used when supplied; otherwise the latest Git commit touching the note supplies its **Updated** date. The deployment date is never substituted. For folder listings, **Added** uses `created`, then `date`, then the first Git commit touching the file (following renames). Later edits do not bump this creation date. Files without a date or Git history sort last, with file paths breaking ties. Filesystem checkout timestamps are never used.

Supported:

- Markdown and GFM tables, task lists, and fenced code highlighted for every language Shiki bundles.
- `[[Note]]`, `[[Folder/Note|Label]]`, aliases, `[[Note#Heading]]`, `[[#Heading]]`.
- Paragraph block references such as `[[Note#^reference]]` and `Text. ^reference`.
- `![[image.png]]`, `|450` or `|450x300` dimensions, normal Markdown images, relative links and PDF slides, including filenames with spaces.
- Static Obsidian callouts, inline `%%comments%%`, table of contents and backlinks. The table of contents highlights the current section as you scroll and supports normal heading links.
- Centered image captions: place an emphasized caption after the image on the same line, or in the following paragraph.
- Harmless inline HTML such as `<br>`, `<code>`, `<sub>`, `<kbd>` and `<details>`. Scripts, styles and unknown tags are removed, and each removal is reported as a warning. Output is sanitized.

Resolution tries the note's directory, the vault root, then a unique filename or alias, ignoring case as Obsidian does. Use folder-qualified links when names are ambiguous. Code stays literal. Note embeds (`![[Another note]]`) are links to the referenced note; full transclusion, Dataview, Canvas, Mermaid rendering and Obsidian plugin output are not implemented. Callout fold markers render as ordinary static callouts.

Unresolved source links become plain text. Every content warning is printed by the prepare step and saved in `.cache/content-warnings.txt`. Two pre-existing archive links currently have no target: `arsenals` and `/ad/movement/kerberos`. Original source files are unchanged.

## Submodule and deployment

```sh
git submodule update --init --recursive
npm run archives:sync
npm run build
```

The submodule tracks `https://github.com/aniqfakhrul/archives`, branch `master`. Edits in it belong to the archives repository: commit and push them there first. Commit the submodule pointer in the parent blog repository to record an exact revision.

Deployment builds fetch the latest `archives/master` automatically. Pull-request builds use the parent repository's recorded submodule revision. The fetched commit, the content warnings and the browser test report are saved in the workflow's `content-build-report` artifact, even when a step fails. Remove the **Load latest archives on deployment builds** step in `.github/workflows/deploy.yml` for fully pinned deployments.

An archives-only push does **not** trigger the blog repository. Run its workflow manually, push the blog, or send the supported `archives-updated` repository-dispatch event from an archives workflow using a suitably authorized token. No cross-repository token or archives workflow has been installed.

To publish:

1. Commit the site files, `.gitmodules` and `content` gitlink. They are prepared locally, not pushed by this task.
2. Set the blog repository's **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.
3. Push to `main` or `master`. Actions fetches the archives, tests the importer, builds and indexes the site, checks types and local links, runs desktop/mobile browser tests, then deploys to Pages.

## Verify

```sh
npm test
npm run build
npm run check
npm run verify
npx playwright install chromium
npm run test:e2e
```

The verifier checks generated local `href`/`src` targets and caps homepage HTML + CSS + JavaScript at 30 KB gzip. That budget excludes content images and does not measure actual network latency. Browser tests pick their fixtures from the prepared vault, so they keep passing as the archives change. Images carry their intrinsic dimensions so pages do not shift while they load. Search is indexed at build time and loads only when used. Articles and the folder tree work without JavaScript; JavaScript adds search and persistent folder state.

Key implementation files: `src/lib/vault.ts` (import orchestration and tree), `src/lib/notes.ts` (files, frontmatter and Git dates), `src/lib/links.ts` (link resolution), `src/lib/markdown.ts` (Obsidian Markdown to sanitized HTML), `src/lib/highlight.ts` (syntax highlighting), `src/lib/config.ts` (validated configuration), `src/components/Tree.astro` (recursive explorer), `src/layouts/Shell.astro` (shared shell), and `src/styles/global.css` (responsive styling, with secondary colours derived from the configured palette).
