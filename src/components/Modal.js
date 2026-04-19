export class Modal {
  constructor({ id, title, subtitle, content, size = '', onClose } = {}) {
    this.id       = id || `modal_${Date.now()}`;
    this.title    = title;
    this.subtitle = subtitle;
    this.content  = content;
    this.size     = size;
    this.onClose  = onClose;
    this._el      = null;
  }

  open() {
    let existing = document.getElementById(this.id);
    if (existing) { existing.classList.add('open'); return; }

    this._el = document.createElement('div');
    this._el.id        = this.id;
    this._el.className = 'modal-overlay';
    this._el.innerHTML = `
    <div class="modal ${this.size}" role="dialog" aria-modal="true">
      ${this.title ? `<div class="modal-title">${this.title}</div>` : ''}
      ${this.subtitle ? `<div class="modal-subtitle">${this.subtitle}</div>` : ''}
      <div class="modal-body">${typeof this.content === 'string' ? this.content : ''}</div>
    </div>`;

    this._el.addEventListener('click', e => { if (e.target === this._el) this.close(); });
    document.addEventListener('keydown', this._onKey = e => { if (e.key === 'Escape') this.close(); });
    document.body.appendChild(this._el);

    if (typeof this.content === 'function') {
      this.content(this._el.querySelector('.modal-body'), this);
    }
  }

  close() {
    if (this.onClose) this.onClose();
    this._el?.remove();
    document.removeEventListener('keydown', this._onKey);
  }

  static open(opts) { const m = new Modal(opts); m.open(); return m; }
}
