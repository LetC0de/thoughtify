/* ═══════════════════════════════════════════════════════
   FreeSpeak — Post Detail Page
   ═══════════════════════════════════════════════════════ */

class PostPage {
  constructor() {
    const base = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
      ? 'http://127.0.0.1:8000'
      : 'https://thoughtify-lmgv.onrender.com';
    this.apiThought = `${base}/thought`;
    this.tokenKey = 'thoughtify_token';
    this.userKey = 'thoughtify_user';

    this.thought = null;
    this.currentUser = null;

    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.boot());
    } else {
      this.boot();
    }
  }

  boot() {
    this.cacheDOMElements();
    this.bindEvents();
    this.loadThought();
  }

  cacheDOMElements() {
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.backBtn = document.getElementById('backBtn');
    this.postArticle = document.getElementById('postArticle');
    this.postSkeleton = document.getElementById('postSkeleton');
    this.postError = document.getElementById('postError');
    this.postMore = document.getElementById('postMore');

    this.postTitle = document.getElementById('postTitle');
    this.postContent = document.getElementById('postContent');
    this.postAuthorAvatar = document.getElementById('postAuthorAvatar');
    this.postAuthorName = document.getElementById('postAuthorName');
    this.postAuthorUsername = document.getElementById('postAuthorUsername');
    this.postDate = document.getElementById('postDate');
    this.postReadingTime = document.getElementById('postReadingTime');
    this.postTags = document.getElementById('postTags');
    this.postOwnerActions = document.getElementById('postOwnerActions');

    // Action buttons
    this.postEditBtn = document.getElementById('postEditBtn');
    this.postDeleteBtn = document.getElementById('postDeleteBtn');
    this.postLikeBtn = document.getElementById('postLikeBtn');
    this.postLikeCount = document.getElementById('postLikeCount');
    this.postCommentBtn = document.getElementById('postCommentBtn');
    this.postCommentCount = document.getElementById('postCommentCount');
    this.postShareBtn = document.getElementById('postShareBtn');

    // Toast
    this.toastContainer = document.getElementById('toastContainer');
  }

  bindEvents() {
    this.backBtn.addEventListener('click', () => {
      if (document.referrer && document.referrer.startsWith(window.location.origin)) {
        history.back();
      } else {
        window.location.href = '/';
      }
    });

    this.postEditBtn?.addEventListener('click', () => this.handleEdit());
    this.postDeleteBtn?.addEventListener('click', () => this.handleDelete());
    this.postLikeBtn?.addEventListener('click', () => this.handleLike());
    this.postShareBtn?.addEventListener('click', () => this.handleShare());
  }

  getToken() { return localStorage.getItem(this.tokenKey); }

  getUser() {
    try { return JSON.parse(localStorage.getItem(this.userKey)); }
    catch { return null; }
  }

  /* ─── Load Thought ─── */

  async loadThought() {
    const params = new URLSearchParams(window.location.search);
    const thoughtId = params.get('id');

    if (!thoughtId) {
      this.showError();
      return;
    }

    this.currentUser = this.getUser();

    try {
      const res = await fetch(`${this.apiThought}/${thoughtId}`);
      if (!res.ok) throw new Error('Not found');
      this.thought = await res.json();
      this.render();
    } catch {
      this.showError();
    } finally {
      this.postSkeleton.style.display = 'none';
      this.loadingOverlay?.classList.add('hidden');
    }
  }

  /* ─── Render ─── */

  render() {
    const t = this.thought;
    document.title = `${this.escapeHtml(t.title)} — FreeSpeak`;

    // Avatar
    const initial = (t.author_name || '?').charAt(0).toUpperCase();
    this.postAuthorAvatar.textContent = initial;

    // Author name + username
    this.postAuthorName.textContent = t.author_name || t.author_username || 'Unknown';
    this.postAuthorUsername.textContent = `@${t.author_username || 'unknown'}`;

    // Date
    const dateStr = t.created_at
      ? new Date(t.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        })
      : 'Just now';
    this.postDate.textContent = dateStr;

    // Reading time
    const wordsPerMin = 200;
    const wordCount = (t.content || '').split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.ceil(wordCount / wordsPerMin));
    this.postReadingTime.textContent = `${mins} min read`;

    // Title & body
    this.postTitle.textContent = t.title;
    this.postContent.textContent = t.content;

    // Owner actions
    const isOwn = this.currentUser && t.user_id === this.currentUser.id;
    this.postOwnerActions.style.display = isOwn ? 'flex' : 'none';

    // Show the article
    this.postArticle.style.display = 'block';
    this.postMore.style.display = 'block';
  }

  /* ─── Actions ─── */

  handleEdit() {
    this.showToast('Edit coming soon', 'success');
  }

  async handleDelete() {
    const token = this.getToken();
    if (!token || !this.thought) return;
    if (!confirm(`Delete "${this.thought.title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${this.apiThought}/delete/${this.thought.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      this.showToast('Thought deleted.', 'success');
      setTimeout(() => { window.location.href = '/'; }, 800);
    } catch (err) {
      this.showToast(err.message || 'Failed to delete.', 'error');
    }
  }

  handleLike() {
    this.showToast('Likes coming soon!', 'success');
  }

  handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: this.thought.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.showToast('Link copied!', 'success');
      });
    }
  }

  /* ─── States ─── */

  showError() {
    this.postSkeleton.style.display = 'none';
    this.postError.style.display = 'block';
    this.loadingOverlay?.classList.add('hidden');
  }

  /* ─── Toast ─── */

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconMap = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
    };
    toast.innerHTML = `<span class="toast-icon">${iconMap[type] || ''}</span><span>${message}</span>`;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-removing');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /* ─── Utilities ─── */

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

new PostPage();
