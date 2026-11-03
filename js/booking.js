/* Booking + contact forms: validate, open WhatsApp with a formatted message, keep a local copy for the admin demo.
   BACKEND HOOK: replace sendEnquiry() body with fetch('/api/enquiries', {method:'POST', body: JSON.stringify(e)}) later. */
(() => {
  const WA = (typeof SAAGRAM !== 'undefined' ? SAAGRAM.whatsapp : '919790124255');
  const today = new Date().toISOString().slice(0, 10);
  const form = document.getElementById('bookingForm') || document.getElementById('contactForm');
  if (!form) return;
  const f = form.elements, isBooking = form.id === 'bookingForm';
  if (isBooking) {
    f.checkin.min = today; f.checkout.min = today;
    f.checkin.addEventListener('change', () => { f.checkout.min = f.checkin.value || today; });
    const q = new URLSearchParams(location.search).get('room'); if (q) f.room.value = q;
  }
  const setErr = (el, m) => { const s = el.closest('div').querySelector('.err'); if (s) s.textContent = m || ''; return !m; };
  function validate() {
    let ok = true;
    const chk = (el, bad, m) => { ok = setErr(el, bad ? m : '') && ok; };
    chk(f.name, f.name.value.trim().length < 2, 'Please enter your name.');
    chk(f.phone, !/^[+]?[0-9 -]{10,15}$/.test(f.phone.value.trim()), 'Enter a valid phone number.');
    if (f.email.value) chk(f.email, !/^\S+@\S+\.\S+$/.test(f.email.value), 'Enter a valid email.');
    if (isBooking) {
      chk(f.checkin, !f.checkin.value || f.checkin.value < today, 'Choose a check-in date from today.');
      chk(f.checkout, !f.checkout.value || f.checkout.value <= f.checkin.value, 'Check-out must be after check-in.');
      chk(f.adults, +f.adults.value < 1, 'At least 1 adult.');
      chk(f.room, !f.room.value, 'Select a room category.');
    } else chk(f.message, f.message.value.trim().length < 5, 'Please write a message.');
    return ok;
  }
  function sendEnquiry(e) { // WhatsApp now; backend later
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(e.text)}`, '_blank', 'noopener');
    if (e.log) try { const k = 'saagram_enquiries', l = JSON.parse(localStorage.getItem(k) || '[]'); l.unshift(e.log); localStorage.setItem(k, JSON.stringify(l)); } catch {}
  }
  form.addEventListener('submit', ev => {
    ev.preventDefault(); if (!validate()) return;
    const v = n => f[n].value.trim();
    if (isBooking) {
      const text = `*Booking Enquiry – Saagram Holidays Home*\nName: ${v('name')}\nPhone: ${v('phone')}\nEmail: ${v('email') || '-'}\nCheck-in: ${v('checkin')}\nCheck-out: ${v('checkout')}\nAdults: ${v('adults')}, Children: ${v('children') || 0}\nRoom: ${v('room')} x ${v('rooms') || 1}\nRequests: ${v('notes') || '-'}`;
      sendEnquiry({ text, log: { id: Date.now().toString(36), date: today, name: v('name'), phone: v('phone'), email: v('email'), checkin: v('checkin'), checkout: v('checkout'), adults: v('adults'), children: v('children') || 0, room: v('room'), rooms: v('rooms') || 1, notes: v('notes'), status: 'New' } });
    } else sendEnquiry({ text: `*Website Enquiry*\nName: ${v('name')}\nPhone: ${v('phone')}\nEmail: ${v('email') || '-'}\nMessage: ${v('message')}` });
    document.getElementById('formNote').textContent = 'WhatsApp should now open with your enquiry. Please press Send there. Availability is confirmed by us directly.';
  });
})();
