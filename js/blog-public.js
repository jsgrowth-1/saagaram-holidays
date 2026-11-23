/* Public Saagaram blog: reads only published records from Supabase. */
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  // Article body is entered by the authenticated Saagaram admin.
  // Strip executable elements and event-handler attributes before rendering HTML.
  function safeArticleHtml(markup) {
    const doc = new DOMParser().parseFromString(String(markup || ''), 'text/html');
    doc.querySelectorAll('script,style,iframe,object,embed,form').forEach(el => el.remove());
    doc.body.querySelectorAll('*').forEach(el => {
      [...el.attributes].forEach(attr => {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();
        if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) {
          el.removeAttribute(attr.name);
        }
      });
    });
    return doc.body.innerHTML;
  }

  function imageMarkup(url, title) {
    if (!url) return '';
    return `<img class="post-hero-image" src="${esc(url)}" alt="${esc(title)}" loading="eager">`;
  }

  async function getDb() {
    if (typeof db === 'undefined') throw new Error('Supabase client was not initialized. Check js/supabase.js.');
    return db;
  }

  async function renderListing() {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;
    try {
      const client = await getDb();
     const { data, error } = await client
    .from('blog_posts')
    .select('id,title,slug,description,body,photo,status,category,created_at')
    .eq('status', 'Published')
    .order('created_at', { ascending: false });
      if (error) throw error;

      if (!data?.length) {
        grid.innerHTML = '<p class="blog-empty">No published articles yet. Please check back soon.</p>';
        return;
      }

      grid.innerHTML = data.map(post => `
        <article class="card reveal dynamic-blog-card">
          <div class="img" role="img" aria-label="${esc(post.title)}"
            style="${post.photo ? `background-image:url('${esc(post.photo).replace(/'/g, '%27')}')` : 'background-image:linear-gradient(135deg,#1fa391,#0b3c5d)'}"></div>
          <div class="body">
            ${post.category ? `<span class="blog-category">${esc(post.category)}</span>` : ''}
            <h2 style="font-size:1.15rem">${esc(post.title)}</h2>
            <p>${esc(post.description || '')}</p>
            ${post.published_at ? `<p class="blog-date">${new Date(post.published_at).toLocaleDateString('en-IN')}</p>` : ''}
            <a class="btn btn-sea" href="blog-post.html?slug=${encodeURIComponent(post.slug)}">Read More</a>
          </div>
        </article>`).join('');
    } catch (error) {
      console.error('Public blog listing error:', error);
      grid.innerHTML = `<p class="blog-error">We couldn't load the articles right now. Please refresh the page later.</p>`;
    }
  }

  async function renderArticle() {
    const article = document.getElementById('blogArticle');
    if (!article) return;
    const slug = new URLSearchParams(location.search).get('slug');
    if (!slug) {
      article.innerHTML = '<p class="post-error">This article link is missing its URL slug. Please return to the <a href="blog.html">blog page</a>.</p>';
      return;
    }

    try {
      const client = await getDb();
      const { data: post, error } = await client.from('blog_posts')
     .select('id,title,slug,description,body,photo,status,category,created_at')
        .eq('slug', slug)
        .eq('status', 'Published')
        .maybeSingle();
      if (error) throw error;
      if (!post) {
        article.innerHTML = '<p class="post-error">This article was not found or is not published. <a href="blog.html">Browse all articles</a>.</p>';
        document.getElementById('postTitle').textContent = 'Article not found';
        return;
      }

      const title = post.meta_title || post.title;
      const description = post.meta_description || post.description || '';
      document.title = `${title} | Saagaram Holidays Home`;
      const descTag = document.querySelector('meta[name="description"]');
      if (descTag) descTag.content = description;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.content = title;
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.content = description;
      if (post.photo) {
        let ogImage = document.querySelector('meta[property="og:image"]');
        if (!ogImage) {
          ogImage = document.createElement('meta');
          ogImage.setAttribute('property', 'og:image');
          document.head.appendChild(ogImage);
        }
        ogImage.content = post.photo;
      }

      document.getElementById('postTitle').textContent = post.title;
      document.getElementById('crumbTitle').textContent = post.title;
      article.innerHTML = `
        ${imageMarkup(post.photo, post.title)}
        <h2 class="sec-title" style="margin-top:24px">${esc(post.title)}</h2>
       <div class="post-meta">${post.category ? esc(post.category) : ''}</div>
        ${post.description ? `<p class="post-intro">${esc(post.description)}</p>` : ''}
        <div class="post-content">${safeArticleHtml(post.body)}</div>
        <div class="actions" style="margin-top:28px">
          <a class="btn btn-sea" href="booking.html">Book Your Stay</a>
          <a class="btn btn-gold" href="blog.html">Back to Blog</a>
        </div>`;
    } catch (error) {
      console.error('Public blog article error:', error);
     article.innerHTML = "<p class=\"post-error\">We could not load this article right now. Please refresh the page later.</p>";
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderListing();
    renderArticle();
  });
})();
