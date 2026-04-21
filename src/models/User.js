export class User {
  constructor(data = {}) {
    this.id          = data.id;
    this.username    = data.username    || '';
    this.displayName = data.display_name|| data.displayName || this.username;
    this.gender      = data.gender      || 'other';
    this.birthDate   = data.birth_date  || data.birthDate   || '';
    this.avatarId    = data.avatar_id   || data.avatarId    || 1;
    this.bio         = data.bio         || '';
    this.xp          = data.xp          || 0;
    this.level       = data.level       || 1;
    this.streak      = data.streak      || 0;
    this.isOnline    = data.is_online   || false;
    this.lastActive  = data.last_active || null;
  }

  get avatarUrl()   { return User.avatarUrl(this.avatarId); }
  get levelLabel()  {
    const labels=['Beginner','Elementary','Pre-Inter','Intermediate','Upper-Inter','Advanced','Expert'];
    return labels[Math.min(this.level-1, labels.length-1)];
  }
  get xpToNext()    { return this.level * 100 - this.xp % (this.level * 100); }
  get levelPct()    { return Math.round((this.xp % (this.level*100)) / (this.level) ); }

  // Inline SVG avatars — no external dependencies, no CORS issues
  static avatarUrl(id) {
    const n = ((id || 1) - 1) % 20;
    const colors = [
      ['#4f6ef7','#c7d2fe'],['#10b981','#a7f3d0'],['#f97316','#fed7aa'],
      ['#8b5cf6','#ddd6fe'],['#ec4899','#fce7f3'],['#14b8a6','#ccfbf1'],
      ['#f59e0b','#fde68a'],['#ef4444','#fecaca'],['#06b6d4','#cffafe'],
      ['#6366f1','#e0e7ff'],['#84cc16','#ecfccb'],['#f43f5e','#ffe4e6'],
      ['#0ea5e9','#e0f2fe'],['#a855f7','#f3e8ff'],['#22c55e','#dcfce7'],
      ['#fb923c','#ffedd5'],['#e879f9','#fae8ff'],['#2dd4bf','#f0fdfa'],
      ['#facc15','#fef9c3'],['#38bdf8','#e0f2fe']
    ];
    const [fg,bg]=colors[n];
    // Cute simple emoji faces
    const faces=['😊','🦊','🐱','🐶','🐺','🦁','🐸','🦉','🐼','🦋',
                 '🦄','🐯','🦊','🐰','🐨','🦔','🐙','🦊','🐦','🌟'];
    const face=faces[n];
    // Return data URL with inline SVG
    const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><circle cx='40' cy='40' r='40' fill='${bg}'/><text x='40' y='52' font-size='36' text-anchor='middle' fill='${fg}'>${face}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  static xpForAction(action) {
    return {vocab_add:5,vocab_review:3,day_complete:50,pomo_done:10,game_win:30,game_play:10,streak_bonus:20,chat_msg:1}[action]||0;
  }

  addXp(amount) { this.xp+=amount; this.level=Math.floor(this.xp/100)+1; }

  toJSON() {
    return {
      id:this.id, username:this.username, display_name:this.displayName,
      gender:this.gender, birth_date:this.birthDate, avatar_id:this.avatarId,
      bio:this.bio, xp:this.xp, level:this.level, streak:this.streak
    };
  }
}
