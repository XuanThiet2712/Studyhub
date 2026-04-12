import { Toast } from '../components/index.js';

export class DocumentsPage {
  constructor(db, store, bus) { this.db=db; this.store=store; this.bus=bus; this._docs=[]; this._filter='all'; }
  render() {
    document.querySelector('.main').innerHTML=`<div class="page">
      <div class="page-header-row page-header"><div><h1 class="page-title">📁 Tài liệu</h1><p class="page-sub">Video · PDF · Link · Lưu trữ Supabase</p></div><button class="btn btn-primary" onclick="docsPage.openAdd()">＋ Thêm tài liệu</button></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        ${[['all','Tất cả'],['video','🎬 Video'],['pdf','📄 PDF'],['link','🔗 Link'],['note','📝 Ghi chú']].map(([f,l])=>`<button onclick="docsPage.setFilter('${f}',this)" style="padding:6px 14px;border-radius:99px;font-size:12px;border:1.5px solid ${f===this._filter?'var(--blue)':'var(--border)'};background:${f===this._filter?'var(--blue-l)':'transparent'};color:${f===this._filter?'var(--blue-d)':'var(--muted)'};cursor:pointer;font-family:var(--font);transition:all .15s">${l}</button>`).join('')}
        <div class="search-wrap" style="margin-left:auto;width:220px"><span class="search-ico">🔍</span><input class="form-input" id="docSearch" placeholder="Tìm..." oninput="docsPage.renderDocs()"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px" id="docsGrid"></div>
      <div class="empty" id="docsEmpty" style="display:none"><div class="empty-icon">📭</div><div class="empty-text">Chưa có tài liệu</div><br><button class="btn btn-primary" onclick="docsPage.openAdd()">＋ Thêm</button></div>
    </div>
    <div class="overlay" id="addDocModal"><div class="modal">
      <div class="modal-title">＋ Thêm tài liệu mới</div>
      <div class="form-group"><label class="form-label">Tiêu đề *</label><input class="form-input" id="dTitle" placeholder="VD: Bài giảng Toán C5"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Loại</label><select class="form-select" id="dType"><option value="video">🎬 Video</option><option value="pdf">📄 PDF</option><option value="link">🔗 Link</option><option value="note">📝 Ghi chú</option></select></div><div class="form-group"><label class="form-label">Môn học</label><input class="form-input" id="dSubj" placeholder="Toán học"></div></div>
      <div class="form-group"><label class="form-label">Link (Mediafire/Drive/YouTube...)</label><input class="form-input" id="dUrl" type="url" placeholder="https://..."></div>
      <div class="form-group"><label class="form-label">Mô tả</label><textarea class="form-textarea" id="dDesc" rows="2"></textarea></div>
      <div class="form-group"><label class="form-label">Tags (phân cách phẩy)</label><input class="form-input" id="dTags" placeholder="chương 5, quan trọng"></div>
      <div class="modal-footer"><button class="btn btn-ghost" onclick="document.getElementById('addDocModal').classList.remove('open')">Hủy</button><button class="btn btn-primary" onclick="docsPage.saveDoc()">💾 Lưu</button></div>
    </div></div>`;
    window.docsPage=this;this.loadDocs();
  }
  async loadDocs(){const u=this.store.get('currentUser');try{this._docs=await this.db.select('documents',{eq:{user_id:u.id},order:{col:'created_at',asc:false}});this.renderDocs();}catch(e){console.error(e);}}
  setFilter(f,btn){this._filter=f;document.querySelectorAll('[onclick^="docsPage.setFilter"]').forEach(b=>{b.style.borderColor=b===btn?'var(--blue)':'var(--border)';b.style.background=b===btn?'var(--blue-l)':'transparent';b.style.color=b===btn?'var(--blue-d)':'var(--muted)';});this.renderDocs();}
  renderDocs(){const q=(document.getElementById('docSearch')?.value||'').toLowerCase();const list=this._docs.filter(d=>(this._filter==='all'||d.doc_type===this._filter)&&(!q||d.title.toLowerCase().includes(q)||d.subject?.toLowerCase().includes(q)));const el=document.getElementById('docsGrid'),em=document.getElementById('docsEmpty');if(!el)return;if(!list.length){el.innerHTML='';em.style.display='block';return;}em.style.display='none';const tc={video:'var(--blue)',pdf:'var(--red)',link:'var(--orange)',note:'var(--green)'};const ti={video:'🎬',pdf:'📄',link:'🔗',note:'📝'};el.innerHTML=list.map(d=>`<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;box-shadow:var(--shadow-sm);position:relative;overflow:hidden" onmouseover="this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.boxShadow='var(--shadow-sm)'">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${tc[d.doc_type]||'var(--blue)'}"></div>
      <div style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:99px;background:${tc[d.doc_type]||'var(--blue)'}18;font-size:11px;font-weight:500;margin-bottom:10px;color:${tc[d.doc_type]||'var(--blue)'}">${ti[d.doc_type]||'📄'} ${d.doc_type?.toUpperCase()}</div>
      <div style="font-size:14px;font-weight:600;margin-bottom:4px">${d.title}</div>
      <div style="font-size:11px;color:var(--muted);font-family:var(--mono);margin-bottom:8px">${d.subject||'Chung'} · ${new Date(d.created_at).toLocaleDateString('vi-VN')}</div>
      ${d.description?`<div style="font-size:12px;color:var(--muted);margin-bottom:8px;line-height:1.5">${d.description.slice(0,80)}${d.description.length>80?'…':''}</div>`:''}
      ${d.tags?.length?`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px">${d.tags.map(t=>`<span class="badge badge-blue" style="font-size:10px">${t}</span>`).join('')}</div>`:''}
      <div style="display:flex;gap:6px">${d.url?`<a href="${d.url}" target="_blank" class="btn btn-primary btn-sm">🔗 Mở</a>`:''}<button class="btn btn-danger btn-sm" onclick="docsPage.del('${d.id}')">🗑</button></div>
    </div>`).join('');}
  openAdd(){document.getElementById('addDocModal').classList.add('open');}
  async saveDoc(){const u=this.store.get('currentUser');const title=document.getElementById('dTitle').value.trim();if(!title){Toast.err('Nhập tiêu đề!');return;}const row=await this.db.insert('documents',{user_id:u.id,title,doc_type:document.getElementById('dType').value,subject:document.getElementById('dSubj').value.trim()||'Chung',url:document.getElementById('dUrl').value.trim(),description:document.getElementById('dDesc').value.trim(),tags:document.getElementById('dTags').value.split(',').map(t=>t.trim()).filter(Boolean)});this._docs.unshift(row);document.getElementById('addDocModal').classList.remove('open');['dTitle','dUrl','dDesc','dTags'].forEach(i=>document.getElementById(i).value='');this.renderDocs();Toast.ok(`Đã lưu "${title}"`);}
  async del(id){if(!confirm('Xóa?'))return;await this.db.delete('documents',id);this._docs=this._docs.filter(d=>d.id!==id);this.renderDocs();Toast.ok('Đã xóa');}
}
