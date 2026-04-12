export class Store {
  constructor(initialState = {}) {
    this._state     = { ...initialState };
    this._listeners = [];
  }

  getState() { return { ...this._state }; }

  get(key) { return this._state[key]; }

  set(key, value) {
    const prev = this._state[key];
    this._state[key] = value;
    if (prev !== value) this._notify(key, value, prev);
  }

  update(updates) {
    Object.entries(updates).forEach(([k, v]) => {
      const prev = this._state[k];
      this._state[k] = v;
      if (prev !== v) this._notify(k, v, prev);
    });
  }

  subscribe(key, cb) {
    const listener = { key, cb };
    this._listeners.push(listener);
    return () => { this._listeners = this._listeners.filter(l => l !== listener); };
  }

  _notify(key, value, prev) {
    this._listeners
      .filter(l => l.key === key || l.key === '*')
      .forEach(l => { try { l.cb(value, prev); } catch(e) {} });
  }
}
