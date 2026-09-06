import fs from 'node:fs';
import path from 'node:path';
import type {
  Blockquote,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
} from 'mdast';
import type { Element, ElementContent, Root as HastRoot } from 'hast';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import { SKIP, visit } from 'unist-util-visit';
import { imageSize } from 'image-size';
import type { Note } from './vault';
import { isExternal, isImageFile, type Resolver } from './links';
import type { CodeHighlighter } from './highlight';

export type RenderContext = {
  note: Note;
  resolve: Resolver;
  warnings: Set<string>;
  /** URLs owned by published notes; links already pointing at them stay as written. */
  noteUrls: Set<string>;
  /** Absolute path of a referenced attachment, given its `/media/…` URL. */
  assetPath: (url: string) => string | undefined;
  highlighter: CodeHighlighter;
};

type TextLike = { value?: unknown; children?: unknown[] };
const textOf = (node: TextLike): string =>
  typeof node.value === 'string'
    ? node.value
    : (node.children ?? []).map((child) => textOf(child as TextLike)).join('');

const dimensionOption = /^\d+(x\d+)?$/;
const isLabel = (option: string) =>
  !dimensionOption.test(option) && option !== 'center';

// Everything else in raw HTML is removed by the sanitizer, so the author is told.
const keptHtml = new Set(defaultSchema.tagNames);

const schema = {
  ...defaultSchema,
  clobberPrefix: '',
  attributes: {
    ...defaultSchema.attributes,
    blockquote: ['className'],
    img: [...(defaultSchema.attributes?.img ?? []), 'width', 'height'],
    p: ['id'],
  },
};

/** Turns `[[wikilinks]]` and `![[embeds]]` into links and images; drops `%%comments%%`. */
function expandWikilinks(
  tree: Root,
  resolved: WeakSet<object>,
  { note, resolve, warnings }: RenderContext,
) {
  visit(tree, 'text', (node, index, parent) => {
    if (!parent || parent.type === 'link' || index === undefined) return;
    node.value = node.value.replace(/%%[\s\S]*?%%/g, '');
    const children: PhrasingContent[] = [];
    let last = 0;
    for (const match of node.value.matchAll(/(!?)\[\[([^\]]+)\]\]/g)) {
      const start = match.index!;
      if (start > last)
        children.push({ type: 'text', value: node.value.slice(last, start) });
      const [target, ...options] = match[2].split('|');
      const result = resolve(target, note);
      const label = options.find(isLabel) || target.split('/').pop()!;
      if (!result.url) {
        if (!result.hidden)
          warnings.add(`Unresolved wikilink in ${note.file}: ${target}`);
        children.push({ type: 'text', value: label });
      } else if (match[1] && !result.isNote && isImageFile(result.file ?? '')) {
        const [width, height] =
          options.find((option) => dimensionOption.test(option))?.split('x') ??
          [];
        const image: PhrasingContent = {
          type: 'image',
          url: result.url,
          alt: options.find(isLabel) || path.basename(target),
          data: {
            hProperties: {
              ...(width ? { width: Number(width) } : {}),
              ...(height ? { height: Number(height) } : {}),
            },
          },
        };
        resolved.add(image);
        children.push(image);
      } else {
        const link: PhrasingContent = {
          type: 'link',
          url: result.url,
          children: [{ type: 'text', value: label }],
        };
        resolved.add(link);
        children.push(link);
        if (result.isNote && result.file !== note.file)
          note.links.push(result.file!);
      }
      last = start + match[0].length;
    }
    if (!last) return;
    if (last < node.value.length)
      children.push({ type: 'text', value: node.value.slice(last) });
    (parent.children as PhrasingContent[]).splice(index, 1, ...children);
    return index + children.length;
  });
}

// `> [!note] Title` renders as a static callout with its title in bold.
function markCallout(node: Blockquote) {
  const paragraph = node.children[0];
  const first =
    paragraph?.type === 'paragraph' ? paragraph.children[0] : undefined;
  if (first?.type !== 'text') return;
  const match = first.value.match(/^\[!(\w+)\]([+-])?\s*([^\n]*)\n?/);
  if (!match) return;
  first.value = first.value.slice(match[0].length);
  node.data = { hProperties: { className: ['callout'] } };
  node.children.unshift({
    type: 'paragraph',
    children: [
      {
        type: 'strong',
        children: [{ type: 'text', value: match[3] || match[1] }],
      },
    ],
  });
}

