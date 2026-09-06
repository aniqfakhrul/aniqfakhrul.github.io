import { notes, folderPages, site } from '../lib/data';
export function GET() {
  const entries = [
    ...notes.map((n) => ({ url: n.url, date: n.date })),
    ...folderPages.map((f) => ({ url: f.url, date: undefined })),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries
      .map(
        ({ url, date }) =>
          `<url><loc>${site.url}${url.replace(/&/g, '&amp;')}</loc>${date ? `<lastmod>${date.slice(0, 10)}</lastmod>` : ''}</url>`,
      )
      .join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}
