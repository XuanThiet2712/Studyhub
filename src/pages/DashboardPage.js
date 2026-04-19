import { User }        from '../models/index.js';
import { DayProgress } from '../models/index.js';

export class DashboardPage {
  constructor(db, store, bus) {
    this.db    = db;
    this.store = store;
    this.bus   = bus;
  }

  render() {
    const user    = new User(this.store.get('currentUser'));
    const online  = (this.store.get('onlineUsers')||[]).length;
    const daysDone= 0; // will be loaded async

    document.querySelector('.main').innerHTML = `
    <div class="page">
      <!-- HERO -->
      <div style="display:grid;grid-template-columns:1fr auto;gap:20px;align-items:start;margin-bottom:28px">
        <div>
          <h1 class="page-title" style="margin-bottom:6px">
            Xin chào, <span style="background:var(--accent-g);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${user.displayName}</span>
          </h1>
          <p class="page-desc">
            <em style="font-style:italic;color:var(--indigo)">"Just do it first."</em>
            — Hôm nay học gì chưa?
          </p>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="app.router.navigate('/roadmap')">📅 Vào học ngay →</button>
            <button class="btn btn-ghost" onclick="app.router.navigate('/game')">⚔️ Thách đấu</button>
            <button class="btn btn-ghost" onclick="app.router.navigate('/chat')">💬 Chat</button>
          </div>
        </div>

        <!-- Photo Zone -->
        <div style="width:172px;flex-shrink:0" id="hinataZone">
          <div style="background:var(--surface);border:1px solid var(--border);padding:14px;text-align:center;border-radius:var(--r-xl);box-shadow:var(--shadow-xs)">
            <div style="font-size:10px;color:var(--faint);font-family:var(--mono);margin-bottom:10px;letter-spacing:0.8px;text-transform:uppercase">Photo</div>
            <img id="hinataImg" src="" alt="" style="width:140px;height:140px;object-fit:cover;border-radius:var(--r-lg);display:none;cursor:pointer" onclick="dashPage.uploadHinata()" onerror="this.style.display='none';document.getElementById('hinataPlaceholder').style.display='flex'">
            <div id="hinataPlaceholder" style="width:140px;height:140px;background:var(--bg2);border-radius:var(--r-lg);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;border:1px dashed var(--border2)" onclick="dashPage.uploadHinata()">
              <div style="font-size:24px;opacity:.4">+</div>
              <div style="font-size:11px;color:var(--muted);margin-top:6px">Thêm ảnh</div>
            </div>
            <input type="file" id="hinataInput" accept="image/*" style="display:none" onchange="dashPage.setHinata(this)">
          </div>
        </div>
      </div>

      <!-- STATS ROW -->
      <div class="grid-4" style="margin-bottom:24px" id="statsRow">
        <div class="stat"><div class="stat-icon">📅</div><div class="stat-val" id="st-days">—</div><div class="stat-label">ngày học xong</div></div>
        <div class="stat"><div class="stat-icon">📖</div><div class="stat-val" id="st-vocab">—</div><div class="stat-label">từ vựng đã lưu</div></div>
        <div class="stat"><div class="stat-icon">🔥</div><div class="stat-val" id="st-streak">${user.streak||0}</div><div class="stat-label">ngày liên tiếp</div></div>
        <div class="stat"><div class="stat-icon">🟢</div><div class="stat-val" id="st-online">${online}</div><div class="stat-label">đang online</div></div>
      </div>

      <!-- GRID -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
        <!-- XP Progress -->
        <div class="card">
          <div class="card-title">⭐ Tiến độ XP — Cấp ${user.level}</div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
            <img src="${user.avatarUrl}" style="width:48px;height:48px;border-radius:50%;border:3px solid var(--blue)">
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600">${user.displayName}</div>
              <div style="font-size:12px;color:var(--muted);font-family:var(--mono)">${user.xp} XP · ${user.xpToNext} XP đến cấp ${user.level+1}</div>
              <div class="prog-track" style="margin-top:6px">
                <div class="prog-fill" style="width:${Math.min((user.xp%(user.level*100))/(user.level*100)*100,100)}%;background:var(--accent-g)"></div>
              </div>
            </div>
          </div>
          <div style="font-size:12px;color:var(--muted)">Học từ vựng: +5 XP · Hoàn thành ngày: +50 XP · Thắng game: +30 XP</div>
        </div>

        <!-- Today tasks -->
        <div class="card">
          <div class="card-title">📋 Hôm nay</div>
          <div id="todayTasks">
            <div style="text-align:center;color:var(--muted);padding:12px;font-family:var(--mono);font-size:12px">Đang tải...</div>
          </div>
          <button class="btn btn-primary btn-sm" style="margin-top:10px;width:100%;justify-content:center" onclick="app.router.navigate('/roadmap')">
            📅 Vào lộ trình học →
          </button>
        </div>
      </div>

      <!-- Due vocab + leaderboard preview -->
      <div class="grid-2">
        <div class="card">
          <div class="card-title">⏰ Từ vựng cần ôn hôm nay</div>
          <div id="dueVocab"><div style="text-align:center;color:var(--muted);font-size:12px;padding:12px">Đang tải...</div></div>
          <button class="btn btn-ghost btn-sm" style="margin-top:8px;width:100%;justify-content:center" onclick="app.router.navigate('/vocabulary')">Xem tất cả →</button>
        </div>
        <div class="card">
          <div class="card-title">🏆 Top học viên</div>
          <div id="lbPreview"><div style="text-align:center;color:var(--muted);font-size:12px;padding:12px">Đang tải...</div></div>
          <button class="btn btn-ghost btn-sm" style="margin-top:8px;width:100%;justify-content:center" onclick="app.router.navigate('/leaderboard')">Xem bảng xếp hạng →</button>
        </div>
      </div>
    </div>`;

    window.dashPage = this;
    this._loadData();
    this._loadHinata();
    this.bus.on('presence:update', () => {
      const el = document.getElementById('st-online');
      if (el) el.textContent = (this.store.get('onlineUsers')||[]).length;
    });
  }

