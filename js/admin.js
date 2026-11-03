/* SAAGRAM HOLIDAYS ADMIN
   Rooms: Supabase
   Blog, Attractions, Enquiries and Contact: localStorage for now.
   Room photos are maintained in GitHub; this admin does not upload images.
*/

const store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem('saagram_' + key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem('saagram_' + key, JSON.stringify(value));
      return true;
    } catch {
      alert('Browser storage is full or blocked.');
      return false;
    }
  }
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const $ = (selector, root = document) => root.querySelector(selector);

/* Default demo content is retained only for the localStorage modules. */
const DEF = {
  blog: [
    'Best Places to Visit in Kanyakumari',
    'Sunrise at the Southernmost Tip of India',
    'Sunset at Kanyakumari',
    'Best Time to Visit Kanyakumari',
    'Family Travel Guide to Kanyakumari',
    'Famous Tourist Attractions Near Saagram',
    'Travel Tips for Kanyakumari Visitors'
  ].map(title => ({ id: uid(), title, desc: '', body: '', photo: '' })),

  places: [
    'Vivekananda Rock Memorial', 'Thiruvalluvar Statue',
    'Kanyakumari Beach', 'Gandhi Memorial',
    'Bhagavathy Amman Temple', 'Sunset Point',
    'Vattakottai Fort', 'Suchindram Temple',
    'Padmanabhapuram Palace', 'Mathur Aqueduct'
  ].map(title => ({ id: uid(), title, desc: '', distance: '', maps: '', photo: '' })),

  contact: {
    name: 'SAAGRAM – HOLIDAYS HOME',
    address: 'Main Road, Vivekanandapuram, Kanyakumari – 629702, Tamil Nadu, India.',
    phone1: '+91 9790124255',
    phone2: '+91 8903940040',
    email: 'harikrishnan1972.hh@gmail.com',
    whatsapp: '919790124255'
  }
};

function localData(key) {
  let value = store.get(key, null);
  if (value === null) {
    value = DEF[key];
    store.set(key, value);
  }
  return value;
}

