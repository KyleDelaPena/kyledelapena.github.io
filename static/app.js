const html = document.documentElement;
const announce = message => { const status = document.querySelector('[data-announcement]'); if (status) status.textContent = message; };

const themeButtons = document.querySelectorAll('[data-theme-toggle]');
function applyTheme(theme, persist = false) {
  html.dataset.theme = theme;
  themeButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#10252d' : '#f7f8f5';
  if (persist) { try { localStorage.setItem('kyle-portfolio-theme', theme); } catch { /* Browsing works without storage. */ } }
}
try { const saved = localStorage.getItem('kyle-portfolio-theme'); if (saved === 'dark' || saved === 'light') applyTheme(saved); }
catch { /* Browsing works without storage. */ }
themeButtons.forEach(button => button.addEventListener('click', () => { const theme = html.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(theme, true); announce(`${theme === 'dark' ? 'Dark' : 'Light'} theme enabled.`); }));

const menuToggle = document.querySelector('[data-menu-toggle]');
const navigation = document.getElementById('site-navigation');
const mobileMenu = window.matchMedia('(max-width:760px)');
function setMenu(open, focus = false) {
  document.body.classList.toggle('nav-is-open', open);
  menuToggle?.setAttribute('aria-expanded', String(open));
  menuToggle?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  if (navigation) {
    navigation.inert = mobileMenu.matches && !open;
    if (mobileMenu.matches && !open) navigation.setAttribute('aria-hidden', 'true');
    else navigation.removeAttribute('aria-hidden');
  }
  if (open && focus) navigation?.querySelector('a')?.focus();
}
setMenu(false);
menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true', true));
mobileMenu.addEventListener('change', () => setMenu(false));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.classList.contains('nav-is-open')) { setMenu(false); menuToggle?.focus(); }
});
document.addEventListener('click', event => { if (document.body.classList.contains('nav-is-open') && !navigation?.contains(event.target) && !menuToggle?.contains(event.target)) setMenu(false); });
navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));

document.querySelectorAll('[data-filter-collection]').forEach(collection => {
  const buttons = [...collection.querySelectorAll('[data-filter]')];
  const search = collection.querySelector('[data-search]');
  const items = [...collection.querySelectorAll('[data-filter-item]')];
  const count = collection.querySelector('[data-result-count]');
  const empty = collection.querySelector('[data-empty]');
  const noun = collection.dataset.noun || 'results';
  let selectedCategory = 'All';
  const update = () => {
    const query = (search?.value || '').trim().toLocaleLowerCase();
    let visible = 0;
    items.forEach(item => {
      const categoryMatches = selectedCategory === 'All' || item.dataset.category === selectedCategory;
      const textMatches = !query || (item.dataset.searchText || item.textContent).toLocaleLowerCase().includes(query);
      item.hidden = !categoryMatches || !textMatches;
      if (!item.hidden) visible += 1;
    });
    buttons.forEach(button => { const active = button.dataset.filter === selectedCategory; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
    if (count) count.textContent = `${visible} of ${items.length} ${noun}${query ? ` matching “${search.value.trim()}”` : ''}`;
    if (empty) empty.hidden = visible !== 0;
  };
  buttons.forEach(button => button.addEventListener('click', () => { selectedCategory = button.dataset.filter; update(); }));
  search?.addEventListener('input', update);
  collection.querySelectorAll('[data-reset]').forEach(button => button.addEventListener('click', () => { selectedCategory = 'All'; if (search) search.value = ''; update(); search?.focus(); }));
  update();
});

const outlineLinks = [...document.querySelectorAll('.skill-outline a')];
if (outlineLinks.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const current = entries.filter(entry => entry.isIntersecting).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!current) return;
    outlineLinks.forEach(link => { if (link.hash === `#${current.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  }, { rootMargin: '-100px 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('.skill-detail-content > section').forEach(section => observer.observe(section));
}
