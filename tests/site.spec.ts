import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { isIndex, displayName, folderIndex } from '../src/lib/navigation';
import { config } from '../src/lib/config';
import type { Note, TreeNode } from '../src/lib/vault';

// Fixtures come from the prepared vault, so the suite keeps working when the archives change.
const { notes, tree } = JSON.parse(
  fs.readFileSync('.cache/vault.json', 'utf8'),
) as { notes: Note[]; tree: TreeNode[] };
const articles = notes.filter(
  (note) => !isIndex(path.posix.basename(note.file)),
);
const folderLocator = (page: Page, node: TreeNode) =>
  page.locator(`details[data-folder=${JSON.stringify(node.path)}]`);
const pageTitle = (page: Page) =>
  page.locator('h1[data-pagefind-meta="title"], h1#folder-title');

// The deepest folder that directly holds a note, with its ancestors.
function deepestFolder(
  nodes: TreeNode[],
  chain: TreeNode[] = [],
): { chain: TreeNode[]; leaf: TreeNode } | undefined {
  let best: { chain: TreeNode[]; leaf: TreeNode } | undefined;
  for (const node of nodes) {
    if (!node.children) continue;
    const leaf = node.children.find(
      (child) => !child.children && !isIndex(child.name),
    );
    for (const candidate of [
      leaf && { chain: [...chain, node], leaf },
      deepestFolder(node.children, [...chain, node]),
    ])
      if (candidate && (!best || candidate.chain.length > best.chain.length))
        best = candidate;
  }
  return best;
}
const nested = deepestFolder(tree)!;
const folder = nested.chain.at(-1)!;
const folderTitle = folderIndex(folder)?.title ?? folder.name;
const leaf = notes.find((note) => note.file === nested.leaf.path)!;
const queryTerm = articles
  .flatMap((note) => note.title.split(/\s+/))
  .find((word) => /^[A-Za-z]{5,}$/.test(word))!;
const mediaCount = (note: Note) => (note.html.match(/\/media\//g) ?? []).length;
const illustrated = [...articles]
  .sort((a, b) => mediaCount(b) - mediaCount(a))
  .slice(0, 3);
const withAttachment =
  notes.find((note) => /href="\/media\/[^"]+\.pdf"/.test(note.html)) ??
  articles[0];
const longest = [...articles]
  .filter((note) => note.toc && note.headings.length >= 4)
  .sort((a, b) => b.html.length - a.html.length)[0];

test('configured folder defaults apply on direct visits despite previous defaults', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const expanded = JSON.stringify({ previous: true, folders: true });
    localStorage.setItem('notebook-folders', expanded);
    localStorage.setItem(
      'notebook-folders:content:["previous","folders"]',
      expanded,
    );
  });
  for (const route of ['/', leaf.url]) {
    await page.goto(route);
    const expanded = await page
      .locator('[data-folder][open]')
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('data-folder')),
      );
    expect(expanded.sort()).toEqual(
      [...config.content.defaultExpandedFolders].sort(),
    );
  }
});

