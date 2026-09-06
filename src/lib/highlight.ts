import { bundledLanguages, createHighlighter } from 'shiki';

export type CodeHighlighter = Awaited<ReturnType<typeof createCodeHighlighter>>;

// rehype-stringify escapes code as text; Shiki needs the original characters.
const decodeEntities = (escaped: string) =>
  escaped
    .replace(/&#x([\da-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

export async function createCodeHighlighter(theme = 'github-light') {
  const highlighter = await createHighlighter({ themes: [theme], langs: [] });
  const loaded = () => highlighter.getLoadedLanguages();
  return {
    /** Loads grammars on demand, so every language Shiki bundles is highlighted. */
    async load(languages: Iterable<string>) {
      for (const language of new Set(
        [...languages].map((l) => l.toLowerCase()),
      )) {
        if (
          !loaded().includes(language) &&
          Object.hasOwn(bundledLanguages, language)
        )
          await highlighter.loadLanguage(
            language as keyof typeof bundledLanguages,
          );
      }
    },
    /** Replaces sanitized `<pre><code>` blocks with highlighted markup. */
    apply(html: string) {
      return html.replace(
        /<pre><code(?: class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>/g,
        (_, language: string | undefined, escaped: string) => {
          const lang = (language ?? 'text').toLowerCase();
          return highlighter.codeToHtml(
            decodeEntities(escaped).replace(/\n$/, ''),
            { lang: loaded().includes(lang) ? lang : 'text', theme },
          );
        },
      );
    },
    dispose: () => highlighter.dispose(),
  };
}
