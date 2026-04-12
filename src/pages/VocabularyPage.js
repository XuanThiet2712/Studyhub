import { Toast } from '../components/index.js';
import { Vocabulary } from '../models/index.js';

const TOEIC_WORDBANK = [
  { word:'achievement', phonetic:'/əˈtʃiːvmənt/', word_type:'n', meaning_vi:'thành tích, thành tựu', definition:'a thing done successfully with effort', example:'Her achievement was recognized by the board.', category:'Business' },
  { word:'negotiate',   phonetic:'/nɪˈɡoʊʃieɪt/', word_type:'v', meaning_vi:'đàm phán, thương lượng', definition:'to try to reach an agreement', example:'We need to negotiate the contract terms.', category:'Business' },
  { word:'revenue',     phonetic:'/ˈrevənjuː/',    word_type:'n', meaning_vi:'doanh thu, thu nhập', definition:'income generated from business activities', example:'Annual revenue increased by 20%.', category:'Finance' },
  { word:'implement',   phonetic:'/ˈɪmplɪment/',   word_type:'v', meaning_vi:'triển khai, thực hiện', definition:'to put a plan or system into operation', example:'The company will implement new software.', category:'Business' },
  { word:'comprehensive',phonetic:'/ˌkɒmprɪˈhensɪv/', word_type:'adj', meaning_vi:'toàn diện, đầy đủ', definition:'including all or nearly all aspects', example:'A comprehensive report was submitted.', category:'General' },
  { word:'expedite',    phonetic:'/ˈekspɪdaɪt/',   word_type:'v', meaning_vi:'đẩy nhanh, xúc tiến', definition:'to make something happen sooner', example:'We will expedite the delivery process.', category:'Business' },
  { word:'liability',   phonetic:'/ˌlaɪəˈbɪlɪti/', word_type:'n', meaning_vi:'trách nhiệm pháp lý, nợ phải trả', definition:'legal responsibility for something', example:'The company has no liability for damages.', category:'Finance' },
  { word:'fluctuate',   phonetic:'/ˈflʌktʃueɪt/',  word_type:'v', meaning_vi:'biến động, dao động', definition:'to change frequently in level', example:'Stock prices fluctuate daily.', category:'Finance' },
  { word:'delegate',    phonetic:'/ˈdelɪɡeɪt/',    word_type:'v', meaning_vi:'ủy quyền, giao phó', definition:'to give a task to someone else', example:'He delegated the task to his assistant.', category:'HR' },
  { word:'discrepancy', phonetic:'/dɪˈskrepənsi/', word_type:'n', meaning_vi:'sự bất đồng, sai lệch', definition:'a difference between things that should match', example:'There is a discrepancy in the accounts.', category:'Finance' },
  { word:'mandatory',   phonetic:'/ˈmændətɔːri/',  word_type:'adj', meaning_vi:'bắt buộc, cưỡng chế', definition:'required by law or rules', example:'Attendance is mandatory for all employees.', category:'Business' },
  { word:'reimburse',   phonetic:'/ˌriːɪmˈbɜːrs/', word_type:'v', meaning_vi:'hoàn trả, bồi hoàn', definition:'to repay money spent or lost', example:'They will reimburse your travel expenses.', category:'Finance' },
  { word:'itinerary',   phonetic:'/aɪˈtɪnəreri/',  word_type:'n', meaning_vi:'lịch trình, hành trình', definition:'a planned route or journey', example:'Please review the travel itinerary.', category:'Travel' },
  { word:'invoice',     phonetic:'/ˈɪnvɔɪs/',      word_type:'n', meaning_vi:'hóa đơn', definition:'a list of goods or services with prices', example:'Please send the invoice by email.', category:'Finance' },
  { word:'procurement', phonetic:'/prəˈkjʊərmənt/',word_type:'n', meaning_vi:'mua sắm, cung ứng', definition:'the process of obtaining goods or services', example:'The procurement department handles all orders.', category:'Business' },
  { word:'tentative',   phonetic:'/ˈtentətɪv/',    word_type:'adj', meaning_vi:'tạm thời, chưa chắc chắn', definition:'not certain or fixed', example:'The schedule is tentative and may change.', category:'General' },
  { word:'surplus',     phonetic:'/ˈsɜːrpləs/',    word_type:'n', meaning_vi:'thặng dư, dư thừa', definition:'an amount left over when requirements are met', example:'The department had a budget surplus.', category:'Finance' },
  { word:'proficient',  phonetic:'/prəˈfɪʃənt/',   word_type:'adj', meaning_vi:'thành thạo, giỏi', definition:'competent or skilled in doing something', example:'She is proficient in three languages.', category:'HR' },
  { word:'obsolete',    phonetic:'/ˌɒbsəˈliːt/',   word_type:'adj', meaning_vi:'lỗi thời, lạc hậu', definition:'no longer used or needed', example:'The old system became obsolete.', category:'General' },
  { word:'verify',      phonetic:'/ˈverɪfaɪ/',     word_type:'v', meaning_vi:'xác minh, kiểm tra', definition:'to check that something is true', example:'Please verify your contact information.', category:'General' },
  { word:'allocate',    phonetic:'/ˈæləkeɪt/',     word_type:'v', meaning_vi:'phân bổ, phân phối', definition:'to distribute for a specific purpose', example:'We will allocate funds for the project.', category:'Finance' },
  { word:'deadline',    phonetic:'/ˈdedlaɪn/',     word_type:'n', meaning_vi:'hạn chót, thời hạn cuối', definition:'a time by which something must be done', example:'The deadline is Friday at 5pm.', category:'Business' },
  { word:'merger',      phonetic:'/ˈmɜːrdʒər/',    word_type:'n', meaning_vi:'sự sáp nhập', definition:'a combination of two companies into one', example:'The merger was completed last quarter.', category:'Business' },
  { word:'agenda',      phonetic:'/əˈdʒendə/',     word_type:'n', meaning_vi:'chương trình nghị sự', definition:'a list of items to be discussed', example:'Please review the meeting agenda.', category:'Business' },
  { word:'endorse',     phonetic:'/ɪnˈdɔːrs/',     word_type:'v', meaning_vi:'xác nhận, ủng hộ', definition:'to express support or approval', example:'The manager endorsed the proposal.', category:'Business' },
];

