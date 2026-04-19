import { Toast } from '../components/index.js';
import { User }  from '../models/index.js';

export class FriendsPage {
  constructor(db, store, bus, realtime) {
    this.db = db; this.store = store; this.bus = bus; this.realtime = realtime;
    this._friends = []; this._requests = []; this._search = ''; this._searchResults = [];
    this._notifSub = null;
  }

  render() {
    document.querySelector('.main').innerHTML = `
    <div class="page">
      <div class="page-header-row page-header">
        <div><h1 class="page-title">👥 Bạn bè</h1><p class="page-sub">Kết bạn · Thách đấu · Cùng học</p></div>
      </div>

      <!-- NOTIFICATION BELL -->
      <div id="friendNotifs" style="display:none;background:var(--orange-l);border:1px solid var(--orange);border-radius:var(--r-lg);padding:12px 16px;margin-bottom:16px;align-items:center;gap:10px">
        <span style="font-size:20px">🔔</span>
        <span id="friendNotifText" style="font-size:13px;font-weight:500;color:var(--orange)"></span>
      </div>

      <!-- TABS -->
      <div class="tabs" style="margin-bottom:20px">
        <button class="tab active" onclick="friendsPage.showTab('friends',this)">👥 Bạn bè <span id="friendsBadge" style="display:none" class="nav-badge"></span></button>
        <button class="tab" onclick="friendsPage.showTab('requests',this)">📨 Lời mời <span id="reqBadge" style="display:none;background:var(--red);color:white;padding:1px 7px;border-radius:99px;font-size:11px;font-weight:700"></span></button>
        <button class="tab" onclick="friendsPage.showTab('search',this)">🔍 Tìm bạn</button>
        <button class="tab" onclick="friendsPage.showTab('challenge',this)">⚔️ Thách đấu</button>
      </div>

      <div id="friendTabContent"></div>
    </div>

    <!-- CHALLENGE MODAL -->
    <div class="modal-overlay" id="challengeModal">
      <div class="modal" style="max-width:460px;text-align:center">
        <div style="font-size:48px;margin-bottom:12px">⚔️</div>
        <div class="modal-title" style="margin-bottom:6px">Thách đấu từ vựng!</div>
        <div id="challengeModalBody" style="font-size:14px;color:var(--muted);margin-bottom:20px"></div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-ghost" onclick="friendsPage.declineChallenge()" id="challengeDeclineBtn">❌ Từ chối</button>
          <button class="btn btn-primary" onclick="friendsPage.acceptChallenge()" id="challengeAcceptBtn">✅ Chấp nhận</button>
        </div>
      </div>
    </div>`;

    window.friendsPage = this;
    this.loadAll();
    this.subscribeToNotifications();
  }

  async loadAll() {
    await Promise.all([this.loadFriends(), this.loadRequests()]);
    this.showTab('friends', document.querySelector('.tab.active'));
  }

  async loadFriends() {
    const user = this.store.get('currentUser');
    try {
      const rows = await this.db.client.from('friendships').select(`
        id, status, requester, addressee,
        req:profiles!friendships_requester_fkey(id,username,display_name,avatar_id,xp,level,last_active),
        adr:profiles!friendships_addressee_fkey(id,username,display_name,avatar_id,xp,level,last_active)
      `).eq('status','accepted').or(`requester.eq.${user.id},addressee.eq.${user.id}`);
      this._friends = (rows.data||[]).map(r => {
        const friend = r.requester === user.id ? r.adr : r.req;
        return { friendshipId: r.id, ...friend };
      });
    } catch(e) { console.error(e); this._friends = []; }
  }

  async loadRequests() {
    const user = this.store.get('currentUser');
    try {
      const rows = await this.db.client.from('friendships').select(`
        id, status, requester,
        req:profiles!friendships_requester_fkey(id,username,display_name,avatar_id,xp)
      `).eq('addressee', user.id).eq('status','pending');
      this._requests = rows.data || [];
      const badge = document.getElementById('reqBadge');
      if (badge) { badge.textContent = this._requests.length || ''; badge.style.display = this._requests.length ? 'inline' : 'none'; }
    } catch(e) { this._requests = []; }
  }

