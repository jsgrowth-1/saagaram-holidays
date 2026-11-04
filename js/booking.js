/* Saagaram booking enquiry: save to Supabase, then open WhatsApp.
   Requires js/supabase.js to load before this file. */
(() => {
  const WA = (typeof Saagaram !== 'undefined' && Saagaram.whatsapp)
    ? Saagaram.whatsapp : '919790124255';
  const form = document.getElementById('bookingForm') || document.getElementById('contactForm');
  if (!form) return;
  const isBooking = form.id === 'bookingForm';
  const fields = form.elements;
  const note = document.getElementById('formNote');

  const localToday = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };

  if (isBooking) {
    const today = localToday();
    fields.checkin.min = today;
    fields.checkout.min = today;
    fields.checkin.addEventListener('change', () => {
      fields.checkout.min = fields.checkin.value || today;
      if (fields.checkout.value && fields.checkout.value <= fields.checkin.value) fields.checkout.value = '';
    });
    const selectedRoom = new URLSearchParams(location.search).get('room');
    if (selectedRoom) {
      const option = [...fields.room.options].find(item =>
        item.value === selectedRoom || item.textContent.trim() === selectedRoom
      );
      if (option) fields.room.value = option.value;
    }
  }

  const setError = (el, message) => {
    const error = el.closest('div')?.querySelector('.err');
    if (error) error.textContent = message || '';
    return !message;
  };

  function validate() {
    let valid = true;
    const check = (el, invalid, message) => {
      if (el) valid = setError(el, invalid ? message : '') && valid;
    };
    check(fields.name, fields.name.value.trim().length < 2, 'Please enter your name.');
    check(fields.phone, !/^[+]?[0-9 ()-]{10,18}$/.test(fields.phone.value.trim()), 'Enter a valid phone number.');
    if (fields.email?.value.trim()) check(fields.email, !/^\S+@\S+\.\S+$/.test(fields.email.value.trim()), 'Enter a valid email.');

    if (isBooking) {
      const today = localToday();
      check(fields.checkin, !fields.checkin.value || fields.checkin.value < today, 'Choose a valid check-in date.');
      check(fields.checkout, !fields.checkout.value || fields.checkout.value <= fields.checkin.value, 'Check-out must be after check-in.');
      check(fields.adults, !Number.isInteger(+fields.adults.value) || +fields.adults.value < 1, 'At least 1 adult is required.');
      check(fields.children, !Number.isInteger(+fields.children.value) || +fields.children.value < 0, 'Enter a valid number of children.');
      check(fields.room, !fields.room.value, 'Select a room category.');
      check(fields.rooms, !Number.isInteger(+fields.rooms.value) || +fields.rooms.value < 1, 'Select at least 1 room.');
    } else if (fields.message) {
      check(fields.message, fields.message.value.trim().length < 5, 'Please write a message.');
    }
    return valid;
  }

  const value = name => fields[name] ? fields[name].value.trim() : '';

  async function submitBooking() {
    const record = {
      name: value('name'),
      phone: value('phone'),
      email: value('email') || null,
      checkin: value('checkin'),
      checkout: value('checkout'),
      adults: Number(value('adults') || 1),
      children: Number(value('children') || 0),
      room: value('room'),
      rooms: Number(value('rooms') || 1),
      notes: value('notes') || null,
      status: 'New'
    };

    const button = form.querySelector('[type="submit"]');
    const originalText = button?.textContent || '';
    if (button) { button.disabled = true; button.textContent = 'Submitting...'; }
    if (note) note.textContent = 'Saving your enquiry...';

    try {
      if (typeof db === 'undefined') throw new Error('Supabase client is not loaded. Check booking.html script tags.');
      const { error } = await db.from('enquiries').insert(record);
      if (error) throw error;

      const message =
        `*Booking Enquiry – Saagaram Holidays Home*\nName: ${record.name}\nPhone: ${record.phone}\nEmail: ${record.email || '-'}\n` +
        `Check-in: ${record.checkin}\nCheck-out: ${record.checkout}\nAdults: ${record.adults}, Children: ${record.children}\n` +
        `Room: ${record.room} x ${record.rooms}\nRequests: ${record.notes || '-'}`;

      const waWindow = window.open(`https://wa.me/${WA}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
      if (note) note.textContent = waWindow
        ? 'Your enquiry has been saved. WhatsApp is open; press Send to contact us.'
        : 'Your enquiry has been saved successfully. If WhatsApp did not open, contact us directly.';

      form.reset();
      fields.adults.value = '2';
      fields.children.value = '0';
      fields.rooms.value = '1';
      fields.checkin.min = localToday();
      fields.checkout.min = localToday();
    } catch (error) {
      console.error('Booking enquiry failed:', error);
      if (note) note.textContent = 'We could not save your enquiry: ' + (error.message || 'Please try again.');
      alert('Booking enquiry was not saved. ' + (error.message || 'Please try again.'));
    } finally {
      if (button) { button.disabled = false; button.textContent = originalText; }
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!validate()) return;
    if (isBooking) return submitBooking();
    const message = `*Website Enquiry*\nName: ${value('name')}\nPhone: ${value('phone')}\nEmail: ${value('email') || '-'}\nMessage: ${value('message')}`;
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  });
})();
