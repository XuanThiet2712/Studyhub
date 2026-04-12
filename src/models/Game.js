export class GameRoom {
  constructor(data = {}) {
    this.id           = data.id;
    this.roomCode     = data.room_code   || data.roomCode   || '';
    this.mode         = data.mode        || '1v1';
    this.status       = data.status      || 'waiting';
    this.hostId       = data.host_id     || data.hostId     || null;
    this.maxPlayers   = data.max_players ?? data.maxPlayers ?? 2;
    this.questionCount= data.question_count ?? 10;
    this.currentQ     = data.current_q   ?? 0;
    this.players      = data.players     || [];
    this.createdAt    = data.created_at  || null;
  }

  get isFull()    { return this.players.length >= this.maxPlayers; }
  get isWaiting() { return this.status === 'waiting'; }
  get isPlaying() { return this.status === 'playing'; }
  get isFinished(){ return this.status === 'finished'; }

  getLeader() {
    return this.players.sort((a,b) => b.score - a.score)[0];
  }
}

export class GamePlayer {
  constructor(data = {}) {
    this.id       = data.id;
    this.roomId   = data.room_id   || data.roomId;
    this.userId   = data.user_id   || data.userId;
    this.score    = data.score     || 0;
    this.answers  = data.answers   || 0;
    this.correct  = data.correct   || 0;
    this.profile  = data.profile   || null;
  }

  get accuracy() {
    return this.answers > 0 ? Math.round(this.correct / this.answers * 100) : 0;
  }
}
