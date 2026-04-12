import { Toast } from '../components/index.js';
import { User }  from '../models/index.js';

const EMOJIS = ['😀','😂','🥰','😎','🤔','😅','🎉','🔥','👍','❤️',
                '🙏','✨','😭','😤','🤩','💪','👀','😊','🥳','💯',
                '📚','✏️','🎓','💡','🧠','⭐','🏆','🎯','📝','🤝'];

export class ChatPage {
  constructor(db, realtime, store, bus) {
    this.db         = db;
    this.realtime   = realtime;
    this.store      = store;
    this.bus        = bus;
    this._unsub     = null;
    this._room      = 'global';
    this._activeTab = 'chat';
    this._pendingImageUrl = null;
  }

  render() {
    const user = new User(this.store.get('currentUser'));
    document.querySelector('.main').innerHTML = `
    <div class="page">
      <div class="page-header-row page-header">
        <div>
          <h1 class="page-title">💬 Cộng đồng</h1>
          <p class="page-sub">Trò chuyện · Bạn bè · <span id="headerOnlineCnt">${(this.store.get('onlineUsers')||[]).length}</span> người đang online</p>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" onclick="chatPage.switchTab('chat',this)">💬 Chat chung</button>
        <button class="tab" onclick="chatPage.switchTab('friends',this)">👥 Bạn bè</button>
        <button class="tab" onclick="chatPage.switchTab('online',this)">🟢 Đang online</button>
        <button class="tab" onclick="chatPage.switchTab('dm',this)">💌 Nhắn tin riêng</button>
      </div>

      <!-- CHAT TAB -->
      <div id="tab-chat" class="chat-layout">
        <div class="chat-box">

          <div class="chat-messages" id="msgList">
            <div style="text-align:center;color:var(--muted);font-size:13px;padding:30px">
              <div style="font-size:28px;margin-bottom:8px">💬</div>Đang tải tin nhắn...
            </div>
          </div>

          <!-- Emoji picker -->
          <div id="emojiPicker" class="chat-emoji-picker">
            ${EMOJIS.map(e=>`<button onclick="chatPage.insertEmoji('${e}')" style="font-size:19px;background:none;border:none;cursor:pointer;padding:2px 4px;border-radius:6px;transition:background .1s" onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background=''">${e}</button>`).join('')}
          </div>

          <!-- Input bar -->
          <div class="chat-input-bar">
            <div id="imgPreviewWrap" style="display:none;margin-bottom:8px;position:relative">
              <img id="imgPreview" style="max-height:80px;border-radius:8px;border:1px solid var(--border)">
              <button onclick="chatPage.clearImage()" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:#ef4444;color:#fff;border:none;font-size:11px;cursor:pointer;line-height:20px;text-align:center">✕</button>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <img src="${user.avatarUrl}" style="width:30px;height:30px;border-radius:50%;flex-shrink:0;border:2px solid var(--border)">
              <button title="Emoji" onclick="chatPage.toggleEmoji()" style="background:none;border:none;font-size:20px;cursor:pointer;padding:4px;border-radius:6px;flex-shrink:0">😊</button>
              <label title="Gửi ảnh" style="cursor:pointer;font-size:18px;padding:4px;border-radius:6px;flex-shrink:0">
                🖼️<input type="file" accept="image/*" style="display:none" onchange="chatPage.onImageSelected(event)">
              </label>
              <input class="form-input" id="chatInput" placeholder="Nhắn gì đó..."
                onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();chatPage.sendMsg()}"
                style="flex:1;border-radius:99px;padding:7px 12px;min-width:0">
              <button class="btn btn-primary btn-sm" style="border-radius:99px;flex-shrink:0" onclick="chatPage.sendMsg()">Gửi ↗</button>
            </div>
          </div>
        </div>

        <!-- Online sidebar -->
        <div class="chat-sidebar">
          <div class="card" style="flex:1;overflow:hidden">
            <div class="card-title">🟢 Online (<span id="onlineCnt">0</span>)</div>
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


