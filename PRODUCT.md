# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Delegated recommendation: Astro static HTML, TypeScript, Markdown, Pagefind, GitHub Pages.

## Users
Readers of Aniq Fakhrul's cyber security notes, research, talks, projects and disclosures. The author edits Markdown in Obsidian and commits to the archives Git repository.

## Product Purpose
Publish a fast personal notebook with navigation identical to the published Markdown folder hierarchy.

## Capabilities and Constraints
The only content root is content, a Git submodule on master. Markdown provides all authored pages. Folders without a published index list their published Markdown descendants by recently added date; there are no custom home, writing or search pages. Root index.md owns /, with _index.md as fallback. Folder index pages own folder URLs. Search lives in the sidebar. Show the contents directly in the explorer, without a content or archives wrapper. All folders default to collapsed, configured through content.defaultExpandedFolders in config.yaml. Browsing choices remain remembered until those defaults change. No separate primary navigation or explorer heading. Hide `.md` extensions and index files. Clicking a folder opens its index.md (or _index.md fallback), or its newest-first file listing if neither exists, and expands it. Clicking the current folder name again toggles it without reloading, with its state remembered. Added dates use created/date frontmatter or first Git history, following renames. Center image captions. Header external links use configured icons and default to text when the icon is absent or unknown. No starter Blog, CVEs, Projects or Research folders; the user will add folders in archives. Exclude draft notes and their exclusively referenced media. Keep existing source content unchanged. Responsive file disclosures, search, image embeds, links, tables, syntax highlighting, RSS, metadata. Highlight the current section in the table of contents as the reader scrolls.

## Brand Commitments
Title: Nix. Simple, compact early-2000s website explicitly inspired by NirSoft and ref/2026-09-06_22-20.png. Smaller text and tighter spacing. All global site, source, content, typography and palette settings in config.yaml.

## Operating Context
Parent repository: aniqfakhrul/aniqfakhrul.github.io. Archives: aniqfakhrul/archives. Push-triggered GitHub Actions retrieves the latest submodule branch then builds and deploys. Archives-only pushes require a blog trigger or cross-repository dispatch. No push or public deployment has been performed in this task.

## Evidence on Hand
The user's screenshot and the archives' existing content. 31 published Markdown notes at initial build. No synthetic biographies, CVEs, research findings or project claims.

## Product Principles
- Source files define the navigation.
- Reading works without JavaScript.
- Configuration is separate from templates.
- Preserve the original archive's content.