test('home, nested folder navigation, persistence, and collapse controls', async ({
  page,
}, info) => {
  const openNavigation = async () => {
    if (info.project.name === 'mobile')
      await page.locator('#navigation > summary').click();
  };
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.primary-nav')).toHaveCount(0);
  await expect(page.locator('details[data-folder=""]')).toHaveCount(0);
  const rootNames = await page
    .locator('.tree-root > li')
    .evaluateAll((nodes) =>
      nodes.map((node) =>
        node
          .querySelector(
            'summary .folder-link > span:last-child, summary > span:last-child, .file-link > span:last-child',
          )
          ?.textContent?.trim(),
      ),
    );
  expect(rootNames).toEqual(
    tree
      .filter((node) => !isIndex(node.name))
      .map((node) => displayName(node.name)),
  );
  await openNavigation();
  for (const node of nested.chain) {
    const details = folderLocator(page, node);
    if ((await details.getAttribute('open')) === null)
      await details
        .locator(':scope > summary')
        .click({ position: { x: 4, y: 8 } });
  }
  const details = folderLocator(page, folder);
  await details
    .getByRole('link', { name: displayName(nested.leaf.name), exact: true })
    .click();
  await expect(pageTitle(page)).toHaveText(leaf.title);
  await page.reload();
  expect(await details.getAttribute('open')).not.toBeNull();
  await openNavigation();
  await details.locator(':scope > summary').click({ position: { x: 4, y: 8 } });
  expect(await details.getAttribute('open')).toBeNull();
  const folderLink = details.getByRole('link', {
    name: folder.name,
    exact: true,
  });
  await folderLink.click();
  await expect(pageTitle(page)).toHaveText(folderTitle);
  expect(await details.getAttribute('open')).not.toBeNull();
  await openNavigation();
  const currentUrl = page.url();
  await folderLink.click();
  await expect(details).not.toHaveAttribute('open');
  expect(page.url()).toBe(currentUrl);
  await expect(pageTitle(page)).toHaveText(folderTitle);
  await folderLink.press('Enter');
  await expect(details).toHaveAttribute('open');
  await folderLink.click();
  await expect(details).not.toHaveAttribute('open');
  await page.reload();
  await expect(details).not.toHaveAttribute('open');
  await expect(page.locator('.explorer-heading')).toHaveCount(0);
  expect(await page.locator('.file-link').allTextContents()).not.toEqual(
    expect.arrayContaining([expect.stringMatching(/\.md|^_?index$/i)]),
  );
});

test('search loads results, follows them, and handles no results', async ({
  page,
}) => {
  await page.goto(`/?q=${encodeURIComponent(queryTerm)}`);
  await expect(page.locator('#search-results li').first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator('#search-results a').first().click();
  await expect(page.locator('.prose')).toBeVisible();
  await page.goto('/?q=qzxvplmnonexistentword');
  await expect(page.getByRole('status')).toContainText('No notes found');
});

test('article images and attachments resolve with dimensions, layouts fit the viewport', async ({
  page,
  request,
}) => {
  for (const route of ['/', ...illustrated.map((note) => note.url)]) {
    await page.goto(route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator('.prose img:not([width][height])')).toHaveCount(
      0,
    );
    const assets = await page
      .locator('.prose img, .prose a[href^="/media/"]')
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute('src') || n.getAttribute('href')),
      );
    for (const asset of assets)
      expect((await request.get(asset!)).ok()).toBeTruthy();
  }
});

test('articles and the folder tree work without JavaScript', async ({
  browser,
}, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: info.project.use.baseURL,
  });
  const page = await context.newPage();
  await page.goto(withAttachment.url);
  await expect(pageTitle(page)).toHaveText(withAttachment.title);
  if (/\.pdf"/.test(withAttachment.html))
    await expect(page.locator('.prose a[href$=".pdf"]').first()).toBeVisible();
  await expect(page.locator('.tree-root > li').first()).toBeVisible();
  await context.close();
});

test('table of contents tracks scrolling, anchor navigation and the document bottom', async ({
  page,
}) => {
  test.skip(!longest, 'no published note has a table of contents');
  await page.goto(longest.url);
  const links = page.locator('.toc nav a');
  const active = page.locator('.toc nav a[aria-current="location"]');
  const firstHref = await links.first().getAttribute('href');
  await expect(active).toHaveAttribute('href', firstHref!);
  const middle = links.nth(Math.floor((await links.count()) / 2));
  const middleHref = await middle.getAttribute('href');
  await middle.click();
  await expect(active).toHaveAttribute('href', middleHref!);
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect(active).toHaveAttribute(
    'href',
    (await links.last().getAttribute('href'))!,
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(active).toHaveAttribute('href', firstHref!);
  await expect(active).toHaveCount(1);
});
