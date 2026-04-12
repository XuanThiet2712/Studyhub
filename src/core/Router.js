export class Router {
  constructor() {
    this._routes  = {};
    this._current = null;
    this._beforeEach = null;
    window.addEventListener('hashchange', () => this._resolve());
  }

  register(path, handler) {
    this._routes[path] = handler;
    return this;
  }

  beforeEach(fn) { this._beforeEach = fn; return this; }

  navigate(path) {
    window.location.hash = path;
  }

  start() { this._resolve(); }

  getCurrentRoute() { return this._current; }

  _resolve() {
    const hash    = window.location.hash.replace('#', '') || '/';
    const [path]  = hash.split('?');
    const params  = Object.fromEntries(new URLSearchParams(hash.split('?')[1] || ''));

    if (this._beforeEach) {
      const result = this._beforeEach(path);
      if (result && result !== path) { this.navigate(result); return; }
    }

    const handler = this._routes[path] || this._routes['*'];
    if (handler) { this._current = path; handler(params); }
  }
}
