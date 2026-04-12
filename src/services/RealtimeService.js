export class RealtimeService {
  constructor(db, store, bus) {
    this.db    = db;
    this.store = store;
    this.bus   = bus;
    this._presenceCh = null;
    this._chatChannels = {};
  }

  // ── Chat ──────────────────────────────────────
  subscribeToChat(room, onMessage) {
    const key = `chat:${room}`;
    // Prevent duplicate subscriptions
    if (this._chatChannels[key]) {
      this._chatChannels[key].unsubscribe();
      delete this._chatChannels[key];
    }
    const ch = this.db.subscribe(
      key,
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room=eq.${room}` },
      payload => onMessage(payload.new)
    );
    this._chatChannels[key] = ch;
    return ch;
  }

  async sendMessage(senderId, content, room = 'global') {
    return this.db.insert('chat_messages', { sender_id: senderId, content, room });
  }

  async loadMessages(room = 'global', limit = 60) {
    const msgs = await this.db.select('chat_messages', {
      eq: { room }, order: { col: 'created_at', asc: true }, limit
    });
    if (!msgs?.length) return [];
    const userIds = [...new Set(msgs.map(m => m.sender_id))];
    const profiles = await this.db.select('profiles', {
      select: 'id,username,display_name,avatar_id',
      in: { id: userIds }
    });
    const pMap = Object.fromEntries(profiles.map(p => [p.id, p]));
    return msgs.map(m => ({ ...m, sender: pMap[m.sender_id] }));
  }

  // ── Online presence ───────────────────────────
  initPresence(user) {
    // Prevent duplicate presence channels
    if (this._presenceCh) {
      this._presenceCh.untrack();
      this._presenceCh.unsubscribe();
      this._presenceCh = null;
    }
    this._presenceCh = this.db.presenceChannel('online-users');
    this._presenceCh
      .on('presence', { event: 'sync' }, () => {
        const state = this._presenceCh.presenceState();
        const online = Object.values(state).flat().map(u => u.user);
        this.store.set('onlineUsers', online);
        this.bus.emit('presence:update', online);
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await this._presenceCh.track({ user });
        }
      });
  }

  leavePresence() {
    if (this._presenceCh) {
      this._presenceCh.untrack();
      this._presenceCh.unsubscribe();
      this._presenceCh = null;
    }
  }

  // ── Game Rooms ────────────────────────────────
  subscribeToRoom(roomId, onChange) {
    return this.db.subscribe(
      `game:${roomId}`,
      { event: '*', schema: 'public', table: 'game_players', filter: `room_id=eq.${roomId}` },
      payload => onChange(payload)
    );
  }
}
