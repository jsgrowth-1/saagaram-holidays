/* SAAGRAM main.js – nav, sticky header, scroll reveal, shared config */
const SAAGRAM = { whatsapp: '919790124255' }; // reused by booking.js in Phase 2
(() => {
  const burger = document.querySelector('.burger'), menu = document.querySelector('.menu'), header = document.querySelector('.header');
  const setMenu = o => { menu.classList.toggle('open', o); burger.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  document.querySelectorAll('[data-room]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    const t = `Hello Saagram Holidays Home, I would like to enquire about the ${b.dataset.room}.`;
    window.open(`https://wa.me/${SAAGRAM.whatsapp}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  }));
})();

/* Phase 4: show admin-saved room prices/photos on public pages.
   DEMO LIMITATION: localStorage is per browser, so this only shows edits made in the SAME browser. A backend is needed for real visitors. */
(() => {
  let rooms; try { rooms = JSON.parse(localStorage.getItem('saagram_rooms') || '[]'); } catch { return; }
  if (!Array.isArray(rooms) || !rooms.length) return;
  document.querySelectorAll('.card').forEach(card => {
    const a = card.querySelector('a[data-room], a[href*="booking.html?room="]'); if (!a) return;
    const name = a.dataset.room || decodeURIComponent(a.getAttribute('href').split('room=')[1] || '');
    const r = rooms.find(x => x.title === name); if (!r) return;
    const price = String(r.price || '').replace(/[^0-9.,]/g, '');
    if (price) { const p = document.createElement('p'); p.className = 'price'; p.textContent = 'From ₹' + price + ' per night'; a.before(p); }
    if (typeof r.photo === 'string' && r.photo.startsWith('data:image/')) { const im = card.querySelector('.img'); if (im) im.style.backgroundImage = 'url("' + r.photo + '")'; }
  });
})();