      <!-- DM TAB -->
      <div id="tab-dm" style="display:none">
        <div style="display:grid;grid-template-columns:280px 1fr;gap:16px;height:calc(100vh - 280px)">
          <!-- Contact list -->
          <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;display:flex;flex-direction:column">
            <div style="padding:12px 14px;border-bottom:1px solid var(--border)">
              <input class="form-input" id="dmSearch" placeholder="🔍 Tìm bạn bè..." oninput="chatPage.searchDMContacts(this.value)" style="font-size:12px">
            </div>
            <div style="flex:1;overflow-y:auto" id="dmContactList">
              <div style="padding:16px;text-align:center;color:var(--muted);font-size:13px">Đang tải danh sách bạn bè...</div>
            </div>
          </div>
          <!-- Chat window -->
          <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;display:flex;flex-direction:column" id="dmChatWindow">
            <div style="padding:20px;text-align:center;color:var(--muted);margin:auto">
              <div style="font-size:40px;margin-bottom:10px">💌</div>
              <div style="font-weight:600;margin-bottom:4px">Chọn bạn để nhắn tin</div>
              <div style="font-size:12px">Tin nhắn riêng tư, chỉ 2 người xem được</div>
            </div>
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
    ['chat','friends','online','dm'].forEach(t => document.getElementById('tab-'+t)&&(document.getElementById('tab-'+t).style.display = 'none'));
    document.getElementById('tab-'+tab).style.display = tab === 'chat' ? 'grid' : 'block';
    document.querySelectorAll('.tabs .tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (tab === 'friends') this._loadFriends();
    if (tab === 'dm') this._loadDMContacts();
    if (tab === 'online')  this._renderOnlineGrid();
  }

  async _loadMessages() {
    try {
      const msgs = await this.realtime.loadMessages(this._room, 60);
      const el   = document.getElementById('msgList');
      if (!msgs.length) {
        el.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;padding:30px"><div style="font-size:32px;margin-bottom:8px">👋</div>Chưa có tin nhắn. Hãy là người đầu tiên nhắn!</div>';
        return;
      }
      el.innerHTML = msgs.map(m => this._renderMsg(m)).join('');
      el.scrollTop = el.scrollHeight;
    } catch(e) { console.error(e); }
  }

  _subscribeToChat() {
    if (this._unsub) this._unsub();

    const unsubIns = this.realtime.subscribeToChat(this._room, async (msg) => {
      const me = this.store.get('currentUser');
      if (msg.sender_id === me?.id) return; // skip own (optimistic already shown)
      const sender = await this.db.select('profiles', {
        select:'id,username,display_name,avatar_id', eq:{id: msg.sender_id}, single:true
      }).catch(()=>null);
      const full = { ...msg, sender };
      const el   = document.getElementById('msgList');
      if (!el) return;
      const div = document.createElement('div');
      div.innerHTML = this._renderMsg(full);
      el.appendChild(div.firstElementChild);
      el.scrollTop = el.scrollHeight;
    });

    const unsubDel = this.realtime.subscribeToChatDelete(this._room, (msgId) => {
      const el = document.getElementById('msg-'+msgId);
      if (el) {
        el.style.transition = 'opacity .25s,transform .25s';
        el.style.opacity = '0'; el.style.transform = 'scale(.95)';
        setTimeout(() => el.remove(), 260);
      }
    });

    this._unsub = () => { unsubIns(); unsubDel(); };
  }

