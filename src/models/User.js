export class User {
  constructor(data = {}) {
    this.id          = data.id;
    this.username    = data.username    || '';
    this.displayName = data.display_name|| data.displayName || '';
    this.gender      = data.gender      || 'other';
    this.birthDate   = data.birth_date  || data.birthDate   || null;
    this.avatarId    = data.avatar_id   || data.avatarId    || 1;
    this.bio         = data.bio         || '';
    this.xp          = data.xp          || 0;
    this.level       = data.level       || 1;
    this.streak      = data.streak      || 0;
    this.isOnline    = data.is_online   ?? data.isOnline ?? false;
    this.lastActive  = data.last_active || data.lastActive  || null;
    this.createdAt   = data.created_at  || data.createdAt   || null;
  }

  get avatarUrl() { return User.avatarUrl(this.avatarId); }
  get levelLabel() { return `Cấp ${this.level}`; }
  get xpToNext()   { return this.level * 100 - (this.xp % (this.level * 100)); }

  static avatarUrl(id) {
    // Using DiceBear avatars — no external image needed
    const styles = ['adventurer','bottts','fun-emoji','micah','notionists','open-peeps','personas'];
    const style  = styles[Math.floor((id-1)/3) % styles.length];
    const seed   = `studyhub_${id}`;
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }

  static xpForAction(action) {
    const table = {
      vocab_add: 5, vocab_review: 3, day_complete: 50, pomo_done: 10,
      game_win: 30, game_play: 10, streak_bonus: 20, chat_msg: 1
    };
    return table[action] || 0;
  }

  addXp(amount) { this.xp += amount; this.level = Math.floor(this.xp / 100) + 1; }
  toJSON() {
    return {
      id: this.id, username: this.username, display_name: this.displayName,
      gender: this.gender, birth_date: this.birthDate, avatar_id: this.avatarId,
      bio: this.bio, xp: this.xp, level: this.level, streak: this.streak
    };
  }
}
