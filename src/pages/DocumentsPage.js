import { Toast } from '../components/index.js';

const DEFAULT_FOLDERS=['TOEIC','Tiếng Anh','Toán','Vật Lý','Hoá Học','LTNC','OOP','Kinh Tế'];
const TYPE_COLORS={video:'#3b82f6',pdf:'#ef4444',link:'#f97316',note:'#22c55e'};
const TYPE_ICONS ={video:'🎬',pdf:'📄',link:'🔗',note:'📝'};

export class DocumentsPage {
  constructor(db,store,bus){this.db=db;this.store=store;this.bus=bus;this._docs=[];this._publicDocs=[];this._filter='all';this._folder='all';this._folders=[];this._scope='mine';}
  render(){
    document.querySelector('.main').innerHTML=`
    <div class="page">
      <div class="page-header-row page-header">
        <div><h1 class="page-title">📁 Tài liệu</h1><p class="page-sub">Quản lý tài liệu theo môn học · Video · PDF · Link</p></div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="docsPage.openAddFolder()">📂 Tạo thư mục</button>
          <button class="btn btn-primary" onclick="docsPage.openAdd()">＋ Thêm tài liệu</button>
        </div>
      </div>

      <!-- Folders -->
      <div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">📂 Thư mục</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap" id="folderList"></div>
      </div>

      <!-- Type filter -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
        ${[['all','Tất cả'],['video','🎬 Video'],['pdf','📄 PDF'],['link','🔗 Link'],['note','📝 Ghi chú']].map(([f,l])=>`
        <button onclick="docsPage.setFilter('${f}',this)" class="type-filter-btn" style="padding:5px 14px;border-radius:99px;font-size:12px;border:1.5px solid ${f==='all'?'var(--blue)':'var(--border)'};background:${f==='all'?'var(--blue-l)':'transparent'};color:${f==='all'?'var(--blue-d)':'var(--muted)'};cursor:pointer;font-family:var(--font);transition:all .15s">${l}</button>`).join('')}
        <div class="search-wrap" style="margin-left:auto;min-width:200px">
          <span class="search-ico">🔍</span>
          <input class="form-input" id="docSearch" placeholder="Tìm tài liệu..." oninput="docsPage.renderDocs()">
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px" id="docsGrid"></div>
      <div class="empty" id="docsEmpty" style="display:none">
        <div class="empty-icon">📭</div>
        <div class="empty-text">Chưa có tài liệu nào</div>
        <button class="btn btn-primary" style="margin-top:14px" onclick="docsPage.openAdd()">＋ Thêm tài liệu đầu tiên</button>
      </div>
    </div>

    <!-- ADD DOC MODAL -->
    <div class="overlay" id="addDocModal">
      <div class="modal">
        <div class="modal-title" id="docModalTitle">＋ Thêm tài liệu</div>
        <input type="hidden" id="editDocId">
        <div class="form-group"><label class="form-label">Tiêu đề *</label><input class="form-input" id="dTitle" placeholder="VD: Bài giảng OOP Chương 5"></div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Loại tài liệu</label>
            <select class="form-select" id="dType">
              <option value="video">🎬 Video</option><option value="pdf">📄 PDF</option>
              <option value="link">🔗 Link</option><option value="note">📝 Ghi chú</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Thư mục / Môn học</label>
            <select class="form-select" id="dSubj" style="max-width:100%"></select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Link (YouTube/Drive/Mediafire...)</label><input class="form-input" id="dUrl" type="url" placeholder="https://..."></div>
        <div class="form-group"><label class="form-label">Mô tả</label><textarea class="form-textarea" id="dDesc" rows="2" placeholder="Nội dung, chương, chủ đề..."></textarea></div>
        <div class="form-group"><label class="form-label">Tags (phân cách bằng dấu phẩy)</label><input class="form-input" id="dTags" placeholder="chương 5, quan trọng, thi cuối kỳ"></div>
        <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--blue-l);border-radius:var(--r-md);margin-bottom:14px">
          <input type="checkbox" id="dPublic" style="width:18px;height:18px;cursor:pointer">
          <div><div style="font-size:13px;font-weight:600">🌐 Chia sẻ công khai</div><div style="font-size:11px;color:var(--muted)">Mọi người trong cộng đồng đều thấy tài liệu này</div></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="document.getElementById('addDocModal').classList.remove('open')">Hủy</button>
          <button class="btn btn-primary" onclick="docsPage.saveDoc()">💾 Lưu</button>
        </div>
      </div>
    </div>

    <!-- ADD FOLDER MODAL -->
    <div class="overlay" id="addFolderModal">
      <div class="modal" style="max-width:400px">
        <div class="modal-title">📂 Tạo thư mục mới</div>
        <div class="form-group"><label class="form-label">Tên thư mục (môn học)</label><input class="form-input" id="folderName" placeholder="VD: Giải tích, LTNC, Hoá Hữu Cơ..." onkeydown="if(event.key==='Enter')docsPage.saveFolder()"></div>
        <div style="margin-bottom:14px">
          <div class="form-label">Gợi ý nhanh:</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
            ${DEFAULT_FOLDERS.map(f=>`<button onclick="document.getElementById('folderName').value='${f}'" style="padding:4px 10px;border-radius:99px;font-size:11px;border:1px solid var(--border);background:var(--bg2);cursor:pointer;color:var(--text2)">${f}</button>`).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="document.getElementById('addFolderModal').classList.remove('open')">Hủy</button>
          <button class="btn btn-primary" onclick="docsPage.saveFolder()">📂 Tạo thư mục</button>
        </div>
      </div>
    </div>`;
    window.docsPage=this;
    this._loadFolders();
    this.loadDocs();
  }

