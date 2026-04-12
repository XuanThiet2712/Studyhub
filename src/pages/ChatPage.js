import { Toast } from '../components/index.js';
import { User }  from '../models/index.js';

export class ChatPage {
  constructor(db, realtime, store, bus) {
    this.db       = db;
    this.realtime = realtime;
    this.store    = store;
    this.bus      = bus;
    this._unsub   = null;
    this._room    = 'global';
    this._activeTab = 'chat';
  }

  render() {
    const user = new User(this.store.get('currentUser'));
    document.querySelector('.main').innerHTML = `
    <div class="page">
      <div class="page-header-row page-header">
        <div>
          <h1 class="page-title">💬 Cộng đồng</h1>
          <p class="page-sub">Trò chuyện · Bạn bè · ${(this.store.get('onlineUsers')||[]).length} người đang online</p>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" onclick="chatPage.switchTab('chat',this)">💬 Chat chung</button>
        <button class="tab" onclick="chatPage.switchTab('friends',this)">👥 Bạn bè</button>
        <button class="tab" onclick="chatPage.switchTab('online',this)">🟢 Đang online</button>
      </div>

      <!-- CHAT TAB -->
      <div id="tab-chat" style="display:grid;grid-template-columns:1fr 260px;gap:16px;height:calc(100vh - 240px)">
        <div style="display:flex;flex-direction:column;background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--shadow-sm)">
          <!-- Messages -->
          <div style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px" id="msgList">
            <div style="text-align:center;color:var(--muted);font-size:12px;font-family:var(--mono);padding:12px">
              Đang tải tin nhắn...
            </div>
          </div>

          <!-- Input -->
          <div style="padding:12px 16px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:center">
            <img src="${user.avatarUrl}" style="width:32px;height:32px;border-radius:50%;flex-shrink:0;border:2px solid var(--border)">
            <input class="form-input" id="chatInput" placeholder="Nhắn gì đó... (Enter để gửi)"
              onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();chatPage.sendMsg()}"
              style="flex:1;border-radius:99px;padding:8px 14px">
            <button class="btn btn-primary btn-sm" style="border-radius:99px;padding:8px 14px" onclick="chatPage.sendMsg()">Gửi ↗</button>
          </div>
        </div>

        <!-- Online sidebar -->
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="card" style="flex:1;overflow:hidden">
            <div class="card-title">🟢 Online ngay (<span id="onlineCnt">0</span>)</div>
            <div style="overflow-y:auto;max-height:calc(100% - 40px)" id="onlineList">
              <div style="text-align:center;color:var(--muted);font-size:12px;padding:12px">Đang tải...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- FRIENDS TAB -->
      <div id="tab-friends" style="display:none">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div>
            <div class="sec-hd">
              <span class="sec-hd-title">Bạn bè của bạn</span>
              <button class="btn btn-ghost btn-sm" onclick="chatPage.showAddFriend()">＋ Thêm bạn</button>
            </div>
            <div id="friendsList"><div class="empty"><div class="empty-icon">👥</div><div class="empty-text">Chưa có bạn bè</div></div></div>
          </div>
          <div>
            <div class="sec-hd"><span class="sec-hd-title">Lời mời kết bạn</span></div>
            <div id="requestsList"><div class="empty"><div class="empty-icon">📬</div><div class="empty-text">Không có lời mời</div></div></div>
          </div>
        </div>
      </div>

      <!-- ONLINE TAB -->
      <div id="tab-online" style="display:none">
        <div class="sec-hd"><span class="sec-hd-title">Ai đang online</span><span id="onlineBadge" class="badge badge-green">0 người</span></div>
        <div class="grid-auto" id="onlineGrid"></div>
      </div>

    </div>`;

    window.chatPage = this;
    this._loadMessages();
    this._subscribeToChat();
    this._updateOnlineUI();
    this.bus.on('presence:update', () => this._updateOnlineUI());
  }

