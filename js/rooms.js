/* Rooms page: image lightbox (keyboard + click accessible) */
(() => {
  const lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = '<button aria-label="Close">×</button><div><img alt=""><p></p></div>'; document.body.appendChild(lb);
  const img = lb.querySelector('img'), msg = lb.querySelector('p');
  const close = () => lb.classList.remove('on');
  img.onerror = () => { img.style.display = 'none'; msg.textContent = 'Photo not added yet: ' + img.dataset.src; };
  img.onload = () => { img.style.display = 'block'; msg.textContent = img.alt; };
  document.querySelectorAll('.gal button').forEach(b => b.addEventListener('click', () => {
    img.dataset.src = b.dataset.full; img.alt = b.getAttribute('aria-label'); img.src = b.dataset.full; lb.classList.add('on');
  }));
  lb.addEventListener('click', e => { if (e.target !== img) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();
