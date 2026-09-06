import fs from 'node:fs/promises';
import path from 'node:path';
import { loadVault } from '../src/lib/vault';
import { config } from '../src/lib/config';

await fs.access(path.join(config.content.directory, '.git')).catch(() => {
  throw new Error(
    'Archives submodule is missing. Run: git submodule update --init --recursive',
  );
});
const vault = await loadVault();
await fs.mkdir('.cache', { recursive: true });
await fs.rm('public/media', { recursive: true, force: true });
for (const [relative, source] of vault.assets) {
  const target = path.join('public/media', relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(source, target);
}
await fs.writeFile(
  '.cache/vault.json',
  JSON.stringify({
    notes: vault.notes,
    tree: vault.tree,
    warnings: vault.warnings,
  }),
);
await fs.writeFile('.cache/content-warnings.txt', vault.warnings.join('\n'));
for (const warning of vault.warnings) console.warn(`warning: ${warning}`);
console.log(
  `Prepared ${vault.notes.length} published notes and ${vault.assets.size} referenced attachments. ${vault.warnings.length} content warnings (see .cache/content-warnings.txt).`,
);
