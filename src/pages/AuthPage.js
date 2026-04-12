import { AvatarPicker, Toast } from '../components/index.js';

export class AuthPage {
  constructor(authService, router) {
    this.auth   = authService;
    this.router = router;
    this._picker= null;
  }

  render() {
    document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">

        <div class="auth-logo">
          <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:8px">
            <div class="logo-mark" style="width:44px;height:44px;font-size:20px;border-radius:12px">S</div>
            <div class="logo-text" style="font-size:26px">StudyHub</div>
          </div>
          <p style="font-size:13px;color:var(--muted)">TOEIC 600+ · Học thông minh · Cộng đồng</p>
        </div>

        <!-- TABS -->
        <div style="display:flex;border:1.5px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:24px">
          <button id="tabLogin" onclick="authPage.showLogin()" style="flex:1;padding:10px;border:none;background:var(--blue);color:white;font-family:var(--font);font-size:13px;font-weight:600;cursor:pointer">
            Đăng nhập
          </button>
          <button id="tabReg" onclick="authPage.showRegister()" style="flex:1;padding:10px;border:none;background:var(--white);color:var(--muted);font-family:var(--font);font-size:13px;cursor:pointer">
            Đăng ký
          </button>
        </div>

        <!-- LOGIN FORM -->
        <div id="loginForm">
          <div class="form-group">
            <label class="form-label">Tên đăng nhập</label>
            <input class="form-input" id="loginUser" placeholder="username" autocomplete="username">
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <div style="position:relative">
              <input class="form-input" id="loginPass" type="password" placeholder="••••••••" autocomplete="current-password"
                onkeydown="if(event.key==='Enter')authPage.login()">
              <button onclick="authPage.togglePw('loginPass',this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted)">👁</button>
            </div>
          </div>
          <button class="btn btn-primary" style="width:100%;padding:11px;font-size:14px;justify-content:center" onclick="authPage.login()">
            Đăng nhập →
          </button>
          <div style="text-align:center;margin-top:14px;font-size:12px;color:var(--muted)">
            Chưa có tài khoản? <span style="color:var(--blue);cursor:pointer" onclick="authPage.showRegister()">Đăng ký ngay</span>
          </div>
        </div>

        <!-- REGISTER FORM (hidden) -->
        <div id="registerForm" style="display:none">
          <!-- Avatar picker -->
          <div style="margin-bottom:16px">
            <label class="form-label">Chọn Avatar 👇</label>
            <div id="avatarPickerWrap"></div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Họ và tên *</label>
              <input class="form-input" id="regName" placeholder="Nguyễn Văn A">
            </div>
            <div class="form-group">
              <label class="form-label">Giới tính</label>
              <select class="form-select" id="regGender">
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tên đăng nhập *</label>
              <input class="form-input" id="regUser" placeholder="username (≥3 ký tự)" autocomplete="off">
            </div>
            <div class="form-group">
              <label class="form-label">Ngày sinh</label>
              <input class="form-input" type="date" id="regBirth">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Mật khẩu *</label>
              <input class="form-input" type="password" id="regPass" placeholder="••••••••" autocomplete="new-password">
            </div>
            <div class="form-group">
              <label class="form-label">Xác nhận mật khẩu *</label>
              <input class="form-input" type="password" id="regPass2" placeholder="••••••••" autocomplete="new-password">
            </div>
          </div>

          <button class="btn btn-primary" style="width:100%;padding:11px;font-size:14px;justify-content:center;margin-top:4px" onclick="authPage.register()">
            Tạo tài khoản 🎉
          </button>
          <div style="text-align:center;margin-top:10px;font-size:12px;color:var(--muted)">
            Đã có tài khoản? <span style="color:var(--blue);cursor:pointer" onclick="authPage.showLogin()">Đăng nhập</span>
          </div>
        </div>

      </div>
    </div>`;

    window.authPage = this;
    this._initAvatarPicker();
  }

  showLogin() {
    document.getElementById('loginForm').style.display    = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('tabLogin').style.background  = 'var(--blue)';
    document.getElementById('tabLogin').style.color       = 'white';
    document.getElementById('tabReg').style.background    = 'var(--white)';
    document.getElementById('tabReg').style.color         = 'var(--muted)';
  }

  showRegister() {
    document.getElementById('loginForm').style.display    = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('tabReg').style.background    = 'var(--blue)';
    document.getElementById('tabReg').style.color         = 'white';
    document.getElementById('tabLogin').style.background  = 'var(--white)';
    document.getElementById('tabLogin').style.color       = 'var(--muted)';
    this._initAvatarPicker();
  }

  _initAvatarPicker() {
    const wrap = document.getElementById('avatarPickerWrap');
    if (!wrap || this._picker) return;
    this._picker = new AvatarPicker('avatarPickerWrap', 1);
    this._picker.render();
  }

  async login() {
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;
    if (!username || !password) { Toast.err('Nhập đủ thông tin!'); return; }
    try {
      this._setLoading(true);
      await this.auth.login(username, password);
      Toast.ok('Đăng nhập thành công!');
      this.router.navigate('/dashboard');
    } catch(e) {
      Toast.err(e.message || 'Đăng nhập thất bại!');
    } finally { this._setLoading(false); }
  }

  async register() {
    const displayName = document.getElementById('regName').value.trim();
    const username    = document.getElementById('regUser').value.trim().toLowerCase();
    const gender      = document.getElementById('regGender').value;
    const birthDate   = document.getElementById('regBirth').value;
    const password    = document.getElementById('regPass').value;
    const password2   = document.getElementById('regPass2').value;
    const avatarId    = this._picker?.getValue() || 1;

    if (!displayName)          { Toast.err('Nhập họ tên!'); return; }
    if (username.length < 3)   { Toast.err('Tên đăng nhập ≥ 3 ký tự!'); return; }
    if (!/^[a-z0-9_]+$/.test(username)) { Toast.err('Tên đăng nhập chỉ dùng a-z, 0-9, _'); return; }
    if (password.length < 6)   { Toast.err('Mật khẩu ≥ 6 ký tự!'); return; }
    if (password !== password2) { Toast.err('Mật khẩu không khớp!'); return; }

    try {
      this._setLoading(true);
      await this.auth.register({ username, password, displayName, gender, birthDate: birthDate||null, avatarId });
      Toast.ok('Tạo tài khoản thành công! 🎉');
      this.router.navigate('/dashboard');
    } catch(e) {
      Toast.err(e.message || 'Đăng ký thất bại!');
    } finally { this._setLoading(false); }
  }

  togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') { input.type='text'; btn.textContent='🙈'; }
    else { input.type='password'; btn.textContent='👁'; }
  }

  _setLoading(on) {
    const btns = document.querySelectorAll('.auth-card .btn');
    btns.forEach(b => { b.disabled = on; b.style.opacity = on ? '.6' : '1'; });
  }
}
