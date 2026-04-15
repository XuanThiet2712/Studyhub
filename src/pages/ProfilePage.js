import { AvatarPicker } from '../components/index.js';
import { User }         from '../models/index.js';
import { Toast }        from '../components/index.js';

export class ProfilePage {
  constructor(db, store, bus, auth) { this.db=db; this.store=store; this.bus=bus; this.auth=auth; this._picker=null; }
  render() {
    const raw = this.store.get('currentUser');
    const u = new User(raw);
    const xpPct = Math.min(((u.xp||0) % (u.level*100)) / (u.level) , 100);
    document.querySelector('.main').innerHTML=`
    <div class="page" style="max-width:900px">
      <!-- HERO BANNER -->
      <div style="background:linear-gradient(135deg,#0f172a,#1e1b4b,#312e81);border-radius:var(--r-2xl);padding:32px;margin-bottom:24px;position:relative;overflow:hidden">
        <div style="position:absolute;inset:0;background:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><circle cx=%2280%22 cy=%2220%22 r=%2260%22 fill=%22rgba(99,102,241,0.15)%22/><circle cx=%2210%22 cy=%2280%22 r=%2240%22 fill=%22rgba(139,92,246,0.1)%22/></svg>');opacity:.6"></div>
        <div style="position:relative;display:flex;align-items:center;gap:24px;flex-wrap:wrap">
          <div style="position:relative">
            <img src="${u.avatarUrl}" style="width:90px;height:90px;border-radius:50%;border:4px solid rgba(255,255,255,0.3);box-shadow:0 8px 24px rgba(0,0,0,0.3)" onerror="this.style.display='none'">
            <div style="position:absolute;bottom:2px;right:2px;width:18px;height:18px;border-radius:50%;background:#22c55e;border:3px solid #1e1b4b"></div>
          </div>
          <div style="flex:1">
            <div style="font-size:24px;font-weight:800;color:white;margin-bottom:3px">${u.displayName}</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.55);margin-bottom:12px">@${u.username} · ${u.gender==='male'?'Nam':u.gender==='female'?'Nữ':'—'}</div>
            ${u.bio?`<div style="font-size:13px;color:rgba(255,255,255,0.8);max-width:400px">${u.bio}</div>`:''}
          </div>
          <!-- Stats -->
          <div style="display:flex;gap:20px;flex-wrap:wrap">
            ${[['⭐','XP',u.xp||0,'#60a5fa'],['🏆','Cấp',u.level||1,'#a78bfa'],['🔥','Streak',(u.streak||0)+' ngày','#fb923c'],['📚','Ngày học',Object.keys(JSON.parse(localStorage.getItem('sh_roadmap_progress')||'{}')).filter(k=>JSON.parse(localStorage.getItem('sh_roadmap_progress')||'{}')[k]).length+'/30','#4ade80']].map(([icon,label,val,color])=>`
            <div style="text-align:center;background:rgba(255,255,255,0.08);border-radius:14px;padding:12px 18px;min-width:70px">
              <div style="font-size:20px">${icon}</div>
              <div style="font-size:18px;font-weight:800;color:${color};font-family:'JetBrains Mono',monospace;margin:3px 0">${val}</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.5px">${label}</div>
            </div>`).join('')}
          </div>
        </div>
        <!-- XP Bar -->
        <div style="margin-top:20px;position:relative">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:11px;color:rgba(255,255,255,0.5)">
            <span>Cấp ${u.level}</span>
            <span>${u.xp||0} / ${u.level*100} XP</span>
            <span>Cấp ${(u.level||1)+1}</span>
          </div>
          <div style="height:8px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden">
            <div style="height:100%;width:${xpPct}%;background:linear-gradient(90deg,#60a5fa,#a78bfa);border-radius:99px;transition:width 1s ease"></div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <!-- EDIT PROFILE -->
        <div class="card">
          <div class="card-title">✏️ Chỉnh sửa hồ sơ</div>
          <div style="margin-bottom:14px">
            <div class="form-label" style="margin-bottom:8px">Avatar</div>
            <div id="profileAvaPicker"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Tên hiển thị</label>
            <input class="form-input" id="pName" value="${u.displayName}" placeholder="Tên của bạn">
          </div>
          <div class="form-group">
            <label class="form-label">Giới thiệu bản thân</label>
            <textarea class="form-textarea" id="pBio" rows="3" placeholder="Viết gì đó về bạn...">${u.bio||''}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Giới tính</label>
              <select class="form-select" id="pGender">
                <option value="male" ${u.gender==='male'?'selected':''}>👦 Nam</option>
                <option value="female" ${u.gender==='female'?'selected':''}>👧 Nữ</option>
                <option value="other" ${u.gender==='other'?'selected':''}>🌈 Khác</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Ngày sinh</label>
              <input class="form-input" type="date" id="pBirth" value="${u.birthDate||''}">
            </div>
          </div>
          <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:4px" onclick="profilePage.save()">💾 Lưu thay đổi</button>
        </div>

        <!-- STATS + ACHIEVEMENTS -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <!-- Activity -->
          <div class="card">
            <div class="card-title">📊 Thống kê học tập</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              ${[
                ['📚','Từ vựng',`<span id="statWords">—</span> từ`,'var(--blue)'],
                ['✅','Thành thạo',`<span id="statMastered">—</span> từ`,'var(--green)'],
                ['📅','Lộ trình',`<span id="statDays">—</span>/30`,'var(--purple)'],
                ['⏱','Pomodoro',`<span id="statPomo">—</span> phiên`,'var(--orange)'],
              ].map(([i,l,v,c])=>`<div style="background:var(--bg2);border-radius:var(--r-lg);padding:12px;border-left:3px solid ${c}">
                <div style="font-size:16px;margin-bottom:4px">${i}</div>
                <div style="font-size:16px;font-weight:700;color:${c}">${v}</div>
                <div style="font-size:11px;color:var(--muted)">${l}</div>
              </div>`).join('')}
            </div>
          </div>

          <!-- AI Key -->
          <div class="card">
            <div class="card-title">🤖 Cấu hình AI</div>
            <div id="profileAIStatus" style="padding:10px;border-radius:var(--r-md);margin-bottom:12px;font-size:13px"></div>
            <button onclick="profilePage.configAI()" class="btn btn-primary" style="width:100%;justify-content:center">🔑 Quản lý API Key</button>
            <div style="margin-top:8px;font-size:11px;color:var(--muted)">Dùng Gemini API key miễn phí từ aistudio.google.com</div>
          </div>

          <!-- Danger Zone -->
          <div class="card" style="border-color:rgba(239,68,68,0.2)">
            <div class="card-title" style="color:var(--red)">⚠️ Vùng nguy hiểm</div>
            <button class="btn btn-ghost btn-sm" style="width:100%;color:var(--red);border-color:rgba(239,68,68,0.3)" onclick="if(confirm('Đăng xuất?'))app.services.auth.logout()">🚪 Đăng xuất</button>
          </div>
        </div>
      </div>
    </div>`;
    window.profilePage = this;
    this._picker = new AvatarPicker('profileAvaPicker', u.avatarId);
    this._picker.render();
    this._loadStats();
    this._updateAIStatus();
  }