export class VocabularyPage {
  constructor(db, store, bus, realtime) {
    this.db         = db; this.store = store; this.bus = bus; this.realtime = realtime;
    this._words     = []; this._filter = 'all'; this._search = '';
    this._mode      = 'list'; this._fcIdx = 0; this._fcFlipped = false;
    this._quizQ     = null; this._quizScore = { correct: 0, total: 0 };
    this._listenIdx = 0; this._listenAnswered = false;
    this._speakIdx  = 0; this._isListening = false; this._recog = null;
    this._dictCache = {}; this._lastDictResult = null;
    this._synth     = window.speechSynthesis;
  }

  render() {
    document.querySelector('.main').innerHTML = `
    <div class="page">
      <div class="page-header-row page-header">
        <div>
          <h1 class="page-title">🇺🇸 Từ vựng TOEIC</h1>
          <p class="page-sub">Học · Ôn · 🎧 Nghe · 🎤 Nói · Tra từ điển · SRS thông minh</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost" onclick="vocabPage.openDictSearch()">🔍 Từ điển</button>
          <button class="btn btn-primary" onclick="vocabPage.openAdd()">＋ Thêm từ</button>
        </div>
      </div>
      <div class="tabs" style="margin-bottom:16px;flex-wrap:wrap;gap:4px">
        <button class="tab active" onclick="vocabPage.setMode('list',this)">📋 Danh sách</button>
        <button class="tab" onclick="vocabPage.setMode('flashcard',this)">🃏 Flashcard</button>
        <button class="tab" onclick="vocabPage.setMode('quiz',this)">🧪 Quiz</button>
        <button class="tab" onclick="vocabPage.setMode('listening',this)">🎧 Nghe</button>
        <button class="tab" onclick="vocabPage.setMode('speaking',this)">🎤 Nói</button>
        <button class="tab" onclick="vocabPage.setMode('wordbank',this)">📖 Ngân hàng từ</button>
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

    <!-- ADD/EDIT MODAL -->
    <div class="overlay" id="addVocabModal">
      <div class="modal" style="max-width:560px">
        <div class="modal-title" id="addVocabTitle">＋ Thêm từ mới</div>
        <input type="hidden" id="editVocabId">
        <div style="background:var(--blue-l);border:1px solid var(--blue);border-radius:var(--r-md);padding:10px 14px;margin-bottom:16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span style="font-size:13px;color:var(--blue-d);font-weight:500">🔍 Tra từ điển tự động điền:</span>
          <div style="flex:1;display:flex;gap:6px;min-width:200px">
            <input class="form-input" id="dictLookupInput" placeholder="Nhập từ..." style="flex:1;margin:0">
            <button class="btn btn-primary btn-sm" onclick="vocabPage.lookupAndFill()" id="dictLookupBtn">Tra</button>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label class="form-label">Từ vựng *</label>
            <div style="display:flex;gap:6px">
              <input class="form-input" id="vWord" placeholder="VD: achievement" oninput="document.getElementById('dictLookupInput').value=this.value" style="flex:1">
              <button onclick="vocabPage.speakText(document.getElementById('vWord').value,'en-US')" style="background:var(--blue-l);border:1px solid var(--blue);border-radius:var(--r-md);padding:0 10px;cursor:pointer" title="Nghe">🔊</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Loại từ</label>
            <select class="form-select" id="vType">
              <option value="n">n - Danh từ</option><option value="v">v - Động từ</option>
              <option value="adj">adj - Tính từ</option><option value="adv">adv - Trạng từ</option>
              <option value="phrase">phrase</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Phiên âm</label><input class="form-input" id="vPhonetic" placeholder="/əˈtʃiːvmənt/"></div>
          <div class="form-group"><label class="form-label">Chủ đề</label>
            <select class="form-select" id="vCategory"><option>TOEIC</option><option>Business</option><option>Finance</option><option>HR</option><option>Travel</option><option>General</option></select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Nghĩa tiếng Việt *</label><input class="form-input" id="vMeaning" placeholder="VD: thành tích, thành tựu"></div>
        <div class="form-group"><label class="form-label">Định nghĩa (English)</label><input class="form-input" id="vDef" placeholder="a thing done successfully"></div>
        <div class="form-group"><label class="form-label">Ví dụ</label><textarea class="form-textarea" id="vExample" rows="2" placeholder="Her achievement was remarkable."></textarea></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="document.getElementById('addVocabModal').classList.remove('open')">Hủy</button>
          <button class="btn btn-primary" onclick="vocabPage.saveWord()">💾 Lưu</button>
        </div>
      </div>
    </div>

    <!-- DICTIONARY MODAL -->
    <div class="overlay" id="dictModal">
      <div class="modal" style="max-width:560px">
        <div class="modal-title">🔍 Từ điển Anh — Free Dictionary</div>
        <div style="display:flex;gap:8px;margin-bottom:16px">
          <input class="form-input" id="dictInput" placeholder="Nhập từ cần tra..." style="flex:1" onkeydown="if(event.key==='Enter')vocabPage.lookupDict()">
          <button class="btn btn-primary" onclick="vocabPage.lookupDict()" id="dictSearchBtn">🔍 Tra</button>
        </div>
        <div id="dictResult" style="min-height:120px"></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="document.getElementById('dictModal').classList.remove('open')">Đóng</button>
          <button class="btn btn-success" id="dictAddBtn" style="display:none" onclick="vocabPage.addFromDict()">➕ Thêm từ này</button>
        </div>
      </div>
    </div>`;
    window.vocabPage = this;
    this.loadWords();
  }

