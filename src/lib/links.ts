import path from 'node:path';
import type { Note } from './vault';
import { folderPathUrl } from './navigation';

export const encodePath = (p: string) =>
  p.split('/').map(encodeURIComponent).join('/');
export const headingId = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/ /g, '-');
export const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};
export const isExternal = (url: string) =>
  /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url);
export const isImageFile = (file: string) =>
  /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(file);

const assetExtensions = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.svg',
  '.pdf',
  '.mp3',
  '.mp4',
  '.ogg',
  '.webm',
  '.txt',
  '.zip',
]);

export type Resolution = {
  file?: string;
  url?: string;
  isNote?: boolean;
  hidden?: boolean;
};
export type Resolver = (target: string, from: Note) => Resolution;

/**
 * Resolves Obsidian and Markdown link targets to site URLs. Lookups ignore
 * case, as Obsidian does, and attachments are recorded for copying.
 */
export function createResolver(options: {
  contentRoot: string;
  files: string[];
  notes: Note[];
  hidden: Set<string>;
  folders: Set<string>;
  assets: Map<string, string>;
  warnings: Set<string>;
}): Resolver {
  const { contentRoot, files, notes, hidden, folders, assets, warnings } =
    options;
  const fileByPath = new Map(files.map((file) => [file.toLowerCase(), file]));
  const noteByFile = new Map(notes.map((note) => [note.file, note]));
  const folderByPath = new Map(
    [...folders].map((folder) => [folder.toLowerCase(), folder]),
  );

  return function resolve(target, from) {
    if (isExternal(target)) return { url: target };
    if (['/rss.xml', '/sitemap.xml', '/'].includes(target))
      return { url: target };
    const hashIndex = target.indexOf('#');
    const fragment =
      hashIndex >= 0 ? safeDecode(target.slice(hashIndex + 1)) : '';
    const raw = safeDecode(
      hashIndex >= 0 ? target.slice(0, hashIndex) : target,
    ).replace(/\\/g, '/');
    const hash = fragment
      ? `#${fragment.startsWith('^') ? 'block-' + fragment.slice(1) : headingId(fragment)}`
      : '';
    if (!raw) return { file: from.file, isNote: true, url: from.url + hash };
    // The note's own folder first, then the vault root.
    const paths = [
      ...new Set([
        path.posix.normalize(
          path.posix.join(path.posix.dirname(from.file), raw),
        ),
        path.posix.normalize(raw).replace(/^\/+/, ''),
      ]),
    ];
    const candidates = paths.flatMap((p) =>
      /\.[^/]+$/.test(p) ? [p, `${p}.md`] : [`${p}.md`, p],
    );
    let found = candidates
      .map((p) => fileByPath.get(p.toLowerCase()))
      .find((p) => p !== undefined);
    if (!found) {
      const name = raw.toLowerCase();
      const possible = files.filter((file) => {
        const lower = file.toLowerCase();
        const base = path.posix.basename(lower);
        return (
          lower.endsWith('/' + name) ||
          lower.endsWith('/' + name + '.md') ||
          base === name ||
          base === name + '.md'
        );
      });
      if (possible.length === 1) found = possible[0];
      else if (possible.length > 1)
        warnings.add(
          `Ambiguous link in ${from.file}: ${target}. Use a folder-qualified path.`,
        );
    }
    if (!found) {
      const aliased = notes.filter((note) =>
        note.aliases.some((alias) => alias.toLowerCase() === raw.toLowerCase()),
      );
      if (aliased.length === 1) found = aliased[0].file;
    }
    if (!found) {
      const folder = paths
        .map((p) => folderByPath.get(p.replace(/^\/+|\/+$/g, '').toLowerCase()))
        .find((p) => p !== undefined);
      return folder === undefined ? {} : { url: folderPathUrl(folder) + hash };
    }
    if (hidden.has(found)) return { hidden: true };
    const note = noteByFile.get(found);
    if (note) return { file: found, isNote: true, url: note.url + hash };
    if (assetExtensions.has(path.extname(found).toLowerCase())) {
      assets.set(found, path.join(contentRoot, found));
      return { file: found, url: `/media/${encodePath(found)}${hash}` };
    }
    return {};
  };
}
