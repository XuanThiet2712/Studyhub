import { User } from '../models/index.js';

export class AvatarPicker {
  constructor(containerId, selectedId = 1, onChange = null) {
    this._container  = document.getElementById(containerId);
    this._selectedId = selectedId;
    this._onChange   = onChange;
    this.TOTAL       = 20;
  }

  render() {
    if (!this._container) return;
    this._container.innerHTML = `
    <div style="margin-bottom:8px">
      <div style="text-align:center;margin-bottom:10px">
        <img src="${User.avatarUrl(this._selectedId)}" style="width:72px;height:72px;border-radius:50%;border:3px solid var(--blue);box-shadow:0 4px 12px rgba(59,130,246,.25)">
        <div style="font-size:11px;color:var(--muted);margin-top:4px;font-family:var(--mono)">Avatar đã chọn</div>
      </div>
      <div class="avatar-grid">
        ${Array.from({length: this.TOTAL}, (_,i) => i+1).map(id => `
          <div class="ava-opt ${id===this._selectedId?'selected':''}" data-id="${id}" onclick="this.closest('[data-picker]')._picker.select(${id})">
            <img src="${User.avatarUrl(id)}" loading="lazy" alt="avatar ${id}">
          </div>`).join('')}
      </div>
    </div>`;

    this._container.dataset.picker = 'true';
    this._container._picker = this;
  }

  select(id) {
    this._selectedId = id;
    // Update selected state
    this._container.querySelectorAll('.ava-opt').forEach(el => {
      el.classList.toggle('selected', parseInt(el.dataset.id) === id);
    });
    // Update preview
    const preview = this._container.querySelector('img');
    if (preview) preview.src = User.avatarUrl(id);
    if (this._onChange) this._onChange(id);
  }

  getValue() { return this._selectedId; }
}
