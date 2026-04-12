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
      { icon:'📅', label:'Lộ trình 30 ngày',     route:'/roadmap',      key:'roadmap',     badge: () => roadmapDone ? `${roadmapDone}/30` : null, bClass:'new' },
      { icon:'🇺🇸', label:'Từ vựng',            route:'/vocabulary',   key:'vocabulary' },
      { icon:'🔬', label:'Word Lab',             route:'/wordlab',      key:'wordlab',     badge: () => 'NEW', bClass:'new' },
      { icon:'🧠', label:'Đường cong lãng quên', route:'/forgetting',   key:'forgetting' },
      { section: 'Cộng đồng' },
      { icon:'💬', label:'Trò chuyện',           route:'/chat',         key:'chat',        badge: () => online ? `${online} online` : null, bClass:'hot' },
      { icon:'👥', label:'Bạn bè',               route:'/friends',      key:'friends',     badge: () => null },
      { icon:'🏆', label:'Bảng xếp hạng',        route:'/leaderboard',  key:'leaderboard' },
      { icon:'🎮', label:'Word Battle',           route:'/game',         key:'game',        badge: () => 'LIVE', bClass:'hot' },
      { section: 'AI & Công cụ' },
      { icon:'🤖', label:'AI Tutor',             route:'/ai-tutor',     key:'ai-tutor',    badge: () => 'AI', bClass:'new' },
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

  destroy() { this._unsubs.forEach(u => u()); }
}
