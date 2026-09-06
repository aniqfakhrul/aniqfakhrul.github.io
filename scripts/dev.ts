import { dev } from 'astro';
import { config } from '../src/lib/config';
import { watch } from 'node:fs';
import { spawn } from 'node:child_process';

await dev({});
let timer: ReturnType<typeof setTimeout>;
let running = false;
let pending = false;
function prepare() {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', 'scripts/prepare.ts'],
    { stdio: 'inherit' },
  );
  child.on('exit', () => {
    running = false;
    if (pending) {
      pending = false;
      prepare();
    }
  });
}
watch(config.content.directory, { recursive: true }, (_event, filename) => {
  if (!filename || filename.split(/[\\/]/).some((p) => p.startsWith('.')))
    return;
  clearTimeout(timer);
  timer = setTimeout(prepare, 150);
});
