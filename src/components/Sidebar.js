import { User } from '../models/index.js';

export class Sidebar {
  constructor(store, bus, router) {
    this.store  = store;
    this.bus    = bus;
    this.router = router;
    this._el    = null;
    this._unsubs= [];

    const quotes = [
      { q: '"Just do it first."',               a: '— StudyHub' },
      { q: '"Start before you\'re ready."',      a: '— Steven Pressfield' },
      { q: '"Done is better than perfect."',     a: '— Sheryl Sandberg' },
      { q: '"Small steps, every single day."',   a: '— StudyHub' },
      { q: '"Fall seven, rise eight."',          a: '— Japanese Proverb' },
      { q: '"The secret is to begin."',          a: '— Mark Twain' },
    ];
    this._quote = quotes[Math.floor(Date.now() / 3600000) % quotes.length];
  }

  mount(el) {
    this._el = el;
    this._unsubs.push(
      this.store.subscribe('currentUser', () => this.render()),
      this.store.subscribe('onlineUsers', () => this._updateOnlineCount()),
    );
    this.bus.on('route:change', () => this._updateActive());
    this.render();
    this._watchNetwork();
  }

  render() {
    if (!this._el) return;
    const user = this.store.get('currentUser');
    if (!user) return;
    const u = new User(user);
    const online = (this.store.get('onlineUsers') || []).length;
    const roadmapDone = Object.values(JSON.parse(localStorage.getItem('sh_roadmap_progress') || '{}')).filter(Boolean).length;

    const nav = [
      { section: 'Chính' },
      { icon:'🏠', label:'Tổng quan',           route:'/dashboard',    key:'dashboard' },
      { icon:'📁', label:'Tài liệu',             route:'/documents',    key:'documents',   badge: () => JSON.parse(localStorage.getItem('sh_docs')||'[]').length || null },
      { section: 'TOEIC 600+' },
      { icon:'📗', label:'Lộ trình Cơ bản',      route:'/custom-roadmap', key:'custom-roadmap', badge:()=>'Mới', bClass:'new' },
      { icon:'📅', label:'Lộ trình 30 ngày',     route:'/roadmap',      key:'roadmap',     badge: () => roadmapDone ? `${roadmapDone}/30` : null, bClass:'new' },
      { icon:'🇺🇸', label:'Từ vựng',            route:'/vocabulary',   key:'vocabulary' },
      { icon:'🔬', label:'Word Lab',             route:'/wordlab',      key:'wordlab',     badge: () => 'NEW', bClass:'new' },
      { icon:'🧠', label:'Đường cong lãng quên', route:'/forgetting',   key:'forgetting' },
      { section: 'Cộng đồng' },
      { icon:'🗡️', label:'RPG Battle',              route:'/rpg',          key:'rpg',         badge:()=>'NEW', bClass:'new' },
      { icon:'🌍', label:'StudyHub World',      route:'/world',        key:'world',       badge:()=>'GAME', bClass:'hot' },
      { icon:'💬', label:'Trò chuyện',           route:'/chat',         key:'chat',        badge: () => online ? `${online} online` : null, bClass:'hot' },
      { icon:'👥', label:'Bạn bè',               route:'/friends',      key:'friends',     badge: () => null },
      { icon:'🏆', label:'Bảng xếp hạng',        route:'/leaderboard',  key:'leaderboard' },
      { icon:'🎮', label:'Word Battle',           route:'/game',         key:'game',        badge: () => 'LIVE', bClass:'hot' },
      { section: 'AI & Công cụ' },
      { icon:'🤖', label:'AI Tutor',             route:'/ai-tutor',     key:'ai-tutor',    badge: () => 'AI', bClass:'new' },
      { icon:'🗣️', label:'Giao tiếp AI',          route:'/conversation', key:'conversation', badge: () => 'MỚI', bClass:'new' },
      { icon:'📝', label:'Ghi chú',              route:'/notes',        key:'notes' },
      { icon:'⏱️', label:'Pomodoro',              route:'/pomodoro',     key:'pomodoro' },
    ];

    const currentRoute = this.router.getCurrentRoute() || '/dashboard';

    this._el.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-mark">S</div>
      <div><div class="logo-text">StudyHub</div><div class="logo-ver">v3.0 · TOEIC</div></div>
    </div>

    <div class="sidebar-user" onclick="app.router.navigate('/profile')">
      <div class="online-indicator">
        <img class="user-ava" src="${u.avatarUrl}" alt="avatar" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="user-ava-placeholder" style="display:none">${u.displayName.charAt(0)}</div>
      </div>
      <div>
        <div class="user-name">${u.displayName}</div>
        <div class="user-level">⭐ ${u.xp} XP · ${u.levelLabel}</div>
      </div>
      <div class="online-dot"></div>
    </div>

    <!-- CONNECTION STATUS - visible wifi indicator -->
    <div id="sidebarConn" class="conn-indicator online" style="cursor:default">
      <div class="conn-dot online" id="sidebarConnDot"></div>
      <span id="sidebarConnText">Đang kết nối...</span>
      <span id="sidebarPingText" style="margin-left:auto;font-family:var(--mono);font-size:10px;opacity:.7"></span>
    </div>
    <div class="sidebar-stats">
      <div class="ss-item"><div class="ss-val" style="color:var(--blue)">${roadmapDone}</div><div class="ss-lbl">Ngày</div></div>
      <div class="ss-item"><div class="ss-val" style="color:var(--purple)" id="sb-vocab-cnt">0</div><div class="ss-lbl">Từ</div></div>
      <div class="ss-item"><div class="ss-val" style="color:var(--orange)" id="sb-online-cnt">${online}</div><div class="ss-lbl">Online</div></div>
    </div>

    <div class="quote-banner">
      <div class="quote-text">${this._quote.q}</div>
      <div class="quote-author">${this._quote.a}</div>
    </div>

    <nav id="sidebarNav">
      ${nav.map(item => {
        if (item.section) return `<div class="nav-section-lbl">${item.section}</div>`;
        const active  = currentRoute === item.route;
        const badgeVal= item.badge ? item.badge() : null;
        const badge   = badgeVal ? `<span class="nav-badge ${item.bClass||''}">${badgeVal}</span>` : '';
        return `<button class="nav-link ${active?'active':''}" onclick="app.router.navigate('${item.route}')" data-route="${item.route}">
          <span class="nav-icon">${item.icon}</span>
          <span>${item.label}</span>${badge}
        </button>`;
      }).join('')}
    </nav>

    <div class="sidebar-footer">
      <div id="netStatus" class="net-status ${navigator.onLine ? 'net-online' : 'net-offline'}">
        <span class="net-dot"></span>
        <span class="net-label">${navigator.onLine ? 'Đã kết nối' : 'Mất mạng'}</span>
        <span class="net-ping" id="netPing"></span>
      </div>
      <button class="logout-btn" onclick="app.services.auth.logout()">
        🚪 Đăng xuất
      </button>
    </div>`;

    this._updateVocabCount();
  }

  _updateActive() {
    const route = this.router.getCurrentRoute();
    this._el?.querySelectorAll('.nav-link').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });
  }

  _updateOnlineCount() {
    const n = (this.store.get('onlineUsers') || []).length;
    const el = this._el?.querySelector('#sb-online-cnt');
    if (el) el.textContent = n;
  }

  async _updateVocabCount() {
    // Will be updated by vocab service
    this.bus.on('vocab:updated', n => {
      const el = this._el?.querySelector('#sb-vocab-cnt');
      if (el) el.textContent = n;
    });
  }

  _watchNetwork() {
    // Update the connection indicator
    const updateConn = (online, ms) => {
      const el   = document.getElementById('sidebarConn');
      const dot  = document.getElementById('sidebarConnDot');
      const text = document.getElementById('sidebarConnText');
      const ping = document.getElementById('sidebarPingText');
      if (!el) return;
      if (online) {
        el.className='conn-indicator online';
        if(dot){dot.className='conn-dot online';}
        if(text) text.textContent='Đang online';
        if(ping&&ms) ping.textContent=ms+'ms';
      } else {
        el.className='conn-indicator offline';
        if(dot){dot.className='conn-dot offline';}
        if(text) text.textContent='Mất kết nối';
        if(ping) ping.textContent='';
      }
    };
    this._updateConn = updateConn;
  }
  _watchNetwork_orig() {
    const update = (online) => {
      const el = document.getElementById('netStatus');
      const lbl = document.getElementById('netStatus')?.querySelector('.net-label');
      if (!el) return;
      el.className = 'net-status ' + (online ? 'net-online' : 'net-offline');
      if (lbl) lbl.textContent = online ? 'Đã kết nối' : 'Mất mạng';
      if (!online) {
        const ping = document.getElementById('netPing');
        if (ping) ping.textContent = '';
      }
    };
    this._onOnline  = () => { update(true);  this._measurePing(); };
    this._onOffline = () => update(false);
    window.addEventListener('online',  this._onOnline);
    window.addEventListener('offline', this._onOffline);
    // Measure ping every 30s
    this._measurePing();
    this._pingInterval = setInterval(() => this._measurePing(), 30000);
  }

  async _measurePing() {
    const pingEl = document.getElementById('netPing');
    if (!pingEl || !navigator.onLine) return;
    try {
      const t0 = performance.now();
      await fetch('https://www.google.com/favicon.ico?_=' + Date.now(), { mode: 'no-cors', cache: 'no-store' });
      const ms = Math.round(performance.now() - t0);
      pingEl.textContent = ms + 'ms';
      // Color-code ping
      pingEl.style.color = ms < 100 ? 'var(--green)' : ms < 300 ? 'var(--orange)' : 'var(--red)';
    } catch {
      pingEl.textContent = '';
    }
  }

  destroy() {
    this._unsubs.forEach(u => u());
    if (this._onOnline)  window.removeEventListener('online',  this._onOnline);
    if (this._onOffline) window.removeEventListener('offline', this._onOffline);
    if (this._pingInterval) clearInterval(this._pingInterval);
  }
}