  _loadFolders(){
    this._folders=JSON.parse(localStorage.getItem('sh_doc_folders')||'["TOEIC","Tiếng Anh","Chung"]');
    this._renderFolders();
    this._updateFolderSelect();
  }

  _renderFolders(){
    const el=document.getElementById('folderList'); if(!el) return;
    const items=[['all','📁 Tất cả'],...this._folders.map(f=>[f,`📂 ${f}`])];
    el.innerHTML=items.map(([id,label])=>`
      <div onclick="docsPage.setFolder('${id}',this)" style="display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:var(--r-lg);cursor:pointer;font-size:13px;font-weight:500;border:1.5px solid ${this._folder===id?'var(--blue)':'var(--border)'};background:${this._folder===id?'var(--blue-l)':'var(--white)'};color:${this._folder===id?'var(--blue-d)':'var(--text2)'};transition:all .15s;box-shadow:var(--shadow-sm)">
        ${label}
        ${id!=='all'?`<span onclick="event.stopPropagation();docsPage.deleteFolder('${id}')" style="margin-left:4px;color:var(--muted2);font-size:10px;cursor:pointer" title="Xoá">✕</span>`:''}
        <span style="font-size:10px;background:rgba(0,0,0,0.06);border-radius:99px;padding:1px 6px">${id==='all'?this._docs.length:this._docs.filter(d=>d.subject===id).length}</span>
      </div>`).join('');
  }

  _updateFolderSelect(){
    const el=document.getElementById('dSubj'); if(!el) return;
    el.innerHTML=[...this._folders,'Chung'].map(f=>`<option value="${f}">${f}</option>`).join('');
  }

  setFolder(f,btn){ this._folder=f; this._renderFolders(); this.renderDocs(); }

  openAddFolder(){ document.getElementById('addFolderModal').classList.add('open'); setTimeout(()=>document.getElementById('folderName')?.focus(),100); }

  saveFolder(){
    const name=document.getElementById('folderName').value.trim();
    if(!name){Toast.err('Nhập tên thư mục!');return;}
    if(!this._folders.includes(name)){
      this._folders.push(name);
      localStorage.setItem('sh_doc_folders',JSON.stringify(this._folders));
    }
    document.getElementById('folderName').value='';
    document.getElementById('addFolderModal').classList.remove('open');
    this._renderFolders(); this._updateFolderSelect();
    Toast.ok(`Đã tạo thư mục "${name}"!`);
  }

  deleteFolder(name){
    if(!confirm(`Xóa thư mục "${name}"? Tài liệu trong đó sẽ chuyển về "Chung".`)) return;
    this._docs.filter(d=>d.subject===name).forEach(async d=>{
      await this.db.update('documents',d.id,{subject:'Chung'}).catch(()=>{});
      d.subject='Chung';
    });
    this._folders=this._folders.filter(f=>f!==name);
    localStorage.setItem('sh_doc_folders',JSON.stringify(this._folders));
    if(this._folder===name) this._folder='all';
    this._renderFolders(); this._updateFolderSelect(); this.renderDocs();
    Toast.ok(`Đã xóa thư mục "${name}"`);
  }

