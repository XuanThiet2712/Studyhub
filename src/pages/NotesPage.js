import { Toast } from '../components/index.js';

export class NotesPage {
  constructor(db, store, bus) { this.db=db; this.store=store; this.bus=bus; this._notes=[]; this._current=null; this._saveTimer=null; }
  render() {
    document.querySelector('.main').innerHTML=`<div class="page">
      <div class="page-header-row page-header"><div><h1 class="page-title">📝 Ghi chú</h1><p class="page-sub">Ghi nhanh trong lúc học · Tự động lưu Supabase</p></div><button class="btn btn-primary" onclick="notesPage.newNote()">＋ Ghi chú mới</button></div>
      <div style="display:grid;grid-template-columns:260px 1fr;gap:16px;height:calc(100vh - 220px)">
        <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--shadow-sm);display:flex;flex-direction:column">
          <div style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center"><span style="font-size:12px;font-weight:600">Danh sách</span><span class="badge badge-blue" id="noteCnt">0</span></div>
          <div style="flex:1;overflow-y:auto" id="noteList"></div>
        </div>
        <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);display:flex;flex-direction:column;box-shadow:var(--shadow-sm);overflow:hidden">
          <input id="nTitle" placeholder="Tiêu đề ghi chú..." style="padding:14px 18px;border:none;border-bottom:1px solid var(--border);font-family:'Lora',serif;font-size:18px;font-weight:700;outline:none;width:100%;background:transparent;color:var(--text)" oninput="notesPage.autoSave()">
          <div style="padding:8px 14px;border-bottom:1px solid var(--border);display:flex;gap:5px;flex-wrap:wrap">
            ${[['**','**','<b>B</b>'],['*','*','<i>I</i>'],['# ','','H1'],['## ','','H2'],['- ','','List'],['> ','','Quote'],['`','`','Code']].map(([a,b,l])=>`<button onclick="notesPage.ins('${a}','${b}')" style="padding:4px 9px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:12px;cursor:pointer;font-family:var(--mono)">${l}</button>`).join('')}
            <button onclick="notesPage.deleteNote()" style="margin-left:auto;padding:4px 9px;border-radius:6px;border:1px solid rgba(239,68,68,.2);background:transparent;color:var(--red);font-size:12px;cursor:pointer">🗑</button>
            <span id="nSaveStatus" style="font-size:11px;color:var(--muted);font-family:var(--mono);align-self:center">—</span>
          </div>
          <textarea id="nBody" placeholder="Bắt đầu viết..." style="flex:1;padding:16px 18px;border:none;outline:none;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.8;resize:none;background:transparent;color:var(--text)" oninput="notesPage.autoSave()"></textarea>
        </div>
      </div></div>`;
    window.notesPage=this;this.loadNotes();
  }
  async loadNotes(){const u=this.store.get('currentUser');try{const rows=await this.db.select('notes',{eq:{user_id:u.id},order:{col:'updated_at',asc:false}});this._notes=rows;this.renderList();}catch(e){console.error(e);}}
  renderList(){document.getElementById('noteCnt').textContent=this._notes.length;const el=document.getElementById('noteList');if(!this._notes.length){el.innerHTML='<div style="padding:16px;text-align:center;font-size:12px;color:var(--muted)">Chưa có ghi chú</div>';return;}el.innerHTML=this._notes.map(n=>`<div onclick="notesPage.select('${n.id}')" style="padding:12px 14px;border-bottom:1px solid var(--border);cursor:pointer;background:${this._current===n.id?'var(--blue-l)':'transparent'};transition:background .12s"><div style="font-size:13px;font-weight:500;margin-bottom:2px">${n.title||'Không tiêu đề'}</div><div style="font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(n.content||'').slice(0,50)||'...'}</div></div>`).join('');}
  select(id){this._current=id;const n=this._notes.find(x=>x.id===id);if(!n)return;document.getElementById('nTitle').value=n.title||'';document.getElementById('nBody').value=n.content||'';document.getElementById('nSaveStatus').textContent=new Date(n.updated_at).toLocaleTimeString('vi-VN');this.renderList();}
  async newNote(){const u=this.store.get('currentUser');try{const row=await this.db.insert('notes',{user_id:u.id,title:'',content:'',updated_at:new Date().toISOString()});this._notes.unshift(row);this.select(row.id);this.renderList();document.getElementById('nTitle').focus();}catch(e){Toast.err('Lỗi tạo ghi chú');}}
  autoSave(){if(!this._current)return;clearTimeout(this._saveTimer);document.getElementById('nSaveStatus').textContent='lưu...';this._saveTimer=setTimeout(async()=>{const n=this._notes.find(x=>x.id===this._current);if(!n)return;n.title=document.getElementById('nTitle').value;n.content=document.getElementById('nBody').value;n.updated_at=new Date().toISOString();await this.db.update('notes',n.id,{title:n.title,content:n.content,updated_at:n.updated_at});this.renderList();document.getElementById('nSaveStatus').textContent='✓ Đã lưu';},700);}
  ins(a,b=''){const ta=document.getElementById('nBody');const s=ta.selectionStart,e=ta.selectionEnd;const sel=ta.value.substring(s,e);ta.value=ta.value.substring(0,s)+a+sel+b+ta.value.substring(e);ta.selectionStart=s+a.length;ta.selectionEnd=s+a.length+sel.length;ta.focus();this.autoSave();}
  async deleteNote(){if(!this._current||!confirm('Xóa?'))return;await this.db.delete('notes',this._current);this._notes=this._notes.filter(n=>n.id!==this._current);this._current=null;document.getElementById('nTitle').value='';document.getElementById('nBody').value='';this.renderList();Toast.ok('Đã xóa');}
}
