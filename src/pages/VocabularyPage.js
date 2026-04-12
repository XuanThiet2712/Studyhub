import { Toast } from '../components/index.js';
import { Vocabulary } from '../models/index.js';

export class VocabularyPage {
  constructor(db, store, bus, realtime) {
    this.db       = db;
    this.store    = store;
    this.bus      = bus;
    this.realtime = realtime;
    this._words   = [];
    this._filter  = 'all';
    this._search  = '';
    this._mode    = 'list';
    this._fcIdx   = 0;
    this._fcFlipped = false;
    this._quizQ   = null;
    this._quizScore = { correct: 0, total: 0 };
  }

  render() {
    document.querySelector('.main').innerHTML = `
    <div class="page">
      <div class="page-header-row page-header">
        <div>
          <h1 class="page-title">🇺🇸 Từ vựng TOEIC</h1>
          <p class="page-sub">Học · Ôn · Kiểm tra · SRS thông minh</p>
        </div>
        <button class="btn btn-primary" onclick="vocabPage.openAdd()">＋ Thêm từ</button>
      </div>
      <div class="tabs" style="margin-bottom:16px">
        <button class="tab active" onclick="vocabPage.setMode('list',this)">📋 Danh sách</button>
        <button class="tab" onclick="vocabPage.setMode('flashcard',this)">🃏 Flashcard</button>
        <button class="tab" onclick="vocabPage.setMode('quiz',this)">🧪 Quiz</button>
      </div>
      <div id="vp-toolbar" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
        <div class="search-wrap" style="flex:1;min-width:180px">
          <span class="search-ico">🔍</span>
          <input class="form-input" id="vocabSearch" placeholder="Tìm từ..." oninput="vocabPage.onSearch(this.value)">
        </div>
        <button onclick="vocabPage.setFilter('all',this)" style="padding:6px 14px;border-radius:99px;font-size:12px;border:1.5px solid var(--blue);background:var(--blue-l);color:var(--blue-d);cursor:pointer">Tất cả</button>
        <button onclick="vocabPage.setFilter('Mới',this)" style="padding:6px 14px;border-radius:99px;font-size:12px;border:1.5px solid var(--border);background:transparent;color:var(--muted);cursor:pointer">Mới</button>
        <button onclick="vocabPage.setFilter('Đang nhớ',this)" style="padding:6px 14px;border-radius:99px;font-size:12px;border:1.5px solid var(--border);background:transparent;color:var(--muted);cursor:pointer">Đang nhớ</button>
        <button onclick="vocabPage.setFilter('Thành thạo',this)" style="padding:6px 14px;border-radius:99px;font-size:12px;border:1.5px solid var(--border);background:transparent;color:var(--muted);cursor:pointer">Thành thạo</button>
        <span style="font-size:12px;color:var(--muted);font-family:var(--mono)" id="vocabCount">0 từ</span>
      </div>
      <div id="vp-content"></div>
    </div>
    <div class="overlay" id="addVocabModal">
      <div class="modal">
        <div class="modal-title" id="addVocabTitle">＋ Thêm từ mới</div>
        <input type="hidden" id="editVocabId">
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label class="form-label">Từ vựng *</label>
            <input class="form-input" id="vWord" placeholder="VD: achievement">
          </div>
          <div class="form-group">
            <label class="form-label">Loại từ</label>
            <select class="form-select" id="vType">
              <option value="n">n - Danh từ</option>
              <option value="v">v - Động từ</option>
              <option value="adj">adj - Tính từ</option>
              <option value="adv">adv - Trạng từ</option>
              <option value="phrase">phrase</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Phiên âm</label>
            <input class="form-input" id="vPhonetic" placeholder="/əˈtʃiːvmənt/">
          </div>
          <div class="form-group">
            <label class="form-label">Chủ đề</label>
            <select class="form-select" id="vCategory">
              <option>TOEIC</option><option>Business</option><option>Finance</option>
              <option>HR</option><option>Travel</option><option>General</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Nghĩa tiếng Việt *</label>
          <input class="form-input" id="vMeaning" placeholder="VD: thành tích, thành tựu">
        </div>
        <div class="form-group">
          <label class="form-label">Định nghĩa (English)</label>
          <input class="form-input" id="vDef" placeholder="VD: a thing done successfully">
        </div>
        <div class="form-group">
          <label class="form-label">Ví dụ</label>
          <textarea class="form-textarea" id="vExample" rows="2" placeholder="VD: Her achievement was remarkable."></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="document.getElementById('addVocabModal').classList.remove('open')">Hủy</button>
          <button class="btn btn-primary" onclick="vocabPage.saveWord()">💾 Lưu</button>
        </div>
      </div>
    </div>`;
    window.vocabPage = this;
    this.loadWords();
  }