/* Used only by the existing localStorage Blog and Attractions forms. */
function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Invalid image file.'));
      image.onload = () => {
        const scale = Math.min(1, 800 / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Blog and Attractions remain localStorage-based for this phase. */
const CFG = {
  blog: {
    label: 'Post',
    cols: ['photo', 'title', 'desc'],
    fields: [
      ['title', 'Title'],
      ['desc', 'Short description', 'textarea'],
      ['body', 'Article body', 'textarea'],
      ['photo', 'Featured image', 'image']
    ]
  },
  places: {
    label: 'Attraction',
    cols: ['photo', 'title', 'distance'],
    fields: [
      ['title', 'Name'],
      ['desc', 'Description', 'textarea'],
      ['distance', 'Distance from Saagram (verify before publishing)'],
      ['maps', 'Google Maps link'],
      ['photo', 'Photograph', 'image']
    ]
  }
};

function renderLocalCrud(key) {
  const config = CFG[key];
  const rows = localData(key);
  const element = $('#v-' + key + ' .tbl');

  const cell = (row, field) => {
    if (field === 'photo') {
      return row.photo ? `<img src="${esc(row.photo)}" alt="">` : '–';
    }
    return esc(row[field] || '–');
  };

  element.innerHTML = rows.length
    ? `<table>
        <thead><tr>${config.cols.map(field => `<th>${esc(field)}</th>`).join('')}<th>Actions</th></tr></thead>
        <tbody>${rows.map(row => `
          <tr>
            ${config.cols.map(field => `<td>${cell(row, field)}</td>`).join('')}
            <td>
              <button class="sm" data-local-edit="${esc(row.id)}">Edit</button>
              <button class="sm del" data-local-delete="${esc(row.id)}">Delete</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`
    : '<p class="empty">Nothing here yet.</p>';

  element.onclick = event => {
    const editId = event.target.dataset.localEdit;
    const deleteId = event.target.dataset.localDelete;

    if (editId) {
      openLocalForm(key, rows.find(row => row.id === editId));
    }

    if (deleteId && confirm('Delete this item?')) {
      store.set(key, rows.filter(row => row.id !== deleteId));
      renderLocalCrud(key);
      stats();
    }
  };
}

function openLocalForm(key, item = null) {
  const config = CFG[key];
  const dialog = $('#dlg');
  let photo = item?.photo || '';

  dialog.innerHTML = `<form method="dialog">
    <h3>${item ? 'Edit' : 'Add'} ${config.label}</h3>
    ${config.fields.map(([name, label, type]) => `
      <label>${esc(label)}</label>
      ${type === 'textarea'
        ? `<textarea name="${name}">${esc(item?.[name] || '')}</textarea>`
        : type === 'image'
          ? `<input type="file" accept="image/*" id="localPhoto">
             <img id="localPreview" src="${esc(photo)}" alt=""
               style="max-width:160px;margin-top:8px;${photo ? '' : 'display:none'}">`
          : `<input name="${name}" type="${type || 'text'}" value="${esc(item?.[name] || '')}">`}
    `).join('')}
    <div class="row">
      <button type="button" class="btn" id="localCancel">Cancel</button>
      <button type="submit" class="btn btn-sea">Save</button>
    </div>
  </form>`;

  dialog.showModal();
  $('#localCancel', dialog).onclick = () => dialog.close();

  const photoInput = $('#localPhoto', dialog);
  if (photoInput) {
    photoInput.onchange = async () => {
      if (!photoInput.files[0]) return;
      try {
        photo = await readPhoto(photoInput.files[0]);
        const preview = $('#localPreview', dialog);
        preview.src = photo;
        preview.style.display = 'block';
      } catch (error) {
        alert(error.message);
      }
    };
  }

  $('form', dialog).onsubmit = event => {
    event.preventDefault();
    const record = { ...(item || { id: uid() }) };

    config.fields.forEach(([name, , type]) => {
      if (type !== 'image') {
        record[name] = $(`[name="${name}"]`, dialog).value.trim();
      }
    });
    if (config.fields.some(field => field[0] === 'photo')) record.photo = photo;

    const list = localData(key);
    const index = list.findIndex(row => row.id === record.id);
    if (index >= 0) list[index] = record;
    else list.push(record);

    if (store.set(key, list)) {
      dialog.close();
      renderLocalCrud(key);
      stats();
    }
  };
}

/* ROOMS: all room records are stored in Supabase. No image upload here. */
async function renderRooms() {
  const element = $('#v-rooms .tbl');
  element.innerHTML = '<p class="empty">Loading rooms from Supabase...</p>';

  const { data: rooms, error } = await db
    .from('rooms')
    .select('id,title,beds,count,price,description,status,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    element.innerHTML = `<p class="empty">Could not load rooms: ${esc(error.message)}</p>`;
    return;
  }

  if (!rooms.length) {
    element.innerHTML = '<p class="empty">No rooms in the database yet. Select “Add Room” to create your first room.</p>';
  } else {
    element.innerHTML = `<table>
      <thead><tr>
        <th>Room</th><th>Bed capacity</th><th>Available</th>
        <th>Price / night</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>${rooms.map(room => `
        <tr>
          <td>${esc(room.title)}</td>
          <td>${esc(room.beds)}</td>
          <td>${esc(room.count)}</td>
          <td>${room.price === null ? 'Not set' : '₹' + esc(room.price)}</td>
          <td>${room.status ? 'Active' : 'Inactive'}</td>
          <td>
            <button class="sm" data-room-edit="${esc(room.id)}">Edit</button>
            <button class="sm del" data-room-delete="${esc(room.id)}">Delete</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  }

  element.onclick = async event => {
    const editId = event.target.dataset.roomEdit;
    const deleteId = event.target.dataset.roomDelete;

    if (editId) {
      openRoomForm(rooms.find(room => room.id === editId));
    }

    if (deleteId && confirm('Permanently delete this room from the database?')) {
      const { error: deleteError } = await db
        .from('rooms')
        .delete()
        .eq('id', deleteId);

      if (deleteError) {
        alert('Could not delete room: ' + deleteError.message);
        return;
      }

      await renderRooms();
      await stats();
    }
  };
}

function openRoomForm(room = null) {
  const dialog = $('#dlg');

  dialog.innerHTML = `<form id="roomForm">
    <h3>${room ? 'Edit Room' : 'Add Room'}</h3>

    <label>Room Name</label>
    <input name="title" maxlength="150" required value="${esc(room?.title || '')}">

    <label>Bed Capacity</label>
    <input name="beds" type="number" min="0" step="1" required value="${room?.beds ?? 1}">

    <label>Available Rooms</label>
    <input name="count" type="number" min="0" step="1" required value="${room?.count ?? 1}">

    <label>Price Per Night (₹)</label>
    <input name="price" type="number" min="0" step="0.01"
      value="${room?.price ?? ''}" placeholder="Leave blank if not decided">

    <label>Description</label>
    <textarea name="description">${esc(room?.description || '')}</textarea>

    <label>Status</label>
    <select name="status">
      <option value="true" ${room?.status !== false ? 'selected' : ''}>Active</option>
      <option value="false" ${room?.status === false ? 'selected' : ''}>Inactive</option>
    </select>

    <p class="sec-sub">Room photographs are managed in the GitHub repository, not here.</p>

    <div class="row">
      <button type="button" class="btn" id="roomCancel">Cancel</button>
      <button type="submit" class="btn btn-sea">Save Room</button>
    </div>
  </form>`;

  dialog.showModal();
  $('#roomCancel', dialog).onclick = () => dialog.close();

  $('#roomForm', dialog).onsubmit = async event => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') || '').trim();
    const beds = Number(form.get('beds'));
    const count = Number(form.get('count'));
    const priceText = String(form.get('price') || '').trim();
    const price = priceText === '' ? null : Number(priceText);

    if (!title || !Number.isInteger(beds) || beds < 0 ||
        !Number.isInteger(count) || count < 0 ||
        (price !== null && (!Number.isFinite(price) || price < 0))) {
      alert('Please enter a valid room name, bed capacity, room count and price.');
      return;
    }

    const roomData = {
      title,
      beds,
      count,
      price,
      description: String(form.get('description') || '').trim(),
      status: form.get('status') === 'true'
    };

    const submitButton = $('button[type="submit"]', event.currentTarget);
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';

    const result = room
      ? await db.from('rooms').update(roomData).eq('id', room.id)
      : await db.from('rooms').insert(roomData);

    if (result.error) {
      alert('Unable to save room: ' + result.error.message);
      submitButton.disabled = false;
      submitButton.textContent = 'Save Room';
      return;
    }

    dialog.close();
    await renderRooms();
    await stats();
  };
}

/* Enquiries remain localStorage-based until the booking integration phase. */
function renderEnq() {
  const rows = store.get('enquiries', []);
  const element = $('#v-enq .tbl');

  element.innerHTML = rows.length ? `<table>
    <thead><tr><th>Date</th><th>Guest</th><th>Stay</th><th>Room</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows.map(row => `
      <tr>
        <td>${esc(row.date)}</td>
        <td>${esc(row.name)}<br><small>${esc(row.phone)}</small></td>
        <td>${esc(row.checkin)} → ${esc(row.checkout)}<br><small>${esc(row.adults)}A ${esc(row.children)}C</small></td>
        <td>${esc(row.room)} ×${esc(row.rooms)}</td>
        <td><select data-enquiry-status="${esc(row.id)}">
          ${['New', 'Contacted', 'Closed'].map(status =>
            `<option value="${status}" ${row.status === status ? 'selected' : ''}>${status}</option>`
          ).join('')}
        </select></td>
        <td><button class="sm del" data-enquiry-delete="${esc(row.id)}">Delete</button></td>
      </tr>`).join('')}
    </tbody>
  </table>` : '<p class="empty">No enquiries are stored in this browser yet. Supabase enquiry integration will be added in a later phase.</p>';

  element.onchange = event => {
    const id = event.target.dataset.enquiryStatus;
    if (!id) return;
    const row = rows.find(item => item.id === id);
    if (row) {
      row.status = event.target.value;
      store.set('enquiries', rows);
      stats();
    }
  };

  element.onclick = event => {
    const id = event.target.dataset.enquiryDelete;
    if (id && confirm('Delete this enquiry from this browser?')) {
      store.set('enquiries', rows.filter(row => row.id !== id));
      renderEnq();
      stats();
    }
  };
}

/* Contact details remain localStorage-based until the settings integration phase. */
function renderContact() {
  const contact = localData('contact');
  const form = $('#contactForm');

  form.innerHTML = Object.keys(contact).map(key => `
    <label>${esc(key)}</label>
    <input name="${esc(key)}" value="${esc(contact[key])}">
  `).join('') + '<div class="row"><button class="btn btn-sea">Save contact info</button></div>';

  form.onsubmit = event => {
    event.preventDefault();
    const updated = {};
    new FormData(form).forEach((value, key) => updated[key] = String(value).trim());

    if (store.set('contact', updated)) {
      alert('Contact information saved in this browser. Supabase settings integration will be added later.');
    }
  };
}

async function stats() {
  const element = $('#stats');
  if (!element) return;

  const { data: rooms, error } = await db
    .from('rooms')
    .select('price');

  if (error) {
    console.error('Could not load room statistics:', error.message);
    element.innerHTML = '<div class="stat"><b>—</b>Room data unavailable</div>';
    return;
  }

  const enquiries = store.get('enquiries', []);
  const blog = localData('blog');
  const places = localData('places');
  const pricedRooms = rooms.filter(room => room.price !== null && room.price !== '').length;

  const values = [
    ['Room categories', rooms.length],
    ['Rooms priced', `${pricedRooms}/${rooms.length}`],
    ['New enquiries', enquiries.filter(item => item.status === 'New').length],
    ['Blog posts', blog.length],
    ['Attractions', places.length],
    ['Total enquiries', enquiries.length]
  ];

  element.innerHTML = values.map(([label, value]) =>
    `<div class="stat"><b>${esc(value)}</b>${esc(label)}</div>`
  ).join('');
}

/* Navigation */
function show(view) {
  document.querySelectorAll('.view').forEach(section => {
    section.classList.toggle('on', section.id === 'v-' + view);
  });

  document.querySelectorAll('.side [data-v]').forEach(button => {
    button.classList.toggle('on', button.dataset.v === view);
  });

  $('.side').classList.remove('open');
  window.scrollTo(0, 0);

  if (view === 'rooms') renderRooms();
  if (view === 'enq') renderEnq();
}

/* Initialize after auth.js has authorized the administrator. */
document.querySelectorAll('.side [data-v]').forEach(button => {
  button.addEventListener('click', () => show(button.dataset.v));
});

$('#menuBtn')?.addEventListener('click', () => $('.side').classList.toggle('open'));

document.querySelectorAll('[data-add]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.add;
    if (key === 'rooms') openRoomForm();
    else if (CFG[key]) openLocalForm(key);
  });
});

$('#reset')?.addEventListener('click', () => {
  if (confirm('Erase only the demo data stored in this browser? Supabase room records will NOT be deleted.')) {
    Object.keys(localStorage)
      .filter(key => key.startsWith('saagram_'))
      .forEach(key => localStorage.removeItem(key));
    location.reload();
  }
});

renderLocalCrud('blog');
renderLocalCrud('places');
renderEnq();
renderContact();
renderRooms();
stats();
