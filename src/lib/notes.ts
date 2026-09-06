import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import type { Note } from './vault';
import { encodePath } from './links';

const trueValue = (v: unknown) =>
  v === true || (typeof v === 'string' && v.toLowerCase() === 'true');
const falseValue = (v: unknown) =>
  v === false || (typeof v === 'string' && v.toLowerCase() === 'false');
const list = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.map(String)
    : typeof v === 'string'
      ? v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

// Obsidian writes tags with or without a hash; the site treats both as one tag.
export function tagList(value: unknown) {
  const seen = new Set<string>();
  return list(value)
    .map((tag) => tag.trim().replace(/^#+/, ''))
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (!tag || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function published(data: Record<string, unknown>) {
  return !trueValue(data.draft) && !falseValue(data.publish);
}

export async function walk(dir: string, prefix = ''): Promise<string[]> {
  const entries = await fs
    .readdir(dir, { withFileTypes: true })
    .catch(() => []);
  const nested = await Promise.all(
    entries
      .filter((e) => !e.name.startsWith('.'))
      .map(async (e) => {
        const relative = path.posix.join(prefix, e.name);
        if (e.isSymbolicLink()) return [];
        if (e.isDirectory()) return walk(path.join(dir, e.name), relative);
        return [relative];
      }),
  );
  return nested.flat().sort();
}

function commitDates(file: string, cwd: string) {
  try {
    const dates = execFileSync(
      'git',
      ['log', '--follow', '--format=%cI', '--', file],
      {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    )
      .trim()
      .split('\n')
      .filter(Boolean);
    return { updated: dateValue(dates[0]), added: dateValue(dates.at(-1)) };
  } catch {
    return {};
  }
}

export function dateValue(value: unknown): string | undefined {
  if (!value) return undefined;
  const normalized = String(value).replace(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?=T|$)/,
    (_, y, m, d) => `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`,
  );
  const date = value instanceof Date ? value : new Date(normalized);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Markdown reduced to the words a reader would see. */
export function plainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[\[[^\]]*\]\]|!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_, target: string, label?: string) => label ?? target.split('/').pop()!,
    )
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>|[#*_>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Shortens text at a word boundary rather than mid-phrase. */
export function excerpt(text: string, limit = 180) {
  if (text.length <= limit) return text;
  const head = text.slice(0, limit + 1);
  const boundary = head.lastIndexOf(' ');
  const cut =
    boundary > limit / 2 ? head.slice(0, boundary) : head.slice(0, limit);
  return cut.replace(/[\s,;:.!?-]+$/, '') + '…';
}

/**
 * Reads every Markdown file into a note. Drafts and notes whose frontmatter
 * cannot be parsed are withheld; the latter are reported by file name.
 */
export async function readNotes(
  contentRoot: string,
  files: string[],
  warnings: Set<string>,
) {
  const notes: Note[] = [];
  const hidden = new Set<string>();
  for (const file of files.filter((f) => /\.md$/i.test(f))) {
    const source = await fs.readFile(path.join(contentRoot, file), 'utf8');
    let parsed: { data: Record<string, unknown>; content: string };
    try {
      parsed = matter(source);
    } catch (error) {
      const reason = String((error as Error).message ?? error).split('\n')[0];
      warnings.add(`Invalid frontmatter in ${file}: ${reason}`);
      hidden.add(file);
      continue;
    }
    const { data, content } = parsed;
    if (!published(data)) {
      hidden.add(file);
      continue;
    }
    const slug = file.replace(/\.md$/i, '');
    const title = String(
      data.title ?? content.match(/^# (.+)$/m)?.[1] ?? path.basename(slug),
    );
    const history = commitDates(file, contentRoot);
    notes.push({
      file,
      slug,
      url: `/${encodePath(slug)}/`,
      title,
      content,
      html: '',
      description: String(data.description ?? excerpt(plainText(content))),
      date: dateValue(data.date ?? data.created) ?? history.updated,
      added: dateValue(data.created) ?? dateValue(data.date) ?? history.added,
      tags: tagList(data.tags),
      aliases: list(data.aliases),
      minutes: Math.max(1, Math.ceil(content.split(/\s+/).length / 220)),
      headings: [],
      backlinks: [],
      links: [],
      toc: !falseValue(data.enableToc),
    });
  }
  return { notes, hidden };
}