  async _loadData() {
    const user = this.store.get('currentUser');
    try {
      const [progress, vocab, lb] = await Promise.all([
        this.db.select('learning_progress',{eq:{user_id:user.id}}),
        this.db.select('vocabulary',{eq:{user_id:user.id},limit:200}),
        this.db.select('leaderboard_cache',{select:'user_id,total_xp',order:{col:'total_xp',asc:false},limit:5}),
      ]);

      // Stats
      const done = progress.filter(p=>p.completed).length;
      document.getElementById('st-days').textContent  = done;
      document.getElementById('st-vocab').textContent = vocab.length;
      this.bus.emit('vocab:updated', vocab.length);

      // Today's task
      const today   = done+1;
      const todayEl = document.getElementById('todayTasks');
      const tp      = progress.find(p=>p.day_number===today);
      if (tp) {
        const dp = new DayProgress(tp);
        todayEl.innerHTML = `
        <div style="font-size:12px;color:var(--muted);font-family:var(--mono);margin-bottom:8px">Ngày ${today} · ${dp.progressPct}% hoàn thành</div>
        <div class="prog-track" style="margin-bottom:10px"><div class="prog-fill" style="width:${dp.progressPct}%;background:var(--green)"></div></div>
        ${['grammar','vocab','listening','reading','speaking'].map(s=>{
          const done = dp[s + 'Done'];
          return `<div style="display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid var(--border);font-size:13px">
            <span>${done?'✅':'○'}</span>
            <span style="color:${done?'var(--muted)':'var(--text)'};text-decoration:${done?'line-through':''}">${{grammar:'📐 Ngữ pháp',vocab:'📖 Từ vựng',listening:'🎧 Nghe',reading:'📄 Đọc hiểu',speaking:'🗣️ Nói'}[s]}</span>
          </div>`;
        }).join('')}`;
      } else {
        todayEl.innerHTML = `<div style="font-size:13px;color:var(--muted)">Ngày ${today} chưa bắt đầu. Bắt đầu học ngay!</div>`;
      }

      // Due vocab
      const due   = vocab.filter(v => new Date(v.next_review) <= new Date()).slice(0,5);
      const dueEl = document.getElementById('dueVocab');
      if (!due.length) { dueEl.innerHTML=`<div style="color:var(--green);font-size:13px;text-align:center;padding:8px">🎉 Không có từ nào cần ôn hôm nay!</div>`; }
      else dueEl.innerHTML = due.map(v=>`
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px">
        <span style="font-family:var(--serif);font-style:italic;color:var(--blue);font-size:15px">${v.word}</span>
        <span style="color:var(--muted)">${v.meaning_vi}</span>
      </div>`).join('');

      // Leaderboard preview
      const uids    = lb.map(r=>r.user_id);
      const lbProfs = uids.length ? await this.db.select('profiles',{select:'id,display_name,avatar_id',in:{id:uids}}) : [];
      const pMap    = Object.fromEntries(lbProfs.map(p=>[p.id,p]));
      const lbEl    = document.getElementById('lbPreview');
      lbEl.innerHTML = lb.map((r,i)=>{
        const p = pMap[r.user_id]||{};
        return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
          <div style="font-family:var(--serif);font-weight:700;color:${['#f59e0b','#9ca3af','#b45309','var(--muted)','var(--muted)'][i]};min-width:22px">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>
          <img src="${User.avatarUrl(p.avatar_id||1)}" style="width:28px;height:28px;border-radius:50%">
          <div style="flex:1;font-size:12px;font-weight:500">${p.display_name||'?'}</div>
          <div style="font-family:var(--mono);font-size:12px;color:var(--blue)">${r.total_xp} XP</div>
        </div>`;
      }).join('');
    } catch(e) { console.error(e); }
  }

  uploadHinata() { document.getElementById('hinataInput')?.click(); }

  setHinata(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target.result;
      localStorage.setItem('sh_hinata', url);
      this._showHinata(url);
    };
    reader.readAsDataURL(file);
  }

  _loadHinata() {
    const url = localStorage.getItem('sh_hinata');
    if (url) this._showHinata(url);
  }

  _showHinata(url) {
    const img = document.getElementById('hinataImg');
    const ph  = document.getElementById('hinataPlaceholder');
    if (img) { img.src=url; img.style.display='block'; img.onclick=()=>dashPage.uploadHinata(); }
    if (ph)  ph.style.display='none';
  }
}
