export class Vocabulary {
  static SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 60]; // days

  constructor(data = {}) {
    this.id         = data.id;
    this.userId     = data.user_id    || data.userId;
    this.word       = data.word       || '';
    this.phonetic   = data.phonetic   || '';
    this.wordType   = data.word_type  || data.wordType   || 'n';
    this.meaningVi  = data.meaning_vi || data.meaningVi  || '';
    this.definition = data.definition || '';
    this.example    = data.example    || '';
    this.synonyms   = data.synonyms   || [];
    this.category   = data.category   || 'TOEIC';
    this.srsLevel   = data.srs_level  ?? data.srsLevel  ?? 0;
    this.nextReview = data.next_review ? new Date(data.next_review) : new Date();
    this.reviewCount= data.review_count ?? data.reviewCount ?? 0;
    this.createdAt  = data.created_at  || null;
  }

  get isDue() { return this.nextReview <= new Date(); }
  get levelLabel() {
    return ['Mới','Học lần 1','Đang nhớ','Thuộc tốt','Rất tốt','Thành thạo','Bậc thầy'][Math.min(this.srsLevel,6)];
  }
  get levelColor() {
    return ['#7d8590','#388bfd','#56d3eb','#f0883e','#3fb950','#39d353','#d29922'][Math.min(this.srsLevel,6)];
  }

  review(quality) {
    // quality: 1=forgot, 2=hard, 3=good, 4=perfect
    if (quality >= 3) {
      this.srsLevel = Math.min(this.srsLevel + 1, 6);
    } else {
      this.srsLevel = Math.max(this.srsLevel - 1, 0);
    }
    const days = Vocabulary.SRS_INTERVALS[this.srsLevel] || 1;
    this.nextReview = new Date(Date.now() + days * 86400000);
    this.reviewCount++;
    return { srsLevel: this.srs_level, nextReview: this.nextReview };
  }

  toJSON() {
    return {
      id: this.id, user_id: this.userId, word: this.word,
      phonetic: this.phonetic, word_type: this.wordType,
      meaning_vi: this.meaningVi, definition: this.definition,
      example: this.example, synonyms: this.synonyms,
      category: this.category, srs_level: this.srsLevel,
      next_review: this.nextReview.toISOString(),
      review_count: this.reviewCount
    };
  }
}
