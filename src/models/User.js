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

  // Mature professional monogram avatars
  static avatarUrl(id) {
    const n = ((id || 1) - 1) % 20;
    const palettes = [
      ['#1e3a5f','#dce8f2'],['#2d1b4e','#e8e0f8'],['#1a3a2a','#cce8d8'],
      ['#4a1c1c','#f2d8d8'],['#1c3040','#ccdce8'],['#3d2b1a','#ecddd0'],
      ['#1a2e4a','#c8d8ec'],['#2e1a3d','#dccef8'],['#1a3830','#bedfce'],
      ['#3a2010','#e8cdb4'],['#102040','#baccdc'],['#301018','#f0ccd4'],
      ['#0e2838','#b4ccd8'],['#28103c','#dccaec'],['#0c2c1c','#b4ccbe'],
      ['#3c2008','#ecccac'],['#2c0830','#e8c0e8'],['#083030','#b0cccc'],
      ['#302808','#dcd4b4'],['#082c40','#aac8dc']
    ];
    const [fg, bg] = palettes[n];
    const letters = 'ABJCDEMFGNHIOPQRSTU';
    const letter = letters[n] || 'S';
    const shapes = [
      `<circle cx='40' cy='40' r='40' fill='${bg}'/>`,
      `<circle cx='40' cy='40' r='40' fill='${bg}'/><circle cx='40' cy='40' r='32' fill='none' stroke='${fg}' stroke-width='1.5' opacity='.18'/>`,
      `<circle cx='40' cy='40' r='40' fill='${bg}'/><path d='M0 40 Q20 20 40 40 Q60 60 80 40' fill='none' stroke='${fg}' stroke-width='1' opacity='.12'/>`,
      `<circle cx='40' cy='40' r='40' fill='${bg}'/><circle cx='40' cy='40' r='38' fill='${fg}' opacity='.06'/>`,
      `<circle cx='40' cy='40' r='40' fill='${bg}'/><line x1='0' y1='40' x2='80' y2='40' stroke='${fg}' stroke-width='1' opacity='.1'/><line x1='40' y1='0' x2='40' y2='80' stroke='${fg}' stroke-width='1' opacity='.1'/>`,
    ];
    const shape = shapes[n % shapes.length];
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'>${shape}<text x='40' y='52' font-size='26' font-family='Georgia,serif' font-weight='700' text-anchor='middle' fill='${fg}'>${letter}</text></svg>`;
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
