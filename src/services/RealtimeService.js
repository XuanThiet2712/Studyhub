export class RealtimeService {
  constructor(db, store, bus) {
    this.db    = db;
    this.store = store;
    this.bus   = bus;
    this._presenceCh   = null;
    this._chatChannels = {};
  }

  // ── Chat ──────────────────────────────────────
  subscribeToChat(room, onMessage) {
    const key = 'chat-ins:' + room;
    if (this._chatChannels[key]) {
      this._chatChannels[key].unsubscribe();
      delete this._chatChannels[key];
    }
    const ch = this.db.subscribe(
      key,
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: 'room=eq.' + room },
      payload => onMessage(payload.new)
    );
    this._chatChannels[key] = ch;
    return () => { ch.unsubscribe(); delete this._chatChannels[key]; };
  }

  subscribeToChatDelete(room, onDelete) {
    const key = 'chat-del:' + room;
    if (this._chatChannels[key]) {
      this._chatChannels[key].unsubscribe();
      delete this._chatChannels[key];
    }
    const ch = this.db.subscribe(
      key,
      { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: 'room=eq.' + room },
      payload => onDelete(payload.old?.id)
    );
    this._chatChannels[key] = ch;
    return () => { ch.unsubscribe(); delete this._chatChannels[key]; };
  }

  async sendMessage(senderId, content, room = 'global', imageUrl = null) {
    const payload = { sender_id: senderId, content, room };
    if (imageUrl) payload.image_url = imageUrl;
    return this.db.insert('chat_messages', payload);
  }

  async deleteMessage(msgId, userId) {
    // Only delete own messages
    const { error } = await this.db.client
      .from('chat_messages')
      .delete()
      .eq('id', msgId)
      .eq('sender_id', userId);
    if (error) throw error;
  }

  async adminDeleteMessage(msgId) {
    // Admin can delete any message
    const { error } = await this.db.client
      .from('chat_messages')
      .delete()
      .eq('id', msgId);
    if (error) throw error;
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

  // ── Image Upload ──────────────────────────────
  async uploadChatImage(file) {
    const ext      = file.name.split('.').pop();
    const fileName = 'chat/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
    const { data, error } = await this.db.client.storage
      .from('chat-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: urlData } = this.db.client.storage
      .from('chat-images')
      .getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  // ── Online presence ───────────────────────────
  initPresence(user) {
    if (this._presenceCh) {
      this._presenceCh.untrack();
      this._presenceCh.unsubscribe();
      this._presenceCh = null;
    }
    this._presenceCh = this.db.presenceChannel('online-users');
    this._presenceCh
      .on('presence', { event: 'sync' }, () => {
        const state  = this._presenceCh.presenceState();
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
      'game:' + roomId,
      { event: '*', schema: 'public', table: 'game_players', filter: 'room_id=eq.' + roomId },
      payload => onChange(payload)
    );
  }
}