import { User } from '../models/index.js';

export class LeaderboardPage {
  constructor(db, store) {
    this.db    = db;
    this.store = store;
    this._tab  = 'xp';
  }

  render() {
    document.querySelector('.main').innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">🏆 Bảng xếp hạng</h1>
        <p class="page-sub">Top học viên StudyHub · Cập nhật realtime</p>
      </div>

      <div class="tabs">
        <button class="tab active" onclick="lbPage.switchTab('xp',this)">⭐ Tổng XP</button>
        <button class="tab" onclick="lbPage.switchTab('vocab',this)">📖 Từ vựng</button>
        <button class="tab" onclick="lbPage.switchTab('study',this)">📅 Ngày học</button>
        <button class="tab" onclick="lbPage.switchTab('games',this)">🎮 Trận thắng</button>
      </div>

      <!-- TOP 3 PODIUM -->
      <div id="podium" style="display:flex;justify-content:center;align-items:flex-end;gap:12px;margin-bottom:28px;padding:0 20px"></div>

      <!-- LIST -->
      <div id="lbList"></div>
    </div>`;

    window.lbPage = this;
    this.loadLeaderboard('xp');
  }

  switchTab(tab, btn) {
    this._tab = tab;
    document.querySelectorAll('.tabs .tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    this.loadLeaderboard(tab);
  }

  async loadLeaderboard(tab) {
    const colMap  = { xp:'total_xp', vocab:'vocab_count', study:'study_days', games:'games_won' };
    const col     = colMap[tab] || 'total_xp';
    const labelMap= { xp:'XP', vocab:'từ', study:'ngày', games:'trận thắng' };
    const label   = labelMap[tab]||'XP';

    document.getElementById('lbList').innerHTML = `<div style="text-align:center;color:var(--muted);padding:20px;font-family:var(--mono)">Đang tải...</div>`;

    try {
      const rows = await this.db.select('leaderboard_cache',{
        select:'*',
        order:{ col, asc:false },
        limit: 50
      });
      const uids = rows.map(r=>r.user_id);
      if (!uids.length) { document.getElementById('lbList').innerHTML='<div class="empty"><div class="empty-icon">🏆</div><div class="empty-text">Chưa có dữ liệu</div></div>'; return; }
      const profiles= await this.db.select('profiles',{
        select:'id,username,display_name,avatar_id,xp,level,is_online,streak',
        in:{ id: uids }
      });
      const pMap = Object.fromEntries(profiles.map(p=>[p.id,p]));
      const full = rows.map((r,i)=>({ rank:i+1, data:r, profile:pMap[r.user_id]||{} })).filter(r=>r.profile.id);

      this._renderPodium(full.slice(0,3), col, label);
      this._renderList(full.slice(3), col, label);
    } catch(e) { console.error(e); document.getElementById('lbList').innerHTML='<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-text">Lỗi tải dữ liệu</div></div>'; }
  }

  _renderPodium(top3, col, label) {
    const podium= document.getElementById('podium');
    const order = [top3[1], top3[0], top3[2]].filter(Boolean);
    const heights= { 0:100, 1:130, 2:80 };
    const medals = { 0:'🥈', 1:'🥇', 2:'🥉' };
    const bgCols = { 0:'#9ca3af', 1:'#f59e0b', 2:'#b45309' };
    const labelIdx= order.findIndex(r=>r?.rank===1);

    podium.innerHTML = order.map((r,i)=>{
      if(!r) return '';
      const p = r.profile;
      const val= r.data[col] || 0;
      const h  = i===1 ? 130 : i===0 ? 100 : 80;
      return `
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <div style="font-size:20px">${medals[i]}</div>
        <div class="${p.is_online?'online-indicator':''}">
          <img src="${User.avatarUrl(p.avatar_id||1)}" style="width:${i===1?60:48}px;height:${i===1?60:48}px;border-radius:50%;border:3px solid ${bgCols[i]}">
        </div>
        <div style="font-size:12px;font-weight:600;text-align:center;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.display_name||p.username}</div>
        <div style="width:${i===1?100:80}px;height:${h}px;background:${bgCols[i]};border-radius:var(--r-md) var(--r-md) 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white">
          <div style="font-family:var(--serif);font-style:italic;font-size:${i===1?22:18}px;font-weight:700">${val}</div>
          <div style="font-size:10px;opacity:.8;font-family:var(--mono)">${label}</div>
        </div>
      </div>`;
    }).join('');
  }

  _renderList(rows, col, label) {
    const me = this.store.get('currentUser');
    const el = document.getElementById('lbList');
    if (!rows.length) { el.innerHTML=''; return; }
    el.innerHTML = rows.map(r=>{
      const p    = r.profile;
      const val  = r.data[col] || 0;
      const isMe = p.id === me?.id;
      return `
      <div class="lb-row ${isMe?'':''}">
        <div class="lb-rank" style="color:var(--muted)">${r.rank}</div>
        <div class="${p.is_online?'online-indicator':''}">
          <img src="${User.avatarUrl(p.avatar_id||1)}" style="width:36px;height:36px;border-radius:50%;border:2px solid ${isMe?'var(--blue)':'var(--border)'}">
        </div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:${isMe?'700':'500'};color:${isMe?'var(--blue-d)':'var(--text)'}">${p.display_name} ${isMe?'<span class="badge badge-blue">Bạn</span>':''}</div>
          <div style="font-size:11px;color:var(--muted);font-family:var(--mono)">Cấp ${p.level||1} · ${p.streak||0} ngày streak</div>
        </div>
        <div style="font-family:var(--serif);font-style:italic;font-size:18px;font-weight:700;color:var(--blue)">${val} <span style="font-size:11px;color:var(--muted)">${label}</span></div>
      </div>`;
    }).join('');
  }
}
