/* SAAGRAM HOLIDAYS ADMIN
   Rooms: Supabase
   Blog, Attractions and Contact: localStorage.
   Enquiries and Rooms: Supabase.
   Room photos are maintained in GitHub; this admin does not upload images.
*/

const store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem('saagram_' + key);
      return value ? JSON.parse(value) : fallback;
    } catch { return fallback; }
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

const CFG = {
  places: {
    label: 'Attraction', cols: ['photo', 'title', 'distance'],
    fields: [
      ['title', 'Name'], ['desc', 'Description', 'textarea'],
      ['distance', 'Distance from Saagram (verify before publishing)'],
      ['maps', 'Google Maps link'], ['photo', 'Photograph', 'image']
    ]
  }
};

function renderLocalCrud(key) {
  const config = CFG[key];
  const rows = localData(key);
  const element = $('#v-' + key + ' .tbl');
  const cell = (row, field) => field === 'photo'
    ? (row.photo ? `<img src="${esc(row.photo)}" alt="">` : '–')
    : esc(row[field] || '–');

  element.innerHTML = rows.length ? `<table>
    <thead><tr>${config.cols.map(field => `<th>${esc(field)}</th>`).join('')}<th>Actions</th></tr></thead>
    <tbody>${rows.map(row => `<tr>
      ${config.cols.map(field => `<td>${cell(row, field)}</td>`).join('')}
      <td><button class="sm" data-local-edit="${esc(row.id)}">Edit</button>
      <button class="sm del" data-local-delete="${esc(row.id)}">Delete</button></td>
    </tr>`).join('')}</tbody></table>` : '<p class="empty">Nothing here yet.</p>';

  element.onclick = event => {
    const editId = event.target.dataset.localEdit;
    const deleteId = event.target.dataset.localDelete;
    if (editId) openLocalForm(key, rows.find(row => row.id === editId));
    if (deleteId && confirm('Delete this item?')) {
      store.set(key, rows.filter(row => row.id !== deleteId));
      renderLocalCrud(key); stats();
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
      ${type === 'textarea' ? `<textarea name="${name}">${esc(item?.[name] || '')}</textarea>`
        : type === 'image' ? `<input type="file" accept="image/*" id="localPhoto">
          <img id="localPreview" src="${esc(photo)}" alt=""
          style="max-width:160px;margin-top:8px;${photo ? '' : 'display:none'}">`
        : `<input name="${name}" type="${type || 'text'}" value="${esc(item?.[name] || '')}">`}
    `).join('')}
    <div class="row"><button type="button" class="btn" id="localCancel">Cancel</button>
    <button type="submit" class="btn btn-sea">Save</button></div>
  </form>`;

  dialog.showModal();
  $('#localCancel', dialog).onclick = () => dialog.close();
  const photoInput = $('#localPhoto', dialog);
  if (photoInput) photoInput.onchange = async () => {
    if (!photoInput.files[0]) return;
    try {
      photo = await readPhoto(photoInput.files[0]);
      const preview = $('#localPreview', dialog);
      preview.src = photo; preview.style.display = 'block';
    } catch (error) { alert(error.message); }
  };

  $('form', dialog).onsubmit = event => {
    event.preventDefault();
    const record = { ...(item || { id: uid() }) };
    config.fields.forEach(([name, , type]) => {
      if (type !== 'image') record[name] = $(`[name="${name}"]`, dialog).value.trim();
    });
    if (config.fields.some(field => field[0] === 'photo')) record.photo = photo;
    const list = localData(key);
    const index = list.findIndex(row => row.id === record.id);
    if (index >= 0) list[index] = record; else list.push(record);
    if (store.set(key, list)) {
      dialog.close(); renderLocalCrud(key); stats();
    }
  };
}


/* BLOG POSTS: Supabase database + Supabase Storage. */
let blogRows = [];
const BLOG_BUCKET = 'blog-images';
const BLOG_CATEGORIES = ['Travel', 'Tourism', 'Destinations', 'Hotel Guide', 'Travel Tips', 'Local Attractions'];

function makeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function blogDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN');
}

async function renderBlog() {
  const section = $('#v-blog');
  const tablePanel = $('#v-blog .tbl');
  if (!section || !tablePanel) return;

  tablePanel.innerHTML = '<p class="empty">Loading blog posts from Supabase...</p>';

  const { data, error } = await db.from('blog_posts')
    .select('id,title,slug,description,body,photo,status,category,author,meta_title,meta_description,created_at,updated_at,published_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Blog load error:', error);
    tablePanel.innerHTML = `<p class="empty">Could not load blog posts: ${esc(error.message)}. Check the blog_posts table columns and its RLS policies.</p>`;
    return;
  }

  blogRows = data || [];
  const published = blogRows.filter(post => post.status === 'published').length;
  const drafts = blogRows.length - published;
  const categories = new Set(blogRows.map(post => post.category).filter(Boolean)).size;

  let tools = $('#blogTools');
  if (!tools) {
    tools = document.createElement('div');
    tools.id = 'blogTools';
    tools.className = 'blog-tools';
    tablePanel.before(tools);
  }

  tools.innerHTML = `
    <div class="blog-metrics">
      <div class="blog-metric"><span>Total posts</span><strong>${blogRows.length}</strong></div>
      <div class="blog-metric"><span>Published</span><strong>${published}</strong></div>
      <div class="blog-metric"><span>Drafts</span><strong>${drafts}</strong></div>
      <div class="blog-metric"><span>Categories</span><strong>${categories}</strong></div>
    </div>
    <div class="blog-filters">
      <input type="search" id="blogSearch" placeholder="Search blog title..." aria-label="Search blog posts">
      <select id="blogCategoryFilter" aria-label="Filter by category">
        <option value="">All categories</option>
        ${[...new Set([...BLOG_CATEGORIES, ...blogRows.map(p => p.category).filter(Boolean)])].map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
      </select>
      <select id="blogStatusFilter" aria-label="Filter by status">
        <option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option>
      </select>
    </div>`;

  function drawRows() {
    const term = ($('#blogSearch')?.value || '').trim().toLowerCase();
    const category = $('#blogCategoryFilter')?.value || '';
    const status = $('#blogStatusFilter')?.value || '';
    const filtered = blogRows.filter(post =>
      (!term || `${post.title || ''} ${post.description || ''}`.toLowerCase().includes(term)) &&
      (!category || post.category === category) &&
      (!status || post.status === status)
    );

    tablePanel.innerHTML = filtered.length ? `<table class="blog-table">
      <thead><tr><th>Image</th><th>Title</th><th>Category</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
      <tbody>${filtered.map(post => `<tr>
        <td>${post.photo ? `<img class="blog-thumb" src="${esc(post.photo)}" alt="">` : '<span class="blog-no-image">No image</span>'}</td>
        <td><strong>${esc(post.title)}</strong><small class="blog-slug">/${esc(post.slug || '')}</small></td>
        <td>${esc(post.category || 'Uncategorized')}</td>
        <td><span class="blog-status ${post.status === 'published' ? 'is-published' : 'is-draft'}">${post.status === 'published' ? 'Published' : 'Draft'}</span></td>
        <td>${blogDate(post.updated_at || post.created_at)}</td>
        <td class="blog-actions"><button class="sm" data-blog-edit="${esc(post.id)}">Edit</button>
        <button class="sm del" data-blog-delete="${esc(post.id)}">Delete</button></td>
      </tr>`).join('')}</tbody></table>` : '<p class="empty">No matching blog posts found.</p>';
  }

  tools.querySelectorAll('input,select').forEach(control => {
    control.addEventListener('input', drawRows);
    control.addEventListener('change', drawRows);
  });
  drawRows();

  tablePanel.onclick = event => {
    const editId = event.target.closest('[data-blog-edit]')?.dataset.blogEdit;
    const deleteId = event.target.closest('[data-blog-delete]')?.dataset.blogDelete;
    if (editId) openBlogForm(blogRows.find(post => String(post.id) === String(editId)));
    if (deleteId) deleteBlogPost(deleteId);
  };
}

