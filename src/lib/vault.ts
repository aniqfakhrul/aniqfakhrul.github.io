import path from 'node:path';
import { config } from './config';
import { createFolderPages, isIndex } from './navigation';
import { readNotes, walk } from './notes';
import { createResolver, encodePath, safeDecode } from './links';
import { renderNote } from './markdown';
import { createCodeHighlighter } from './highlight';

export type Note = {
  file: string;
  slug: string;
  url: string;
  title: string;
  description: string;
  content: string;
  html: string;
  date?: string;
  added?: string;
  tags: string[];
  aliases: string[];
  minutes: number;
  headings: { depth: number; id: string; text: string }[];
  backlinks: { title: string; url: string }[];
  links: string[];
  toc: boolean;
};
export type TreeNode = {
  name: string;
  path: string;
  children?: TreeNode[];
  note?: Note;
};
export type Vault = {
  notes: Note[];
  tree: TreeNode[];
  assets: Map<string, string>;
  warnings: string[];
};
export { published } from './notes';
export { encodePath, headingId } from './links';

const root = path.resolve(config.content.directory);

export function createTree(notes: Note[]): TreeNode[] {
  const tree: TreeNode[] = [];
  for (const note of notes) {
    let children = tree;
    let currentPath = '';
    const segments = note.file.split('/');
    segments.forEach((name, index) => {
      currentPath += `${currentPath ? '/' : ''}${name}`;
      if (index === segments.length - 1)
        children.push({ name, path: currentPath, note });
      else {
        let folder = children.find((n) => n.name === name && n.children);
        if (!folder) {
          folder = { name, path: currentPath, children: [] };
          children.push(folder);
        }
        children = folder.children!;
      }
    });
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort(
      (a, b) =>
        Number(!!b.children) - Number(!!a.children) ||
        a.name.localeCompare(b.name),
    );
    nodes.forEach((n) => n.children && sort(n.children));
  };
  sort(tree);
  return tree;
}

// Folder indexes own the folder URL. Prefer index.md when both forms exist.
function assignRoutes(notes: Note[]) {
  const publishedPaths = new Set(notes.map((note) => note.file.toLowerCase()));
  const routes = new Set<string>();
  for (const note of notes) {
    const basename = path.posix.basename(note.file).toLowerCase();
    const folder = path.posix.dirname(note.file);
    const hasPrimary = publishedPaths.has(
      path.posix.join(folder, 'index.md').toLowerCase(),
    );
    if (basename === 'index.md' || (basename === '_index.md' && !hasPrimary)) {
      note.slug = folder === '.' ? '' : folder;
    }
    note.url = '/' + (note.slug ? encodePath(note.slug) + '/' : '');
    if (routes.has(note.url))
      throw new Error(`Conflicting Markdown routes at ${note.url}`);
    routes.add(note.url);
  }
}

export async function loadVault(contentRoot = root): Promise<Vault> {
  const files = await walk(contentRoot);
  const warnings = new Set<string>();
  const assets = new Map<string, string>();
  const { notes, hidden } = await readNotes(contentRoot, files, warnings);
  assignRoutes(notes);
  const folders = new Set([
    ...createFolderPages(notes).map((folder) => folder.path),
    ...notes
      .filter((note) => isIndex(path.posix.basename(note.file)))
      .map((note) => {
        const folder = path.posix.dirname(note.file);
        return folder === '.' ? '' : folder;
      }),
  ]);
  const resolve = createResolver({
    contentRoot,
    files,
    notes,
    hidden,
    folders,
    assets,
    warnings,
  });
  const noteUrls = new Set(notes.map((note) => note.url));
  const assetPath = (url: string) =>
    url.startsWith('/media/')
      ? assets.get(safeDecode(url.replace(/#.*$/, '').slice('/media/'.length)))
      : undefined;
  const highlighter = await createCodeHighlighter();
  try {
    for (const note of notes)
      note.html = await renderNote({
        note,
        resolve,
        warnings,
        noteUrls,
        assetPath,
        highlighter,
      });
  } finally {
    highlighter.dispose();
  }
  for (const note of notes)
    note.backlinks = notes
      .filter((n) => n.links.includes(note.file))
      .map((n) => ({ title: n.title, url: n.url }));
  return { notes, tree: createTree(notes), assets, warnings: [...warnings] };
}
