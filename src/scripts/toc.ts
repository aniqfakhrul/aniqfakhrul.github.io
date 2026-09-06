const toc = document.querySelector<HTMLElement>('.toc');
const article = document.querySelector<HTMLElement>('.prose');

if (toc && article) {
  const sections = [
    ...toc.querySelectorAll<HTMLAnchorElement>('nav a[href^="#"]'),
  ]
    .map((link) => ({
      link,
      heading: document.getElementById(decodeURIComponent(link.hash.slice(1))),
    }))
    .filter(
      (section): section is { link: HTMLAnchorElement; heading: HTMLElement } =>
        !!section.heading && article.contains(section.heading),
    );
  let active: HTMLAnchorElement | undefined;
  let scheduled = false;

  function update() {
    scheduled = false;
    let current = sections[0];
    // Keep the preceding section active throughout long paragraphs and images.
    for (const section of sections) {
      if (section.heading.getBoundingClientRect().top > 40) break;
      current = section;
    }
    if (
      window.scrollY > 0 &&
      window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2
    )
      current = sections.at(-1) ?? current;
    if (!current || current.link === active) return;
    active?.removeAttribute('aria-current');
    active = current.link;
    active.setAttribute('aria-current', 'location');

    // Scroll only the desktop TOC panel, never move the reader's document.
    if (getComputedStyle(toc!).position === 'sticky') {
      const panel = toc!.getBoundingClientRect();
      const link = active.getBoundingClientRect();
      if (link.top < panel.top) toc!.scrollTop += link.top - panel.top - 8;
      else if (link.bottom > panel.bottom)
        toc!.scrollTop += link.bottom - panel.bottom + 8;
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('pageshow', schedule);
  // Lazy images and mobile navigation can change heading positions after load.
  new ResizeObserver(schedule).observe(document.body);
  schedule();
}