  async loadDocs(){
    const u=this.store.get('currentUser');
    try{this._docs=await this.db.select('documents',{eq:{user_id:u.id},order:{col:'created_at',asc:false}});}
    catch(e){console.error(e);}
    this._renderFolders(); this.renderDocs();
  }

  async loadPublicDocs(){
    try{
      const { data } = await this.db.client.from('documents').select('*,profiles!documents_user_id_fkey(display_name,avatar_id)').eq('is_public',true).order('created_at',{ascending:false}).limit(50);
      this._publicDocs = data||[];
    }catch(e){this._publicDocs=[];}
    this.renderPublicDocs();
  }

  setScope(scope,btn){
    this._scope=scope;
    document.querySelectorAll('.tabs .tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    if(scope==='public'){this.loadPublicDocs();}
    else this.renderDocs();
  }

  renderPublicDocs(){
    // Hide folders/filters for public
    document.getElementById('folderList').parentElement.style.display=this._scope==='mine'?'block':'none';
    document.getElementById('vp-filters')?.style && (document.getElementById('vp-filters').style.display=this._scope==='mine'?'flex':'none');
    const grid=document.getElementById('docsGrid'),empty=document.getElementById('docsEmpty');
    if(!grid)return;
    if(!this._publicDocs.length){grid.innerHTML='';empty.style.display='block';empty.querySelector('.empty-text').textContent='Chưa có tài liệu cộng đồng nào';return;}
    empty.style.display='none';
    const tc={video:'#3b82f6',pdf:'#ef4444',link:'#f97316',note:'#22c55e'};
    const ti={video:'🎬',pdf:'📄',link:'🔗',note:'📝'};
    grid.innerHTML=this._publicDocs.map(d=>{
      const c=tc[d.doc_type]||'#3b82f6';
      return `<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--shadow-sm);transition:all .2s;display:flex;flex-direction:column" onmouseover="this.style.boxShadow='var(--shadow-md)';this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='var(--shadow-sm)';this.style.transform=''">
        <div style="height:4px;background:${c}"></div>
        <div style="padding:14px 16px;flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="font-size:10px;padding:2px 8px;border-radius:99px;background:${c}15;color:${c};font-weight:600">${ti[d.doc_type]||'📄'} ${(d.doc_type||'link').toUpperCase()}</span>
            <span style="font-size:10px;color:var(--muted);margin-left:auto">${d.subject||'Chung'}</span>
          </div>
          <div style="font-size:14px;font-weight:700;margin-bottom:5px">${d.title}</div>
          ${d.description?`<div style="font-size:12px;color:var(--muted);margin-bottom:8px">${d.description.slice(0,80)}${d.description.length>80?'…':''}</div>`:''}
          <div style="display:flex;align-items:center;gap:6px;margin-top:8px">
            <span style="font-size:11px;color:var(--muted)">👤 ${d.profiles?.display_name||'Ẩn danh'}</span>
            <span style="font-size:11px;color:var(--muted2);margin-left:auto">${new Date(d.created_at).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
        <div style="padding:8px 14px;border-top:1px solid var(--border);background:var(--bg2)">
          ${d.url?`<a href="${d.url}" target="_blank" class="btn btn-primary btn-sm" style="width:100%;justify-content:center">🔗 Mở tài liệu</a>`:'<div style="font-size:12px;color:var(--muted);text-align:center;padding:4px">Không có link</div>'}
        </div>
      </div>`;
    }).join('');
  }

  setFilter(f,btn){
    this._filter=f;
    document.querySelectorAll('.type-filter-btn').forEach(b=>{b.style.borderColor='var(--border)';b.style.background='transparent';b.style.color='var(--muted)';});
    btn.style.borderColor='var(--blue)';btn.style.background='var(--blue-l)';btn.style.color='var(--blue-d)';
    this.renderDocs();
  }

  renderDocs(){
    const q=(document.getElementById('docSearch')?.value||'').toLowerCase();
    const list=this._docs.filter(d=>
      (this._filter==='all'||d.doc_type===this._filter)&&
      (this._folder==='all'||d.subject===this._folder)&&
      (!q||d.title.toLowerCase().includes(q)||(d.subject||'').toLowerCase().includes(q)||(d.description||'').toLowerCase().includes(q))
    );
    const grid=document.getElementById('docsGrid'),empty=document.getElementById('docsEmpty');
    if(!grid) return;
    if(!list.length){grid.innerHTML='';empty.style.display='block';return;}
    empty.style.display='none';
    grid.innerHTML=list.map(d=>{
      const c=TYPE_COLORS[d.doc_type]||'var(--blue)';
      const ic=TYPE_ICONS[d.doc_type]||'📄';
      return `<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--shadow-sm);transition:all .2s;display:flex;flex-direction:column" onmouseover="this.style.boxShadow='var(--shadow-md)';this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='var(--shadow-sm)';this.style.transform=''">
        <div style="height:4px;background:${c}"></div>
        <div style="padding:16px;flex:1">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
            <div style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:99px;background:${c}15;font-size:11px;font-weight:600;color:${c}">${ic} ${d.doc_type?.toUpperCase()}</div>
            <div style="font-size:11px;color:var(--muted);background:var(--bg2);padding:2px 8px;border-radius:99px">${d.subject||'Chung'}</div>
          </div>
          <div style="font-size:14px;font-weight:700;margin-bottom:5px;line-height:1.4">${d.title}</div>
          ${d.description?`<div style="font-size:12px;color:var(--muted);margin-bottom:8px;line-height:1.5">${d.description.slice(0,90)}${d.description.length>90?'…':''}</div>`:''}
          ${d.tags?.length?`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">${d.tags.map(t=>`<span class="badge badge-blue" style="font-size:10px">${t}</span>`).join('')}</div>`:''}
          <div style="font-size:10px;color:var(--muted2);font-family:var(--mono)">${new Date(d.created_at).toLocaleDateString('vi-VN')}</div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid var(--border);display:flex;gap:6px;background:var(--bg2)">
          ${d.url?`<a href="${d.url}" target="_blank" class="btn btn-primary btn-sm" style="flex:1;justify-content:center">🔗 Mở</a>`:''}
          <button class="btn btn-ghost btn-sm" onclick="docsPage.openEdit('${d.id}')" title="Sửa">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="docsPage.del('${d.id}')" title="Xóa">🗑</button>
        </div>
      </div>`;
    }).join('');
  }

  openAdd(){
    document.getElementById('docModalTitle').textContent='＋ Thêm tài liệu';
    document.getElementById('editDocId').value='';
    ['dTitle','dUrl','dDesc','dTags'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    this._updateFolderSelect();
    document.getElementById('addDocModal').classList.add('open');
  }

  openEdit(id){
    const d=this._docs.find(x=>x.id===id); if(!d) return;
    document.getElementById('docModalTitle').textContent='✏️ Chỉnh sửa tài liệu';
    document.getElementById('editDocId').value=id;
    document.getElementById('dTitle').value=d.title;
    document.getElementById('dUrl').value=d.url||'';
    document.getElementById('dDesc').value=d.description||'';
    document.getElementById('dTags').value=(d.tags||[]).join(', ');
    document.getElementById('dType').value=d.doc_type||'link';
    this._updateFolderSelect();
    document.getElementById('dSubj').value=d.subject||'Chung';
    document.getElementById('addDocModal').classList.add('open');
  }

  async saveDoc(){
    const u=this.store.get('currentUser');
    const title=document.getElementById('dTitle').value.trim();
    if(!title){Toast.err('Nhập tiêu đề!');return;}
    const editId=document.getElementById('editDocId').value;
    const payload={
      title, user_id:u.id,
      doc_type:document.getElementById('dType').value,
      subject:document.getElementById('dSubj').value||'Chung',
      url:document.getElementById('dUrl').value.trim(),
      description:document.getElementById('dDesc').value.trim(),
      tags:document.getElementById('dTags').value.split(',').map(t=>t.trim()).filter(Boolean),
      is_public:document.getElementById('dPublic')?.checked||false,
    };
    try {
      if(editId){
        await this.db.update('documents',editId,payload);
        const idx=this._docs.findIndex(d=>d.id===editId);
        if(idx>=0) this._docs[idx]={...this._docs[idx],...payload};
        Toast.ok('Đã cập nhật!');
      } else {
        const row=await this.db.insert('documents',payload);
        this._docs.unshift(row);
        Toast.ok(`Đã thêm "${title}"!`);
      }
      document.getElementById('addDocModal').classList.remove('open');
      this._renderFolders(); this.renderDocs();
    } catch(e){Toast.err('Lỗi: '+e.message);}
  }

  async del(id){
    if(!confirm('Xóa tài liệu này?')) return;
    await this.db.delete('documents',id);
    this._docs=this._docs.filter(d=>d.id!==id);
    this._renderFolders(); this.renderDocs(); Toast.ok('Đã xóa');
  }
}
