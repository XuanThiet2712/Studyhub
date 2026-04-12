export class SupabaseService {
  constructor() {
    // ★ ĐIỀN VÀO ĐÂY sau khi tạo project Supabase
    this.SUPABASE_URL  = 'https://ccutiubkbvikdlyoevib.supabase.co';
    this.SUPABASE_KEY  = 'sb_publishable_PZ7gv8PJnFsGVPOCBBt4jg_yjTKMoF5';
    this._client       = null;
    this._channels     = {};
  }

  async init() {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    this._client = createClient(this.SUPABASE_URL, this.SUPABASE_KEY);
    return this;
  }

  get client() {
    if (!this._client) throw new Error('Supabase not initialized. Call init() first.');
    return this._client;
  }

  // ── CRUD helpers ──────────────────────────────
  async select(table, query = {}) {
    let q = this.client.from(table).select(query.select || '*');
    if (query.eq)     Object.entries(query.eq).forEach(([k,v]) => q = q.eq(k,v));
    if (query.in)     Object.entries(query.in).forEach(([k,v]) => q = q.in(k,v));
    if (query.order)  q = q.order(query.order.col, { ascending: query.order.asc ?? true });
    if (query.limit)  q = q.limit(query.limit);
    if (query.single) q = q.single();
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  async insert(table, payload) {
    const { data, error } = await this.client.from(table).insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async update(table, id, payload) {
    const { data, error } = await this.client.from(table).update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async upsert(table, payload, conflictKey = 'id') {
    const { data, error } = await this.client.from(table).upsert(payload, { onConflict: conflictKey }).select().single();
    if (error) throw error;
    return data;
  }

  async delete(table, id) {
    const { error } = await this.client.from(table).delete().eq('id', id);
    if (error) throw error;
  }

  // ── Realtime ──────────────────────────────────
  subscribe(channelName, config, callback) {
    const ch = this.client.channel(channelName)
      .on('postgres_changes', config, callback)
      .subscribe();
    this._channels[channelName] = ch;
    return ch;
  }

  broadcast(channelName, event, payload) {
    const ch = this._channels[channelName] ||
      this.client.channel(channelName).subscribe();
    this._channels[channelName] = ch;
    ch.send({ type: 'broadcast', event, payload });
  }

  presenceChannel(channelName) {
    const ch = this.client.channel(channelName, {
      config: { presence: { key: channelName } }
    });
    this._channels[channelName] = ch;
    return ch;
  }

  unsubscribe(channelName) {
    const ch = this._channels[channelName];
    if (ch) { ch.unsubscribe(); delete this._channels[channelName]; }
  }
}
