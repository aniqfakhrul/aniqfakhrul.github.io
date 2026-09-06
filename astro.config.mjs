import { defineConfig } from 'astro/config';
import { site } from './src/lib/config.ts';
export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  server: { host: '127.0.0.1', port: 4321 },
});
