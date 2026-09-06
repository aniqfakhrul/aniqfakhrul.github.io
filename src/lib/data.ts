import generated from '../../.cache/vault.json';
import path from 'node:path';
import type { Note, TreeNode } from './vault';
import { createFolderPages, isIndex } from './navigation';
import { config, site } from './config';
export const { notes } = generated as { notes: Note[] };
export const tree = generated.tree as TreeNode[];
export const folderPages = createFolderPages(notes, site.title);
export { site, config } from './config';
export const formatDate = (date?: string) =>
  date
    ? new Intl.DateTimeFormat(config.content.dateLocale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: config.content.timeZone,
      }).format(new Date(date))
    : 'Undated';
// Index pages describe folders rather than being entries of their own.
export const recentNotes = [...notes]
  .filter((n) => !isIndex(path.posix.basename(n.file)))
  .sort(
    (a, b) =>
      (b.date ?? '').localeCompare(a.date ?? '') ||
      a.title.localeCompare(b.title),
  );
