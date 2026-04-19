import { User } from '../models/index.js';

export class AvatarPicker {
  constructor(containerId, selectedId=1, onChange=null) {
    this._cid = containerId;
    this._sel = Number(selectedId)||1;
    this._cb  = onChange;
    this.TOTAL = 20;
  }

  get _el() { return document.getElementById(this._cid); }

  render() {
    const el = this._el; if(!el) return;
    el.innerHTML = `
    <div>
      <div style="text-align:center;margin-bottom:16px">
        <img id="avaPreview" src="${User.avatarUrl(this._sel)}"
          style="width:80px;height:80px;border-radius:50%;border:3px solid var(--blue);box-shadow:0 4px 16px rgba(37,99,235,.2);background:var(--bg2)">
        <div style="font-size:11px;color:var(--muted);margin-top:6px;font-family:var(--mono);letter-spacing:0.3px">Avatar ${this._sel} / ${this.TOTAL}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;max-height:200px;overflow-y:auto;padding:2px">
        ${Array.from({length:this.TOTAL},(_,i)=>i+1).map(id=>`
        <div data-avaid="${id}" onclick="window.__avaPicker_${this._cid}.pick(${id})"
          style="aspect-ratio:1;border-radius:50%;cursor:pointer;border:2.5px solid ${id===this._sel?'var(--blue)':'transparent'};transition:all .18s;padding:3px;background:${id===this._sel?'var(--blue-l)':'var(--bg2)'};display:flex;align-items:center;justify-content:center"
          onmouseover="this.style.transform='scale(1.1)';this.style.borderColor='var(--border2)'" onmouseout="this.style.transform='';this.style.borderColor='${id===this._sel?'var(--blue)':'transparent'}'">
          <img src="${User.avatarUrl(id)}" style="width:100%;height:100%;border-radius:50%;display:block">
        </div>`).join('')}
      </div>
    </div>`;
    window[`__avaPicker_${this._cid}`] = this;
  }

  pick(id) {
    this._sel = id;
    const prev = document.getElementById('avaPreview');
    if(prev) prev.src = User.avatarUrl(id);
    // Update count label
    prev?.parentElement?.querySelector('div')?.remove?.();
    this._el?.querySelectorAll('[data-avaid]').forEach(el => {
      const sid = parseInt(el.dataset.avaid);
      el.style.border = sid===id ? '2.5px solid var(--blue)' : '2.5px solid transparent';
      el.style.background = sid===id ? 'var(--blue-l)' : 'var(--bg2)';
    });
    if(this._cb) this._cb(id);
  }

  getValue() { return this._sel; }
}
