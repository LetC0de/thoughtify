/* ═══════════════════════════════════════════
   THOUGHTIFY — A Thought-Sharing Platform
   Application Logic
   ═══════════════════════════════════════════ */

class Thoughtify {
  constructor() {
    this.apiBase = 'http://127.0.0.1:8000/thought';
    this.thoughts = [];
    this.editingId = null;
    this.isSubmitting = false;

    // DOM refs
    this.form = document.getElementById('thoughtForm');
    this.titleInput = document.getElementById('thoughtTitle');
    this.contentInput = document.getElementById('thoughtContent');
    this.submitBtn = document.getElementById('submitBtn');
    this.submitBtnText = document.getElementById('submitBtnText');
    this.submitSpinner = document.getElementById('submitSpinner');
    this.cancelEditBtn = document.getElementById('cancelEditBtn');
    this.grid = document.getElementById('thoughtsGrid');
    this.emptyState = document.getElementById('emptyState');
    this.skeleton = document.getElementById('skeletonGrid');
    this.thoughtCount = document.getElementById('thoughtCount');
    this.totalCount = document.getElementById('totalCount');
    this.formWrap = document.getElementById('formWrap');

    // Modal
    this.modal = document.getElementById('modalOverlay');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalBody = document.getElementById('modalBody');
    this.modalConfirm = document.getElementById('modalConfirm');
    this.modalCancel = document.getElementById('modalCancel');
    this.modalAction = null;

    // Toast container
    this.toastContainer = document.getElementById('toastContainer');

    this.init();
  }

  init() {
    // Form submit
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Cancel edit
    this.cancelEditBtn.addEventListener('click', () => this.cancelEdit());

    // Modal actions
    this.modalCancel.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });

    // Keyboard shortcut: Ctrl+Enter to submit
    this.contentInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.form.dispatchEvent(new Event('submit'));
      }
    });

    // Load thoughts
    this.fetchThoughts();
  }

  /* ─── API Calls ─── */

  async fetchThoughts() {
    this.showSkeleton(true);
    this.hideEmptyState();

    try {
      const res = await fetch(`${this.apiBase}/all_thought`);
      if (!res.ok) throw new Error('Failed to fetch thoughts');
      this.thoughts = await res.json();
      this.renderThoughts();
      this.updateStats();
    } catch (err) {
      this.showToast('Failed to load thoughts. Is the server running?', 'error');
      this.showEmptyState('server-down');
    } finally {
      this.showSkeleton(false);
    }
  }

  async createThought(title, content) {
    const res = await fetch(`${this.apiBase}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) throw new Error('Failed to create thought');
    return res.json();
  }

  async updateThought(id, title, content) {
    const res = await fetch(`${this.apiBase}/update/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) throw new Error('Failed to update thought');
    return res.json();
  }

  async deleteThought(id) {
    const res = await fetch(`${this.apiBase}/delete/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete thought');
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
        this.showToast('Thought updated ✨', 'success');
      } else {
        await this.createThought(title, content);
        this.showToast('Thought shared! 🎉', 'success');
      }

      this.form.reset();
      this.cancelEdit();
      await this.fetchThoughts();
    } catch (err) {
      this.showToast(
        this.editingId
          ? 'Failed to update thought. Try again.'
          : 'Failed to share thought. Try again.',
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

    // Scroll to form
    this.formWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    this.titleInput.focus();

    // Add subtle highlight to form
    this.form.classList.add('editing');
  }

  cancelEdit() {
    this.editingId = null;
    this.form.reset();
    this.submitBtnText.textContent = 'Share Thought';
    this.cancelEditBtn.style.display = 'none';
    this.form.classList.remove('editing');
  }

  /* ─── Render ─── */

  renderThoughts() {
    this.hideEmptyState();
    this.hideSkeleton();

    if (this.thoughts.length === 0) {
      this.showEmptyState('empty');
      this.grid.innerHTML = '';
      return;
    }

    this.grid.innerHTML = '';
    this.thoughts.forEach((thought, index) => {
      const card = this.createCard(thought, index);
      this.grid.appendChild(card);
    });

    // Trigger staggered entrance animation
    requestAnimationFrame(() => {
      const cards = this.grid.querySelectorAll('.thought-card');
      cards.forEach((card, i) => {
        setTimeout(() => {
          card.classList.add('visible');
        }, i * 60);
      });
    });
  }

  createCard(thought, index) {
    const article = document.createElement('article');
    article.className = 'thought-card';
    article.style.transitionDelay = `${index * 60}ms`;

    // Format date if available, or use a fallback
    const dateStr = thought.created_at
      ? new Date(thought.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Just now';

    article.innerHTML = `
      <div class="thought-card-header">
        <span class="thought-card-bullet"></span>
        <h3 class="thought-card-title">${this.escapeHtml(thought.title)}</h3>
      </div>
      <div class="thought-card-content">${this.escapeHtml(thought.content)}</div>
      <div class="thought-card-footer">
        <span class="thought-card-date">${dateStr}</span>
        <div class="thought-card-actions">
          <button class="btn btn-ghost btn-icon edit-btn" title="Edit" aria-label="Edit thought">
            ✎
          </button>
          <button class="btn btn-ghost btn-icon delete-btn" title="Delete" aria-label="Delete thought">
            ✕
          </button>
        </div>
      </div>
    `;

    // Edit
    article.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.enterEditMode(thought);
    });

    // Delete with confirmation
    article.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.confirmDelete(thought);
    });

    return article;
  }

  /* ─── Delete Confirmation Modal ─── */

  confirmDelete(thought) {
    this.modalTitle.textContent = 'Delete Thought';
    this.modalBody.innerHTML = `
      <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">
        Are you sure you want to delete <strong style="color: var(--text-primary);">"${this.escapeHtml(thought.title)}"</strong>?
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
        await this.fetchThoughts();
      } catch {
        this.showToast('Failed to delete thought.', 'error');
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
    const count = this.thoughts.length;
    this.thoughtCount.textContent = count;
    this.totalCount.textContent = count;
  }

  /* ─── Empty State ─── */

  showEmptyState(type) {
    this.emptyState.style.display = 'block';
    this.grid.innerHTML = '';
    this.hideSkeleton();

    const icon = this.emptyState.querySelector('.empty-state-icon');
    const title = this.emptyState.querySelector('.empty-state-title');
    const text = this.emptyState.querySelector('.empty-state-text');

    if (type === 'server-down') {
      icon.textContent = '🔌';
      title.textContent = 'Connection Lost';
      text.textContent = "Couldn't reach the server. Make sure your backend is running on port 8000.";
    } else {
      icon.textContent = '💭';
      title.textContent = 'No Thoughts Yet';
      text.textContent = 'The garden of ideas is empty. Be the first to plant a thought.';
    }
  }

  hideEmptyState() {
    this.emptyState.style.display = 'none';
  }

  /* ─── Skeleton ─── */

  showSkeleton(show) {
    this.skeleton.style.display = show ? 'grid' : 'none';
  }

  hideSkeleton() {
    this.skeleton.style.display = 'none';
  }

  /* ─── Toast System ─── */

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = { success: '✓', error: '✕' };
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
document.addEventListener('DOMContentLoaded', () => {
  new Thoughtify();
});