async function deleteBlogPost(id) {
  const post = blogRows.find(item => String(item.id) === String(id));
  if (!post || !confirm(`Delete "${post.title}" permanently?`)) return;

  const { error } = await db.from('blog_posts').delete().eq('id', id);
  if (error) {
    alert('Could not delete blog post: ' + error.message);
    return;
  }
  await renderBlog();
  await stats();
}

function openBlogForm(post = null) {
  const dialog = $('#dlg');
  const currentPhoto = post?.photo || '';
  const initialStatus = post?.status === 'published' ? 'published' : 'draft';

  dialog.classList.add('blog-dialog');
  dialog.innerHTML = `
    <form id="blogForm" class="blog-form">
      <div class="blog-form-heading">
        <div><h3>${post ? 'Edit Blog Post' : 'Create Blog Post'}</h3><p>Write, optimize and publish your Saagaram article.</p></div>
        <button type="button" class="blog-close" id="blogCancel" aria-label="Close">×</button>
      </div>
      <div class="blog-form-grid">
        <div class="blog-main-fields">
          <label for="blogTitle">Blog title *</label>
          <input id="blogTitle" name="title" maxlength="180" required value="${esc(post?.title || '')}" placeholder="Enter an engaging blog title">

          <label for="blogSlug">URL slug *</label>
          <input id="blogSlug" name="slug" maxlength="120" required value="${esc(post?.slug || '')}" placeholder="example-blog-title">
          <small class="field-help">Used in the public blog URL. Use lowercase letters, numbers and hyphens.</small>

          <label for="blogDescription">Short description</label>
          <textarea id="blogDescription" name="description" maxlength="320" rows="3" placeholder="Write a short introduction...">${esc(post?.description || '')}</textarea>

          <label for="blogBody">Article content *</label>
          <textarea id="blogBody" name="body" class="blog-editor" rows="16">${esc(post?.body || '')}</textarea>
          <small class="field-help">Use the editor toolbar for headings, lists, links and formatting.</small>
        </div>

        <aside class="blog-side-fields">
          <div class="blog-side-card">
            <h4>Publish settings</h4>
            <label for="blogStatus">Status</label>
            <select id="blogStatus" name="status">
              <option value="draft" ${initialStatus === 'draft' ? 'selected' : ''}>Save as draft</option>
              <option value="published" ${initialStatus === 'published' ? 'selected' : ''}>Published</option>
            </select>
            <label for="blogCategory">Category</label>
            <select id="blogCategory" name="category">
              ${[...new Set([...BLOG_CATEGORIES, ...(post?.category ? [post.category] : [])])].map(c => `<option value="${esc(c)}" ${post?.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
            </select>
            <label for="blogAuthor">Author</label>
            <input id="blogAuthor" name="author" value="${esc(post?.author || 'Saagaram Holidays')}">
          </div>

          <div class="blog-side-card">
            <h4>Featured image</h4>
            <input id="blogPhoto" type="file" accept="image/jpeg,image/png,image/webp">
            <img id="blogPhotoPreview" class="blog-photo-preview" src="${esc(currentPhoto)}" alt="Featured image preview" style="${currentPhoto ? '' : 'display:none'}">
            <small class="field-help">JPG, PNG or WebP. Maximum 1 MB.</small>
          </div>

          <div class="blog-side-card">
            <h4>SEO settings</h4>
            <label for="blogMetaTitle">Meta title</label>
            <input id="blogMetaTitle" name="meta_title" maxlength="70" value="${esc(post?.meta_title || '')}" placeholder="SEO page title">
            <label for="blogMetaDescription">Meta description</label>
            <textarea id="blogMetaDescription" name="meta_description" maxlength="170" rows="4" placeholder="Search result description...">${esc(post?.meta_description || '')}</textarea>
          </div>
        </aside>
      </div>
      <div class="blog-form-footer">
        <span id="blogSaveMessage" role="status"></span>
        <button type="button" class="btn" id="blogCancelBottom">Cancel</button>
        <button type="submit" class="btn btn-sea" id="blogSaveDraft">Save Draft</button>
        <button type="button" class="btn btn-publish" id="blogPublish">Publish</button>
      </div>
    </form>`;

  const closeDialog = () => {
    dialog.close();
    dialog.classList.remove('blog-dialog');
  };
  $('#blogCancel', dialog).onclick = closeDialog;
  $('#blogCancelBottom', dialog).onclick = closeDialog;

  const titleInput = $('#blogTitle', dialog);
  const slugInput = $('#blogSlug', dialog);
  let slugTouched = Boolean(post?.slug);
  slugInput.addEventListener('input', () => { slugTouched = true; });
  titleInput.addEventListener('input', () => {
    if (!slugTouched) slugInput.value = makeSlug(titleInput.value);
  });

  const photoInput = $('#blogPhoto', dialog);
  let uploadedPhotoUrl = currentPhoto;
  photoInput.addEventListener('change', () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) {
      alert('Image must be 1 MB or smaller.');
      photoInput.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please choose a JPG, PNG or WebP image.');
      photoInput.value = '';
      return;
    }
    const preview = $('#blogPhotoPreview', dialog);
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
  });

  // Article content uses a simple textarea; no third-party editor or API key is required.\n
  async function saveBlog(status) {
    const form = $('#blogForm', dialog);
    const title = titleInput.value.trim();
    const slug = makeSlug(slugInput.value || title);
    const description = $('#blogDescription', dialog).value.trim();
    const body = $('#blogBody', dialog).value.trim();

    if (!title || !slug || !body.trim()) {
      alert('Please enter a title, URL slug and article content.');
      return;
    }

    const saveButtons = form.querySelectorAll('button');
    saveButtons.forEach(button => button.disabled = true);
    $('#blogSaveMessage', dialog).textContent = 'Saving...';

    try {
      const imageFile = photoInput.files?.[0];
      if (imageFile) {
        const safeName = imageFile.name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-');
        const filePath = `${Date.now()}-${uid()}-${safeName}`;
        const { error: uploadError } = await db.storage.from(BLOG_BUCKET)
          .upload(filePath, imageFile, { upsert: false, contentType: imageFile.type });
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
        const { data: publicData } = db.storage.from(BLOG_BUCKET).getPublicUrl(filePath);
        uploadedPhotoUrl = publicData.publicUrl;
      }

      const now = new Date().toISOString();
      const payload = {
        title,
        slug,
        description,
        body,
        photo: uploadedPhotoUrl,
        status,
        category: $('#blogCategory', dialog).value,
        author: $('#blogAuthor', dialog).value.trim() || 'Saagaram Holidays',
        meta_title: $('#blogMetaTitle', dialog).value.trim() || title,
        meta_description: $('#blogMetaDescription', dialog).value.trim() || description,
        updated_at: now,
        published_at: status === 'published' ? (post?.published_at || now) : null
      };

      // Check slug uniqueness before insert/update to provide a readable error.
      let slugCheck = db.from('blog_posts').select('id').eq('slug', slug);
      if (post?.id) slugCheck = slugCheck.neq('id', post.id);
      const { data: slugMatches, error: slugError } = await slugCheck.limit(1);
      if (slugError) throw new Error(`Could not validate URL slug: ${slugError.message}`);
      if (slugMatches?.length) throw new Error('This URL slug is already in use. Please choose another.');

      const result = post?.id
        ? await db.from('blog_posts').update(payload).eq('id', post.id)
        : await db.from('blog_posts').insert(payload);

      if (result.error) throw new Error(result.error.message);

      closeDialog();
      await renderBlog();
      await stats();
    } catch (error) {
      console.error('Blog save error:', error);
      $('#blogSaveMessage', dialog).textContent = '';
      alert(`Could not save blog post: ${error.message}`);
      saveButtons.forEach(button => button.disabled = false);
    }
  }

  $('#blogForm', dialog).onsubmit = event => {
    event.preventDefault();
    saveBlog('draft');
  };
  $('#blogPublish', dialog).onclick = () => saveBlog('published');
  $('#blogSaveDraft', dialog).textContent = 'Save Draft';

  dialog.showModal();
}


/* ROOMS: Supabase records; photographs remain in GitHub. */
async function renderRooms() {
  const element = $('#v-rooms .tbl');
  element.innerHTML = '<p class="empty">Loading rooms from Supabase...</p>';
  const { data: rooms, error } = await db.from('rooms')
    .select('id,title,beds,count,price,description,status,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    element.innerHTML = `<p class="empty">Could not load rooms: ${esc(error.message)}</p>`;
    return;
  }
  if (!rooms.length) {
    element.innerHTML = '<p class="empty">No rooms in the database yet. Select “Add Room” to create your first room.</p>';
  } else {
    element.innerHTML = `<table><thead><tr>
      <th>Room</th><th>Bed capacity</th><th>Available</th><th>Price / night</th><th>Status</th><th>Actions</th>
      </tr></thead><tbody>${rooms.map(room => `<tr>
      <td>${esc(room.title)}</td><td>${esc(room.beds)}</td><td>${esc(room.count)}</td>
      <td>${room.price === null ? 'Not set' : '₹' + esc(room.price)}</td>
      <td>${room.status ? 'Active' : 'Inactive'}</td>
      <td><button class="sm" data-room-edit="${esc(room.id)}">Edit</button>
      <button class="sm del" data-room-delete="${esc(room.id)}">Delete</button></td>
      </tr>`).join('')}</tbody></table>`;
  }

  element.onclick = async event => {
    const editId = event.target.dataset.roomEdit;
    const deleteId = event.target.dataset.roomDelete;
    if (editId) openRoomForm(rooms.find(room => room.id === editId));
    if (deleteId && confirm('Permanently delete this room from the database?')) {
      const { error: deleteError } = await db.from('rooms').delete().eq('id', deleteId);
      if (deleteError) { alert('Could not delete room: ' + deleteError.message); return; }
      await renderRooms(); await stats();
    }
  };
}

function openRoomForm(room = null) {
  const dialog = $('#dlg');
  dialog.innerHTML = `<form id="roomForm">
    <h3>${room ? 'Edit Room' : 'Add Room'}</h3>
    <label>Room Name</label><input name="title" maxlength="150" required value="${esc(room?.title || '')}">
    <label>Bed Capacity</label><input name="beds" type="number" min="0" step="1" required value="${room?.beds ?? 1}">
    <label>Available Rooms</label><input name="count" type="number" min="0" step="1" required value="${room?.count ?? 1}">
    <label>Price Per Night (₹)</label><input name="price" type="number" min="0" step="0.01" value="${room?.price ?? ''}" placeholder="Leave blank if not decided">
    <label>Description</label><textarea name="description">${esc(room?.description || '')}</textarea>
    <label>Status</label><select name="status">
      <option value="true" ${room?.status !== false ? 'selected' : ''}>Active</option>
      <option value="false" ${room?.status === false ? 'selected' : ''}>Inactive</option>
    </select>
    <p class="sec-sub">Room photographs are managed in the GitHub repository, not here.</p>
    <div class="row"><button type="button" class="btn" id="roomCancel">Cancel</button>
    <button type="submit" class="btn btn-sea">Save Room</button></div>
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

    if (!title || !Number.isInteger(beds) || beds < 0 || !Number.isInteger(count) ||
        count < 0 || (price !== null && (!Number.isFinite(price) || price < 0))) {
      alert('Please enter a valid room name, bed capacity, room count and price.'); return;
    }
    const roomData = {
      title, beds, count, price,
      description: String(form.get('description') || '').trim(),
      status: form.get('status') === 'true'
    };
    const submitButton = $('button[type="submit"]', event.currentTarget);
    submitButton.disabled = true; submitButton.textContent = 'Saving...';
    const result = room ? await db.from('rooms').update(roomData).eq('id', room.id)
      : await db.from('rooms').insert(roomData);
    if (result.error) {
      alert('Unable to save room: ' + result.error.message);
      submitButton.disabled = false; submitButton.textContent = 'Save Room'; return;
    }
    dialog.close(); await renderRooms(); await stats();
  };
}