  switchTab(tab, btn) {
    this._activeTab = tab;
    ['chat','friends','online'].forEach(t => document.getElementById(`tab-${t}`).style.display = 'none');
    document.getElementById(`tab-${tab}`).style.display = tab === 'chat' ? 'grid' : 'block';
    document.querySelectorAll('.tabs .tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (tab === 'friends') this._loadFriends();
    if (tab === 'online')  this._renderOnlineGrid();
  }

  async _loadMessages() {
    try {
      const msgs = await this.realtime.loadMessages(this._room, 60);
      const el   = document.getElementById('msgList');
      if (!msgs.length) { el.innerHTML = `<div style="text-align:center;color:var(--muted);font-size:12px;padding:20px">Chưa có tin nhắn. Là người đầu tiên nhắn gì đó! 👋</div>`; return; }
      el.innerHTML = msgs.map(m => this._renderMsg(m)).join('');
      el.scrollTop = el.scrollHeight;
    } catch(e) {
      console.error(e);
    }
  }

  _subscribeToChat() {
    if (this._unsub) this._unsub();
    this._unsub = this.realtime.subscribeToChat(this._room, async (msg) => {
      // Fetch sender
      const sender = await this.db.select('profiles', { select:'id,username,display_name,avatar_id', eq:{id: msg.sender_id}, single:true }).catch(()=>null);
      const full   = { ...msg, sender };
      const el     = document.getElementById('msgList');
      if (!el) return;
      const div = document.createElement('div');
      div.innerHTML = this._renderMsg(full);
      el.appendChild(div.firstChild);
      el.scrollTop = el.scrollHeight;
    });
  }

  _renderMsg(msg) {
    const me     = this.store.get('currentUser');
    const isMine = msg.sender_id === me?.id;
    const sender = msg.sender || {};
    const avaUrl = User.avatarUrl(sender.avatar_id || 1);
    const name   = sender.display_name || sender.username || '?';
    const time   = new Date(msg.created_at).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'});

    if (isMine) return `
    <div style="display:flex;justify-content:flex-end;gap:8px;align-items:flex-end">
      <div>
        <div class="chat-bubble mine">${this._escHtml(msg.content)}</div>
        <div class="chat-meta" style="text-align:right">${time}</div>
      </div>
      <img src="${avaUrl}" style="width:28px;height:28px;border-radius:50%;flex-shrink:0;border:1.5px solid var(--border)">
    </div>`;

    return `
    <div style="display:flex;gap:8px;align-items:flex-end">
      <img src="${avaUrl}" style="width:28px;height:28px;border-radius:50%;flex-shrink:0;border:1.5px solid var(--border)" title="${name}">
      <div>
        <div style="font-size:11px;color:var(--muted);font-family:var(--mono);margin-bottom:2px">${name}</div>
        <div class="chat-bubble theirs">${this._escHtml(msg.content)}</div>
        <div class="chat-meta">${time}</div>
      </div>
    </div>`;
  }

  async sendMsg() {
    const input = document.getElementById('chatInput');
    const text  = input.value.trim();
    if (!text) return;
    const user = this.store.get('currentUser');
    input.value = '';
    try {
      await this.realtime.sendMessage(user.id, text, this._room);
      // XP for chatting
      await this.db.update('profiles', user.id, { xp: (user.xp||0) + 1 });
    } catch(e) { Toast.err('Gửi tin thất bại!'); input.value = text; }
  }

  _updateOnlineUI() {
    const online = this.store.get('onlineUsers') || [];
    const cnt    = online.length;
    const elCnt  = document.getElementById('onlineCnt');
    if (elCnt) elCnt.textContent = cnt;
    const elBadge= document.getElementById('onlineBadge');
    if (elBadge) elBadge.textContent = `${cnt} người`;

    const el = document.getElementById('onlineList');
    if (!el) return;
    if (!online.length) { el.innerHTML = `<div style="text-align:center;color:var(--muted);font-size:12px;padding:12px">Chưa có ai online</div>`; return; }
    el.innerHTML = online.map(u => `
    <div style="display:flex;align-items:center;gap:8px;padding:7px 6px;border-radius:var(--r-md);transition:background .12s;cursor:default" onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">
      <div class="online-indicator">
        <img src="${User.avatarUrl(u.avatar_id||1)}" style="width:28px;height:28px;border-radius:50%;border:1.5px solid var(--border)">
      </div>
      <div>
        <div style="font-size:12px;font-weight:500">${u.display_name||u.username}</div>
        <div style="font-size:10px;color:var(--green);font-family:var(--mono)">● online</div>
      </div>
      <button class="btn btn-ghost btn-sm" style="margin-left:auto;padding:3px 8px;font-size:10px" onclick="chatPage.addFriend('${u.id}')">＋</button>
    </div>`).join('');
  }

  _renderOnlineGrid() {
    const online = this.store.get('onlineUsers') || [];
    const el     = document.getElementById('onlineGrid');
    if (!el) return;
    if (!online.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">🌐</div><div class="empty-text">Chưa có ai online</div></div>`; return; }
    el.innerHTML = online.map(u => `
    <div class="card" style="text-align:center;padding:20px">
      <div class="online-indicator" style="display:inline-block;margin-bottom:10px">
        <img src="${User.avatarUrl(u.avatar_id||1)}" style="width:56px;height:56px;border-radius:50%;border:2px solid var(--border)">
      </div>
      <div style="font-size:14px;font-weight:600">${u.display_name||u.username}</div>
      <div style="font-size:11px;color:var(--muted);font-family:var(--mono);margin:4px 0">⭐ ${u.xp||0} XP</div>
      <div style="font-size:11px;color:var(--green)">● Đang online</div>
      <div style="display:flex;gap:6px;justify-content:center;margin-top:12px">
        <button class="btn btn-ghost btn-sm" onclick="chatPage.addFriend('${u.id}')">👥 Kết bạn</button>
        <button class="btn btn-primary btn-sm" onclick="app.router.navigate('/game')">⚔️ Thách đấu</button>
      </div>
    </div>`).join('');
  }

  async _loadFriends() {
    const me = this.store.get('currentUser');
    try {
      const [sent, received] = await Promise.all([
        this.db.select('friendships', { eq:{ requester: me.id, status:'accepted' } }),
        this.db.select('friendships', { eq:{ addressee: me.id } }),
      ]);
      const friendIds = [
        ...sent.map(f => f.addressee),
        ...received.filter(f=>f.status==='accepted').map(f=>f.requester)
      ];
      const pendingIds = received.filter(f=>f.status==='pending').map(f=>({id:f.id, uid:f.requester}));

      // Load profiles
      let friends = [], pendingProfiles = [];
      if (friendIds.length) {
        friends = await this.db.select('profiles', { select:'id,username,display_name,avatar_id,xp,is_online', in:{id:friendIds} });
      }
      if (pendingIds.length) {
        const pids = pendingIds.map(p=>p.uid);
        const profs= await this.db.select('profiles', { select:'id,username,display_name,avatar_id', in:{id:pids} });
        pendingProfiles = pendingIds.map(p => ({ friendshipId:p.id, ...profs.find(pr=>pr.id===p.uid) }));
      }

      this._renderFriends(friends);
      this._renderRequests(pendingProfiles);
    } catch(e) { console.error(e); }
  }

  _renderFriends(friends) {
    const el = document.getElementById('friendsList');
    if (!el) return;
    if (!friends.length) { el.innerHTML=`<div class="empty"><div class="empty-icon">👥</div><div class="empty-text">Chưa có bạn bè</div></div>`; return; }
    el.innerHTML = friends.map(f=>`
    <div class="lb-row" style="margin-bottom:8px">
      <div class="online-indicator" style="${f.is_online?'':'opacity:.6'}">
        <img src="${User.avatarUrl(f.avatar_id)}" style="width:36px;height:36px;border-radius:50%;border:2px solid var(--border)">
      </div>
      <div>
        <div style="font-size:13px;font-weight:500">${f.display_name}</div>
        <div style="font-size:11px;color:var(--muted);font-family:var(--mono)">⭐ ${f.xp} XP · ${f.is_online?'<span style="color:var(--green)">● online</span>':'offline'}</div>
      </div>
      <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="app.router.navigate('/game')">⚔️</button>
    </div>`).join('');
  }

  _renderRequests(pending) {
    const el = document.getElementById('requestsList');
    if (!el) return;
    if (!pending.length) { el.innerHTML=`<div class="empty"><div class="empty-icon">📬</div><div class="empty-text">Không có lời mời</div></div>`; return; }
    el.innerHTML = pending.map(p=>`
    <div class="lb-row" style="margin-bottom:8px">
      <img src="${User.avatarUrl(p.avatar_id)}" style="width:36px;height:36px;border-radius:50%">
      <div style="flex:1"><div style="font-size:13px;font-weight:500">${p.display_name}</div></div>
      <button class="btn btn-success btn-sm" onclick="chatPage.acceptFriend('${p.friendshipId}')">✓</button>
      <button class="btn btn-danger btn-sm" onclick="chatPage.declineFriend('${p.friendshipId}')">✕</button>
    </div>`).join('');
  }

  showAddFriend() {
    const modal = document.createElement('div');
    modal.className = 'overlay open';
    modal.innerHTML = `
    <div class="modal modal-sm">
      <div class="modal-title">👥 Thêm bạn bè</div>
      <div class="form-group">
        <label class="form-label">Tên đăng nhập của bạn</label>
        <input class="form-input" id="addFriendInput" placeholder="username">
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Hủy</button>
        <button class="btn btn-primary" onclick="chatPage.sendFriendReq()">Gửi lời mời</button>
      </div>
    </div>`;
    modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  async sendFriendReq() {
    const username = document.getElementById('addFriendInput')?.value?.trim();
    if (!username) return;
    const me = this.store.get('currentUser');
    try {
      const target = await this.db.select('profiles', { eq:{username}, single:true });
      if (target.id === me.id) { Toast.err('Không thể kết bạn với chính mình!'); return; }
      await this.db.insert('friendships', { requester: me.id, addressee: target.id, status:'pending' });
      document.querySelector('.overlay')?.remove();
      Toast.ok(`Đã gửi lời mời đến ${target.display_name}!`);
    } catch(e) { Toast.err(e.message==='not found'?'Không tìm thấy user!':'Đã gửi lời mời trước đó!'); }
  }

  async addFriend(targetId) {
    const me = this.store.get('currentUser');
    if (targetId === me.id) { Toast.info('Đó là chính bạn!'); return; }
    try {
      await this.db.insert('friendships', { requester: me.id, addressee: targetId, status:'pending' });
      Toast.ok('Đã gửi lời mời kết bạn!');
    } catch { Toast.info('Đã gửi lời mời trước đó'); }
  }

  async acceptFriend(fid) {
    await this.db.update('friendships', fid, { status:'accepted' });
    Toast.ok('Đã chấp nhận kết bạn!');
    this._loadFriends();
  }

  async declineFriend(fid) {
    await this.db.delete('friendships', fid);
    this._loadFriends();
  }

  _escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  destroy() { if (this._unsub) this._unsub(); }
}