  async loadWords() {
    const user = this.store.get('currentUser');
    try {
      const rows = await this.db.select('vocabulary', {
        eq: { user_id: user.id },
        order: { col: 'created_at', asc: false }
      });
      this._words = rows.map(r => new Vocabulary(r));
    } catch(e) { console.error(e); this._words = []; }
    this.bus.emit('vocab:updated', this._words.length);
    this.renderContent();
  }

  setMode(mode, btn) {
    this._mode = mode; this._fcIdx = 0; this._fcFlipped = false;
    document.querySelectorAll('.tabs .tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.renderContent();
  }

  setFilter(f, btn) {
    this._filter = f;
    document.querySelectorAll('#vp-toolbar button').forEach(b => {
      b.style.borderColor = 'var(--border)'; b.style.background = 'transparent'; b.style.color = 'var(--muted)';
    });
    btn.style.borderColor = 'var(--blue)'; btn.style.background = 'var(--blue-l)'; btn.style.color = 'var(--blue-d)';
    this.renderContent();
  }

  onSearch(val) { this._search = val.toLowerCase(); this.renderContent(); }

  filtered() {
    return this._words.filter(w => {
      const ms = !this._search || w.word.toLowerCase().includes(this._search) || w.meaningVi.toLowerCase().includes(this._search);
      const mf = this._filter === 'all' || w.levelLabel === this._filter;
      return ms && mf;
    });
  }

  renderContent() {
    const words = this.filtered();
    const cnt = document.getElementById('vocabCount');
    if (cnt) cnt.textContent = `${words.length} từ`;
    const el = document.getElementById('vp-content');
    if (!el) return;
    if (this._mode === 'list') this.renderList(el, words);
    else if (this._mode === 'flashcard') this.renderFlashcard(el, words);
    else this.renderQuiz(el, words);
  }

  renderList(el, words) {
    if (!words.length) {
      el.innerHTML = `<div class="empty"><div class="empty-icon">📭</div><div class="empty-text">Chưa có từ nào</div><br><button class="btn btn-primary" onclick="vocabPage.openAdd()">＋ Thêm từ đầu tiên</button></div>`;
      return;
    }
    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
      ${words.map(w => `<div class="card" style="border-left:3px solid ${w.levelColor}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div>
            <div style="font-size:16px;font-weight:700">${w.word}</div>
            <div style="font-size:11px;color:var(--muted);font-family:var(--mono)">${w.phonetic||''} · <span style="color:var(--blue)">${w.wordType}</span></div>
          </div>
          <span style="font-size:10px;padding:2px 8px;border-radius:99px;background:${w.levelColor}22;color:${w.levelColor};font-weight:600">${w.levelLabel}</span>
        </div>
        <div style="font-size:14px;font-weight:500;margin-bottom:4px">${w.meaningVi}</div>
        ${w.definition?`<div style="font-size:12px;color:var(--muted);margin-bottom:6px;font-style:italic">${w.definition}</div>`:''}
        ${w.example?`<div style="font-size:11px;color:var(--muted);border-left:2px solid var(--border2);padding-left:8px">${w.example}</div>`:''}
        <div style="display:flex;gap:6px;margin-top:10px">
          <button class="btn btn-success btn-sm" onclick="vocabPage.review('${w.id}',4)">✅</button>
          <button class="btn btn-ghost btn-sm" onclick="vocabPage.review('${w.id}',2)">😅</button>
          <button class="btn btn-danger btn-sm" onclick="vocabPage.review('${w.id}',1)">❌</button>
          <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="vocabPage.openEdit('${w.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="vocabPage.deleteWord('${w.id}')">🗑</button>
        </div>
      </div>`).join('')}
    </div>`;
  }

  renderFlashcard(el, words) {
    if (!words.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">🃏</div><div class="empty-text">Không có từ nào</div></div>`; return; }
    if (this._fcIdx >= words.length) this._fcIdx = 0;
    const w = words[this._fcIdx];
    const flipped = this._fcFlipped;
    el.innerHTML = `<div style="max-width:520px;margin:0 auto">
      <div style="text-align:center;margin-bottom:14px;font-size:12px;color:var(--muted)">${this._fcIdx+1} / ${words.length}</div>
      <div onclick="vocabPage.flipCard()" style="background:var(--white);border:1.5px solid var(--border);border-radius:var(--r-xl);padding:40px 32px;text-align:center;cursor:pointer;min-height:220px;display:flex;flex-direction:column;justify-content:center;box-shadow:var(--shadow-md);position:relative">
        <div style="position:absolute;top:14px;right:16px;font-size:11px;color:var(--muted)">${flipped?'↩ từ vựng':'👆 nhấn xem nghĩa'}</div>
        ${!flipped
          ? `<div style="font-family:'Lora',serif;font-size:36px;font-weight:700;margin-bottom:8px">${w.word}</div>
             <div style="font-size:14px;color:var(--muted);font-family:var(--mono)">${w.phonetic||''}</div>
             <div style="font-size:12px;color:var(--blue);margin-top:6px">${w.wordType} · ${w.category}</div>`
          : `<div style="font-size:22px;font-weight:600;margin-bottom:8px">${w.meaningVi}</div>
             ${w.definition?`<div style="font-size:13px;color:var(--muted);font-style:italic;margin-bottom:8px">${w.definition}</div>`:''}
             ${w.example?`<div style="font-size:12px;color:var(--muted);border-top:1px solid var(--border);padding-top:10px">${w.example}</div>`:''}
             <div style="margin-top:12px"><span style="font-size:11px;padding:3px 10px;border-radius:99px;background:${w.levelColor}22;color:${w.levelColor}">${w.levelLabel}</span></div>`}
      </div>
      ${flipped
        ? `<div style="display:flex;gap:10px;margin-top:16px;justify-content:center">
             <button class="btn btn-danger" onclick="vocabPage.fcReview('${w.id}',1)">❌ Quên</button>
             <button class="btn btn-ghost" onclick="vocabPage.fcReview('${w.id}',2)">😅 Khó</button>
             <button class="btn btn-ghost" onclick="vocabPage.fcReview('${w.id}',3)">👍 Nhớ</button>
             <button class="btn btn-success" onclick="vocabPage.fcReview('${w.id}',4)">✅ Thuộc</button>
           </div>`
        : `<div style="display:flex;gap:10px;margin-top:16px;justify-content:center">
             <button class="btn btn-ghost" onclick="vocabPage.fcPrev()">← Trước</button>
             <button class="btn btn-primary" onclick="vocabPage.flipCard()">🔄 Lật thẻ</button>
             <button class="btn btn-ghost" onclick="vocabPage.fcNext()">Tiếp →</button>
           </div>`}
    </div>`;
  }

