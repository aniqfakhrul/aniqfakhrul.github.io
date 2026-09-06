import { recentNotes, site } from '../lib/data';
const escape = (text: string) =>
  text.replace(
    /[<>&"']/g,
    (c) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      })[c]!,
  );
export function GET() {
  const entries = recentNotes.slice(0, 30);
  const items = entries
    .map(
      (n) =>
        `<item><title>${escape(n.title)}</title><link>${site.url}${n.url}</link><guid>${site.url}${n.url}</guid><description>${escape(n.description)}</description>${n.date ? `<pubDate>${new Date(n.date).toUTCString()}</pubDate>` : ''}</item>`,
    )
    .join('');
  const latest = entries.find((n) => n.date)?.date;
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escape(site.title)}</title><link>${site.url}/</link><atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml"/><description>${escape(site.description)}</description><language>${escape(site.language)}</language>${latest ? `<lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>` : ''}${items}</channel></rss>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}
