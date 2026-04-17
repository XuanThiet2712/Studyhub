import { Toast } from '../components/index.js';

export class AuthPage {
  constructor(auth, router) { this.auth=auth; this.router=router; this._tab='login'; }

  render() {
    // Remove existing page structure - auth doesn't use sidebar
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card anim-slide">
        <!-- Logo -->
        <div class="auth-logo">
          <div class="auth-logo-mark">S</div>
          <div class="auth-title">StudyHub</div>
          <div class="auth-sub">TOEIC 600+ · Học thông minh · Cộng đồng</div>
        </div>

        <!-- Tabs -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;background:var(--bg2);border-radius:var(--r-lg);padding:4px;margin-bottom:24px;border:1px solid var(--border2)">
          <button id="loginTab" onclick="authPage.switchTab('login')"
            style="padding:9px;border-radius:var(--r-md);border:none;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;background:white;color:var(--blue);box-shadow:var(--shadow-xs)">
            Đăng nhập
          </button>
          <button id="registerTab" onclick="authPage.switchTab('register')"
            style="padding:9px;border-radius:var(--r-md);border:none;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;background:transparent;color:var(--muted)">
            Đăng ký
          </button>
        </div>

        <!-- LOGIN FORM -->
        <div id="loginForm">
          <div class="form-group">
            <label class="form-label">Tên đăng nhập</label>
            <input class="form-input" id="loginUser" placeholder="username" autocomplete="username"
              onkeydown="if(event.key==='Enter')document.getElementById('loginPass').focus()">
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <div style="position:relative">
              <input class="form-input" id="loginPass" type="password" placeholder="••••••••" autocomplete="current-password"
                style="padding-right:40px"
                onkeydown="if(event.key==='Enter')authPage.login()">
              <button onclick="const i=document.getElementById('loginPass');i.type=i.type==='password'?'text':'password'"
                style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:var(--muted)">👁</button>
            </div>
          </div>
          <button class="btn btn-primary" style="width:100%;justify-content:center;padding:11px;font-size:14px;margin-bottom:14px" onclick="authPage.login()" id="loginBtn">
            Đăng nhập →
          </button>
          <div style="text-align:center;font-size:12px;color:var(--muted)">
            Chưa có tài khoản? <a href="#" onclick="authPage.switchTab('register');return false" style="color:var(--blue);font-weight:600">Đăng ký ngay</a>
          </div>
        </div>

        <!-- REGISTER FORM -->
        <div id="registerForm" style="display:none">
          <div class="form-group">
            <label class="form-label">Tên đăng nhập *</label>
            <input class="form-input" id="regUser" placeholder="Ít nhất 3 ký tự" autocomplete="username"
              onkeydown="if(event.key==='Enter')document.getElementById('regName').focus()">
          </div>
          <div class="form-group">
            <label class="form-label">Tên hiển thị *</label>
            <input class="form-input" id="regName" placeholder="Tên của bạn"
              onkeydown="if(event.key==='Enter')document.getElementById('regPass').focus()">
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu *</label>
            <div style="position:relative">
              <input class="form-input" id="regPass" type="password" placeholder="Ít nhất 6 ký tự"
                style="padding-right:40px"
                onkeydown="if(event.key==='Enter')authPage.register()">
              <button onclick="const i=document.getElementById('regPass');i.type=i.type==='password'?'text':'password'"
                style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:var(--muted)">👁</button>
            </div>
          </div>
          <button class="btn btn-primary" style="width:100%;justify-content:center;padding:11px;font-size:14px;margin-bottom:14px" onclick="authPage.register()" id="registerBtn">
            Tạo tài khoản ✓
          </button>
          <div style="text-align:center;font-size:12px;color:var(--muted)">
            Đã có tài khoản? <a href="#" onclick="authPage.switchTab('login');return false" style="color:var(--blue);font-weight:600">Đăng nhập</a>
          </div>
        </div>

        <!-- Status message -->
        <div id="authMsg" style="display:none;margin-top:12px;padding:10px 13px;border-radius:var(--r-md);font-size:12px;font-weight:500;text-align:center"></div>
      </div>
    </div>`;
    window.authPage = this;
    setTimeout(() => document.getElementById('loginUser')?.focus(), 100);
  }

  switchTab(tab) {
    this._tab = tab;
    const isLogin = tab === 'login';
    document.getElementById('loginForm').style.display  = isLogin ? 'block' : 'none';
    document.getElementById('registerForm').style.display = isLogin ? 'none' : 'block';
    const lt = document.getElementById('loginTab'), rt = document.getElementById('registerTab');
    if (isLogin) {
      lt.style.cssText='padding:9px;border-radius:var(--r-md);border:none;font-size:13px;font-weight:700;cursor:pointer;background:white;color:var(--blue);box-shadow:var(--shadow-xs)';
      rt.style.cssText='padding:9px;border-radius:var(--r-md);border:none;font-size:13px;font-weight:500;cursor:pointer;background:transparent;color:var(--muted)';
      setTimeout(() => document.getElementById('loginUser')?.focus(), 50);
    } else {
      rt.style.cssText='padding:9px;border-radius:var(--r-md);border:none;font-size:13px;font-weight:700;cursor:pointer;background:white;color:var(--blue);box-shadow:var(--shadow-xs)';
      lt.style.cssText='padding:9px;border-radius:var(--r-md);border:none;font-size:13px;font-weight:500;cursor:pointer;background:transparent;color:var(--muted)';
      setTimeout(() => document.getElementById('regUser')?.focus(), 50);
    }
    this._setMsg('');
  }

  _setMsg(msg, isErr=true) {
    const el = document.getElementById('authMsg');
    if (!el) return;
    if (!msg) { el.style.display='none'; return; }
    el.style.display='block';
    el.style.background = isErr ? 'var(--red-l)' : 'var(--green-l)';
    el.style.color       = isErr ? 'var(--red)'   : 'var(--green)';
    el.style.border      = isErr ? '1px solid rgba(244,63,94,.2)' : '1px solid rgba(16,185,129,.2)';
    el.textContent = msg;
  }

  async login() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    if (!user || !pass) { this._setMsg('Nhập đủ username và mật khẩu!'); return; }
    const btn = document.getElementById('loginBtn');
    btn.textContent='⏳ Đang đăng nhập...'; btn.disabled=true;
    try {
      await this.auth.login(user, pass);
    } catch(e) {
      this._setMsg(e.message.includes('Invalid')||e.message.includes('incorrect')||e.message.includes('không') ? '❌ Sai username hoặc mật khẩu' : '❌ ' + e.message);
      btn.textContent='Đăng nhập →'; btn.disabled=false;
    }
  }

  async register() {
    const user = document.getElementById('regUser').value.trim();
    const name = document.getElementById('regName').value.trim();
    const pass = document.getElementById('regPass').value;
    if (!user||!name||!pass) { this._setMsg('Điền đầy đủ thông tin!'); return; }
    if (user.length < 3) { this._setMsg('Username tối thiểu 3 ký tự'); return; }
    if (pass.length < 6) { this._setMsg('Mật khẩu tối thiểu 6 ký tự'); return; }
    const btn = document.getElementById('registerBtn');
    btn.textContent='⏳ Đang tạo...'; btn.disabled=true;
    try {
      await this.auth.register({ username:user, password:pass, displayName:name, gender:'other', avatarId:1 });
      this._setMsg('✅ Đăng ký thành công! Đang chuyển hướng...', false);
    } catch(e) {
      this._setMsg(e.message.includes('unique')||e.message.includes('exists') ? '❌ Username đã tồn tại' : '❌ ' + e.message);
      btn.textContent='Tạo tài khoản ✓'; btn.disabled=false;
    }
  }
}
