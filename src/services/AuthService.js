export class AuthService {
  constructor(db, store, bus) {
    this.db    = db;
    this.store = store;
    this.bus   = bus;
    this._SESSION_KEY = 'sh_session_v2';
  }

  async register({ username, password, displayName, gender, birthDate, avatarId }) {
    // Check username taken
    const existing = await this.db.select('profiles', { eq: { username }, single: true })
      .catch(() => null);
    if (existing) throw new Error('Tên đăng nhập đã tồn tại!');

    // Simple hash (production should use bcrypt via edge function)
    const hash = await this._hashPassword(password);

    const profile = await this.db.insert('profiles', {
      username,
      password_hash: hash,
      display_name:  displayName,
      gender,
      birth_date:    birthDate || null,
      avatar_id:     avatarId || 1,
      is_online:     true,
      last_active:   new Date().toISOString(),
    });

    this._saveSession(profile);
    this.store.update({ currentUser: profile, isLoggedIn: true });
    this.bus.emit('auth:login', profile);
    return profile;
  }

  async login(username, password) {
    const profile = await this.db.select('profiles', {
      eq: { username }, single: true
    }).catch(() => { throw new Error('Tài khoản không tồn tại!'); });

    const hash = await this._hashPassword(password);
    if (hash !== profile.password_hash) throw new Error('Sai mật khẩu!');

    // Mark online
    await this.db.update('profiles', profile.id, {
      is_online: true, last_active: new Date().toISOString()
    });

    const updated = { ...profile, is_online: true };
    this._saveSession(updated);
    this.store.update({ currentUser: updated, isLoggedIn: true });
    this.bus.emit('auth:login', updated);
    return updated;
  }

  async logout() {
    const user = this.store.get('currentUser');
    if (user) {
      await this.db.update('profiles', user.id, { is_online: false });
    }
    this._clearSession();
    this.store.update({ currentUser: null, isLoggedIn: false });
    this.bus.emit('auth:logout');
  }

  async restoreSession() {
    const raw = localStorage.getItem(this._SESSION_KEY);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      // Re-fetch fresh profile
      const profile = await this.db.select('profiles', { eq: { id: session.id }, single: true });
      await this.db.update('profiles', profile.id, {
        is_online: true, last_active: new Date().toISOString()
      });
      const updated = { ...profile, is_online: true };
      this._saveSession(updated);
      this.store.update({ currentUser: updated, isLoggedIn: true });
      return updated;
    } catch {
      this._clearSession();
      return null;
    }
  }

  async updateProfile(userId, changes) {
    const updated = await this.db.update('profiles', userId, changes);
    const current = this.store.get('currentUser');
    const merged  = { ...current, ...updated };
    this._saveSession(merged);
    this.store.set('currentUser', merged);
    return merged;
  }

  _saveSession(profile)  { localStorage.setItem(this._SESSION_KEY, JSON.stringify(profile)); }
  _clearSession()        { localStorage.removeItem(this._SESSION_KEY); }

  async _hashPassword(pw) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw + 'studyhub_salt'));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }
}
