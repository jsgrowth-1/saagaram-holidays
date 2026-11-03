/* SAAGRAM admin.js – FRONTEND DEMO. Data lives in this browser's localStorage only.
   No authentication, no encryption, no multi-device sync. Replace store with API calls when a backend exists. */
const store = {
  get(k, d) { try { const v = localStorage.getItem('saagram_' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('saagram_' + k, JSON.stringify(v)); return true; } catch { alert('Browser storage is full or blocked. Try smaller photos.'); return false; } }
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r = document) => r.querySelector(s);

/* Default data (no prices, no invented reviews) */
const DEF = {
  rooms: [['Double Bed Room', 2, 1], ['Triple Bed Room', 3, 2], ['Six Bed Room', 6, 2], ['Five Bed Room', 5, 1], ['Hall', 0, 1]]
    .map(([title, beds, count]) => ({ id: uid(), title, beds, count, price: '', desc: '', photo: '' })),
  blog: ['Best Places to Visit in Kanyakumari', 'Sunrise at the Southernmost Tip of India', 'Sunset at Kanyakumari', 'Best Time to Visit Kanyakumari', 'Family Travel Guide to Kanyakumari', 'Famous Tourist Attractions Near Saagram', 'Travel Tips for Kanyakumari Visitors']
    .map(title => ({ id: uid(), title, desc: '', body: '', photo: '' })),
  places: ['Vivekananda Rock Memorial', 'Thiruvalluvar Statue', 'Kanyakumari Beach', 'Gandhi Memorial', 'Bhagavathy Amman Temple', 'Sunset Point', 'Vattakottai Fort', 'Suchindram Temple', 'Padmanabhapuram Palace', 'Mathur Aqueduct']
    .map(title => ({ id: uid(), title, desc: '', distance: '', maps: '', photo: '' })),
  contact: { name: 'SAAGRAM – HOLIDAYS HOME', address: 'Main Road, Vivekanandapuram, Kanyakumari – 629702, Tamil Nadu, India.', phone1: '+91 9790124255', phone2: '+91 8903940040', email: 'harikrishnan1972.hh@gmail.com', whatsapp: '919790124255' }
};
const data = k => { let v = store.get(k); if (!v) { v = DEF[k]; store.set(k, v); } return v; };

/* Resize uploaded photos to keep localStorage small */
function readPhoto(file) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => {
      const s = Math.min(1, 800 / im.width), c = document.createElement('canvas');
      c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', .7)); }; im.src = r.result; };
    r.readAsDataURL(file);
  });
}