  renderQuiz(el, words) {
    if (words.length < 4) { el.innerHTML = `<div class="empty"><div class="empty-icon">🧪</div><div class="empty-text">Cần ít nhất 4 từ để làm quiz</div></div>`; return; }
    if (!this._quizQ) this.nextQuiz(words);
    const q = this._quizQ;
    el.innerHTML = `<div style="max-width:560px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;margin-bottom:20px">
        <span style="font-size:13px;color:var(--muted)">Câu ${this._quizScore.total+1}</span>
        <span style="font-size:13px;font-weight:600;color:var(--green)">✅ ${this._quizScore.correct}/${this._quizScore.total}</span>
      </div>
      <div style="background:var(--white);border:1.5px solid var(--border);border-radius:var(--r-xl);padding:28px;text-align:center;box-shadow:var(--shadow-sm);margin-bottom:16px">
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Nghĩa của từ này là gì?</div>
        <div style="font-family:'Lora',serif;font-size:32px;font-weight:700">${q.word.word}</div>
        <div style="font-size:13px;color:var(--muted);font-family:var(--mono);margin-top:4px">${q.word.phonetic||''}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${q.choices.map((c,i)=>`<button onclick="vocabPage.checkAnswer('${c.id}','${q.word.id}')"
          style="padding:14px 16px;border-radius:var(--r-md);border:1.5px solid var(--border);background:var(--white);cursor:pointer;font-size:13px;text-align:left;transition:all .15s;color:var(--text)" id="qbtn_${c.id}">
          <span style="font-weight:600;color:var(--muted);margin-right:8px">${['A','B','C','D'][i]}</span>${c.meaningVi}
        </button>`).join('')}
      </div>
    </div>`;
  }

  nextQuiz(words) {
    const pool = (words.length >= 4 ? words : this._words);
    if (pool.length < 4) return;
    const word = pool[Math.floor(Math.random()*pool.length)];
    const choices = [word, ...pool.filter(w=>w.id!==word.id).sort(()=>Math.random()-.5).slice(0,3)].sort(()=>Math.random()-.5);
    this._quizQ = { word, choices };
  }