  showTab(tab, btn) {
    if (btn) { document.querySelectorAll('.tabs .tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
    const el = document.getElementById('friendTabContent');
    if (tab === 'friends')   this.renderFriends(el);
    if (tab === 'requests')  this.renderRequests(el);
    if (tab === 'search')    this.renderSearch(el);
    if (tab === 'challenge') this.renderChallenges(el);
  }

  renderFriends(el) {
    if (!this._friends.length) {
      el.innerHTML = `<div class="empty"><div class="empty-icon">👥</div><div class="empty-text">Chưa có bạn bè nào</div><p style="font-size:13px;color:var(--muted)">Tìm và kết bạn để cùng học!</p></div>`;
      return;
    }
    const online = new Set((this.store.get('onlineUsers')||[]).map(u=>u.id));
    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
      ${this._friends.map(f => {
        const u = new User(f); const isOnline = online.has(f.id);
        return `<div class="card" style="text-align:center;padding:20px;position:relative">
          ${isOnline?`<div style="position:absolute;top:12px;right:12px;width:10px;height:10px;border-radius:50%;background:var(--green);box-shadow:0 0 0 2px var(--surface)"></div>`:''}
          <img src="${u.avatarUrl}" style="width:64px;height:64px;border-radius:50%;border:2px solid var(--border);margin-bottom:10px" onerror="this.style.display='none'">
          <div style="font-size:14px;font-weight:600">${f.display_name||f.username}</div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px">@${f.username}</div>
          <div style="font-size:12px;color:var(--blue);margin-bottom:12px">⭐ ${f.xp||0} XP · Lv ${f.level||1}</div>
          <div style="font-size:11px;color:${isOnline?'var(--green)':'var(--muted)'};margin-bottom:12px">${isOnline?'🟢 Đang online':'⚫ Offline'}</div>
          <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" onclick="friendsPage.sendChallenge('${f.id}','${(f.display_name||f.username).replace(/'/g,'_')}')">⚔️ Thách đấu</button>
            <button class="btn btn-ghost btn-sm" onclick="friendsPage.removeFriend('${f.friendshipId}','${f.display_name||f.username}')">🗑</button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  renderRequests(el) {
    if (!this._requests.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">📨</div><div class="empty-text">Không có lời mời kết bạn nào</div></div>`; return; }
    el.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px;max-width:500px">
      ${this._requests.map(r => {
        const u = new User(r.req); return `<div class="card" style="display:flex;align-items:center;gap:14px;padding:14px">
          <img src="${u.avatarUrl}" style="width:48px;height:48px;border-radius:50%;border:1px solid var(--border)" onerror="this.style.display='none'">
          <div style="flex:1">
            <div style="font-size:14px;font-weight:600">${r.req?.display_name||r.req?.username}</div>
            <div style="font-size:11px;color:var(--muted)">@${r.req?.username} · ⭐${r.req?.xp||0} XP</div>
            <div style="font-size:11px;color:var(--muted)">Muốn kết bạn với bạn</div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-success btn-sm" onclick="friendsPage.acceptRequest('${r.id}')">✅</button>
            <button class="btn btn-danger btn-sm" onclick="friendsPage.declineRequest('${r.id}')">❌</button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  renderSearch(el) {
    el.innerHTML = `<div style="max-width:560px">
      <div style="display:flex;gap:8px;margin-bottom:20px">
        <input class="form-input" id="friendSearchInput" placeholder="Tìm theo username..." style="flex:1" onkeydown="if(event.key==='Enter')friendsPage.searchUsers()">
        <button class="btn btn-primary" onclick="friendsPage.searchUsers()" id="friendSearchBtn">🔍 Tìm</button>
      </div>
      <div id="friendSearchResults"></div>
    </div>`;
  }

  async searchUsers() {
    const q = document.getElementById('friendSearchInput').value.trim();
    if (!q || q.length < 2) { Toast.err('Nhập ít nhất 2 ký tự'); return; }
    const btn = document.getElementById('friendSearchBtn'); btn.textContent='⏳'; btn.disabled=true;
    const user = this.store.get('currentUser');
    try {
      const rows = await this.db.client.from('profiles').select('id,username,display_name,avatar_id,xp,level').ilike('username',`%${q}%`).neq('id',user.id).limit(10);
      const el = document.getElementById('friendSearchResults');
      const myFriendIds = new Set(this._friends.map(f=>f.id));
      if (!rows.data?.length) { el.innerHTML=`<div class="empty"><div class="empty-text">Không tìm thấy user "@${q}"</div></div>`; return; }
      el.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px">
        ${rows.data.map(p => {
          const u = new User(p); const isFriend = myFriendIds.has(p.id);
          return `<div class="card" style="display:flex;align-items:center;gap:12px;padding:12px">
            <img src="${u.avatarUrl}" style="width:44px;height:44px;border-radius:50%;border:1px solid var(--border)" onerror="this.style.display='none'">
            <div style="flex:1"><div style="font-size:14px;font-weight:600">${p.display_name||p.username}</div><div style="font-size:11px;color:var(--muted)">@${p.username} · ⭐${p.xp||0} XP</div></div>
            ${isFriend?`<span style="font-size:12px;color:var(--green)">✅ Bạn bè</span>`:
            `<button class="btn btn-primary btn-sm" onclick="friendsPage.sendRequest('${p.id}','${(p.display_name||p.username).replace(/'/g,'_')}',this)">➕ Kết bạn</button>`}
          </div>`;
        }).join('')}
      </div>`;
    } catch(e) { Toast.err('Lỗi tìm kiếm'); }
    finally { btn.textContent='🔍 Tìm'; btn.disabled=false; }
  }

  renderChallenges(el) {
    const onlineFriends = (this.store.get('onlineUsers')||[]).filter(u => this._friends.some(f=>f.id===u.id));
    el.innerHTML = `<div style="max-width:560px">
      <div style="background:linear-gradient(135deg,var(--blue-l),var(--purple-l));border-radius:var(--r-xl);padding:24px;margin-bottom:20px;text-align:center">
        <div style="font-size:40px;margin-bottom:8px">⚔️</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:6px">Thách đấu từ vựng</div>
        <div style="font-size:13px;color:var(--muted)">Thách bạn bè thi từ vựng TOEIC real-time</div>
      </div>
      <h3 style="font-size:14px;font-weight:600;margin-bottom:12px">🟢 Bạn bè đang online (${onlineFriends.length})</h3>
      ${onlineFriends.length ? `<div style="display:flex;flex-direction:column;gap:8px">
        ${onlineFriends.map(f => `<div class="card" style="display:flex;align-items:center;gap:12px;padding:12px">
          <div style="width:10px;height:10px;border-radius:50%;background:var(--green);flex-shrink:0"></div>
          <div style="flex:1"><div style="font-size:14px;font-weight:600">${f.display_name||f.username}</div><div style="font-size:11px;color:var(--muted)">@${f.username}</div></div>
          <button class="btn btn-primary btn-sm" onclick="friendsPage.sendChallenge('${f.id}','${(f.display_name||f.username||'').replace(/'/g,'_')}')">⚔️ Thách</button>
        </div>`).join('')}
      </div>` : `<div class="empty"><div class="empty-icon">🌙</div><div class="empty-text">Không có bạn nào online</div></div>`}
      <div style="margin-top:20px;padding:14px;background:var(--bg2);border-radius:var(--r-lg)">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px">💡 Cách thách đấu:</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.8">1. Chọn bạn bè đang online ở trên<br>2. Gửi lời thách đấu — họ sẽ nhận thông báo<br>3. Khi cả hai vào Game → Word Battle là thi đấu!</div>
      </div>
    </div>`;
  }

  async sendRequest(toId, toName, btn) {
    const user = this.store.get('currentUser');
    try {
      await this.db.insert('friendships', { requester: user.id, addressee: toId, status: 'pending' });
      btn.textContent = '⏳ Đã gửi'; btn.disabled = true; btn.style.background = 'var(--muted)';
      Toast.ok(`Đã gửi lời mời kết bạn đến @${toName}!`);
      // Real-time notify
      this.db.client.channel(`notify:${toId}`).send({ type:'broadcast', event:'friend_request', payload:{ from: user.username||user.display_name, userId: user.id }});
    } catch(e) { Toast.err(e.message?.includes('unique') ? 'Đã gửi lời mời rồi!' : 'Lỗi gửi lời mời'); }
  }

  async acceptRequest(friendshipId) {
    try {
      await this.db.client.from('friendships').update({ status:'accepted' }).eq('id', friendshipId);
      Toast.ok('Đã chấp nhận kết bạn! 🎉');
      await this.loadAll(); this.showTab('friends', null);
    } catch(e) { Toast.err('Lỗi'); }
  }

  async declineRequest(friendshipId) {
    try {
      await this.db.client.from('friendships').delete().eq('id', friendshipId);
      this._requests = this._requests.filter(r=>r.id!==friendshipId);
      this.showTab('requests', null); Toast.info('Đã từ chối lời mời');
    } catch(e) { Toast.err('Lỗi'); }
  }

  async removeFriend(friendshipId, name) {
    if (!confirm(`Xóa ${name} khỏi danh sách bạn bè?`)) return;
    try {
      await this.db.client.from('friendships').delete().eq('id', friendshipId);
      this._friends = this._friends.filter(f=>f.friendshipId!==friendshipId);
      Toast.ok('Đã xóa bạn bè'); this.showTab('friends', null);
    } catch(e) { Toast.err('Lỗi'); }
  }

  sendChallenge(toId, toName) {
    const user = this.store.get('currentUser');
    try {
      this.db.client.channel(`notify:${toId}`).subscribe().then?.(() => {});
      this.db.client.channel(`notify:${toId}`).send({
        type:'broadcast', event:'challenge',
        payload:{ from: user.display_name||user.username, fromId: user.id, message:`${user.display_name||user.username} thách bạn thi đấu từ vựng!` }
      });
      Toast.ok(`Đã gửi thách đấu đến ${toName}! 🔥`);
      // Navigate to game
      setTimeout(() => this.bus?.emit('navigate','/game') || app?.router?.navigate('/game'), 1000);
    } catch(e) { Toast.err('Lỗi gửi thách đấu'); }
  }

  subscribeToNotifications() {
    const user = this.store.get('currentUser');
    if (!user) return;
    const ch = this.db.client.channel(`notify:${user.id}`);
    ch.on('broadcast', { event: 'friend_request' }, ({ payload }) => {
      Toast.info(`👋 @${payload.from} muốn kết bạn!`);
      const banner = document.getElementById('friendNotifs');
      const bannerText = document.getElementById('friendNotifText');
      if (banner && bannerText) {
        bannerText.textContent = `👋 @${payload.from} vừa gửi lời mời kết bạn! Xem tab "Lời mời".`;
        banner.style.display = 'flex';
        setTimeout(() => { banner.style.display = 'none'; }, 8000);
      }
      this.loadRequests();
    });
    ch.on('broadcast', { event: 'challenge' }, ({ payload }) => {
      this._pendingChallenge = payload;
      const modalBody = document.getElementById('challengeModalBody');
      const modal = document.getElementById('challengeModal');
      if (modalBody) modalBody.textContent = payload.message || `${payload.from} thách bạn thi đấu từ vựng!`;
      if (modal) modal.classList.add('open');
      Toast.info(`⚔️ ${payload.from} vừa thách bạn thi đấu!`);
    });
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') console.log('✅ Notification channel subscribed');
    });
    this._notifCh = ch;
  }

  acceptChallenge() {
    document.getElementById('challengeModal').classList.remove('open');
    Toast.ok('Vào Game để thi đấu! ⚔️');
    app?.router?.navigate('/game');
  }

  declineChallenge() { document.getElementById('challengeModal').classList.remove('open'); Toast.info('Đã từ chối thách đấu'); }
}
