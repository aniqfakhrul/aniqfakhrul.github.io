import type { Note, TreeNode } from './vault';
export const isIndex = (name: string) => /^_?index\.md$/i.test(name);
export const displayName = (name: string) => name.replace(/\.md$/i, '');
export const folderIndex = (node: TreeNode) =>
  node.children?.find((child) => /^index\.md$/i.test(child.name))?.note ??
  node.children?.find((child) => /^_index\.md$/i.test(child.name))?.note;

export const folderPathUrl = (folder: string) =>
  '/' +
  (folder ? folder.split('/').map(encodeURIComponent).join('/') + '/' : '');

export type FolderPage = {
  path: string;
  slug: string;
  url: string;
  title: string;
  files: string[];
};

// Only real Markdown folders receive a fallback; an authored index always wins.
export function createFolderPages(
  notes: Note[],
  rootName = 'content',
): FolderPage[] {
  const paths = new Set(['']);
  for (const note of notes) {
    const parts = note.file.split('/').slice(0, -1);
    parts.forEach((_, i) => paths.add(parts.slice(0, i + 1).join('/')));
  }
  const indexed = new Set(
    notes
      .filter((note) => isIndex(note.file.split('/').at(-1)!))
      .map((note) => note.file.split('/').slice(0, -1).join('/')),
  );
  return [...paths]
    .filter((folder) => !indexed.has(folder))
    .map((folder) => {
      const url = folderPathUrl(folder);
      if (notes.some((note) => note.url === url))
        throw new Error(
          `Folder ${folder || rootName} conflicts with a Markdown page at ${url}. Rename the page or move it into the folder as index.md.`,
        );
      const files = notes
        .filter((note) => !folder || note.file.startsWith(folder + '/'))
        .sort(
          (a, b) =>
            (b.added ?? '').localeCompare(a.added ?? '') ||
            a.file.localeCompare(b.file),
        )
        .map((note) => note.file);
      return {
        path: folder,
        slug: folder,
        url,
        title: folder.split('/').at(-1) || rootName,
        files,
      };
    });
}
