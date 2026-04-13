export class DayProgress {
  constructor(data = {}) {
    this.id           = data.id;
    this.userId       = data.user_id     || data.userId;
    this.dayNumber    = data.day_number  ?? data.dayNumber  ?? 1;
    this.completed    = data.completed   ?? false;
    this.completedAt  = data.completed_at || null;
    this.grammarDone  = data.grammar_done  ?? false;
    this.vocabDone    = data.vocab_done    ?? false;
    this.listeningDone= data.listening_done?? false;
    this.readingDone  = data.reading_done  ?? false;
    this.writingDone  = data.writing_done  ?? false;
    this.speakingDone = data.speaking_done ?? false;
    this.timeSpent    = data.time_spent_mins ?? 0;
    this.notes        = data.notes         || '';
  }

  get checkCount() {
    return [this.grammarDone, this.vocabDone, this.listeningDone,
            this.readingDone, this.writingDone, this.speakingDone].filter(Boolean).length;
  }
  get progressPct() { return Math.round(this.checkCount / 6 * 100); }

  markSection(section) {
    const map = {
      grammar:   'grammarDone',
      vocab:     'vocabDone',
      listening: 'listeningDone',
      reading:   'readingDone',
      writing:   'writingDone',
      speaking:  'speakingDone'
    };
    if (map[section]) this[map[section]] = !this[map[section]];
    if (this.checkCount === 6 && !this.completed) {
      this.completed   = true;
      this.completedAt = new Date().toISOString();
    }
  }

  toJSON() {
    return {
      id: this.id, user_id: this.userId, day_number: this.dayNumber,
      completed: this.completed, completed_at: this.completedAt,
      grammar_done: this.grammarDone, vocab_done: this.vocabDone,
      listening_done: this.listeningDone, reading_done: this.readingDone,
      writing_done: this.writingDone, speaking_done: this.speakingDone,
      time_spent_mins: this.timeSpent, notes: this.notes
    };
  }
}
