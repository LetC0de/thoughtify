/* ═══════════════════════════════════════════════════════
   THOUGHTIFY — A Sanctuary for Ideas
   Application Logic — Global Feed Edition
   ═══════════════════════════════════════════════════════ */

class Thoughtify {
  constructor() {
    // ─── Config ───
    this.apiBaseUser = 'http://127.0.0.1:8000/user';
    this.apiBaseThought = 'http://127.0.0.1:8000/thought';
    this.tokenKey = 'thoughtify_token';
    this.userKey = 'thoughtify_user';

    this.feed = [];             // global feed
    this.myThoughts = [];       // user's own
    this.activeTab = 'global';  // 'global' | 'mine'
    this.editingId = null;
    this.isSubmitting = false;
    this.currentUser = null;
    this.isFetching = false;

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
    this.checkAuth();
  }

  /* ─── DOM Caching ─── */

  cacheDOMElements() {
    // Views
    this.authView = document.getElementById('authView');
    this.appView = document.getElementById('appView');
    this.loadingOverlay = document.getElementById('loadingOverlay');

    // Auth
    this.tabLogin = document.getElementById('tabLogin');
    this.tabRegister = document.getElementById('tabRegister');
    this.loginForm = document.getElementById('loginForm');
    this.registerForm = document.getElementById('registerForm');
    this.loginError = document.getElementById('loginError');
    this.registerError = document.getElementById('registerError');
    this.loginBtn = document.getElementById('loginBtn');
    this.registerBtn = document.getElementById('registerBtn');
    this.loginSpinner = document.getElementById('loginSpinner');
    this.registerSpinner = document.getElementById('registerSpinner');
    this.loginBtnText = document.getElementById('loginBtnText');
    this.registerBtnText = document.getElementById('registerBtnText');

    this.loginUsername = document.getElementById('loginUsername');
    this.loginPassword = document.getElementById('loginPassword');
    this.regName = document.getElementById('regName');
    this.regUsername = document.getElementById('regUsername');
    this.regEmail = document.getElementById('regEmail');
    this.regPassword = document.getElementById('regPassword');

    // App header
    this.headerGreeting = document.getElementById('headerGreeting');
    this.userAvatar = document.getElementById('userAvatar');
    this.logoutBtn = document.getElementById('logoutBtn');

    // Stats
    this.statCount = document.getElementById('statCount');
    this.statMineCount = document.getElementById('statMineCount');
    this.totalCount = document.getElementById('totalCount');

    // Form
    this.form = document.getElementById('thoughtForm');
    this.titleInput = document.getElementById('thoughtTitle');
    this.contentInput = document.getElementById('thoughtContent');
    this.submitBtn = document.getElementById('submitBtn');
    this.submitBtnText = document.getElementById('submitBtnText');
    this.submitSpinner = document.getElementById('submitSpinner');
    this.cancelEditBtn = document.getElementById('cancelEditBtn');
    this.formWrap = document.getElementById('formWrap');
    this.collapseFormBtn = document.getElementById('collapseFormBtn');
    this.collapseIcon = document.getElementById('collapseIcon');
    this.formTitle = document.getElementById('formTitle');

    // Feed
    this.feedTabs = document.querySelectorAll('.feed-tab');
    this.tabFeedGlobal = document.getElementById('tabFeedGlobal');
    this.tabFeedMine = document.getElementById('tabFeedMine');
    this.feedTitle = document.getElementById('feedTitle');

    // Grid & states
    this.grid = document.getElementById('thoughtsGrid');
    this.emptyState = document.getElementById('emptyState');
    this.emptyStateTitle = document.getElementById('emptyStateTitle');
    this.emptyStateText = document.getElementById('emptyStateText');
    this.errorState = document.getElementById('errorState');
    this.skeleton = document.getElementById('skeletonGrid');
    this.emptyStateBtn = document.getElementById('emptyStateBtn');
    this.retryBtn = document.getElementById('retryBtn');

    // Modal
    this.modal = document.getElementById('modalOverlay');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalBody = document.getElementById('modalBody');
    this.modalConfirm = document.getElementById('modalConfirm');
    this.modalCancel = document.getElementById('modalCancel');
    this.modalAction = null;

    // Toast
    this.toastContainer = document.getElementById('toastContainer');
  }

  /* ─── Event Binding ─── */

