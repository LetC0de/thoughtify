/* ═══════════════════════════════════════════════════════
   THOUGHTIFY — A Sanctuary for Ideas
   Application Logic — Landing-First Architecture
   ═══════════════════════════════════════════════════════ */

class Thoughtify {
  constructor() {
    // Use environment-aware base URL — production or local dev
    const base = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
      ? 'http://127.0.0.1:8000'
      : 'https://thoughtify-lmgv.onrender.com';
    this.apiBaseUser = `${base}/user`;
    this.apiBaseThought = `${base}/thought`;
    this.tokenKey = 'thoughtify_token';
    this.userKey = 'thoughtify_user';

    // Data
    this.publicThoughts = [];
    this.myThoughts = [];
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
    try {
      this.cacheDOMElements();
      this.bindEvents();
      this.checkAuth();

      // Load public feed immediately on landing
      this.fetchPublicFeed();
    } catch (e) {
      console.error('Boot error:', e);
      // Still hide loading so page isn't stuck forever
      this.loadingOverlay?.classList.add('hidden');
    }
  }

  /* ─── DOM Caching ─── */

  cacheDOMElements() {
    // Views
    this.landingView = document.getElementById('landingView');
    this.appView = document.getElementById('appView');
    this.loadingOverlay = document.getElementById('loadingOverlay');

    // Landing nav
    this.landingLoginBtn = document.getElementById('landingLoginBtn');
    this.landingSignupBtn = document.getElementById('landingSignupBtn');
    this.landingUserSignedin = document.getElementById('landingUserSignedin');
    this.landingUserAvatar = document.getElementById('landingUserAvatar');
    this.landingDashboardBtn = document.getElementById('landingDashboardBtn');

    // Hero
    this.heroStartBtn = document.getElementById('heroStartBtn');
    this.heroExploreBtn = document.getElementById('heroExploreBtn');

    // Public feed
    this.publicFeedGrid = document.getElementById('publicFeedGrid');
    this.publicSkeleton = document.getElementById('publicSkeleton');
    this.publicEmpty = document.getElementById('publicEmpty');
    this.publicError = document.getElementById('publicError');
    // this.publicFeedCount removed — not shown on landing
    this.publicEmptyBtn = document.getElementById('publicEmptyBtn');
    this.publicRetryBtn = document.getElementById('publicRetryBtn');

    // Auth overlay
    this.authOverlay = document.getElementById('authOverlay');
    this.authCloseBtn = document.getElementById('authCloseBtn');
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

    // Dashboard header
    this.headerGreeting = document.getElementById('headerGreeting');
    this.userAvatar = document.getElementById('userAvatar');
    this.logoutBtn = document.getElementById('logoutBtn');
    this.backToLandingBtn = document.getElementById('backToLandingBtn');
    this.dashboardTitle = document.getElementById('dashboardTitle');

    // Stats
    this.statCount = document.getElementById('statCount');
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
    this.formTitle = document.getElementById('formTitle');

    // Dashboard grid & states
    this.grid = document.getElementById('thoughtsGrid');
    this.dashSkeleton = document.getElementById('dashSkeleton');
    this.dashEmpty = document.getElementById('dashEmpty');
    this.dashEmptyTitle = document.getElementById('dashEmptyTitle');
    this.dashError = document.getElementById('dashError');
    this.dashEmptyBtn = document.getElementById('dashEmptyBtn');
    this.dashRetryBtn = document.getElementById('dashRetryBtn');

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
    // Landing nav buttons → open auth
    this.landingLoginBtn.addEventListener('click', () => this.openAuth('login'));
    this.landingSignupBtn.addEventListener('click', () => this.openAuth('register'));
    this.heroStartBtn.addEventListener('click', () => this.openAuth('register'));

    // Hero explore → scroll to public feed
    this.heroExploreBtn.addEventListener('click', () => {
      document.getElementById('publicFeedSection').scrollIntoView({ behavior: 'smooth' });
    });

    // Public feed actions
    this.publicEmptyBtn.addEventListener('click', () => this.openAuth('register'));
    this.publicRetryBtn.addEventListener('click', () => this.fetchPublicFeed());

    // Auth overlay
    this.authCloseBtn.addEventListener('click', () => this.closeAuth());
    this.authOverlay.addEventListener('click', (e) => {
      if (e.target === this.authOverlay) this.closeAuth();
    });

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

    // Dashboard nav
    this.logoutBtn.addEventListener('click', () => this.logout());
    this.backToLandingBtn.addEventListener('click', () => this.showLanding());
    this.landingDashboardBtn.addEventListener('click', () => this.showDashboard());

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

    // Modal
    this.modalCancel.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { this.closeModal(); this.closeAuth(); }
    });

    // Dashboard state buttons
    this.dashEmptyBtn.addEventListener('click', () => {
      this.formWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.titleInput.focus();
    });
    this.dashRetryBtn.addEventListener('click', () => this.fetchMyThoughts());
  }

  /* ═══════════════════════════════════════════════════════
     VIEW MANAGEMENT
     ═══════════════════════════════════════════════════════ */

  showLanding() {
    this.appView.style.display = 'none';
    this.landingView.style.display = 'block';
    document.body.style.overflow = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showDashboard() {
    this.landingView.style.display = 'none';
    this.appView.style.display = 'block';
    document.body.style.overflow = '';

    const user = this.currentUser || this.getUser();
    if (!user) { this.showLanding(); return; }

    // Update dashboard
    const initial = (user.name || user.username || '?').charAt(0).toUpperCase();
    this.userAvatar.textContent = initial;
    this.headerGreeting.textContent = `Hello, ${user.name || user.username}`;
    this.dashboardTitle.innerHTML = `Welcome back, <span>${user.name || user.username}</span>`;

    // Update landing nav
    this.landingUserAvatar.textContent = initial;

    // Load my thoughts
    this.fetchMyThoughts();
  }

  /* ─── Auth Overlay ─── */

  openAuth(tab = 'login') {
    this.authOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    this.switchAuthTab(tab);

    // Clear errors
    this.loginError.textContent = '';
    this.registerError.textContent = '';
    this.loginForm.reset();
    this.registerForm.reset();

    // Focus first field
    setTimeout(() => {
      if (tab === 'login') this.loginUsername.focus();
      else this.regName.focus();
    }, 300);
  }

  closeAuth() {
    this.authOverlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  /* ═══════════════════════════════════════════════════════
     AUTHENTICATION
     ═══════════════════════════════════════════════════════ */

  checkAuth() {
    const token = this.getToken();
    if (!token) {
      // No token — hide loading and show landing immediately
      this.loadingOverlay.classList.add('hidden');
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
      this.updateLandingNav(user);
      this.loadingOverlay.classList.add('hidden');
    } catch {
      this.clearAuth();
      this.loadingOverlay.classList.add('hidden');
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
      if (!res.ok) throw new Error(data.detail || 'Login failed');

      this.saveToken(data.token);
      await this.verifyToken(data.token);
      this.closeAuth();
      this.showDashboard();
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
      if (!res.ok) throw new Error(data.detail || 'Registration failed');

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
    this.showLanding();
    this.updateLandingNav(null);
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

  updateLandingNav(user) {
    if (user) {
      document.getElementById('landingNavActions').querySelectorAll('.btn-secondary, .btn-primary').forEach(b => b.style.display = 'none');
      this.landingUserSignedin.style.display = 'flex';
      this.landingUserAvatar.textContent = (user.name || user.username || '?').charAt(0).toUpperCase();
    } else {
      document.getElementById('landingNavActions').querySelectorAll('.btn-secondary, .btn-primary').forEach(b => b.style.display = '');
      this.landingUserSignedin.style.display = 'none';
    }
  }

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
     PUBLIC FEED
     ═══════════════════════════════════════════════════════ */

  async fetchPublicFeed() {
    this.publicSkeleton.style.display = 'grid';
    this.publicEmpty.style.display = 'none';
    this.publicError.style.display = 'none';

    try {
      const res = await fetch(`${this.apiBaseThought}/public`);
      if (!res.ok) throw new Error('Failed to load feed');
      this.publicThoughts = await res.json();
      this.renderPublicFeed();
    } catch {
      this.publicError.style.display = 'block';
      this.publicFeedGrid.innerHTML = '';
    } finally {
      this.publicSkeleton.style.display = 'none';
    }
  }

  renderPublicFeed() {
    this.publicSkeleton.style.display = 'none';
    this.publicError.style.display = 'none';

    if (!this.publicThoughts.length) {
      this.publicEmpty.style.display = 'block';
      this.publicFeedGrid.innerHTML = '';
      return;
    }

    this.publicEmpty.style.display = 'none';

    this.publicFeedGrid.innerHTML = '';
    this.publicThoughts.forEach((thought, i) => {
      const card = this.createPublicCard(thought, i);
      this.publicFeedGrid.appendChild(card);
    });

    requestAnimationFrame(() => {
      const cards = this.publicFeedGrid.querySelectorAll('.thought-card');
      cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), i * 60);
      });
    });
  }

  createPublicCard(thought, index) {
    const article = document.createElement('article');
    article.className = 'thought-card thought-card--clickable';
    article.style.transitionDelay = `${index * 60}ms`;

    const dateStr = thought.created_at
      ? new Date(thought.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
      : 'just now';

    article.innerHTML = `
      <div class="thought-card-author">
        <div class="author-avatar">${(thought.author_name || '?').charAt(0).toUpperCase()}</div>
        <div class="author-info">
          <span class="author-name">${this.escapeHtml(thought.author_name || thought.author_username || 'Anonymous')}</span>
          <span class="author-username">${this.escapeHtml(thought.author_username || 'unknown')}</span>
        </div>
      </div>
      <div class="thought-card-header">
        <span class="thought-card-bullet"></span>
        <h3 class="thought-card-title">${this.escapeHtml(thought.title)}</h3>
      </div>
      <div class="thought-card-content">${this.escapeHtml(thought.content)}</div>
      <div class="thought-card-footer">
        <div class="card-footer-actions">
          <button class="card-action-btn" aria-label="Like">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <button class="card-action-btn" aria-label="Comment">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
        <span class="thought-card-date">${dateStr}</span>
      </div>
    `;

    // Click to navigate to detail page
    article.addEventListener('click', () => {
      window.location.href = `post.html?id=${thought.id}`;
    });

    return article;
  }

  /* ═══════════════════════════════════════════════════════
     DASHBOARD — MY THOUGHTS ONLY
     ═══════════════════════════════════════════════════════ */

  async fetchMyThoughts() {
    if (this.isFetching) return;
    this.isFetching = true;
    this.dashSkeleton.style.display = 'grid';
    this.dashEmpty.style.display = 'none';
    this.dashError.style.display = 'none';

    const token = this.getToken();
    if (!token) return;

    try {
      const res = await fetch(`${this.apiBaseThought}/mine`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) { this.clearAuth(); this.showLanding(); return; }
        throw new Error('Failed to load your thoughts');
      }
      this.myThoughts = await res.json();
      this.renderMyThoughts();
    } catch (err) {
      this.dashError.style.display = 'block';
      this.showToast(err.message || 'Failed to load your thoughts.', 'error');
    } finally {
      this.dashSkeleton.style.display = 'none';
      this.isFetching = false;
    }
  }

  renderMyThoughts() {
    this.dashSkeleton.style.display = 'none';
    this.dashError.style.display = 'none';
    const count = this.myThoughts.length;
    this.statCount.textContent = count;
    this.totalCount.textContent = `${count} thought${count !== 1 ? 's' : ''}`;

    if (count === 0) {
      this.dashEmpty.style.display = 'block';
      this.grid.innerHTML = '';
      return;
    }

    this.dashEmpty.style.display = 'none';
    this.grid.innerHTML = '';
    this.myThoughts.forEach((thought, index) => {
      const card = this.createDashCard(thought, index);
      this.grid.appendChild(card);
    });

    requestAnimationFrame(() => {
      const cards = this.grid.querySelectorAll('.thought-card');
      cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), i * 60);
      });
    });
  }

  createDashCard(thought, index) {
    const article = document.createElement('article');
    article.className = 'thought-card thought-card--clickable';
    article.style.transitionDelay = `${index * 60}ms`;

    const dateStr = thought.created_at
      ? new Date(thought.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
      : 'just now';

    article.innerHTML = `
      <div class="thought-card-header">
        <span class="thought-card-bullet"></span>
        <h3 class="thought-card-title">${this.escapeHtml(thought.title)}</h3>
      </div>
      <div class="thought-card-content">${this.escapeHtml(thought.content)}</div>
      <div class="thought-card-footer">
        <div class="card-footer-actions">
          <button class="card-action-btn" aria-label="Like">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <button class="card-action-btn" aria-label="Comment">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
        <div class="thought-card-actions" style="opacity: 1;">
          <button class="btn btn-ghost btn-icon edit-btn" title="Edit" aria-label="Edit thought">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-icon delete-btn" title="Delete" aria-label="Delete thought">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
        <span class="thought-card-date">${dateStr}</span>
      </div>
    `;

    const editBtn = article.querySelector('.edit-btn');
    if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); this.enterEditMode(thought); });

    const deleteBtn = article.querySelector('.delete-btn');
    if (deleteBtn) deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); this.confirmDelete(thought); });

    // Click to navigate to detail page (not triggered by action buttons)
    article.addEventListener('click', () => {
      window.location.href = `post.html?id=${thought.id}`;
    });

    return article;
  }

  /* ─── CRUD ─── */

  async createThought(title, content) {
    const token = this.getToken();
    const res = await fetch(`${this.apiBaseThought}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

  async handleSubmit(e) {
    e.preventDefault();
    const title = this.titleInput.value.trim();
    const content = this.contentInput.value.trim();
    if (!title || !content) { this.showToast('Please fill in both title and content.', 'error'); return; }
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
      await Promise.all([this.fetchMyThoughts(), this.fetchPublicFeed()]);
    } catch (err) {
      this.showToast(err.message || 'Failed to save thought.', 'error');
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

  toggleFormCollapse() {
    this.formWrap.classList.toggle('collapsed');
    this.collapseFormBtn.classList.toggle('collapsed');
  }

  confirmDelete(thought) {
    this.modalTitle.textContent = 'Delete Thought';
    this.modalBody.innerHTML = `
      <p style="margin-bottom: 0.5rem;">Are you sure you want to delete <strong>"${this.escapeHtml(thought.title)}"</strong>?</p>
      <p style="color: var(--text-muted); font-size: 0.85rem;">This action cannot be undone.</p>
    `;
    this.modalConfirm.textContent = 'Delete';
    this.modalConfirm.className = 'btn btn-danger';
    this.modalAction = async () => {
      try {
        await this.deleteThought(thought.id);
        this.showToast('Thought deleted.', 'success');
        await Promise.all([this.fetchMyThoughts(), this.fetchPublicFeed()]);
      } catch (err) {
        this.showToast(err.message || 'Failed to delete thought.', 'error');
      }
    };
    this.openModal();
  }

  /* ─── Modal ─── */

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

/* ─── Boot ─── */
new Thoughtify();