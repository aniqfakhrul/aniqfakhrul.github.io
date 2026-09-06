import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
// A trailing slash would double up when paths are appended.
const url = z.url().transform((value) => value.replace(/\/+$/, ''));
const schema = z.object({
  site: z.object({
    title: z.string().min(1),
    author: z.string().min(1),
    description: z.string(),
    tagline: z.string(),
    url,
    language: z.string().min(2),
    links: z.array(
      z.object({
        label: z.string().min(1),
        url: z
          .string()
          .refine(
            (value) => /^https?:\/\//.test(value) || /^\/(?!\/)/.test(value),
            'Use an HTTP(S) URL or a root-relative path',
          ),
        icon: z.string().optional(),
      }),
    ),
  }),
  content: z.object({
    directory: z.string().min(1),
    defaultExpandedFolders: z.array(z.string()),
    dateLocale: z.string(),
    timeZone: z.string(),
  }),
  source: z.object({ repository: url, branch: z.string().min(1) }),
  theme: z.object({
    sidebarWidth: z.number().min(170).max(400),
    bodySize: z.number().min(12).max(24),
    articleSize: z.number().min(12).max(24),
    uiSize: z.number().min(11).max(18),
    headingSize: z.number().min(18).max(36),
    readingFont: z.string(),
    uiFont: z.string(),
    colors: z.object({
      brand: color,
      brandStroke: color,
      paper: color,
      ink: color,
      navy: color,
      link: color,
      visited: color,
      sidebar: color,
      line: color,
      subtle: color,
      muted: color,
    }),
  }),
});
// Every npm script and the Astro build run from the repository root.
const file = path.resolve(process.cwd(), 'config.yaml');
if (!fs.existsSync(file))
  throw new Error(
    `config.yaml was not found at ${file}. Run commands from the repository root.`,
  );
export const config = schema.parse(parse(fs.readFileSync(file, 'utf8')));
export const site = config.site;