  async loadWords() {
    const user = this.store.get('currentUser');
    try {
      const rows = await this.db.select('vocabulary', { eq:{ user_id:user.id }, order:{ col:'created_at', asc:false } });
      this._words = rows.map(r => new Vocabulary(r));
    } catch(e) { console.error(e); this._words = []; }
    this.bus.emit('vocab:updated', this._words.length);
    this.renderContent();
  }

  setMode(mode, btn) {
    this._mode = mode; this._fcIdx = 0; this._fcFlipped = false; this._listenAnswered = false;
    document.querySelectorAll('.tabs .tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); this.renderContent();
  }

  setFilter(f, btn) {
    this._filter = f;
    document.querySelectorAll('#vp-toolbar button').forEach(b => { b.style.borderColor='var(--border)'; b.style.background='transparent'; b.style.color='var(--muted)'; });
    btn.style.borderColor='var(--blue)'; btn.style.background='var(--blue-l)'; btn.style.color='var(--blue-d)';
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
    if (this._mode === 'list')      this.renderList(el, words);
    else if (this._mode === 'flashcard') this.renderFlashcard(el, words);
    else if (this._mode === 'quiz') this.renderQuiz(el, words);
    else if (this._mode === 'listening') this.renderListening(el, words);
    else if (this._mode === 'speaking')  this.renderSpeaking(el, words);
    else if (this._mode === 'wordbank')  this.renderWordBank(el);
  }

  renderList(el, words) {
    if (!words.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">📭</div><div class="empty-text">Chưa có từ nào</div><br><button class="btn btn-primary" onclick="vocabPage.openAdd()">＋ Thêm từ đầu tiên</button></div>`; return; }
    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
      ${words.map(w => `<div class="card" style="border-left:3px solid ${w.levelColor}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div>
            <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:6px">
              ${w.word}
              <button onclick="vocabPage.speakText('${w.word.replace(/['"]/g,'_')}','en-US')" style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--muted)">🔊</button>
            </div>
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
        <div style="font-size:10px;color:var(--muted2);margin-top:6px">📅 Ôn tiếp: ${this._formatDate(w.nextReview)} · ${w.reviewCount} lần ôn</div>
      </div>`).join('')}
    </div>`;
  }

  renderFlashcard(el, words) {
    if (!words.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">🃏</div><div class="empty-text">Không có từ nào</div></div>`; return; }
    if (this._fcIdx >= words.length) this._fcIdx = 0;
    const w = words[this._fcIdx]; const flipped = this._fcFlipped;
    const pct = Math.round((this._fcIdx/words.length)*100);
    el.innerHTML = `<div style="max-width:520px;margin:0 auto">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <span style="font-size:12px;color:var(--muted)">${this._fcIdx+1}/${words.length}</span>
        <div style="flex:1;height:4px;background:var(--bg3);border-radius:99px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--blue);border-radius:99px;transition:width .3s"></div></div>
        <button onclick="vocabPage.speakText('${w.word.replace(/['"]/g,'_')}','en-US')" style="background:none;border:none;cursor:pointer;font-size:20px">🔊</button>
      </div>
      <div onclick="vocabPage.flipCard()" style="background:var(--white);border:1.5px solid var(--border);border-radius:var(--r-xl);padding:40px 32px;text-align:center;cursor:pointer;min-height:220px;display:flex;flex-direction:column;justify-content:center;box-shadow:var(--shadow-md);position:relative">
        <div style="position:absolute;top:14px;right:16px;font-size:11px;color:var(--muted)">${flipped?'↩ từ vựng':'👆 nhấn xem nghĩa'}</div>
        ${!flipped
          ? `<div style="font-family:'Lora',serif;font-size:36px;font-weight:700;margin-bottom:8px">${w.word}</div><div style="font-size:14px;color:var(--muted);font-family:var(--mono)">${w.phonetic||''}</div><div style="font-size:12px;color:var(--blue);margin-top:6px">${w.wordType} · ${w.category}</div>`
          : `<div style="font-size:22px;font-weight:600;margin-bottom:8px">${w.meaningVi}</div>${w.definition?`<div style="font-size:13px;color:var(--muted);font-style:italic;margin-bottom:8px">${w.definition}</div>`:''}${w.example?`<div style="font-size:12px;color:var(--muted);border-top:1px solid var(--border);padding-top:10px">${w.example}</div>`:''}<div style="margin-top:12px"><span style="font-size:11px;padding:3px 10px;border-radius:99px;background:${w.levelColor}22;color:${w.levelColor}">${w.levelLabel}</span></div>`}
      </div>
      ${flipped
        ? `<div style="display:flex;gap:10px;margin-top:16px;justify-content:center"><button class="btn btn-danger" onclick="vocabPage.fcReview('${w.id}',1)">❌ Quên</button><button class="btn btn-ghost" onclick="vocabPage.fcReview('${w.id}',2)">😅 Khó</button><button class="btn btn-ghost" onclick="vocabPage.fcReview('${w.id}',3)">👍 Nhớ</button><button class="btn btn-success" onclick="vocabPage.fcReview('${w.id}',4)">✅ Thuộc</button></div>`
        : `<div style="display:flex;gap:10px;margin-top:16px;justify-content:center"><button class="btn btn-ghost" onclick="vocabPage.fcPrev()">← Trước</button><button class="btn btn-primary" onclick="vocabPage.flipCard()">🔄 Lật thẻ</button><button class="btn btn-ghost" onclick="vocabPage.fcNext()">Tiếp →</button></div>`}
    </div>`;
  }

  renderQuiz(el, words) {
    if (words.length < 4) { el.innerHTML = `<div class="empty"><div class="empty-icon">🧪</div><div class="empty-text">Cần ít nhất 4 từ để làm quiz</div></div>`; return; }
    if (!this._quizQ) this.nextQuiz(words);
    const q = this._quizQ;
    const acc = this._quizScore.total ? Math.round(this._quizScore.correct/this._quizScore.total*100) : 0;
    el.innerHTML = `<div style="max-width:560px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;margin-bottom:20px;align-items:center">
        <span style="font-size:13px;color:var(--muted)">Câu ${this._quizScore.total+1}</span>
        <div style="display:flex;gap:10px;align-items:center">
          <span style="font-size:13px;font-weight:600;color:var(--green)">✅ ${this._quizScore.correct}/${this._quizScore.total}</span>
          ${this._quizScore.total?`<span style="font-size:12px;padding:2px 8px;border-radius:99px;background:${acc>=70?'var(--green-l)':'var(--red-l)'};color:${acc>=70?'var(--green)':'var(--red)'}">${acc}%</span>`:''}
        </div>
        <button class="btn btn-ghost btn-sm" onclick="vocabPage._quizScore={correct:0,total:0};vocabPage._quizQ=null;vocabPage.renderContent()">🔄 Reset</button>
      </div>
      <div style="background:var(--white);border:1.5px solid var(--border);border-radius:var(--r-xl);padding:28px;text-align:center;box-shadow:var(--shadow-sm);margin-bottom:16px">
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Nghĩa của từ này là gì?</div>
        <div style="font-family:'Lora',serif;font-size:32px;font-weight:700">${q.word.word}</div>
        <div style="font-size:13px;color:var(--muted);font-family:var(--mono);margin-top:4px">${q.word.phonetic||''}</div>
        <button onclick="vocabPage.speakText('${q.word.word.replace(/['"]/g,'_')}','en-US')" style="margin-top:8px;background:var(--blue-l);border:1px solid var(--blue);border-radius:99px;padding:4px 12px;cursor:pointer;font-size:12px;color:var(--blue-d)">🔊 Nghe</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${q.choices.map((c,i)=>`<button onclick="vocabPage.checkAnswer('${c.id}','${q.word.id}')" style="padding:14px 16px;border-radius:var(--r-md);border:1.5px solid var(--border);background:var(--white);cursor:pointer;font-size:13px;text-align:left;transition:all .15s;color:var(--text)" id="qbtn_${c.id}"><span style="font-weight:600;color:var(--muted);margin-right:8px">${['A','B','C','D'][i]}</span>${c.meaningVi}</button>`).join('')}
      </div>
    </div>`;
  }

  renderListening(el, words) {
    if (!words.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">🎧</div><div class="empty-text">Chưa có từ nào</div></div>`; return; }
    if (this._listenIdx >= words.length) this._listenIdx = 0;
    const w = words[this._listenIdx];
    const choices = this._buildListenChoices(words, w);
    el.innerHTML = `<div style="max-width:520px;margin:0 auto">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:12px;color:var(--muted);margin-bottom:4px">${this._listenIdx+1} / ${words.length}</div>
        <h2 style="font-size:18px;font-weight:600">🎧 Luyện nghe — Chọn từ bạn vừa nghe</h2>
      </div>
      <div style="background:linear-gradient(135deg,var(--blue-l),var(--purple-l));border:1.5px solid var(--blue);border-radius:var(--r-xl);padding:40px;text-align:center;margin-bottom:20px">
        <button onclick="vocabPage.speakText('${w.word.replace(/['"]/g,'_')}','en-US')" style="width:80px;height:80px;border-radius:50%;background:var(--blue);border:none;cursor:pointer;font-size:32px;box-shadow:var(--shadow-md);color:white">🔊</button>
        <div style="margin-top:12px;font-size:13px;color:var(--muted)">Nhấn để nghe · Chọn từ bạn nghe được</div>
        ${this._listenAnswered?`<div style="margin-top:14px;font-family:'Lora',serif;font-size:26px;font-weight:700;color:var(--blue)">${w.word}</div><div style="font-size:12px;color:var(--muted)">${w.phonetic||''}</div>`:''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        ${choices.map((c,i)=>`<button onclick="vocabPage.checkListenAnswer('${c.id}','${w.id}',this)" style="padding:14px;border-radius:var(--r-md);border:1.5px solid var(--border);background:var(--white);cursor:pointer;font-size:13px;transition:all .15s" id="lbtn_${c.id}"><span style="font-weight:700;color:var(--muted);margin-right:6px">${['A','B','C','D'][i]}</span>${c.word}</button>`).join('')}
      </div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-ghost" onclick="vocabPage._listenIdx=Math.max(0,vocabPage._listenIdx-1);vocabPage._listenAnswered=false;vocabPage.renderContent()">← Trước</button>
        <button class="btn btn-ghost btn-sm" onclick="vocabPage.speakText('${w.word.replace(/['"]/g,'_')}','en-US')">🔊 Nghe lại</button>
        <button class="btn btn-ghost" onclick="vocabPage._listenIdx=(vocabPage._listenIdx+1)%${words.length};vocabPage._listenAnswered=false;vocabPage.renderContent()">Tiếp →</button>
      </div>
    </div>`;
    setTimeout(() => this.speakText(w.word, 'en-US'), 600);
  }

  _buildListenChoices(words, correct) {
    const others = words.filter(w => w.id !== correct.id).sort(() => Math.random()-.5).slice(0,3);
    return [correct, ...others].sort(() => Math.random()-.5);
  }

  checkListenAnswer(chosenId, correctId) {
    if (this._listenAnswered) return;
    this._listenAnswered = true;
    const correct = chosenId === correctId;
    document.querySelectorAll('[id^="lbtn_"]').forEach(b => {
      const id = b.id.replace('lbtn_','');
      if (id === correctId) { b.style.background='#dcfce7'; b.style.borderColor='var(--green)'; }
      else if (id === chosenId && !correct) { b.style.background='rgba(239,68,68,0.1)'; b.style.borderColor='var(--red)'; }
      b.disabled = true;
    });
    if (correct) { Toast.ok('Chính xác! 🎉'); this.speakText('Correct!'); }
    else { const cw = this._words.find(w=>w.id===correctId); Toast.err(`Sai! Từ đúng: "${cw?.word||'?'}"`); }
    setTimeout(() => { this._listenIdx = (this._listenIdx+1) % this.filtered().length; this._listenAnswered = false; this.renderContent(); }, 1600);
  }

  renderSpeaking(el, words) {
    if (!words.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">🎤</div><div class="empty-text">Chưa có từ nào</div></div>`; return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { el.innerHTML = `<div class="empty"><div class="empty-icon">🎤</div><div class="empty-text">Trình duyệt không hỗ trợ Speech Recognition</div><p style="font-size:13px;color:var(--muted)">Dùng Chrome hoặc Edge</p></div>`; return; }
    const idx = this._speakIdx || 0;
    const w = words[idx % words.length];
    el.innerHTML = `<div style="max-width:520px;margin:0 auto">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:12px;color:var(--muted)">${idx+1} / ${words.length}</div>
        <h2 style="font-size:18px;font-weight:600;margin-top:4px">🎤 Luyện phát âm</h2>
        <p style="font-size:13px;color:var(--muted)">Đọc to từ tiếng Anh, AI chấm phát âm</p>
      </div>
      <div style="background:var(--white);border:1.5px solid var(--border);border-radius:var(--r-xl);padding:32px;text-align:center;box-shadow:var(--shadow-md);margin-bottom:20px">
        <div style="font-family:'Lora',serif;font-size:42px;font-weight:700;color:var(--blue);margin-bottom:6px">${w.word}</div>
        <div style="font-size:14px;color:var(--muted);font-family:var(--mono);margin-bottom:6px">${w.phonetic||''}</div>
        <div style="font-size:14px;color:var(--text2);margin-bottom:14px">${w.meaningVi}</div>
        <button onclick="vocabPage.speakText('${w.word.replace(/['"]/g,'_')}','en-US')" style="background:var(--blue-l);border:1px solid var(--blue);border-radius:99px;padding:6px 16px;cursor:pointer;font-size:13px;color:var(--blue-d)">🔊 Nghe mẫu</button>
      </div>
      <div style="text-align:center;margin-bottom:20px">
        <div id="speakStatus" style="font-size:14px;color:var(--muted);margin-bottom:12px">Nhấn nút đỏ để bắt đầu nói</div>
        <div id="speakResult" style="font-size:16px;font-weight:600;min-height:28px;margin-bottom:10px"></div>
        <div id="speakScore" style="min-height:50px;margin-bottom:14px"></div>
        <button id="speakBtn" onclick="vocabPage.startSpeaking('${w.word.replace(/['"]/g,'_')}')"
          style="width:80px;height:80px;border-radius:50%;background:var(--red);border:none;cursor:pointer;font-size:32px;box-shadow:var(--shadow-md);color:white">🎤</button>
      </div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-ghost" onclick="vocabPage._speakIdx=Math.max(0,(vocabPage._speakIdx||0)-1);vocabPage.renderContent()">← Trước</button>
        <button class="btn btn-ghost" onclick="vocabPage._speakIdx=((vocabPage._speakIdx||0)+1)%${words.length};vocabPage.renderContent()">Tiếp →</button>
      </div>
    </div>`;
  }

  startSpeaking(targetWord) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = document.getElementById('speakBtn');
    const status = document.getElementById('speakStatus');
    const result = document.getElementById('speakResult');
    const score  = document.getElementById('speakScore');
    if (this._isListening) { this._recog?.stop(); return; }
    const recog = new SpeechRecognition();
    recog.lang = 'en-US'; recog.continuous = false; recog.interimResults = false;
    this._recog = recog;
    recog.onstart = () => {
      this._isListening = true; btn.style.background='var(--green)'; btn.textContent='⏹';
      status.textContent='🎙 Đang nghe...'; result.textContent=''; score.innerHTML='';
    };
    recog.onresult = (e) => {
      const spoken = e.results[0][0].transcript.trim().toLowerCase();
      const conf = e.results[0][0].confidence;
      const target = targetWord.toLowerCase();
      const correct = spoken === target || spoken.includes(target) || target.includes(spoken);
      result.textContent = `Bạn nói: "${spoken}"`;
      result.style.color = correct ? 'var(--green)' : 'var(--orange)';
      const stars = correct && conf>0.85 ? '⭐⭐⭐' : correct ? '⭐⭐' : '⭐';
      score.innerHTML = `<div style="font-size:22px">${stars}</div><div style="font-size:13px;margin-top:4px;color:${correct?'var(--green)':'var(--orange)'}">${correct?`✅ Chính xác! Tự tin: ${Math.round(conf*100)}%`:'⚠️ Chưa khớp, thử lại!'}</div>`;
      if (correct) Toast.ok(`Phát âm tốt! ${stars}`);
    };
    recog.onerror = (e) => { status.textContent='Lỗi: '+e.error; this._isListening=false; btn.style.background='var(--red)'; btn.textContent='🎤'; };
    recog.onend   = () => { this._isListening=false; btn.style.background='var(--red)'; btn.textContent='🎤'; if(!result.textContent) status.textContent='Không nghe thấy, thử lại'; else status.textContent='Xong! Nhấn lại để thử lại'; };
    recog.start();
  }

  renderWordBank(el) {
    const myWords = new Set(this._words.map(w => w.word.toLowerCase()));
    el.innerHTML = `<div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div><h3 style="font-size:16px;font-weight:600">📖 Ngân hàng từ TOEIC</h3><p style="font-size:12px;color:var(--muted)">${TOEIC_WORDBANK.filter(w=>!myWords.has(w.word.toLowerCase())).length} từ chưa học · ${this._words.length} đã có</p></div>
        <button class="btn btn-primary btn-sm" onclick="vocabPage.addAllFromBank()">➕ Thêm tất cả</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">
        ${TOEIC_WORDBANK.map(w => {
          const owned = myWords.has(w.word.toLowerCase());
          return `<div style="background:var(--white);border:1px solid ${owned?'var(--green)':'var(--border)'};border-radius:var(--r-lg);padding:14px;position:relative">
            ${owned?'<div style="position:absolute;top:10px;right:10px;font-size:11px;background:var(--green-l);color:var(--green);padding:2px 8px;border-radius:99px">✅ Đã có</div>':''}
            <div style="font-size:15px;font-weight:700;margin-bottom:2px;display:flex;align-items:center;gap:6px">
              ${w.word}<button onclick="vocabPage.speakText('${w.word}','en-US')" style="background:none;border:none;cursor:pointer;font-size:12px">🔊</button>
            </div>
            <div style="font-size:11px;color:var(--muted);font-family:var(--mono);margin-bottom:4px">${w.phonetic} · <span style="color:var(--blue)">${w.word_type}</span></div>
            <div style="font-size:13px;margin-bottom:4px">${w.meaning_vi}</div>
            <div style="font-size:11px;color:var(--muted);font-style:italic;margin-bottom:8px">${w.definition}</div>
            ${!owned?`<button class="btn btn-primary btn-sm" onclick="vocabPage.addFromBankItem('${w.word}')">➕ Thêm</button>`:''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  addFromBankItem(word) {
    const w = TOEIC_WORDBANK.find(x => x.word === word);
    if (w) this.addFromBankData(w);
  }

  async addFromBankData(w) {
    const user = this.store.get('currentUser');
    try {
      const row = await this.db.insert('vocabulary', { user_id:user.id, word:w.word, phonetic:w.phonetic||'', word_type:w.word_type||'n', meaning_vi:w.meaning_vi, definition:w.definition||'', example:w.example||'', category:w.category||'TOEIC', srs_level:0, review_count:0, next_review:new Date().toISOString() });
      this._words.unshift(new Vocabulary(row)); this.bus.emit('vocab:updated', this._words.length); Toast.ok(`Đã thêm "${w.word}"`); this.renderContent();
    } catch(e) { Toast.err('Lỗi: '+e.message); }
  }

  async addAllFromBank() {
    const myWords = new Set(this._words.map(w => w.word.toLowerCase()));
    const toAdd = TOEIC_WORDBANK.filter(w => !myWords.has(w.word.toLowerCase()));
    if (!toAdd.length) { Toast.info('Đã có tất cả từ!'); return; }
    const user = this.store.get('currentUser'); let added = 0;
    for (const w of toAdd) { try { const row = await this.db.insert('vocabulary', {user_id:user.id,word:w.word,phonetic:w.phonetic||'',word_type:w.word_type||'n',meaning_vi:w.meaning_vi,definition:w.definition||'',example:w.example||'',category:w.category||'TOEIC',srs_level:0,review_count:0,next_review:new Date().toISOString()}); this._words.unshift(new Vocabulary(row)); added++; } catch {} }
    this.bus.emit('vocab:updated', this._words.length); Toast.ok(`Đã thêm ${added} từ!`); this.renderContent();
  }

  openDictSearch() { document.getElementById('dictModal').classList.add('open'); setTimeout(()=>document.getElementById('dictInput')?.focus(),100); }

  async lookupDict() {
    const word = document.getElementById('dictInput').value.trim(); if (!word) return;
    const btn = document.getElementById('dictSearchBtn'); btn.textContent='⏳'; btn.disabled=true;
    const el = document.getElementById('dictResult');
    el.innerHTML=`<div style="text-align:center;padding:20px;color:var(--muted)">Đang tra...</div>`;
    try {
      const data = await this._fetchDict(word);
      if (!data) { el.innerHTML=`<div style="color:var(--red)">Không tìm thấy "${word}"</div>`; return; }
      this._lastDictResult = data; el.innerHTML = this._renderDictResult(data);
      document.getElementById('dictAddBtn').style.display='inline-flex';
    } catch(e) { el.innerHTML=`<div style="color:var(--red)">Lỗi: ${e.message}</div>`; }
    finally { btn.textContent='🔍 Tra'; btn.disabled=false; }
  }

  async _fetchDict(word) {
    if (this._dictCache[word]) return this._dictCache[word];
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) throw new Error('not found');
      const json = await res.json();
      const entry = json[0];
      const phonetic = entry.phonetic || entry.phonetics?.find(p=>p.text)?.text || '';
      const meanings = entry.meanings || [];
      const first = meanings[0];
      const result = { word:entry.word, phonetic, word_type:first?.partOfSpeech||'n', definition:first?.definitions?.[0]?.definition||'', example:first?.definitions?.[0]?.example||'', synonyms:first?.synonyms?.slice(0,5)||[], audioUrl:entry.phonetics?.find(p=>p.audio)?.audio||'' };
      this._dictCache[word] = result; return result;
    } catch {
      const local = TOEIC_WORDBANK.find(w=>w.word.toLowerCase()===word.toLowerCase());
      if (local) return { word:local.word, phonetic:local.phonetic, word_type:local.word_type, definition:local.definition, example:local.example, synonyms:[] };
      return null;
    }
  }

  _renderDictResult(d) {
    return `<div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div style="font-family:'Lora',serif;font-size:26px;font-weight:700">${d.word}</div>
        ${d.audioUrl?`<button onclick="new Audio('${d.audioUrl}').play()" style="background:var(--blue-l);border:1px solid var(--blue);border-radius:99px;padding:4px 12px;cursor:pointer;font-size:12px;color:var(--blue-d)">🔊 Nghe</button>`:
        `<button onclick="vocabPage.speakText('${d.word}','en-US')" style="background:var(--blue-l);border:1px solid var(--blue);border-radius:99px;padding:4px 12px;cursor:pointer;font-size:12px;color:var(--blue-d)">🔊 TTS</button>`}
      </div>
      <div style="font-size:12px;color:var(--muted);font-family:var(--mono);margin-bottom:8px">${d.phonetic||''} · <span style="color:var(--blue)">${d.word_type}</span></div>
      ${d.definition?`<div style="background:var(--bg2);border-radius:var(--r-md);padding:10px 14px;margin-bottom:8px"><div style="font-size:11px;color:var(--muted);margin-bottom:3px">Định nghĩa</div><div style="font-size:13px">${d.definition}</div></div>`:''}
      ${d.example?`<div style="background:var(--bg2);border-radius:var(--r-md);padding:10px 14px;margin-bottom:8px"><div style="font-size:11px;color:var(--muted);margin-bottom:3px">Ví dụ</div><div style="font-size:13px;font-style:italic">${d.example}</div></div>`:''}
      ${d.synonyms?.length?`<div style="font-size:12px;color:var(--muted)">Từ đồng nghĩa: <span style="color:var(--text)">${d.synonyms.join(', ')}</span></div>`:''}
      <div style="margin-top:12px;padding:10px;background:var(--orange-l);border-radius:var(--r-md);border-left:3px solid var(--orange);font-size:12px;color:var(--orange)">⚡ Nhấn "Thêm từ này" và điền nghĩa tiếng Việt để lưu vào kho từ vựng</div>
    </div>`;
  }

  addFromDict() {
    if (!this._lastDictResult) return;
    const d = this._lastDictResult;
    document.getElementById('dictModal').classList.remove('open');
    document.getElementById('vWord').value = d.word;
    document.getElementById('vPhonetic').value = d.phonetic || '';
    document.getElementById('vDef').value = d.definition || '';
    document.getElementById('vExample').value = d.example || '';
    if (d.word_type) { const sel=document.getElementById('vType'); const o=[...sel.options].find(o=>o.value===d.word_type); if(o) sel.value=d.word_type; }
    document.getElementById('addVocabModal').classList.add('open');
    Toast.info('Điền nghĩa tiếng Việt rồi lưu!');
  }

  async lookupAndFill() {
    const word = (document.getElementById('dictLookupInput')?.value || document.getElementById('vWord')?.value||'').trim();
    if (!word) { Toast.err('Nhập từ cần tra!'); return; }
    const btn = document.getElementById('dictLookupBtn'); btn.textContent='⏳'; btn.disabled=true;
    try {
      const data = await this._fetchDict(word);
      if (!data) { Toast.err('Không tìm thấy từ này'); return; }
      document.getElementById('vWord').value = data.word||word;
      if (data.phonetic) document.getElementById('vPhonetic').value = data.phonetic;
      if (data.definition) document.getElementById('vDef').value = data.definition;
      if (data.example) document.getElementById('vExample').value = data.example;
      if (data.word_type) { const sel=document.getElementById('vType'); const o=[...sel.options].find(o=>o.value===data.word_type); if(o) sel.value=data.word_type; }
      Toast.ok('Đã điền thông tin từ điển!');
    } catch(e) { Toast.err('Lỗi: '+e.message); }
    finally { btn.textContent='Tra'; btn.disabled=false; }
  }

  speakText(text, lang='en-US') {
    if (!this._synth || !text) return; this._synth.cancel();
    const utt = new SpeechSynthesisUtterance(text); utt.lang=lang; utt.rate=0.85;
    const voices = this._synth.getVoices(); const v = voices.find(v=>v.lang.startsWith('en')&&v.name.includes('Google'))||voices.find(v=>v.lang.startsWith('en'));
    if (v) utt.voice=v; this._synth.speak(utt);
  }

  nextQuiz(words) {
    const pool = words.length>=4?words:this._words; if(pool.length<4) return;
    const word = pool[Math.floor(Math.random()*pool.length)];
    const choices = [word,...pool.filter(w=>w.id!==word.id).sort(()=>Math.random()-.5).slice(0,3)].sort(()=>Math.random()-.5);
    this._quizQ = { word, choices };
  }

  checkAnswer(chosenId, correctId) {
    const correct = chosenId===correctId; this._quizScore.total++; if(correct) this._quizScore.correct++;
    document.querySelectorAll('[id^="qbtn_"]').forEach(b => { const id=b.id.replace('qbtn_',''); if(id===correctId){b.style.background='#dcfce7';b.style.borderColor='var(--green)';} else if(id===chosenId&&!correct){b.style.background='rgba(239,68,68,0.1)';b.style.borderColor='var(--red)';} b.disabled=true; });
    if(correct){Toast.ok('Chính xác! 🎉');this.speakText('Correct!');}else{Toast.err(`Sai! Đáp án: ${this._quizQ.word.meaningVi}`);}
    setTimeout(()=>{this.nextQuiz(this.filtered());this.renderContent();},1400);
  }

  flipCard(){this._fcFlipped=!this._fcFlipped;this.renderContent();}
  fcNext(){const w=this.filtered();this._fcIdx=(this._fcIdx+1)%w.length;this._fcFlipped=false;this.renderContent();}
  fcPrev(){const w=this.filtered();this._fcIdx=(this._fcIdx-1+w.length)%w.length;this._fcFlipped=false;this.renderContent();}
  async fcReview(id,q){await this.review(id,q);this.fcNext();}

  async review(id,quality){
    const w=this._words.find(x=>x.id===id); if(!w) return; w.review(quality);
    try{await this.db.update('vocabulary',id,{srs_level:w.srsLevel,next_review:w.nextReview.toISOString(),review_count:w.reviewCount});}catch(e){console.error(e);}
    this.renderContent();
  }

  openAdd(){
    document.getElementById('addVocabTitle').textContent='＋ Thêm từ mới'; document.getElementById('editVocabId').value='';
    ['vWord','vPhonetic','vMeaning','vDef','vExample'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('addVocabModal').classList.add('open');
  }

  openEdit(id){
    const w=this._words.find(x=>x.id===id); if(!w) return;
    document.getElementById('addVocabTitle').textContent='✏️ Chỉnh sửa từ'; document.getElementById('editVocabId').value=id;
    document.getElementById('vWord').value=w.word; document.getElementById('vPhonetic').value=w.phonetic;
    document.getElementById('vType').value=w.wordType; document.getElementById('vCategory').value=w.category;
    document.getElementById('vMeaning').value=w.meaningVi; document.getElementById('vDef').value=w.definition; document.getElementById('vExample').value=w.example;
    document.getElementById('addVocabModal').classList.add('open');
  }

  async saveWord(){
    const word=document.getElementById('vWord').value.trim(); const meaning=document.getElementById('vMeaning').value.trim();
    if(!word||!meaning){Toast.err('Nhập từ và nghĩa!');return;}
    const user=this.store.get('currentUser'); const editId=document.getElementById('editVocabId').value;
    const payload={word,meaning_vi:meaning,phonetic:document.getElementById('vPhonetic').value.trim(),word_type:document.getElementById('vType').value,category:document.getElementById('vCategory').value,definition:document.getElementById('vDef').value.trim(),example:document.getElementById('vExample').value.trim()};
    try{
      if(editId){await this.db.update('vocabulary',editId,payload);const idx=this._words.findIndex(w=>w.id===editId);if(idx>=0)this._words[idx]=new Vocabulary({...this._words[idx].toJSON(),...payload,id:editId});Toast.ok('Đã cập nhật!');}
      else{const row=await this.db.insert('vocabulary',{...payload,user_id:user.id,srs_level:0,review_count:0,next_review:new Date().toISOString()});this._words.unshift(new Vocabulary(row));Toast.ok(`Đã thêm "${word}"!`);}
      this.bus.emit('vocab:updated',this._words.length); document.getElementById('addVocabModal').classList.remove('open'); this.renderContent();
    }catch(e){Toast.err('Lỗi: '+e.message);}
  }

  async deleteWord(id){
    if(!confirm('Xóa từ này?')) return;
    try{await this.db.delete('vocabulary',id);this._words=this._words.filter(w=>w.id!==id);this.bus.emit('vocab:updated',this._words.length);this.renderContent();Toast.ok('Đã xóa');}
    catch(e){Toast.err('Lỗi: '+e.message);}
  }

  _formatDate(date){
    if(!date) return '—'; const d=new Date(date),now=new Date(); const diff=Math.ceil((d-now)/86400000);
    if(diff<=0) return 'Hôm nay'; if(diff===1) return 'Ngày mai'; return `${diff} ngày nữa`;
  }
}