/* Generic CRUD view */
const CFG = {
  rooms: { label: 'Room', cols: ['photo', 'title', 'beds', 'count', 'price'], fields: [['title', 'Room category'], ['beds', 'Bed capacity', 'number'], ['count', 'Rooms available', 'number'], ['price', 'Price per night (₹, leave blank until decided)', 'number'], ['desc', 'Description', 'textarea'], ['photo', 'Photograph', 'image']] },
  blog: { label: 'Post', cols: ['photo', 'title', 'desc'], fields: [['title', 'Title'], ['desc', 'Short description', 'textarea'], ['body', 'Article body', 'textarea'], ['photo', 'Featured image', 'image']] },
  places: { label: 'Attraction', cols: ['photo', 'title', 'distance'], fields: [['title', 'Name'], ['desc', 'Description', 'textarea'], ['distance', 'Distance from Saagram (verify before publishing)'], ['maps', 'Google Maps link'], ['photo', 'Photograph', 'image']] }
};
function renderCrud(k) {
  const c = CFG[k], rows = data(k), el = $('#v-' + k + ' .tbl');
  const cell = (r, f) => f === 'photo' ? (r.photo ? `<img src="${r.photo}" alt="">` : '–') : f === 'price' ? (r.price ? '₹' + esc(r.price) : 'Not set') : esc(r[f] || '–');
  el.innerHTML = rows.length ? `<table><thead><tr>${c.cols.map(f => `<th>${f}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map(r => `<tr>${c.cols.map(f => `<td>${cell(r, f)}</td>`).join('')}<td><button class="sm" data-e="${r.id}">Edit</button><button class="sm del" data-d="${r.id}">Delete</button></td></tr>`).join('')}</tbody></table>` : '<p class="empty">Nothing here yet.</p>';
  el.onclick = e => {
    if (e.target.dataset.e) openForm(k, rows.find(r => r.id === e.target.dataset.e));
    if (e.target.dataset.d && confirm('Delete this item?')) { store.set(k, rows.filter(r => r.id !== e.target.dataset.d)); renderCrud(k); stats(); }
  };
}
function openForm(k, item) {
  const c = CFG[k], d = $('#dlg'); let photo = item?.photo || '';
  d.innerHTML = `<form method="dialog"><h3>${item ? 'Edit' : 'Add'} ${c.label}</h3>${c.fields.map(([n, l, t]) => `<label>${l}</label>` + (t === 'textarea' ? `<textarea name="${n}">${esc(item?.[n])}</textarea>` : t === 'image' ? `<input type="file" accept="image/*" id="ph"><img id="pv" src="${photo}" alt="" style="max-width:160px;margin-top:8px;${photo ? '' : 'display:none'}">` : `<input name="${n}" type="${t || 'text'}" value="${esc(item?.[n])}">`)).join('')}<div class="row"><button type="button" class="btn" id="cx">Cancel</button><button class="btn btn-sea">Save</button></div></form>`;
  d.showModal();
  $('#cx', d).onclick = () => d.close();
  const ph = $('#ph', d); if (ph) ph.onchange = async () => { if (ph.files[0]) { photo = await readPhoto(ph.files[0]); const p = $('#pv', d); p.src = photo; p.style.display = 'block'; } };
  $('form', d).onsubmit = () => {
    const o = { ...(item || { id: uid() }) }; c.fields.forEach(([n, , t]) => { if (t !== 'image') o[n] = $(`[name=${n}]`, d).value.trim(); }); o.photo = photo;
    const list = data(k), i = list.findIndex(r => r.id === o.id); i > -1 ? list[i] = o : list.push(o);
    if (store.set(k, list)) { renderCrud(k); stats(); }
  };
}

/* Enquiries: booking.js (Phase 2) will push objects {id,date,name,phone,email,checkin,checkout,adults,children,room,rooms,notes,status} into saagram_enquiries */
function renderEnq() {
  const rows = store.get('enquiries', []), el = $('#v-enq .tbl');
  el.innerHTML = rows.length ? `<table><thead><tr><th>Date</th><th>Guest</th><th>Stay</th><th>Room</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.date)}</td><td>${esc(r.name)}<br><small>${esc(r.phone)}</small></td><td>${esc(r.checkin)} → ${esc(r.checkout)}<br><small>${esc(r.adults)}A ${esc(r.children)}C</small></td><td>${esc(r.room)} ×${esc(r.rooms)}</td><td><select data-s="${r.id}">${['New', 'Contacted', 'Closed'].map(s => `<option ${r.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td><td><button class="sm del" data-d="${r.id}">Delete</button></td></tr>`).join('')}</tbody></table>` : '<p class="empty">No enquiries saved in this browser yet. Enquiries are sent to WhatsApp; the Booking page will also log a copy here.</p>';
  el.onchange = e => { if (e.target.dataset.s) { rows.find(r => r.id === e.target.dataset.s).status = e.target.value; store.set('enquiries', rows); stats(); } };
  el.onclick = e => { if (e.target.dataset.d && confirm('Delete enquiry?')) { store.set('enquiries', rows.filter(r => r.id !== e.target.dataset.d)); renderEnq(); stats(); } };
}
function renderContact() {
  const c = data('contact'), f = $('#contactForm');
  f.innerHTML = Object.keys(c).map(k => `<label>${k}</label><input name="${k}" value="${esc(c[k])}">`).join('') + '<div class="row"><button class="btn btn-sea">Save contact info</button></div>';
  f.onsubmit = e => { e.preventDefault(); const o = {}; new FormData(f).forEach((v, k) => o[k] = v.trim()); if (store.set('contact', o)) alert('Saved in this browser. The public pages will read this once connected (Phase 4).'); };
}
function stats() {
  const enq = store.get('enquiries', []), prices = data('rooms').filter(r => r.price).length;
  $('#stats').innerHTML = [['Room categories', data('rooms').length], ['Rooms priced', prices + '/' + data('rooms').length], ['New enquiries', enq.filter(e => e.status === 'New').length], ['Blog posts', data('blog').length], ['Attractions', data('places').length], ['Total enquiries', enq.length]].map(([l, n]) => `<div class="stat"><b>${n}</b>${l}</div>`).join('');
}

/* Navigation + init */
function show(v) {
  document.querySelectorAll('.view').forEach(x => x.classList.toggle('on', x.id === 'v-' + v));
  document.querySelectorAll('.side [data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  $('.side').classList.remove('open'); scrollTo(0, 0);
}
document.querySelectorAll('[data-v]').forEach(b => b.onclick = () => show(b.dataset.v));
$('#menuBtn').onclick = () => $('.side').classList.toggle('open');
document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => openForm(b.dataset.add));
$('#reset').onclick = () => { if (confirm('Erase all admin data stored in this browser?')) { Object.keys(localStorage).filter(k => k.startsWith('saagram_')).forEach(k => localStorage.removeItem(k)); location.reload(); } };
['rooms', 'blog', 'places'].forEach(renderCrud); renderEnq(); renderContact(); stats();