  async _loadStats() {
    const u = this.store.get('currentUser'); if(!u) return;
    try {
      const [vocab,prog,pomo] = await Promise.all([
        this.db.select('vocabulary',{eq:{user_id:u.id}}).catch(()=>[]),
        this.db.select('learning_progress',{eq:{user_id:u.id}}).catch(()=>[]),
        this.db.select('pomodoro_sessions',{eq:{user_id:u.id,completed:true}}).catch(()=>[]),
      ]);
      const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
      set('statWords', vocab.length);
      set('statMastered', vocab.filter(w=>w.srs_level>=4).length);
      set('statDays', prog.filter(p=>p.completed).length);
      set('statPomo', pomo.length);
    } catch{}
  }

  _updateAIStatus() {
    const el = document.getElementById('profileAIStatus'); if(!el) return;
    try {
      const { aiService } = window._aiServiceRef || {};
      // Try to get from module cache
      import('../services/AIService.js').then(({aiService}) => {
        if(aiService.hasKey()) {
          el.style.background='var(--green-l)'; el.style.color='#15803d';
          el.innerHTML='✅ <strong>AI đang hoạt động</strong> · Key đã được cấu hình';
        } else {
          el.style.background='var(--red-l)'; el.style.color='#b91c1c';
          el.innerHTML='❌ <strong>Chưa cấu hình AI</strong> · Nhấn bên dưới để thêm key';
        }
      });
    } catch{}
  }

  configAI() {
    import('../services/AIService.js').then(({showAPIKeyModal}) => {
      showAPIKeyModal(() => { this._updateAIStatus(); Toast.ok('AI đã kích hoạt! 🎉'); });
    });
  }

  async save() {
    const u = this.store.get('currentUser');
    const changes = {
      display_name: document.getElementById('pName').value.trim(),
      bio:          document.getElementById('pBio').value.trim(),
      gender:       document.getElementById('pGender').value,
      birth_date:   document.getElementById('pBirth').value||null,
      avatar_id:    this._picker.getValue()
    };
    if(!changes.display_name) { Toast.err('Tên không được để trống!'); return; }
    try {
      await this.auth.updateProfile(u.id, changes);
      Toast.ok('✅ Đã cập nhật hồ sơ!');
      setTimeout(() => this.render(), 500);
    } catch(e) { Toast.err('Lỗi: '+e.message); }
  }
}
