export {};

type SearchResult = {
  data(): Promise<{ url: string; meta: { title?: string }; excerpt: string }>;
};
type Pagefind = {
  search(query: string): Promise<{ results: SearchResult[] }>;
};
declare global {
  interface Window {
    loadPagefind?: () => Promise<Pagefind>;
  }
}

const input = document.querySelector<HTMLInputElement>('#sidebar-query')!;
const statusLine = document.querySelector<HTMLElement>('#search-status')!;
const list = document.querySelector<HTMLOListElement>('#search-results')!;
const panel = document.querySelector<HTMLElement>('#sidebar-results')!;
const more = document.querySelector<HTMLButtonElement>('#load-more')!;
const sidebar = document.querySelector<HTMLDetailsElement>('#navigation')!;
let engine: Pagefind | undefined;
let results: SearchResult[] = [];
let offset = 0;
let generation = 0;

async function renderBatch(token: number) {
  const batch = await Promise.all(
    results.slice(offset, offset + 8).map((result) => result.data()),
  );
  if (token !== generation) return;
  for (const item of batch) {
    const entry = document.createElement('li');
    const link = document.createElement('a');
    link.href = item.url;
    link.textContent = item.meta.title ?? item.url;
    const excerpt = document.createElement('p');
    excerpt.textContent = (
      new DOMParser().parseFromString(item.excerpt, 'text/html').body
        .textContent ?? ''
    ).slice(0, 150);
    entry.append(link, excerpt);
    list.append(entry);
  }
  offset += batch.length;
  more.hidden = offset >= results.length;
}

async function search() {
  const query = input.value.trim();
  const token = ++generation;
  list.replaceChildren();
  more.hidden = true;
  panel.hidden = !query;
  if (!query) return;
  sidebar.open = true;
  statusLine.textContent = 'Searching…';
  history.replaceState(
    null,
    '',
    `${location.pathname}?q=${encodeURIComponent(query)}`,
  );
  try {
    if (!window.loadPagefind) throw new Error('Pagefind loader missing');
    engine ??= await window.loadPagefind();
    const response = await engine.search(query);
    if (token !== generation) return;
    results = response.results;
    offset = 0;
    statusLine.textContent = results.length
      ? `${results.length} notes found.`
      : 'No notes found. Try a broader term.';
    await renderBatch(token);
  } catch {
    if (token === generation)
      statusLine.textContent =
        'Search could not load. Try again, or browse the folders.';
  }
}

document
  .querySelector<HTMLFormElement>('#sidebar-search')!
  .addEventListener('submit', (event) => {
    event.preventDefault();
    search();
  });
more.addEventListener('click', async () => {
  more.disabled = true;
  try {
    await renderBatch(generation);
  } catch {
    statusLine.textContent =
      'More results could not load. Try the search again.';
  } finally {
    more.disabled = false;
  }
});
document
  .querySelector<HTMLButtonElement>('#clear-search')!
  .addEventListener('click', () => {
    generation++;
    input.value = '';
    list.replaceChildren();
    panel.hidden = true;
    history.replaceState(null, '', location.pathname);
    input.focus();
  });
const query = new URLSearchParams(location.search).get('q');
if (query) {
  input.value = query;
  search();
}