// `Text. ^id` gives the paragraph an anchor for `[[Note#^id]]` links.
function markBlockReference(node: Paragraph) {
  const last = node.children.at(-1);
  if (last?.type !== 'text') return;
  const match = last.value.match(/\s+\^([\w-]+)\s*$/);
  if (!match) return;
  last.value = last.value.slice(0, match.index);
  node.data = { hProperties: { id: `block-${match[1]}` } };
}

/** Resolves Markdown links and images; marks callouts and block references. */
function rewriteLinks(
  tree: Root,
  resolved: WeakSet<object>,
  { note, resolve, warnings, noteUrls }: RenderContext,
) {
  visit(tree, (node, index, parent) => {
    if (
      (node.type === 'link' || node.type === 'image') &&
      !resolved.has(node)
    ) {
      if (
        noteUrls.has(node.url.split('#')[0]) ||
        node.url.startsWith('/media/')
      )
        return;
      const result = resolve(node.url, note);
      if (result.url) {
        node.url = result.url;
        if (result.isNote && result.file !== note.file)
          note.links.push(result.file!);
      } else if (!isExternal(node.url)) {
        if (!result.hidden)
          warnings.add(`Unresolved link in ${note.file}: ${node.url}`);
        if (parent && index !== undefined) {
          const value = node.type === 'image' ? (node.alt ?? '') : textOf(node);
          (parent.children as RootContent[]).splice(index, 1, {
            type: 'text',
            value,
          });
          return index;
        }
      }
    }
    if (node.type === 'blockquote') markCallout(node);
    if (node.type === 'paragraph') markBlockReference(node);
  });
}

function warnUnsupportedHtml(tree: Root, { note, warnings }: RenderContext) {
  visit(tree, 'html', (node) => {
    const tag = node.value.match(/^<\/?([a-zA-Z][\w-]*)/)?.[1]?.toLowerCase();
    if (tag && !keptHtml.has(tag))
      warnings.add(
        `Unsupported HTML in ${note.file}: ${node.value.replace(/\s+/g, ' ').slice(0, 60)}`,
      );
  });
}

const dimensions = new Map<
  string,
  { width: number; height: number } | undefined
>();
function imageDimensions(file: string) {
  if (!dimensions.has(file)) {
    try {
      const { width, height } = imageSize(fs.readFileSync(file));
      dimensions.set(file, width && height ? { width, height } : undefined);
    } catch {
      dimensions.set(file, undefined);
    }
  }
  return dimensions.get(file);
}

// Intrinsic dimensions reserve space before the image loads; Obsidian's `|450` keeps its ratio.
function describeImage(
  node: Element,
  first: boolean,
  assetPath: RenderContext['assetPath'],
) {
  node.properties.decoding = 'async';
  if (first) node.properties.fetchPriority = 'high';
  else node.properties.loading = 'lazy';
  const file = assetPath(String(node.properties.src ?? ''));
  const size = file ? imageDimensions(file) : undefined;
  if (!size) return;
  const width = Number(node.properties.width) || 0;
  const height = Number(node.properties.height) || 0;
  if (width && !height)
    node.properties.height = Math.round((width * size.height) / size.width);
  else if (height && !width)
    node.properties.width = Math.round((height * size.width) / size.height);
  else if (!width && !height)
    Object.assign(node.properties, { width: size.width, height: size.height });
}

const meaningful = (child: ElementContent) =>
  child.type !== 'text' || child.value.trim() !== '';
const isTag = (child: ElementContent | undefined, tagName: string) =>
  child?.type === 'element' && child.tagName === tagName;
function toFigure(
  paragraph: Element,
  image: ElementContent,
  caption: ElementContent[],
) {
  paragraph.tagName = 'figure';
  paragraph.children = [
    image,
    {
      type: 'element',
      tagName: 'figcaption',
      properties: {},
      children: caption,
    },
  ];
}

