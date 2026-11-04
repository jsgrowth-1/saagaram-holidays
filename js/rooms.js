/* SAAGARAM HOLIDAYS - PUBLIC ROOMS PAGE
   Room details and prices come from Supabase.
   Room photographs remain in the GitHub repository.
   All room photographs are displayed together; no thumbnail clicking required.
*/
(() => {
  const SUPABASE_URL = 'https://pgsgxcpcadzrtpztyits.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_0KjoXy9evMYsK043pXatjw_weYiA0c5';

  const grid = document.querySelector('#roomsGrid');
  if (!grid) return;

  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const ROOM_IMAGES = {
    'Double Bed Room': [
      'images/rooms/IMG-20261024-WA0059.jpg',
      'images/rooms/IMG-20261024-WA0047.jpg',
      'images/rooms/IMG-20261024-WA0050.jpg',
      'images/rooms/IMG-20261024-WA0048.jpg'
    ],
    'Triple Bed Room': [
      'images/rooms/IMG-20261024-WA0060.jpg',
      'images/rooms/IMG-20261024-WA0046.jpg',
      'images/rooms/IMG-20261024-WA0050.jpg'
    ],
    'Six Bed Room': [
      'images/rooms/IMG-20261024-WA0048.jpg',
      'images/rooms/IMG-20261024-WA0052.jpg',
      'images/rooms/IMG-20261024-WA0047.jpg',
      'images/rooms/IMG-20261024-WA0050.jpg'
    ],
    'Five Bed Room': [
      'images/rooms/IMG-20261024-WA0053.jpg',
      'images/rooms/IMG-20261024-WA0049.jpg',
      'images/rooms/IMG-20261024-WA0054.jpg',
      'images/rooms/IMG-20261024-WA0050.jpg'
    ],
    'Hall': [
  'images/rooms/IMG-20261024-WA0045.jpg',
  'images/rooms/IMG-20261024-WA0057.jpg'
]
  };

  // Display every room photo at the same time in a responsive photo grid.
  const galleryStyles = `
    <style id="saagaram-room-gallery-styles">
      #roomsGrid .room-gallery {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin: 0;
        padding: 12px 12px 0;
      }
      #roomsGrid .room-gallery img {
        display: block;
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 10px;
        background: #edf2f2;
      }
      #roomsGrid .room-gallery img:first-child {
        grid-column: 1 / -1;
        height: 220px;
      }
      @media (max-width: 520px) {
        #roomsGrid .room-gallery img { height: 120px; }
        #roomsGrid .room-gallery img:first-child { height: 190px; }
      }
    </style>`;

  if (!document.querySelector('#saagaram-room-gallery-styles')) {
    document.head.insertAdjacentHTML('beforeend', galleryStyles);
  }

  function formatPrice(price) {
    if (price === null || price === undefined || price === '') {
      return 'Tariff available on enquiry';
    }
    return `₹${Number(price).toLocaleString('en-IN')} per night`;
  }

  function roomCard(room) {
    const images = ROOM_IMAGES[room.title] || [];
    const gallery = images.length
      ? `<div class="room-gallery" aria-label="${escapeHTML(room.title)} photographs">
          ${images.map((path, index) => `
            <img src="${escapeHTML(path)}"
                 alt="${escapeHTML(room.title)} photo ${index + 1}"
                 loading="lazy">
          `).join('')}
        </div>`
      : `<div class="room-gallery"><p>Photos coming soon.</p></div>`;

    const capacity = Number(room.beds) > 0
      ? `${escapeHTML(room.beds)} beds`
      : 'Spacious hall';
    const count = `${escapeHTML(room.count)} ${Number(room.count) === 1 ? 'room' : 'rooms'} available`;
    const description = room.description
      ? `<p>${escapeHTML(room.description)}</p>`
      : '<p>A comfortable space for your Kanyakumari stay.</p>';
    const roomQuery = encodeURIComponent(room.title);

    return `
      <article class="card reveal">
        ${gallery}
        <div class="body">
          <h2 style="font-size:1.4rem">${escapeHTML(room.title)}</h2>
          <div class="meta">${capacity} · ${count}</div>
          ${description}
          <p class="price">${formatPrice(room.price)}</p>
          <p class="meta">Amenities: Free WiFi · Free private parking · Family-friendly</p>
          <a class="btn btn-sea" href="booking.html?room=${roomQuery}">Enquire Now</a>
        </div>
      </article>
    `;
  }

  async function loadRooms() {
    grid.innerHTML = '<p class="empty">Loading rooms...</p>';

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      grid.innerHTML = '<p class="empty">Room information is temporarily unavailable. Please contact us for details.</p>';
      console.error('Supabase JavaScript library did not load.');
      return;
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: rooms, error } = await client
      .from('rooms')
      .select('id,title,beds,count,price,description,status')
      .eq('status', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase room query failed:', error);
      grid.innerHTML = '<p class="empty">We could not load room details right now. Please contact us on WhatsApp.</p>';
      return;
    }

    if (!rooms || rooms.length === 0) {
      grid.innerHTML = '<p class="empty">Room details will be available soon. Please contact us for tariffs and availability.</p>';
      return;
    }

    grid.innerHTML = rooms.map(roomCard).join('');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      grid.querySelectorAll('.reveal').forEach(card => observer.observe(card));
    }
  }

  loadRooms();
})();
