export class Modal {
  constructor({ id, title, content, size = '', onClose } = {}) {
    this.id      = id || `modal_${Date.now()}`;
    this.title   = title;
    this.content = content;
    this.size    = size;
    this.onClose = onClose;
    this._el     = null;
  }

  open() {
    let existing = document.getElementById(this.id);
    if (existing) { existing.classList.add('open'); return; }

    this._el = document.createElement('div');
    this._el.id        = this.id;
    this._el.className = 'overlay';
    this._el.innerHTML = `
    <div class="modal ${this.size}" role="dialog">
      ${this.title ? `<div class="modal-title">${this.title}</div>` : ''}
      <div class="modal-body">${typeof this.content === 'string' ? this.content : ''}</div>
    </div>`;

    this._el.addEventListener('click', e => { if (e.target === this._el) this.close(); });
    document.body.appendChild(this._el);
    requestAnimationFrame(() => this._el.classList.add('open'));

    if (typeof this.content === 'function') {
      this.content(this._el.querySelector('.modal-body'), this);
    }
  }

  close() {
    this._el?.classList.remove('open');
    if (this.onClose) this.onClose();
  }

  static open(opts) { const m = new Modal(opts); m.open(); return m; }
}