// An emphasized caption next to an image on the same line becomes a figure.
function captionInline(node: Element) {
  const image = node.children.find((child) => isTag(child, 'img'));
  const caption = node.children.filter(
    (child) => child !== image && meaningful(child),
  );
  if (image && caption.length === 1 && isTag(caption[0], 'em'))
    toFigure(node, image, caption);
}

// An image paragraph followed by an emphasized paragraph becomes a figure.
function captionAdjacent(parent: HastRoot | Element) {
  const children = parent.children as ElementContent[];
  for (let index = 0; index < children.length - 1; index++) {
    const paragraph = children[index];
    const after = children[index + 1];
    // HAST includes whitespace between paragraphs.
    const nextIndex =
      after.type === 'text' && !after.value.trim() ? index + 2 : index + 1;
    const next = children[nextIndex];
    if (!isTag(paragraph, 'p') || !isTag(next, 'p')) continue;
    const images = (paragraph as Element).children.filter(meaningful);
    const caption = (next as Element).children.filter(meaningful);
    if (
      images.length === 1 &&
      isTag(images[0], 'img') &&
      caption.length === 1 &&
      isTag(caption[0], 'em')
    ) {
      toFigure(paragraph as Element, images[0], caption);
      children.splice(index + 1, nextIndex - index);
    }
  }
}

function rehypeNotebook(context: RenderContext) {
  const { note, resolve, warnings, assetPath } = context;
  return (tree: HastRoot) => {
    let images = 0;
    visit(tree, 'element', (node, index, parent) => {
      // Links and images written as raw HTML skipped the Markdown pass.
      const attribute =
        node.tagName === 'a' ? 'href' : node.tagName === 'img' ? 'src' : '';
      const url = attribute ? String(node.properties[attribute] ?? '') : '';
      if (url && !isExternal(url) && !/^[/#]/.test(url)) {
        const result = resolve(url, note);
        if (result.url) {
          node.properties[attribute] = result.url;
          if (result.isNote && result.file !== note.file)
            note.links.push(result.file!);
        } else if (parent && index !== undefined) {
          if (!result.hidden)
            warnings.add(`Unresolved link in ${note.file}: ${url}`);
          (parent.children as ElementContent[]).splice(index, 1, {
            type: 'text',
            value: String(node.properties.alt ?? '') || textOf(node),
          });
          return index;
        }
      }
      if (/^h[1-6]$/.test(node.tagName))
        note.headings.push({
          depth: Number(node.tagName[1]),
          id: String(node.properties.id ?? ''),
          text: textOf(node),
        });
      if (node.tagName === 'img')
        describeImage(node, images++ === 0, assetPath);
      if (node.tagName === 'p') captionInline(node);
    });
    visit(tree, (node) => {
      if (node.type === 'root' || node.type === 'element')
        captionAdjacent(node);
    });
    // Wide tables scroll inside a wrapper instead of losing their table semantics.
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === undefined) return;
      (parent.children as ElementContent[])[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'] },
        children: [node],
      };
      return SKIP;
    });
  };
}

/** Renders one note's Markdown to sanitized, highlighted HTML. */
export async function renderNote(context: RenderContext): Promise<string> {
  const { note, highlighter } = context;
  const tree = unified().use(remarkParse).use(remarkGfm).parse(note.content);
  const resolved = new WeakSet<object>();
  expandWikilinks(tree, resolved, context);
  rewriteLinks(tree, resolved, context);
  warnUnsupportedHtml(tree, context);
  const languages: string[] = [];
  visit(tree, 'code', (node) => {
    if (node.lang) languages.push(node.lang);
  });
  await highlighter.load(languages);
  const processor = unified()
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
    .use(rehypeSlug)
    .use(() => rehypeNotebook(context))
    .use(rehypeStringify);
  const html = processor.stringify(await processor.run(tree));
  // Highlight only after sanitization; Shiki receives text, never executable markup.
  return highlighter.apply(String(html));
}
