import { site, config } from '../lib/config';
export function GET() {
  const initial = [...site.title][0].replace(/[<>&"']/g, '');
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="${config.theme.colors.sidebar}" d="M0 0h32v32H0z"/><text x="16" y="25" text-anchor="middle" font-family="Arial,sans-serif" font-size="27" font-weight="bold" fill="${config.theme.colors.navy}">${initial}</text></svg>`,
    { headers: { 'Content-Type': 'image/svg+xml' } },
  );
}
