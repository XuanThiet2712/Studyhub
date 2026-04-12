export class App {
  constructor({ supabase, bus, store, router }) {
    this.supabase = supabase;
    this.bus      = bus;
    this.store    = store;
    this.router   = router;
    this.services = {};
    this.pages    = {};
  }

  registerService(name, service) { this.services[name] = service; return this; }
  registerPage(path, page)       { this.pages[path] = page; this.router.register(path, p => page.render(p)); return this; }

  async boot() {
    // Restore session
    const session = await this.services.auth?.restoreSession();
    if (session) this.bus.emit('auth:ready', session);

    // Route guard
    this.router.beforeEach(path => {
      const pub = ['/', '/login', '/register'];
      if (!pub.includes(path) && !this.store.get('currentUser')) return '/';
    });

    this.router.register('*', () => this.router.navigate('/'));
    this.router.start();
  }
}