/* ENQUIRIES: read and manage the real Supabase enquiries table. */
let enquiryRows = [];

function displayDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? esc(value) : date.toLocaleString('en-IN');
}

async function renderEnq() {
  const element = $('#v-enq .tbl');
  if (!element) return;
  element.innerHTML = '<p class="empty">Loading enquiries from Supabase...</p>';

  const { data: rows, error } = await db.from('enquiries')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Enquiries load error:', error);
    element.innerHTML = `<p class="empty">Could not load enquiries: ${esc(error.message)}. Check admin SELECT policy and table columns.</p>`;
    return;
  }

  enquiryRows = rows || [];
  if (!enquiryRows.length) {
    element.innerHTML = '<p class="empty">No booking enquiries found in Supabase.</p>';
    return;
  }

  element.innerHTML = `<table>
    <thead><tr><th>Received</th><th>Guest</th><th>Stay</th><th>Room</th><th>Special requests</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>${enquiryRows.map(row => `<tr>
      <td>${displayDate(row.date || row.created_at)}</td>
      <td>${esc(row.name)}<br><small>${esc(row.phone)}<br>${esc(row.email)}</small></td>
      <td>${esc(row.checkin)} → ${esc(row.checkout)}<br><small>${esc(row.adults)} Adults, ${esc(row.children)} Children</small></td>
      <td>${esc(row.room)} × ${esc(row.rooms)}</td>
      <td>${esc(row.notes || '—')}</td>
      <td><select data-enquiry-status="${esc(row.id)}">
        ${['New', 'Contacted', 'Closed'].map(status =>
          `<option value="${status}" ${(row.status || 'New') === status ? 'selected' : ''}>${status}</option>`
        ).join('')}
      </select></td>
      <td><button class="sm del" data-enquiry-delete="${esc(row.id)}">Delete</button></td>
    </tr>`).join('')}</tbody></table>`;

  element.onchange = async event => {
    const id = event.target.dataset.enquiryStatus;
    if (!id) return;
    const { error: updateError } = await db.from('enquiries')
      .update({ status: event.target.value }).eq('id', id);
    if (updateError) {
      alert('Could not update enquiry status: ' + updateError.message);
      await renderEnq(); return;
    }
    const row = enquiryRows.find(item => item.id === id);
    if (row) row.status = event.target.value;
    await stats();
  };

  element.onclick = async event => {
    const id = event.target.dataset.enquiryDelete;
    if (!id || !confirm('Permanently delete this enquiry from Supabase?')) return;
    const { error: deleteError } = await db.from('enquiries').delete().eq('id', id);
    if (deleteError) { alert('Could not delete enquiry: ' + deleteError.message); return; }
    await renderEnq(); await stats();
  };
}