  bindEvents() {
    // Auth tabs
    this.tabLogin.addEventListener('click', () => this.switchAuthTab('login'));
    this.tabRegister.addEventListener('click', () => this.switchAuthTab('register'));

    document.querySelectorAll('[data-switch]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchAuthTab(e.currentTarget.dataset.switch);
      });
    });

    // Auth forms
    this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));

    // Thought form
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.cancelEditBtn.addEventListener('click', () => this.cancelEdit());

    this.contentInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.form.dispatchEvent(new Event('submit'));
      }
    });

    this.collapseFormBtn.addEventListener('click', () => this.toggleFormCollapse());

    // Feed tabs
    this.tabFeedGlobal.addEventListener('click', () => this.switchFeedTab('global'));
    this.tabFeedMine.addEventListener('click', () => this.switchFeedTab('mine'));

    // Modal
    this.modalCancel.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });

    // Logout
    this.logoutBtn.addEventListener('click', () => this.logout());

    // Empty state & retry
    this.emptyStateBtn.addEventListener('click', () => {
      this.formWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.titleInput.focus();
    });
    this.retryBtn.addEventListener('click', () => this.loadActiveTab());
  }

  /* ═══════════════════════════════════════════════════════
     AUTHENTICATION
     ═══════════════════════════════════════════════════════ */

  checkAuth() {
    const token = this.getToken();
    if (!token) {
      this.showAuthView();
      return;
    }
    this.verifyToken(token);
  }

  async verifyToken(token) {
    try {
      const res = await fetch(`${this.apiBaseUser}/is_auth`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Token invalid');
      const user = await res.json();
      this.currentUser = user;
      this.saveUser(user);
      this.showAppView();
    } catch {
      this.clearAuth();
      this.showAuthView();
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const username = this.loginUsername.value.trim();
    const password = this.loginPassword.value;

    if (!username || !password) {
      this.showAuthError('login', 'Please fill in all fields.');
      return;
    }

    this.setAuthLoading('login', true);
    this.loginError.textContent = '';

    try {
      const res = await fetch(`${this.apiBaseUser}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      this.saveToken(data.token);
      await this.verifyToken(data.token);
      this.showToast('Welcome back! ✨', 'success');
    } catch (err) {
      this.showAuthError('login', err.message || 'Login failed. Check your credentials.');
    } finally {
      this.setAuthLoading('login', false);
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const name = this.regName.value.trim();
    const username = this.regUsername.value.trim();
    const email = this.regEmail.value.trim();
    const password = this.regPassword.value;

    if (!name || !username || !email || !password) {
      this.showAuthError('register', 'Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      this.showAuthError('register', 'Password must be at least 6 characters.');
      return;
    }

    this.setAuthLoading('register', true);
    this.registerError.textContent = '';

    try {
      const res = await fetch(`${this.apiBaseUser}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      this.showToast('Account created! Welcome to Thoughtify 🎉', 'success');

      this.switchAuthTab('login');
      this.loginUsername.value = username;
      this.loginPassword.value = '';
      this.loginPassword.focus();
    } catch (err) {
      this.showAuthError('register', err.message || 'Registration failed.');
    } finally {
      this.setAuthLoading('register', false);
    }
  }

  logout() {
    this.clearAuth();
    this.showAuthView();
    this.showToast('Signed out. Until next time ✦', 'success');
  }

  /* ─── Auth Helpers ─── */

  getToken() { return localStorage.getItem(this.tokenKey); }
  saveToken(token) { localStorage.setItem(this.tokenKey, token); }
  saveUser(user) { localStorage.setItem(this.userKey, JSON.stringify(user)); }

  getUser() {
    try { return JSON.parse(localStorage.getItem(this.userKey)); }
    catch { return null; }
  }

  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser = null;
  }

  /* ─── View Switching ─── */

  showAuthView() {
    this.authView.style.display = 'flex';
    this.appView.style.display = 'none';
    this.loadingOverlay.classList.add('hidden');
    document.body.style.overflow = 'auto';
    this.loginForm.reset();
    this.registerForm.reset();
    this.loginError.textContent = '';
    this.registerError.textContent = '';
  }

  showAppView() {
    const user = this.currentUser || this.getUser();
    if (!user) { this.showAuthView(); return; }

    this.authView.style.display = 'none';
    this.appView.style.display = 'block';

    const initial = (user.name || user.username || '?').charAt(0).toUpperCase();
    this.userAvatar.textContent = initial;
    this.headerGreeting.textContent = `Hello, ${user.name || user.username}`;

    this.loadingOverlay.classList.add('hidden');

    this.loadActiveTab();
  }

  /* ─── Tab Switching ─── */

  switchAuthTab(tab) {
    [this.tabLogin, this.tabRegister].forEach(t => t.classList.remove('active'));
    [this.loginForm, this.registerForm].forEach(f => f.classList.remove('active'));
    this.loginError.textContent = '';
    this.registerError.textContent = '';

    if (tab === 'login') {
      this.tabLogin.classList.add('active');
      this.loginForm.classList.add('active');
      this.tabLogin.setAttribute('aria-selected', 'true');
      this.tabRegister.setAttribute('aria-selected', 'false');
    } else {
      this.tabRegister.classList.add('active');
      this.registerForm.classList.add('active');
      this.tabRegister.setAttribute('aria-selected', 'true');
      this.tabLogin.setAttribute('aria-selected', 'false');
    }
  }

  /* ═══════════════════════════════════════════════════════
     FEED TAB SWITCHING
     ═══════════════════════════════════════════════════════ */

  switchFeedTab(tab) {
    if (tab === this.activeTab) return;
    this.activeTab = tab;

    // Update tab UI
    this.feedTabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });

    if (tab === 'global') {
      this.tabFeedGlobal.classList.add('active');
      this.tabFeedGlobal.setAttribute('aria-selected', 'true');
      this.feedTitle.innerHTML = 'Global <span>Feed</span>';
      this.renderThoughts(this.feed);
    } else {
      this.tabFeedMine.classList.add('active');
      this.tabFeedMine.setAttribute('aria-selected', 'true');
      this.feedTitle.innerHTML = 'My <span>Thoughts</span>';
      this.renderThoughts(this.myThoughts);
    }
  }

  loadActiveTab() {
    if (this.activeTab === 'global') {
      this.fetchFeed();
    } else {
      this.fetchMyThoughts();
    }
  }

  /* ═══════════════════════════════════════════════════════
     Auth UI Helpers
     ═══════════════════════════════════════════════════════ */

  setAuthLoading(form, loading) {
    if (form === 'login') {
      this.loginBtn.disabled = loading;
      this.loginSpinner.style.display = loading ? 'inline-block' : 'none';
      this.loginBtnText.textContent = loading ? 'Signing in...' : 'Sign In';
    } else {
      this.registerBtn.disabled = loading;
      this.registerSpinner.style.display = loading ? 'inline-block' : 'none';
      this.registerBtnText.textContent = loading ? 'Creating account...' : 'Create Account';
    }
  }

  showAuthError(form, message) {
    if (form === 'login') this.loginError.textContent = message;
    else this.registerError.textContent = message;
  }

  /* ═══════════════════════════════════════════════════════
     THOUGHT CRUD
     ═══════════════════════════════════════════════════════ */

  async fetchFeed() {
    if (this.isFetching) return;
    this.isFetching = true;
    this.showSkeleton(true);
    this.hideEmptyState();
    this.hideErrorState();

    const token = this.getToken();
    if (!token) return;

    try {
      const res = await fetch(`${this.apiBaseThought}/feed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) { this.clearAuth(); this.showAuthView(); return; }
        throw new Error('Failed to fetch feed');
      }
      this.feed = await res.json();
      if (this.activeTab === 'global') this.renderThoughts(this.feed);
      this.updateStats();
    } catch (err) {
      if (this.activeTab === 'global') this.showErrorState();
      this.showToast(err.message || 'Failed to load feed.', 'error');
    } finally {
      this.showSkeleton(false);
      this.isFetching = false;
    }
  }

  async fetchMyThoughts() {
    if (this.isFetching) return;
    this.isFetching = true;
    this.showSkeleton(true);
    this.hideEmptyState();
    this.hideErrorState();

    const token = this.getToken();
    if (!token) return;

    try {
      const res = await fetch(`${this.apiBaseThought}/mine`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) { this.clearAuth(); this.showAuthView(); return; }
        throw new Error('Failed to fetch your thoughts');
      }
      this.myThoughts = await res.json();
      if (this.activeTab === 'mine') this.renderThoughts(this.myThoughts);
      this.updateStats();
    } catch (err) {
      if (this.activeTab === 'mine') this.showErrorState();
      this.showToast(err.message || 'Failed to load your thoughts.', 'error');
    } finally {
      this.showSkeleton(false);
      this.isFetching = false;
    }
  }

  async createThought(title, content) {
    const token = this.getToken();
    const res = await fetch(`${this.apiBaseThought}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to create thought');
    }
    return res.json();
  }

  async updateThought(id, title, content) {
    const token = this.getToken();
    const res = await fetch(`${this.apiBaseThought}/update/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to update thought');
    }
    return res.json();
  }

  async deleteThought(id) {
    const token = this.getToken();
    const res = await fetch(`${this.apiBaseThought}/delete/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to delete thought');
    }
    return res.json();
  }

  /* ─── Form Handlers ─── */

  async handleSubmit(e) {
    e.preventDefault();

    const title = this.titleInput.value.trim();
    const content = this.contentInput.value.trim();

    if (!title || !content) {
      this.showToast('Please fill in both title and content.', 'error');
      return;
    }

    if (this.isSubmitting) return;
    this.setSubmitting(true);

    try {
      if (this.editingId) {
        await this.updateThought(this.editingId, title, content);
        this.showToast('Thought updated and polished ✨', 'success');
      } else {
        await this.createThought(title, content);
        this.showToast('New thought captured! 🎉', 'success');
      }

      this.form.reset();
      this.cancelEdit();
      // Refresh both views
      await Promise.all([this.fetchFeed(), this.fetchMyThoughts()]);
      // Switch to "My Thoughts" after creating
      if (!this.editingId) this.switchFeedTab('mine');
    } catch (err) {
      this.showToast(
        err.message || (this.editingId
          ? 'Failed to update thought. Try again.'
          : 'Failed to share thought. Try again.'),
        'error'
      );
    } finally {
      this.setSubmitting(false);
    }
  }

  setSubmitting(submitting) {
    this.isSubmitting = submitting;
    this.submitBtn.disabled = submitting;
    this.submitBtnText.textContent = submitting
      ? (this.editingId ? 'Updating...' : 'Sharing...')
      : (this.editingId ? 'Update Thought' : 'Share Thought');
    this.submitSpinner.style.display = submitting ? 'inline-block' : 'none';
  }

  /* ─── Edit Mode ─── */

  enterEditMode(thought) {
    this.editingId = thought.id;
    this.titleInput.value = thought.title;
    this.contentInput.value = thought.content;
    this.submitBtnText.textContent = 'Update Thought';
    this.cancelEditBtn.style.display = 'inline-flex';
    this.formTitle.innerHTML = 'Edit <span>Thought</span>';

    this.formWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    this.titleInput.focus();

    this.formWrap.classList.remove('collapsed');
    this.collapseFormBtn.classList.remove('collapsed');
  }

  cancelEdit() {
    this.editingId = null;
    this.form.reset();
    this.submitBtnText.textContent = 'Share Thought';
    this.cancelEditBtn.style.display = 'none';
    this.formTitle.innerHTML = 'Capture a <span>Thought</span>';
  }

  /* ─── Form Collapse ─── */

  toggleFormCollapse() {
    this.formWrap.classList.toggle('collapsed');
    this.collapseFormBtn.classList.toggle('collapsed');
  }

  /* ─── Render ─── */

  renderThoughts(thoughts) {
    this.hideEmptyState();
    this.hideErrorState();
    this.hideSkeleton();

    if (!thoughts || thoughts.length === 0) {
      this.showEmptyState();
      this.grid.innerHTML = '';
      return;
    }

    this.grid.innerHTML = '';
    thoughts.forEach((thought, index) => {
      const card = this.createCard(thought, index);
      this.grid.appendChild(card);
    });

    requestAnimationFrame(() => {
      const cards = this.grid.querySelectorAll('.thought-card');
      cards.forEach((card, i) => {
        setTimeout(() => { card.classList.add('visible'); }, i * 60);
      });
    });
  }

  createCard(thought, index) {
    const article = document.createElement('article');
    article.className = 'thought-card';
    article.style.transitionDelay = `${index * 60}ms`;

    const isOwn = this.currentUser && thought.user_id === this.currentUser.id;

    const dateStr = thought.created_at
      ? new Date(thought.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'just now';

    article.innerHTML = `
      <!-- Author -->
      <div class="thought-card-author">
        <div class="author-avatar">${(thought.author_name || '?').charAt(0).toUpperCase()}</div>
        <div class="author-info">
          <span class="author-name">${this.escapeHtml(thought.author_name || thought.author_username || 'Unknown')}</span>
          <span class="author-username">${this.escapeHtml(thought.author_username || 'unknown')}</span>
        </div>
      </div>

      <!-- Header -->
      <div class="thought-card-header">
        <span class="thought-card-bullet"></span>
        <h3 class="thought-card-title">${this.escapeHtml(thought.title)}</h3>
      </div>

      <!-- Content -->
      <div class="thought-card-content">${this.escapeHtml(thought.content)}</div>

      <!-- Footer -->
      <div class="thought-card-footer">
        <span class="thought-card-date">${dateStr}</span>
        <div class="thought-card-footer-right">
          <span class="thought-card-author-tag" style="${isOwn ? '' : 'display: none;'}" data-own-tag>you</span>
          <div class="thought-card-actions" style="${isOwn ? '' : 'display: none;'}" data-own-actions>
            <button class="btn btn-ghost btn-icon edit-btn" title="Edit" aria-label="Edit thought">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-ghost btn-icon delete-btn" title="Delete" aria-label="Delete thought">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    // Edit
    const editBtn = article.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.enterEditMode(thought);
      });
    }

    // Delete
    const deleteBtn = article.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.confirmDelete(thought);
      });
    }

    return article;
  }

  /* ─── Delete Confirmation Modal ─── */

  confirmDelete(thought) {
    this.modalTitle.textContent = 'Delete Thought';
    this.modalBody.innerHTML = `
      <p style="margin-bottom: 0.5rem;">
        Are you sure you want to delete <strong>"${this.escapeHtml(thought.title)}"</strong>?
      </p>
      <p style="color: var(--text-muted); font-size: 0.85rem;">
        This action cannot be undone.
      </p>
    `;
    this.modalConfirm.textContent = 'Delete';
    this.modalConfirm.className = 'btn btn-danger';
    this.modalAction = async () => {
      try {
        await this.deleteThought(thought.id);
        this.showToast('Thought deleted.', 'success');
        await Promise.all([this.fetchFeed(), this.fetchMyThoughts()]);
        if (this.activeTab === 'global') this.switchFeedTab('global');
      } catch (err) {
        this.showToast(err.message || 'Failed to delete thought.', 'error');
      }
    };

    this.openModal();
  }

  /* ─── Modal Control ─── */

  openModal() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const handleConfirm = async () => {
      this.modalConfirm.removeEventListener('click', handleConfirm);
      this.closeModal();
      if (this.modalAction) await this.modalAction();
      this.modalAction = null;
    };

    this.modalConfirm.addEventListener('click', handleConfirm);
  }

  closeModal() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ─── Stats ─── */

  updateStats() {
    const feedCount = this.feed.length;
    const mineCount = this.myThoughts.length;
    this.statCount.textContent = feedCount;
    this.statMineCount.textContent = mineCount;
    this.totalCount.textContent = this.activeTab === 'global'
      ? `${feedCount} thought${feedCount !== 1 ? 's' : ''}`
      : `${mineCount} thought${mineCount !== 1 ? 's' : ''}`;
  }

  /* ─── Empty State ─── */

  showEmptyState() {
    this.emptyState.style.display = 'block';
    this.grid.innerHTML = '';
    this.hideSkeleton();

    if (this.activeTab === 'global') {
      this.emptyStateTitle.textContent = 'The Feed is Quiet';
      this.emptyStateText.textContent = 'No thoughts have been shared yet. Be the first to spark a conversation!';
    } else {
      this.emptyStateTitle.textContent = 'No Thoughts Yet';
      this.emptyStateText.textContent = 'Your mind is a quiet garden. Plant your first thought above.';
    }
  }

  hideEmptyState() { this.emptyState.style.display = 'none'; }

  /* ─── Error State ─── */

  showErrorState() {
    this.errorState.style.display = 'block';
    this.grid.innerHTML = '';
    this.hideSkeleton();
    this.hideEmptyState();
  }

  hideErrorState() { this.errorState.style.display = 'none'; }

  /* ─── Skeleton ─── */

  showSkeleton(show) { this.skeleton.style.display = show ? 'grid' : 'none'; }
  hideSkeleton() { this.skeleton.style.display = 'none'; }

  /* ─── Toast System ─── */

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
    };

    toast.innerHTML = `
      <span class="toast-icon">${iconMap[type] || ''}</span>
      <span>${message}</span>
    `;

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

/* ─── Boot ─── */
new Thoughtify();