/* ═══════════════════════════════════════════════════════
   FreeSpeak — Post Detail Page with Comments
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
    this.comments = [];
    this.replyingTo = null; // { id, name }

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

    // Comments
    this.postCommentsSection = document.getElementById('postCommentsSection');
    this.postCommentsList = document.getElementById('postCommentsList');
    this.postCommentsEmpty = document.getElementById('postCommentsEmpty');
    this.postCommentsCount = document.getElementById('postCommentsCount');
    this.postCommentInput = document.getElementById('postCommentInput');
    this.postCommentSubmit = document.getElementById('postCommentSubmit');
    this.commentFormAvatar = document.getElementById('commentFormAvatar');
    this.postReplyingTo = document.getElementById('postReplyingTo');
    this.postReplyTargetName = document.getElementById('postReplyTargetName');
    this.postCancelReply = document.getElementById('postCancelReply');

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
    this.postCommentBtn?.addEventListener('click', () => {
      this.postCommentInput.focus();
    });

    // Comment form
    this.postCommentSubmit.addEventListener('click', () => this.handleCommentSubmit());
    this.postCommentInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.handleCommentSubmit();
      }
    });
    this.postCancelReply.addEventListener('click', () => this.cancelReply());
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
      this.loadComments();
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

    this.postAuthorName.textContent = t.author_name || t.author_username || 'Unknown';
    this.postAuthorUsername.textContent = `@${t.author_username || 'unknown'}`;

    const dateStr = t.created_at
      ? new Date(t.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        })
      : 'Just now';
    this.postDate.textContent = dateStr;

    const wordsPerMin = 200;
    const wordCount = (t.content || '').split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.ceil(wordCount / wordsPerMin));
    this.postReadingTime.textContent = `${mins} min read`;

    this.postTitle.textContent = t.title;
    this.postContent.textContent = t.content;

    const liked = t.liked_by_me || false;
    const likesCount = t.likes_count || 0;
    this.postLikeCount.textContent = likesCount;
    this.postLikeBtn.dataset.liked = liked;
    this.postLikeBtn.classList.toggle('liked', liked);

    const isOwn = this.currentUser && t.user_id === this.currentUser.id;
    this.postOwnerActions.style.display = isOwn ? 'flex' : 'none';

    // Comment form avatar
    if (this.currentUser) {
      this.commentFormAvatar.textContent = (this.currentUser.name || this.currentUser.username || '?').charAt(0).toUpperCase();
    } else {
      this.commentFormAvatar.textContent = '?';
    }

    this.postArticle.style.display = 'block';
    this.postMore.style.display = 'block';
  }

  /* ═══ COMMENTS ═══ */

  async loadComments() {
    if (!this.thought) return;
    try {
      const res = await fetch(`${this.apiThought}/${this.thought.id}/comments`);
      if (!res.ok) throw new Error('Failed');
      this.comments = await res.json();
      this.renderComments();
    } catch {
      // Silently fail — comments are supplemental
    }
  }

  renderComments() {
    const list = this.postCommentsList;
    // Clear all but the empty state placeholder
    list.innerHTML = '';
    this.postCommentsCount.textContent = this.countAllComments(this.comments);

    if (this.comments.length === 0) {
      list.appendChild(this.postCommentsEmpty);
      this.postCommentsEmpty.style.display = 'block';
      return;
    }

    this.postCommentsEmpty.style.display = 'none';
    this.comments.forEach(comment => {
      const el = this.createCommentElement(comment, 0);
      list.appendChild(el);
    });
  }

  countAllComments(comments) {
    let count = comments.length;
    for (const c of comments) {
      if (c.replies && c.replies.length) {
        count += this.countAllComments(c.replies);
      }
    }
    return count;
  }

  createCommentElement(comment, depth) {
    const container = document.createElement('div');

    const el = document.createElement('div');
    el.className = 'comment';

    const isOwn = this.currentUser && comment.user_id === this.currentUser.id;
    const initial = (comment.author_name || '?').charAt(0).toUpperCase();
    const timeStr = comment.created_at
      ? new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';

    el.innerHTML = `
      <div class="comment-avatar">${initial}</div>
      <div class="comment-body">
        <div class="comment-author-row">
          <span class="comment-author-name">${this.escapeHtml(comment.author_name || comment.author_username || 'Unknown')}</span>
          <span class="comment-author-username">@${this.escapeHtml(comment.author_username || 'unknown')}</span>
          ${timeStr ? `<span class="comment-time">${timeStr}</span>` : ''}
        </div>
        <div class="comment-content ${comment.is_deleted ? 'deleted' : ''}">${comment.is_deleted ? '[This comment has been deleted]' : this.escapeHtml(comment.content)}</div>
        <div class="comment-footer">
          ${!comment.is_deleted ? `<button class="comment-reply-btn">Reply</button>` : ''}
          ${isOwn && !comment.is_deleted ? `<button class="comment-delete-btn" title="Delete">Delete</button>` : ''}
        </div>
      </div>
    `;

    // Reply button
    const replyBtn = el.querySelector('.comment-reply-btn');
    if (replyBtn) {
      replyBtn.addEventListener('click', () => {
        this.setReplyingTo(comment);
      });
    }

    // Delete button
    const deleteBtn = el.querySelector('.comment-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete this comment?')) return;
        try {
          const token = this.getToken();
          const res = await fetch(`${this.apiThought}/comments/${comment.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed');
          this.showToast('Comment deleted.', 'success');
          this.loadComments();
        } catch {
          this.showToast('Failed to delete comment.', 'error');
        }
      });
    }

    container.appendChild(el);

    // Replies
    if (comment.replies && comment.replies.length > 0) {
      const repliesContainer = document.createElement('div');
      repliesContainer.className = 'comment-replies';
      comment.replies.forEach(reply => {
        const replyEl = this.createCommentElement(reply, depth + 1);
        repliesContainer.appendChild(replyEl);
      });
      container.appendChild(repliesContainer);
    }

    return container;
  }

  /* ─── Comment Form ─── */

  setReplyingTo(comment) {
    this.replyingTo = comment;
    this.postReplyingTo.style.display = 'inline';
    this.postReplyTargetName.textContent = comment.author_name || comment.author_username || 'user';
    this.postCommentInput.focus();
  }

  cancelReply() {
    this.replyingTo = null;
    this.postReplyingTo.style.display = 'none';
    this.postCommentInput.value = '';
  }

  async handleCommentSubmit() {
    const token = this.getToken();
    if (!token) {
      this.showToast('Sign in to comment!', 'error');
      return;
    }

    const content = this.postCommentInput.value.trim();
    if (!content) {
      this.showToast('Please write something.', 'error');
      return;
    }

    this.postCommentSubmit.disabled = true;

    try {
      const body = { content };
      if (this.replyingTo) {
        body.parent_comment_id = this.replyingTo.id;
      }

      const res = await fetch(`${this.apiThought}/${this.thought.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('Failed');

      this.postCommentInput.value = '';
      this.cancelReply();
      this.showToast(this.replyingTo ? 'Reply posted! 💬' : 'Comment posted! 💬', 'success');
      this.loadComments();
    } catch {
      this.showToast('Failed to post comment.', 'error');
    } finally {
      this.postCommentSubmit.disabled = false;
    }
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

  async handleLike() {
    const token = this.getToken();
    if (!token) return this.showToast('Sign in to like!', 'error');

    const btn = this.postLikeBtn;
    const isLiked = btn.dataset.liked === 'true';
    const newLiked = !isLiked;
    const currentCount = parseInt(this.postLikeCount.textContent || '0', 10);

    btn.dataset.liked = newLiked;
    btn.classList.toggle('liked', newLiked);
    this.postLikeCount.textContent = newLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    try {
      const res = await fetch(`${this.apiThought}/${this.thought.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      this.postLikeCount.textContent = data.likes;
      if (data.liked !== newLiked) {
        btn.dataset.liked = data.liked;
        btn.classList.toggle('liked', data.liked);
      }
    } catch {
      btn.dataset.liked = isLiked;
      btn.classList.toggle('liked', isLiked);
      this.postLikeCount.textContent = currentCount;
      this.showToast('Failed to update like.', 'error');
    }
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