  checkAnswer(chosenId, correctId) {
    const correct = chosenId === correctId;
    this._quizScore.total++;
    if (correct) this._quizScore.correct++;
    document.querySelectorAll('[id^="qbtn_"]').forEach(btn => {
      const id = btn.id.replace('qbtn_','');
      if (id === correctId) { btn.style.background='#dcfce7'; btn.style.borderColor='var(--green)'; }
      else if (id === chosenId && !correct) { btn.style.background='rgba(239,68,68,0.1)'; btn.style.borderColor='var(--red)'; }
      btn.disabled = true;
    });
    if (correct) Toast.ok('Chính xác! 🎉'); else Toast.err(`Sai! Đáp án: ${this._quizQ.word.meaningVi}`);
    setTimeout(() => { this.nextQuiz(this.filtered()); this.renderContent(); }, 1200);
  }

  flipCard() { this._fcFlipped = !this._fcFlipped; this.renderContent(); }
  fcNext() { const w=this.filtered(); this._fcIdx=(this._fcIdx+1)%w.length; this._fcFlipped=false; this.renderContent(); }
  fcPrev() { const w=this.filtered(); this._fcIdx=(this._fcIdx-1+w.length)%w.length; this._fcFlipped=false; this.renderContent(); }
  async fcReview(id, quality) { await this.review(id, quality); this.fcNext(); }

  async review(id, quality) {
    const w = this._words.find(x=>x.id===id);
    if (!w) return;
    w.review(quality);
    try { await this.db.update('vocabulary', id, { srs_level: w.srsLevel, next_review: w.nextReview.toISOString(), review_count: w.reviewCount }); }
    catch(e) { console.error(e); }
    this.renderContent();
  }

  openAdd() {
    document.getElementById('addVocabTitle').textContent = '＋ Thêm từ mới';
    document.getElementById('editVocabId').value = '';
    ['vWord','vPhonetic','vMeaning','vDef','vExample'].forEach(id => document.getElementById(id).value='');
    document.getElementById('addVocabModal').classList.add('open');
  }

  openEdit(id) {
    const w = this._words.find(x=>x.id===id);
    if (!w) return;
    document.getElementById('addVocabTitle').textContent = '✏️ Chỉnh sửa từ';
    document.getElementById('editVocabId').value = id;
    document.getElementById('vWord').value = w.word;
    document.getElementById('vPhonetic').value = w.phonetic;
    document.getElementById('vType').value = w.wordType;
    document.getElementById('vCategory').value = w.category;
    document.getElementById('vMeaning').value = w.meaningVi;
    document.getElementById('vDef').value = w.definition;
    document.getElementById('vExample').value = w.example;
    document.getElementById('addVocabModal').classList.add('open');
  }

  async saveWord() {
    const word = document.getElementById('vWord').value.trim();
    const meaning = document.getElementById('vMeaning').value.trim();
    if (!word||!meaning) { Toast.err('Nhập từ và nghĩa!'); return; }
    const user = this.store.get('currentUser');
    const editId = document.getElementById('editVocabId').value;
    const payload = {
      word, meaning_vi: meaning,
      phonetic: document.getElementById('vPhonetic').value.trim(),
      word_type: document.getElementById('vType').value,
      category: document.getElementById('vCategory').value,
      definition: document.getElementById('vDef').value.trim(),
      example: document.getElementById('vExample').value.trim(),
    };
    try {
      if (editId) {
        await this.db.update('vocabulary', editId, payload);
        const idx = this._words.findIndex(w=>w.id===editId);
        if (idx>=0) this._words[idx] = new Vocabulary({...this._words[idx].toJSON(),...payload,id:editId});
        Toast.ok('Đã cập nhật!');
      } else {
        const row = await this.db.insert('vocabulary', {...payload, user_id:user.id, srs_level:0, review_count:0, next_review:new Date().toISOString()});
        this._words.unshift(new Vocabulary(row));
        Toast.ok(`Đã thêm "${word}"!`);
      }
      this.bus.emit('vocab:updated', this._words.length);
      document.getElementById('addVocabModal').classList.remove('open');
      this.renderContent();
    } catch(e) { Toast.err('Lỗi: '+e.message); }
  }

  async deleteWord(id) {
    if (!confirm('Xóa từ này?')) return;
    try {
      await this.db.delete('vocabulary', id);
      this._words = this._words.filter(w=>w.id!==id);
      this.bus.emit('vocab:updated', this._words.length);
      this.renderContent();
      Toast.ok('Đã xóa');
    } catch(e) { Toast.err('Lỗi: '+e.message); }
  }
}
