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


