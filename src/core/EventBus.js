export class EventBus {
  constructor() { this._listeners = {}; }

  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
    return () => this.off(event, cb); // returns unsubscribe fn
  }

  off(event, cb) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(l => l !== cb);
  }

  emit(event, data) {
    (this._listeners[event] || []).forEach(cb => {
      try { cb(data); } catch(e) { console.error(`EventBus error [${event}]:`, e); }
    });
  }

  once(event, cb) {
    const unsub = this.on(event, data => { cb(data); unsub(); });
  }
}
