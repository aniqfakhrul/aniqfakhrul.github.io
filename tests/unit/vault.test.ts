import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadVault, published } from '../../src/lib/vault';
import { createFolderPages } from '../../src/lib/navigation';

// image-size only needs a PNG signature and IHDR chunk to report dimensions.
function png(width: number, height: number) {
  const buffer = Buffer.alloc(33);
  buffer.write('\x89PNG\r\n\x1a\n', 0, 'latin1');
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'latin1');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  buffer.writeUInt8(8, 24);
  buffer.writeUInt8(2, 25);
  return buffer;
}
const imageTag = (html: string, src: string) =>
  html.match(new RegExp(`<img[^>]*src="${src}"[^>]*>`))?.[0] ?? '';

async function fixture(prefix: string, run: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    await run(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test('publishing flags understand Obsidian string and boolean values', () => {
  for (const flag of [true, 'true', 'TRUE'])
    assert.equal(published({ draft: flag }), false);
  for (const flag of [false, 'false'])
    assert.equal(published({ draft: flag }), true);
  assert.equal(published({ publish: 'false' }), false);
  assert.equal(published({}), true);
});

test('nested Obsidian links, aliases, assets, code, drafts, and inline HTML remain correct', () =>
  fixture('notebook-', async (dir) => {
    await fs.mkdir(path.join(dir, 'Nested/Deeper'), { recursive: true });
    await fs.mkdir(path.join(dir, 'assets'));
    await fs.writeFile(
      path.join(dir, 'Home.md'),
      [
        '---',
        'title: Welcome',
        '---',
        '[[Nested/Deeper/Note#A Heading|Read it]]',
        '',
        '[[Alias]]',
        '',
        '![[diagram.png|120]]',
        '',
        '![[plain.png]]',
        '',
        '[Slides](slides.pdf)',
        '',
        '[[Draft]]',
        '',
        '```text',
        '[[Literal]] %%keep%%',
        '<script>alert(1)</script>',
        '```',
        '',
        '<script>alert(2)</script>',
        '',
        '[bad](javascript:alert%281%29)',
        '',
        '> [!note] Remember',
        '> Read carefully.',
        '',
        '%%private comment%% visible',
        '',
        '| Command | Filter |',
        '| --- | --- |',
        '| Get-Group | <code>(&(objectClass=group))</code> |',
        '',
        'Water is H<sub>2</sub>O; press <kbd>Ctrl</kbd>. Replace <tgt> first.',
      ].join('\n'),
    );
    await fs.writeFile(
      path.join(dir, 'Nested/Deeper/Note.md'),
      '---\naliases: [Alias]\n---\n# A Heading\n\nUseful text. ^reference\n\n[[#A Heading]]\n',
    );
    await fs.writeFile(
      path.join(dir, 'Draft.md'),
      '---\ndraft: "true"\n---\nDo not publish ![[private.png]]',
    );
    await fs.writeFile(path.join(dir, 'assets/diagram.png'), png(2, 3));
    await fs.writeFile(path.join(dir, 'assets/plain.png'), png(4, 2));
    for (const file of ['slides.pdf', 'private.png', 'unused.png'])
      await fs.writeFile(path.join(dir, 'assets', file), 'fixture');
    const vault = await loadVault(dir);
    assert.equal(vault.notes.length, 2);
    const home = vault.notes.find((n) => n.file === 'Home.md')!;
    const note = vault.notes.find((n) => n.file.endsWith('/Note.md'))!;
    assert.match(home.html, /href="\/Nested\/Deeper\/Note\/#a-heading"/);
    assert.match(home.html, /href="\/media\/assets\/slides.pdf"/);
    assert.match(home.html, /\[\[Literal\]\] %%keep%%/);
    assert.doesNotMatch(
      home.html,
      /<script>|javascript:|private comment|href="[^"]*Draft|<tgt>/,
    );
    assert.match(home.html, /Remember/);
    // Intrinsic dimensions come from the file; an Obsidian width keeps the ratio.
    const sized = imageTag(home.html, '/media/assets/diagram.png');
    assert.match(sized, /width="120"/);
    assert.match(sized, /height="180"/);
    assert.match(sized, /fetchpriority="high"/);
    assert.doesNotMatch(sized, /loading="lazy"/);
    const plain = imageTag(home.html, '/media/assets/plain.png');
    assert.match(plain, /width="4"/);
    assert.match(plain, /height="2"/);
    assert.match(plain, /loading="lazy"/);
    // Harmless inline HTML survives sanitization; unknown tags are reported.
    assert.match(home.html, /<code>\(&#x26;\(objectClass=group\)\)<\/code>/);
    assert.match(home.html, /H<sub>2<\/sub>O/);
    assert.match(home.html, /<kbd>Ctrl<\/kbd>/);
    assert.match(home.html, /<div class="table-scroll"><table>/);
    assert.deepEqual(vault.warnings.sort(), [
      'Unsupported HTML in Home.md: <script>alert(2)</script>',
      'Unsupported HTML in Home.md: <tgt>',
    ]);
    assert.match(note.html, /id="a-heading"/);
    assert.match(note.html, /id="block-reference"/);
    assert.equal(note.backlinks[0].title, 'Welcome');
    assert.deepEqual([...vault.assets.keys()].sort(), [
      'assets/diagram.png',
      'assets/plain.png',
      'assets/slides.pdf',
    ]);
    const nested = vault.tree.find((n) => n.name === 'Nested')!;
    assert.equal(nested.children![0].children![0].name, 'Note.md');
  }));

test('duplicate basenames require a qualified path', () =>
  fixture('notebook-links-', async (dir) => {
    for (const folder of ['A', 'B']) {
      await fs.mkdir(path.join(dir, folder));
      await fs.writeFile(path.join(dir, folder, 'Same.md'), `# ${folder}`);
    }
    await fs.writeFile(
      path.join(dir, 'Home.md'),
      '[[Same]] and [[A/Same|Explicit]]',
    );
    const vault = await loadVault(dir);
    const home = vault.notes.find((n) => n.file === 'Home.md')!;
    assert.match(home.html, /href="\/A\/Same\/"/);
    assert.equal((home.html.match(/href=/g) || []).length, 1);
    assert.ok(vault.warnings.some((w) => w.includes('Ambiguous')));
  }));

test('links resolve case-insensitively, as Obsidian does', () =>
  fixture('notebook-case-', async (dir) => {
    await fs.mkdir(path.join(dir, 'Folder'));
    await fs.writeFile(path.join(dir, 'Folder/ESC1.md'), '# ESC1');
    await fs.writeFile(
      path.join(dir, 'Home.md'),
      '[[esc1]] [[folder/esc1|Path]] [[ESC1.MD]] [text](FOLDER/esc1.md)',
    );
    const vault = await loadVault(dir);
    const home = vault.notes.find((n) => n.file === 'Home.md')!;
    assert.equal((home.html.match(/href="\/Folder\/ESC1\/"/g) || []).length, 4);
    assert.deepEqual(vault.warnings, []);
  }));

test('a note with invalid frontmatter is withheld and reported by name', () =>
  fixture('notebook-yaml-', async (dir) => {
    await fs.writeFile(path.join(dir, 'Good.md'), '# Good\n\n[[Broken]]');
    await fs.writeFile(
      path.join(dir, 'Broken.md'),
      '---\ntags: [oops\n---\n# Broken',
    );
    const vault = await loadVault(dir);
    assert.deepEqual(
      vault.notes.map((n) => n.file),
      ['Good.md'],
    );
    assert.equal(vault.warnings.length, 1);
    assert.match(vault.warnings[0], /^Invalid frontmatter in Broken\.md: /);
  }));

test('tags accept the Obsidian hash prefix and drop duplicates; descriptions end on whole words', () =>
  fixture('notebook-meta-', async (dir) => {
    await fs.mkdir(path.join(dir, 'Folder'));
    await fs.writeFile(path.join(dir, 'Folder/Note.md'), '# Note');
    await fs.writeFile(
      path.join(dir, 'Tagged.md'),
      '---\ntags: ["#Azure", azure, "#azure", ad]\n---\n# Tagged',
    );
    await fs.writeFile(
      path.join(dir, 'Listed.md'),
      '---\ntags: "#a, b"\n---\n' +
        'See [[Folder/Note|the note]] now. ' +
        'Sentence '.repeat(40),
    );
    const vault = await loadVault(dir);
    assert.deepEqual(vault.notes.find((n) => n.file === 'Tagged.md')!.tags, [
      'Azure',
      'ad',
    ]);
    const listed = vault.notes.find((n) => n.file === 'Listed.md')!;
    assert.deepEqual(listed.tags, ['a', 'b']);
    assert.match(
      listed.description,
      /^See the note now\. (Sentence )*Sentence…$/,
    );
    assert.ok(listed.description.length <= 181);
  }));

test('Markdown indexes own root and folder URLs without generated-page conflicts', () =>
  fixture('notebook-indexes-', async (dir) => {
    await fs.mkdir(path.join(dir, 'Research'));
    await fs.writeFile(
      path.join(dir, 'index.md'),
      '# My homepage\n\n[[Research/index|Research]]',
    );
    await fs.writeFile(path.join(dir, '_index.md'), '# Legacy introduction');
    await fs.writeFile(path.join(dir, 'Research/index.md'), '# Research notes');
    await fs.writeFile(path.join(dir, 'Research/Example.md'), '# Example');
    const vault = await loadVault(dir);
    assert.equal(
      vault.notes.find((note) => note.file === 'index.md')!.url,
      '/',
    );
    assert.equal(
      vault.notes.find((note) => note.file === '_index.md')!.url,
      '/_index/',
    );
    assert.equal(
      vault.notes.find((note) => note.file === 'Research/index.md')!.url,
      '/Research/',
    );
    assert.equal(
      vault.notes.find((note) => note.file === 'Research/Example.md')!.url,
      '/Research/Example/',
    );
    assert.equal(vault.notes.filter((note) => note.url === '/').length, 1);
    assert.match(
      vault.notes.find((note) => note.file === 'index.md')!.html,
      /href="\/Research\/"/,
    );
    await fs.rm(path.join(dir, 'index.md'));
    const fallback = await loadVault(dir);
    assert.equal(
      fallback.notes.find((note) => note.file === '_index.md')!.url,
      '/',
    );
  }));

test('folders without indexes list published descendants by added date, preserving Git creation dates through edits and renames', () =>
  fixture('notebook-folders-', async (dir) => {
    const git = (...args: string[]) =>
      execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
    const commit = (date: string) => {
      git('add', '.');
      execFileSync(
        'git',
        [
          '-c',
          'user.name=Test',
          '-c',
          'user.email=test@example.invalid',
          '-c',
          'commit.gpgsign=false',
          'commit',
          '-m',
          'Fixture',
        ],
        {
          cwd: dir,
          stdio: 'pipe',
          env: {
            ...process.env,
            GIT_AUTHOR_DATE: date,
            GIT_COMMITTER_DATE: date,
          },
        },
      );
    };
    git('init');
    await fs.mkdir(path.join(dir, 'Research/Nested'), { recursive: true });
    await fs.writeFile(
      path.join(dir, 'Research/Original.md'),
      '# Original\n\nKeep the original content to track renames.\n',
    );
    commit('2024-01-01T00:00:00Z');
    git('mv', 'Research/Original.md', 'Research/Renamed.md');
    await fs.appendFile(path.join(dir, 'Research/Renamed.md'), '\nUpdated.\n');
    commit('2026-09-01T00:00:00Z');
    await fs.writeFile(
      path.join(dir, 'index.md'),
      '# Root\n\n[Research](Research/)',
    );
    await fs.writeFile(
      path.join(dir, 'Research/Nested/Latest.md'),
      '---\ncreated: 2026-02-02\ndate: 2020-01-01\n---\n# Latest',
    );
    await fs.writeFile(
      path.join(dir, 'Research/Next.md'),
      '---\ndate: 2025-03-03\n---\n# Next',
    );
    await fs.writeFile(path.join(dir, 'Research/Undated.md'), '# Undated');
    await fs.writeFile(
      path.join(dir, 'Research/Draft.md'),
      '---\ndraft: true\ncreated: 2027-01-01\n---\n# Draft',
    );
    const vault = await loadVault(dir);
    const renamed = vault.notes.find(
      (note) => note.file === 'Research/Renamed.md',
    )!;
    assert.equal(renamed.added, '2024-01-01T00:00:00.000Z');
    assert.equal(renamed.date, '2026-09-01T00:00:00.000Z');
    const folders = createFolderPages(vault.notes);
    assert.deepEqual(
      folders.map((folder) => folder.path),
      ['Research', 'Research/Nested'],
    );
    assert.deepEqual(folders[0].files, [
      'Research/Nested/Latest.md',
      'Research/Next.md',
      'Research/Renamed.md',
      'Research/Undated.md',
    ]);
    assert.match(
      vault.notes.find((note) => note.file === 'index.md')!.html,
      /href="\/Research\/"/,
    );
    await fs.writeFile(
      path.join(dir, 'Research/index.md'),
      '# Authored introduction',
    );
    const indexed = await loadVault(dir);
    assert.equal(
      createFolderPages(indexed.notes).some(
        (folder) => folder.path === 'Research',
      ),
      false,
    );
    await fs.rm(path.join(dir, 'index.md'));
    const rootFallback = createFolderPages((await loadVault(dir)).notes)[0];
    assert.equal(rootFallback.url, '/');
    assert.ok(rootFallback.files.includes('Research/index.md'));
    // A folder containing only a child's index is still a populated folder.
    await fs.mkdir(path.join(dir, 'Talks/Conference'), { recursive: true });
    await fs.writeFile(
      path.join(dir, 'Talks/Conference/index.md'),
      '# Conference',
    );
    assert.deepEqual(
      createFolderPages((await loadVault(dir)).notes).find(
        (folder) => folder.path === 'Talks',
      )!.files,
      ['Talks/Conference/index.md'],
    );
  }));