function renderContact() {
  const contact = localData('contact');
  const form = $('#contactForm');
  form.innerHTML = Object.keys(contact).map(key => `
    <label>${esc(key)}</label><input name="${esc(key)}" value="${esc(contact[key])}">
  `).join('') + '<div class="row"><button class="btn btn-sea">Save contact info</button></div>';

  form.onsubmit = event => {
    event.preventDefault();
    const updated = {};
    new FormData(form).forEach((value, key) => updated[key] = String(value).trim());
    if (store.set('contact', updated)) alert('Contact information saved in this browser.');
  };
}

async function stats() {
  const element = $('#stats');
  if (!element) return;

  const [roomResult, enquiryResult, blogResult] = await Promise.all([
    db.from('rooms').select('price'),
    db.from('enquiries').select('id,status', { count: 'exact' }),
    db.from('blog_posts').select('id', { count: 'exact', head: true })
  ]);

  if (roomResult.error) {
    console.error('Could not load room statistics:', roomResult.error.message);
  }
  if (enquiryResult.error) {
    console.error('Could not load enquiry statistics:', enquiryResult.error.message);
  }

  const rooms = roomResult.data || [];
  const enquiries = enquiryResult.data || [];
  const places = localData('places');
  const pricedRooms = rooms.filter(room => room.price !== null && room.price !== '').length;

  const values = [
    ['Room categories', roomResult.error ? '—' : rooms.length],
    ['Rooms priced', roomResult.error ? '—' : `${pricedRooms}/${rooms.length}`],
    ['New enquiries', enquiryResult.error ? '—' : enquiries.filter(item => (item.status || 'New') === 'New').length],
    ['Blog posts', blogResult.error ? '—' : (blogResult.count ?? 0)],
    ['Attractions', places.length],
    ['Total enquiries', enquiryResult.error ? '—' : (enquiryResult.count ?? enquiries.length)]
  ];

  element.innerHTML = values.map(([label, value]) =>
    `<div class="stat"><b>${esc(value)}</b>${esc(label)}</div>`
  ).join('');
}

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
  if (view === 'blog') renderBlog();
}

document.querySelectorAll('.side [data-v]').forEach(button => {
  button.addEventListener('click', () => show(button.dataset.v));
});
$('#menuBtn')?.addEventListener('click', () => $('.side').classList.toggle('open'));

document.querySelectorAll('[data-add]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.add;
    if (key === 'rooms') openRoomForm();
    else if (key === 'blog') openBlogForm();
    else if (CFG[key]) openLocalForm(key);
  });
});

$('#reset')?.addEventListener('click', () => {
  if (confirm('Erase only local demo data for attractions and contact information? Supabase rooms, enquiries and blog posts will NOT be deleted.')) {
    Object.keys(localStorage).filter(key => key.startsWith('saagram_'))
      .forEach(key => localStorage.removeItem(key));
    location.reload();
  }
});

renderBlog();
renderLocalCrud('places');
renderContact();
renderRooms();
renderEnq();
stats();