  _renderMsg(msg) {
    const me      = this.store.get('currentUser');
    const isAdmin = me?.username === 'admin';
    const isMine  = msg.sender_id === me?.id;
    const sender  = msg.sender || {};
    const avaUrl  = User.avatarUrl(sender.avatar_id || 1);
    const name    = sender.display_name || sender.username || '?';
    const time    = new Date(msg.created_at).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'});
    const canDel  = isMine || isAdmin;

    const contentHtml = msg.image_url
      ? '<img src="'+msg.image_url+'" style="max-width:220px;max-height:180px;border-radius:10px;display:block;cursor:pointer" onclick="chatPage.openImage(\''+msg.image_url+'\')" loading="lazy">'
      : '<span>'+this._escHtml(msg.content)+'</span>';

    const delBtn = canDel
      ? '<button class="chat-del" data-id="'+msg.id+'" title="Xóa" onclick="chatPage.deleteMsg(\''+msg.id+'\')" style="opacity:0;background:none;border:none;cursor:pointer;font-size:13px;padding:2px 5px;border-radius:6px;color:var(--muted);transition:opacity .15s">🗑️</button>'
      : '';

    if (isMine) return '<div id="msg-'+msg.id+'" style="display:flex;justify-content:flex-end;gap:6px;align-items:flex-end;padding:2px 0" onmouseover="var b=this.querySelector(\'.chat-del\');if(b)b.style.opacity=\'1\'" onmouseout="var b=this.querySelector(\'.chat-del\');if(b)b.style.opacity=\'0\'">'+delBtn+'<div><div style="background:var(--primary,#6366f1);color:#fff;padding:8px 13px;border-radius:16px 16px 4px 16px;font-size:14px;max-width:320px;word-break:break-word;box-shadow:0 1px 4px rgba(0,0,0,.12)">'+contentHtml+'</div><div style="font-size:10px;color:var(--muted);text-align:right;margin-top:2px;font-family:var(--mono)">'+time+'</div></div><img src="'+avaUrl+'" style="width:28px;height:28px;border-radius:50%;flex-shrink:0;border:1.5px solid var(--border)"></div>';

    return '<div id="msg-'+msg.id+'" style="display:flex;gap:6px;align-items:flex-end;padding:2px 0" onmouseover="var b=this.querySelector(\'.chat-del\');if(b)b.style.opacity=\'1\'" onmouseout="var b=this.querySelector(\'.chat-del\');if(b)b.style.opacity=\'0\'"><img src="'+avaUrl+'" style="width:28px;height:28px;border-radius:50%;flex-shrink:0;border:1.5px solid var(--border)" title="'+name+'"><div><div style="font-size:11px;color:var(--muted);font-family:var(--mono);margin-bottom:2px">'+name+'</div><div style="background:var(--bg2,#f3f4f6);color:var(--text);padding:8px 13px;border-radius:16px 16px 16px 4px;font-size:14px;max-width:320px;word-break:break-word;box-shadow:0 1px 3px rgba(0,0,0,.07)">'+contentHtml+'</div><div style="font-size:10px;color:var(--muted);margin-top:2px;font-family:var(--mono)">'+time+'</div></div>'+delBtn+'</div>';
  }

  async sendMsg() {
    const input = document.getElementById('chatInput');
    const text  = input.value.trim();
    const user  = this.store.get('currentUser');
    if (!text && !this._pendingImageUrl) return;

    input.value = '';
    this.toggleEmoji(false);

    const tempId  = 'temp-' + Date.now();
    const tempMsg = {
      id: tempId, sender_id: user.id,
      content: text || '', image_url: this._pendingImageUrl || null,
      created_at: new Date().toISOString(), sender: user
    };
    const el  = document.getElementById('msgList');
    const div = document.createElement('div');
    div.innerHTML = this._renderMsg(tempMsg);
    el.appendChild(div.firstElementChild);
    el.scrollTop = el.scrollHeight;

    const imageUrl = this._pendingImageUrl || null;
    this.clearImage();

    try {
      const saved = await this.realtime.sendMessage(user.id, text || '', this._room, imageUrl);
      const tempEl = document.getElementById('msg-'+tempId);
      if (tempEl) tempEl.id = 'msg-'+saved.id;
      this.db.update('profiles', user.id, { xp: (user.xp||0) + 1 }).catch(()=>{});
    } catch(e) {
      Toast.err('Gửi tin thất bại!');
      document.getElementById('msg-'+tempId)?.remove();
      input.value = text;
    }
  }

  async deleteMsg(msgId) {
    const me = this.store.get('currentUser');
    if (!confirm('Xóa tin nhắn này?')) return;
    try {
      if (me?.username === 'admin') {
        await this.realtime.adminDeleteMessage(msgId);
      } else {
        await this.realtime.deleteMessage(msgId, me.id);
      }
      const el = document.getElementById('msg-'+msgId);
      if (el) { el.style.transition='opacity .2s'; el.style.opacity='0'; setTimeout(()=>el.remove(),200); }
    } catch(e) { Toast.err('Không thể xóa tin nhắn!'); }
  }

  toggleEmoji(force) {
    const el = document.getElementById('emojiPicker');
    if (!el) return;
    const show = force !== undefined ? force : el.style.display === 'none';
    el.style.display = show ? 'flex' : 'none';
  }

  insertEmoji(emoji) {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const pos = input.selectionStart || input.value.length;
    input.value = input.value.slice(0, pos) + emoji + input.value.slice(pos);
    input.focus();
    input.selectionStart = input.selectionEnd = pos + emoji.length;
  }

