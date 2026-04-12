export class Toast {
  static _root = null;

  static init() {
    let root = document.getElementById('toastRoot');
    if (!root) { root = document.createElement('div'); root.id = 'toastRoot'; document.body.appendChild(root); }
    Toast._root = root;
  }

  static show(msg, type = 'ok', dur = 3000) {
    if (!Toast._root) Toast.init();
    const icons = { ok:'✓', err:'✕', inf:'ℹ' };
    const el    = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type]||'•'}</span> ${msg}`;
    Toast._root.appendChild(el);
    setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(12px)'; el.style.transition='.2s'; setTimeout(()=>el.remove(),200); }, dur);
    return el;
  }

  static ok  (msg, dur) { return Toast.show(msg, 'ok',  dur); }
  static err (msg, dur) { return Toast.show(msg, 'err', dur); }
  static info(msg, dur) { return Toast.show(msg, 'inf', dur); }
}
