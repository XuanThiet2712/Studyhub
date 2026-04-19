import { Toast } from './Toast.js';

export class NotificationSystem {
  constructor(db, store, bus) {
    this.db = db; this.store = store; this.bus = bus;
    this._channel = null; this._unread = 0;
    this._panel = null;
    this._notifs = JSON.parse(localStorage.getItem('sh_notifs') || '[]');
  }

  init() {
    const user = this.store.get('currentUser');
    if (!user) return;
    this._renderBell();
    this._subscribe(user.id);
    this._updateBadge();
  }

  _renderBell() {
    // Inject notification bell into sidebar footer area
    const existing = document.getElementById('notif-bell-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'notif-bell-container';
    container.style.cssText = 'position:fixed;top:14px;right:20px;z-index:9999';
    container.innerHTML = `
      <button id="notifBell" onclick="window.__notifSystem?.togglePanel()" style="background:var(--surface);border:1px solid var(--border);border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;box-shadow:var(--shadow-sm);font-size:16px">
        🔔
        <span id="notifBadge" style="display:none;position:absolute;top:-3px;right:-3px;background:var(--red);color:white;border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid var(--surface)"></span>
      </button>
      <div id="notifPanel" style="display:none;position:absolute;right:0;top:48px;width:300px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);box-shadow:var(--shadow-lg);overflow:hidden;max-height:400px">
        <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;font-weight:600">🔔 Thông báo</span>
          <button onclick="window.__notifSystem?.clearAll()" style="background:none;border:none;cursor:pointer;font-size:11px;color:var(--muted)">Xóa tất cả</button>
        </div>
        <div id="notifList" style="overflow-y:auto;max-height:340px"></div>
      </div>`;
    document.body.appendChild(container);
    window.__notifSystem = this;
    this._renderList();
  }

  _subscribe(userId) {
    this._channel = this.db.client.channel(`notify:${userId}`);
    this._channel
      .on('broadcast', { event: 'friend_request' }, ({ payload }) => {
        this.add({ type:'friend', icon:'👋', title:'Lời mời kết bạn', body:`@${payload.from} muốn kết bạn với bạn!`, time: Date.now(), link:'/friends' });
        Toast.info(`👋 @${payload.from} muốn kết bạn!`);
      })
      .on('broadcast', { event: 'challenge' }, ({ payload }) => {
        this.add({ type:'challenge', icon:'⚔️', title:'Thách đấu!', body:`${payload.from} thách bạn thi đấu từ vựng!`, time: Date.now(), link:'/game' });
        Toast.info(`⚔️ ${payload.from} thách bạn đấu!`);
        // Show challenge popup if friendsPage exists
        if (window.friendsPage) { window.friendsPage._pendingChallenge = payload; try { document.getElementById('challengeModalBody').textContent = payload.message||payload.from+' thách bạn!'; document.getElementById('challengeModal').classList.add('open'); } catch {} }
      })
      .on('broadcast', { event: 'friend_accepted' }, ({ payload }) => {
        this.add({ type:'friend', icon:'✅', title:'Đã chấp nhận kết bạn', body:`@${payload.from} đã chấp nhận lời mời kết bạn!`, time: Date.now(), link:'/friends' });
        Toast.ok(`✅ @${payload.from} đã chấp nhận kết bạn!`);
      })
      .subscribe();
  }

  add(notif) {
    this._notifs.unshift(notif);
    if (this._notifs.length > 50) this._notifs = this._notifs.slice(0,50);
    localStorage.setItem('sh_notifs', JSON.stringify(this._notifs));
    this._unread++;
    this._updateBadge();
    this._renderList();
  }

  _updateBadge() {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    if (this._unread > 0) { badge.style.display='flex'; badge.textContent=this._unread>9?'9+':this._unread; }
    else badge.style.display='none';
  }

  _renderList() {
    const el = document.getElementById('notifList');
    if (!el) return;
    if (!this._notifs.length) { el.innerHTML=`<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">Không có thông báo nào</div>`; return; }
    el.innerHTML = this._notifs.map(n => `
      <div onclick="window.__notifSystem?.clickNotif('${n.link||''}')" style="padding:12px 16px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;gap:10px;align-items:flex-start;transition:background .15s" onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background='transparent'">
        <div style="font-size:20px;flex-shrink:0">${n.icon||'🔔'}</div>
        <div style="flex:1"><div style="font-size:12px;font-weight:600">${n.title}</div><div style="font-size:11px;color:var(--muted);margin-top:2px">${n.body}</div><div style="font-size:10px;color:var(--muted2);margin-top:4px">${this._timeAgo(n.time)}</div></div>
      </div>`).join('');
  }

  togglePanel() {
    const panel = document.getElementById('notifPanel');
    if (!panel) return;
    const open = panel.style.display === 'block';
    panel.style.display = open ? 'none' : 'block';
    if (!open) { this._unread=0; this._updateBadge(); }
  }

  clickNotif(link) {
    document.getElementById('notifPanel').style.display='none';
    if (link) app?.router?.navigate(link);
  }

  clearAll() { this._notifs=[]; localStorage.setItem('sh_notifs','[]'); this._renderList(); }

  _timeAgo(ts) {
    const diff = Date.now()-ts; if(diff<60000) return 'Vừa xong'; if(diff<3600000) return `${Math.floor(diff/60000)} phút trước`;
    if(diff<86400000) return `${Math.floor(diff/3600000)} giờ trước`; return `${Math.floor(diff/86400000)} ngày trước`;
  }
}