  async onImageSelected(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { Toast.err('Ảnh quá lớn! Tối đa 5MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const wrap = document.getElementById('imgPreviewWrap');
      const img  = document.getElementById('imgPreview');
      if (wrap && img) { img.src = ev.target.result; wrap.style.display = 'block'; }
    };
    reader.readAsDataURL(file);
    try {
      Toast.info('Đang tải ảnh...');
      const url = await this.realtime.uploadChatImage(file);
      this._pendingImageUrl = url;
      Toast.ok('Ảnh sẵn sàng! Nhấn Gửi để gửi.');
    } catch(e) { Toast.err('Upload ảnh thất bại: ' + e.message); this.clearImage(); }
  }

  clearImage() {
    this._pendingImageUrl = null;
    const wrap = document.getElementById('imgPreviewWrap');
    if (wrap) wrap.style.display = 'none';
  }

  openImage(url) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out';
    overlay.innerHTML = '<img src="'+url+'" style="max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.5)">';
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
  }

  _updateOnlineUI() {
    const online = this.store.get('onlineUsers') || [];
    const cnt    = online.length;
    ['onlineCnt','headerOnlineCnt'].forEach(id => { const e = document.getElementById(id); if(e) e.textContent = cnt; });
    const elBadge = document.getElementById('onlineBadge');
    if (elBadge) elBadge.textContent = cnt + ' người';
    const el = document.getElementById('onlineList');
    if (!el) return;
    if (!online.length) { el.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:12px">Chưa có ai online</div>'; return; }
    el.innerHTML = online.map(u => '<div style="display:flex;align-items:center;gap:8px;padding:7px 6px;border-radius:var(--r-md);transition:background .12s" onmouseover="this.style.background=\'var(--bg2)\'" onmouseout="this.style.background=\'\'"><div class="online-indicator"><img src="'+User.avatarUrl(u.avatar_id||1)+'" style="width:28px;height:28px;border-radius:50%;border:1.5px solid var(--border)"></div><div><div style="font-size:12px;font-weight:500">'+(u.display_name||u.username)+'</div><div style="font-size:10px;color:var(--green);font-family:var(--mono)">● online</div></div><button class="btn btn-ghost btn-sm" style="margin-left:auto;padding:3px 8px;font-size:10px" onclick="chatPage.addFriend(\''+u.id+'\')">＋</button></div>').join('');
  }

  _renderOnlineGrid() {
    const online = this.store.get('onlineUsers') || [];
    const el = document.getElementById('onlineGrid');
    if (!el) return;
    if (!online.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">🌐</div><div class="empty-text">Chưa có ai online</div></div>'; return; }
    el.innerHTML = online.map(u => '<div class="card" style="text-align:center;padding:20px"><div class="online-indicator" style="display:inline-block;margin-bottom:10px"><img src="'+User.avatarUrl(u.avatar_id||1)+'" style="width:56px;height:56px;border-radius:50%;border:2px solid var(--border)"></div><div style="font-size:14px;font-weight:600">'+(u.display_name||u.username)+'</div><div style="font-size:11px;color:var(--muted);font-family:var(--mono);margin:4px 0">⭐ '+(u.xp||0)+' XP</div><div style="font-size:11px;color:var(--green)">● Đang online</div><div style="display:flex;gap:6px;justify-content:center;margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="chatPage.addFriend(\''+u.id+'\')">👥 Kết bạn</button><button class="btn btn-primary btn-sm" onclick="app.router.navigate(\'/game\')">⚔️ Thách đấu</button></div></div>').join('');
  }

  async _loadFriends() {
    const me = this.store.get('currentUser');
    try {
      const [sent, received] = await Promise.all([
        this.db.select('friendships', { eq:{ requester: me.id, status:'accepted' } }),
        this.db.select('friendships', { eq:{ addressee: me.id } }),
      ]);
      const friendIds  = [...sent.map(f=>f.addressee), ...received.filter(f=>f.status==='accepted').map(f=>f.requester)];
      const pendingIds = received.filter(f=>f.status==='pending').map(f=>({id:f.id, uid:f.requester}));
      let friends = [], pendingProfiles = [];
      if (friendIds.length) friends = await this.db.select('profiles', { select:'id,username,display_name,avatar_id,xp,is_online', in:{id:friendIds} });
      if (pendingIds.length) {
        const profs = await this.db.select('profiles', { select:'id,username,display_name,avatar_id', in:{id:pendingIds.map(p=>p.uid)} });
        pendingProfiles = pendingIds.map(p => ({ friendshipId:p.id, ...profs.find(pr=>pr.id===p.uid) }));
      }
      this._renderFriends(friends);
      this._renderRequests(pendingProfiles);
    } catch(e) { console.error(e); }
  }

  _renderFriends(friends) {
    const el = document.getElementById('friendsList');
    if (!el) return;
    if (!friends.length) { el.innerHTML='<div class="empty"><div class="empty-icon">👥</div><div class="empty-text">Chưa có bạn bè</div></div>'; return; }
    el.innerHTML = friends.map(f=>'<div class="lb-row" style="margin-bottom:8px"><div class="online-indicator" style="'+(f.is_online?'':'opacity:.6')+'"><img src="'+User.avatarUrl(f.avatar_id)+'" style="width:36px;height:36px;border-radius:50%;border:2px solid var(--border)"></div><div><div style="font-size:13px;font-weight:500">'+f.display_name+'</div><div style="font-size:11px;color:var(--muted);font-family:var(--mono)">⭐ '+f.xp+' XP · '+(f.is_online?'<span style="color:var(--green)">● online</span>':'offline')+'</div></div><button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="app.router.navigate(\'/game\')">⚔️</button></div>').join('');
  }

  _renderRequests(pending) {
    const el = document.getElementById('requestsList');
    if (!el) return;
    if (!pending.length) { el.innerHTML='<div class="empty"><div class="empty-icon">📬</div><div class="empty-text">Không có lời mời</div></div>'; return; }
    el.innerHTML = pending.map(p=>'<div class="lb-row" style="margin-bottom:8px"><img src="'+User.avatarUrl(p.avatar_id)+'" style="width:36px;height:36px;border-radius:50%"><div style="flex:1"><div style="font-size:13px;font-weight:500">'+p.display_name+'</div></div><button class="btn btn-success btn-sm" onclick="chatPage.acceptFriend(\''+p.friendshipId+'\')">✓</button><button class="btn btn-danger btn-sm" onclick="chatPage.declineFriend(\''+p.friendshipId+'\')">✕</button></div>').join('');
  }

  showAddFriend() {
    const modal = document.createElement('div');
    modal.className = 'overlay open';
    modal.innerHTML = '<div class="modal modal-sm"><div class="modal-title">👥 Thêm bạn bè</div><div class="form-group"><label class="form-label">Tên đăng nhập của bạn</label><input class="form-input" id="addFriendInput" placeholder="username"></div><div class="modal-footer"><button class="btn btn-ghost" onclick="this.closest(\'.overlay\').remove()">Hủy</button><button class="btn btn-primary" onclick="chatPage.sendFriendReq()">Gửi lời mời</button></div></div>';
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
      Toast.ok('Đã gửi lời mời đến ' + target.display_name + '!');
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
  // ── DIRECT MESSAGES ──────────────────────────────────────
  async _loadDMContacts() {
    const me = this.store.get('currentUser');
    const el = document.getElementById('dmContactList');
    if (!el) return;
    try {
      const [sent, recv] = await Promise.all([
        this.db.select('friendships',{eq:{requester:me.id,status:'accepted'}}).catch(()=>[]),
        this.db.select('friendships',{eq:{addressee:me.id,status:'accepted'}}).catch(()=>[]),
      ]);
      const friendIds = [
        ...sent.map(f=>f.addressee),
        ...recv.map(f=>f.requester),
      ].filter(Boolean);
      if (!friendIds.length) { el.innerHTML='<div style="padding:16px;text-align:center;color:var(--muted);font-size:13px">Chưa có bạn bè nào. Thêm bạn bè ở tab Bạn bè!</div>'; return; }
      const friends = await this.db.select('profiles',{select:'id,username,display_name,avatar_id,is_online,xp',in:{id:friendIds}});
      this._dmFriends = friends;
      this._renderDMContacts(friends);
    } catch(e) { el.innerHTML='<div style="padding:16px;color:var(--red);font-size:12px">Lỗi tải danh sách</div>'; }
  }

  _renderDMContacts(friends) {
    const el = document.getElementById('dmContactList');
    if (!el) return;
    el.innerHTML = friends.map(f => `
    <div onclick="chatPage.openDM('${f.id}','${f.display_name.replace(/'/g,"\\'")}','${f.avatar_id}')"
      style="display:flex;gap:10px;align-items:center;padding:12px 14px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .1s" id="dmContact_${f.id}"
      onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background='transparent'">
      <div style="position:relative;flex-shrink:0">
        <img src="${User.avatarUrl(f.avatar_id)}" style="width:38px;height:38px;border-radius:50%;border:2px solid var(--border)">
        <div style="position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;background:${f.is_online?'var(--green)':'var(--muted)'};border:2px solid var(--white)"></div>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.display_name}</div>
        <div style="font-size:11px;color:var(--muted)">${f.is_online?'<span style="color:var(--green)">● online</span>':'offline'}</div>
      </div>
    </div>`).join('');
  }

  searchDMContacts(q) {
    if (!this._dmFriends) return;
    const filtered = this._dmFriends.filter(f => f.display_name.toLowerCase().includes(q.toLowerCase()) || f.username.toLowerCase().includes(q.toLowerCase()));
    this._renderDMContacts(filtered);
  }

  async openDM(friendId, friendName, avatarId) {
    this._dmFriendId = friendId;
    this._dmFriendName = friendName;
    // Highlight selected contact
    document.querySelectorAll('[id^="dmContact_"]').forEach(el => el.style.background = 'transparent');
    const sel = document.getElementById(`dmContact_${friendId}`);
    if (sel) sel.style.background = 'var(--blue-l)';

    const me = this.store.get('currentUser');
    const roomKey = [me.id, friendId].sort().join('_');
    this._dmRoom = `dm_${roomKey}`;

    const win = document.getElementById('dmChatWindow');
    win.innerHTML = `
    <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:var(--bg2)">
      <img src="${User.avatarUrl(avatarId)}" style="width:34px;height:34px;border-radius:50%">
      <div><div style="font-size:14px;font-weight:600">${friendName}</div><div style="font-size:11px;color:var(--muted)">Tin nhắn riêng</div></div>
      <button onclick="app.router.navigate('/game')" class="btn btn-ghost btn-sm" style="margin-left:auto">⚔️ Thách đấu</button>
    </div>
    <div id="dmMessages" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;min-height:0"></div>
    <div style="padding:10px 12px;border-top:1px solid var(--border);display:flex;gap:8px;background:var(--bg2)">
      <input class="form-input" id="dmInput" placeholder="Nhắn tin..." style="flex:1;font-size:13px" onkeydown="if(event.key==='Enter')chatPage.sendDM()">
      <button class="btn btn-primary btn-sm" onclick="chatPage.sendDM()">➤</button>
    </div>`;

    // Load messages
    await this._loadDMMessages();

    // Subscribe realtime
    if (this._dmUnsub) this._dmUnsub.unsubscribe?.();
    this._dmUnsub = this.db.subscribe(
      `dm:${this._dmRoom}`,
      {event:'INSERT',schema:'public',table:'chat_messages',filter:`room=eq.${this._dmRoom}`},
      payload => this._appendDMMsg(payload.new, false)
    );
  }

  async _loadDMMessages() {
    try {
      const msgs = await this.db.select('chat_messages',{
        eq:{room:this._dmRoom},
        order:{col:'created_at',asc:true},
        limit:50
      });
      const el = document.getElementById('dmMessages');
      if (!el) return;
      el.innerHTML = '';
      msgs.forEach(m => this._appendDMMsg(m, true));
    } catch(e) {}
  }

  _appendDMMsg(msg, initial=false) {
    const el = document.getElementById('dmMessages');
    if (!el) return;
    const me = this.store.get('currentUser');
    const isMe = msg.sender_id === me.id;
    const div = document.createElement('div');
    div.style.cssText = `display:flex;${isMe?'justify-content:flex-end':'justify-content:flex-start'}`;
    const time = new Date(msg.created_at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
    div.innerHTML = `<div style="max-width:72%;background:${isMe?'var(--blue)':'var(--bg2)'};color:${isMe?'white':'var(--text)'};padding:9px 13px;border-radius:${isMe?'16px 16px 4px 16px':'16px 16px 16px 4px'};font-size:13px;line-height:1.5">
      ${msg.content}
      <div style="font-size:10px;opacity:.6;margin-top:3px;text-align:right">${time}</div>
    </div>`;
    el.appendChild(div);
    if (!initial) el.scrollTop = el.scrollHeight;
    if (initial && el.children.length === 1) el.scrollTop = el.scrollHeight;
  }

  async sendDM() {
    const input = document.getElementById('dmInput');
    const text = input?.value?.trim();
    if (!text || !this._dmRoom) return;
    input.value = '';
    const me = this.store.get('currentUser');
    try {
      const msg = await this.db.insert('chat_messages',{
        sender_id: me.id, content: text, room: this._dmRoom
      });
      this._appendDMMsg({...msg, sender_id:me.id}, false);
      document.getElementById('dmMessages').scrollTop = 999999;
    } catch(e) { Toast.err('Lỗi gửi tin: ' + e.message); }
  }
