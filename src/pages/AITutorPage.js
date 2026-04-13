import { Toast } from '../components/index.js';

// ★ THAY API KEY GEMINI TẠI ĐÂY nếu bị lỗi quota/429
// Lấy FREE tại: https://aistudio.google.com → Get API Key → Create API key
const GEMINI_API_KEY = 'AIzaSyAavLnQP6I1FcaGX9vJS-MlYQ0RxRyaJ-M';

const _GEMINI_MODELS = [
  { api: 'v1beta', model: 'gemini-2.5-flash-preview-04-17' },
  { api: 'v1beta', model: 'gemini-2.5-flash' },
  { api: 'v1beta', model: 'gemini-2.0-flash' },
  { api: 'v1beta', model: 'gemini-2.0-flash-lite' },
  { api: 'v1beta', model: 'gemini-1.5-flash' },
  { api: 'v1beta', model: 'gemini-1.5-flash-8b' },
];

async function callAI(systemPrompt, messages) {
  const contents = [
    { role: 'user',  parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Đã hiểu. Tôi sẽ hỗ trợ bạn theo đúng vai trò.' }] },
    ...messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  ];
  let lastErr;
  for (const { api, model } of _GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 1000, temperature: 0.7 } })
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message || `HTTP ${res.status}`;
        if (res.status === 429 || res.status === 404 || msg.includes('quota') || msg.includes('not found') || msg.includes('not supported')) {
          lastErr = new Error(msg);
          if (res.status === 429) await new Promise(r => setTimeout(r, 600));
          continue;
        }
        throw new Error(msg);
      }
      console.log(`✅ AI: ${model}`);
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, không có phản hồi.';
    } catch(e) {
      lastErr = e;
      if (!e.message.includes('quota') && !e.message.includes('not found') && !e.message.includes('429') && !e.message.includes('not supported')) throw e;
    }
  }
  throw new Error('⚠️ API Gemini hết quota hoặc key không hợp lệ.\nLấy key mới tại: https://aistudio.google.com → Get API Key\nSau đó thay vào dòng GEMINI_API_KEY trong AITutorPage.js');
}

export class AITutorPage {
  constructor(db, store, bus) {
    this.db = db; this.store = store; this.bus = bus;
    this._messages = []; this._loading = false;
    this._progressData = null; this._mode = 'chat';
    this._practiceMode = null; this._practiceSession = null;
  }

  render() {
    document.querySelector('.main').innerHTML = `
    <div class="page" style="max-width:900px">
      <div class="page-header-row page-header">
        <div>
          <h1 class="page-title">🤖 AI Tutor</h1>
          <p class="page-sub">Học thông minh · Luyện tập · Phân tích tiến độ</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="aiTutor.switchMode('practice')">🎯 Luyện tập</button>
          <button class="btn btn-ghost btn-sm" onclick="aiTutor.analyzeProgress()">📊 Phân tích</button>
        </div>
      </div>

      <!-- MODE TABS -->
      <div class="tabs" style="margin-bottom:16px">
        <button class="tab active" onclick="aiTutor.switchMode('chat',this)" id="tab-chat-btn">💬 Chat với AI</button>
        <button class="tab" onclick="aiTutor.switchMode('practice',this)" id="tab-practice-btn">🎯 Luyện kỹ năng</button>
        <button class="tab" onclick="aiTutor.switchMode('reading',this)" id="tab-reading-btn">📖 Đọc hiểu</button>
        <button class="tab" onclick="aiTutor.switchMode('listening',this)" id="tab-listening-btn">🎧 Nghe hiểu</button>
        <button class="tab" onclick="aiTutor.switchMode('speaking',this)" id="tab-speaking-btn">🗣️ Luyện nói</button>
      </div>

      <!-- CHAT MODE -->
      <div id="ai-mode-chat">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
          <button class="btn btn-ghost btn-sm" onclick="aiTutor.quickAsk('Phân tích chi tiết tiến độ học của tôi')">📊 Tiến độ</button>
          <button class="btn btn-ghost btn-sm" onclick="aiTutor.quickAsk('Gợi ý từ vựng TOEIC tôi nên học tiếp theo dựa trên level hiện tại')">📚 Gợi ý từ</button>
          <button class="btn btn-ghost btn-sm" onclick="aiTutor.quickAsk('Chiến lược thi TOEIC 600+ hiệu quả nhất cho tôi')">🎯 Chiến lược</button>
          <button class="btn btn-ghost btn-sm" onclick="aiTutor.quickAsk('Tôi cần cải thiện kỹ năng nào nhất? Cho kế hoạch học 7 ngày')">📅 Kế hoạch</button>
          <button class="btn btn-ghost btn-sm" onclick="aiTutor.quickAsk('Động viên tôi và nhận xét điểm mạnh yếu của tôi')">💪 Đánh giá</button>
          <button class="btn btn-ghost btn-sm" onclick="aiTutor.quickAsk('Giải thích SRS và cách học từ vựng hiệu quả nhất')">🧠 Mẹo học</button>
        </div>
        <div style="display:flex;flex-direction:column;height:calc(100vh - 380px);min-height:380px;background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--shadow-sm)">
          <div id="aiMessages" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:12px">
            <div style="text-align:center;padding:24px">
              <div style="font-size:52px;margin-bottom:12px">🤖</div>
              <div style="font-size:17px;font-weight:700;margin-bottom:8px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Xin chào! Tôi là AI Tutor của bạn</div>
              <div style="font-size:13px;color:var(--muted);max-width:420px;margin:0 auto;line-height:1.7">Tôi phân tích dữ liệu học tập thực của bạn, gợi ý từ vựng, luyện kỹ năng Reading · Listening · Speaking và tư vấn chiến lược TOEIC 600+</div>
            </div>
          </div>
          <div style="border-top:1px solid var(--border);padding:12px 14px;display:flex;gap:10px;align-items:flex-end;background:var(--bg2)">
            <textarea id="aiInput" placeholder="Hỏi bất cứ điều gì về TOEIC, tiến độ học, ngữ pháp..." style="flex:1;border:1.5px solid var(--border);border-radius:var(--r-lg);padding:10px 14px;font-size:13px;font-family:var(--font);resize:none;min-height:44px;max-height:120px;outline:none;background:var(--white)" rows="1"
              oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"
              onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();aiTutor.send()}"
              onfocus="this.style.borderColor='var(--blue)'" onblur="this.style.borderColor='var(--border)'"></textarea>
            <button onclick="aiTutor.send()" id="aiSendBtn" style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:white;flex-shrink:0">➤</button>
          </div>
        </div>
      </div>

      <!-- PRACTICE MODE -->
      <div id="ai-mode-practice" style="display:none">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px">
          ${[
            {icon:'📖',title:'Đọc hiểu',sub:'TOEIC Part 6-7',color:'#3b82f6',action:"aiTutor.startPractice('reading')"},
            {icon:'🎧',title:'Nghe hiểu',sub:'TOEIC Part 1-4',color:'#8b5cf6',action:"aiTutor.startPractice('listening')"},
            {icon:'🗣️',title:'Luyện nói',sub:'Phát âm & Hội thoại',color:'#f59e0b',action:"aiTutor.startPractice('speaking')"},
            {icon:'✍️',title:'Điền từ',sub:'TOEIC Part 5',color:'#10b981',action:"aiTutor.startPractice('grammar')"},
          ].map(p=>`<div onclick="${p.action}" style="background:var(--white);border:2px solid var(--border);border-radius:var(--r-xl);padding:24px;text-align:center;cursor:pointer;transition:all .2s" onmouseover="this.style.borderColor='${p.color}';this.style.transform='translateY(-3px)'" onmouseout="this.style.borderColor='var(--border)';this.style.transform=''">
            <div style="font-size:40px;margin-bottom:10px">${p.icon}</div>
            <div style="font-weight:700;font-size:15px;margin-bottom:4px">${p.title}</div>
            <div style="font-size:12px;color:var(--muted)">${p.sub}</div>
          </div>`).join('')}
        </div>
        <div id="practiceArea"></div>
      </div>

      <!-- READING MODE -->
      <div id="ai-mode-reading" style="display:none">
        <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);padding:24px;box-shadow:var(--shadow-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div>
              <div style="font-size:16px;font-weight:700">📖 Luyện đọc hiểu TOEIC</div>
              <div style="font-size:12px;color:var(--muted)">AI tạo bài đọc phù hợp với level của bạn • Part 6-7</div>
            </div>
            <button class="btn btn-primary" onclick="aiTutor.generateReading()">✨ Tạo bài mới</button>
          </div>
          <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
            <span style="font-size:12px;color:var(--muted)">Chủ đề:</span>
            ${['Workplace','Business','Travel','Technology','HR'].map(t=>`<button onclick="aiTutor.setReadingTopic('${t}',this)" style="padding:4px 12px;border-radius:99px;font-size:12px;border:1.5px solid var(--border);background:transparent;cursor:pointer" class="topic-btn">${t}</button>`).join('')}
          </div>
          <div id="readingContent">
            <div style="text-align:center;padding:40px;color:var(--muted)">
              <div style="font-size:40px;margin-bottom:10px">📖</div>
              <div>Nhấn "Tạo bài mới" để AI tạo bài đọc phù hợp với trình độ của bạn</div>
              <div style="font-size:12px;margin-top:6px">AI sẽ tạo đoạn văn + câu hỏi theo format TOEIC Part 6-7</div>
            </div>
          </div>
        </div>
      </div>

      <!-- LISTENING MODE -->
      <div id="ai-mode-listening" style="display:none">
        <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);padding:24px;box-shadow:var(--shadow-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div>
              <div style="font-size:16px;font-weight:700">🎧 Luyện nghe TOEIC</div>
              <div style="font-size:12px;color:var(--muted)">AI tạo đoạn hội thoại • Dùng Text-to-Speech • Part 1-4</div>
            </div>
            <button class="btn btn-primary" onclick="aiTutor.generateListening()">✨ Tạo bài mới</button>
          </div>
          <div style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-radius:var(--r-lg);padding:16px;margin-bottom:16px;font-size:13px;line-height:1.7">
            💡 <strong>Hướng dẫn:</strong> AI tạo đoạn hội thoại ngắn → Nhấn 🔊 để nghe → Trả lời câu hỏi. 
            <br>🔑 Chiến lược: Đọc câu hỏi TRƯỚC, nghe lần 1 nắm ý chính, lần 2 tìm chi tiết.
          </div>
          <div id="listeningContent">
            <div style="text-align:center;padding:40px;color:var(--muted)">
              <div style="font-size:40px;margin-bottom:10px">🎧</div>
              <div>Nhấn "Tạo bài mới" để AI tạo đoạn hội thoại TOEIC</div>
            </div>
          </div>
        </div>
      </div>

      <!-- SPEAKING MODE -->
      <div id="ai-mode-speaking" style="display:none">
        <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);padding:24px;box-shadow:var(--shadow-sm)">
          <div style="font-size:16px;font-weight:700;margin-bottom:6px">🗣️ Luyện nói & Phát âm</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:16px">AI tạo câu để luyện nói • Nghe mẫu • Tự đọc & so sánh</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
            <div style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-radius:var(--r-lg);padding:16px">
              <div style="font-weight:600;margin-bottom:8px">🎯 Bài luyện hôm nay</div>
              <button class="btn btn-primary" style="width:100%;margin-bottom:8px" onclick="aiTutor.generateSpeaking()">✨ Tạo bài luyện nói</button>
              <button class="btn btn-ghost" style="width:100%" onclick="aiTutor.practicePronunciation()">🔤 Luyện phát âm từ vựng</button>
            </div>
            <div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border-radius:var(--r-lg);padding:16px">
              <div style="font-weight:600;margin-bottom:8px">💡 Mẹo luyện nói</div>
              <div style="font-size:12px;color:var(--muted);line-height:1.8">
                • Nghe mẫu → đọc theo (shadowing)<br>
                • Tập nói to, rõ ràng, chậm trước<br>
                • Ghi âm và so sánh với mẫu<br>
                • Luyện 10-15 phút/ngày đều đặn
              </div>
            </div>
          </div>
          <div id="speakingContent">
            <div style="text-align:center;padding:30px;color:var(--muted)">
              <div style="font-size:40px;margin-bottom:10px">🗣️</div>
              <div>Chọn bài luyện để bắt đầu</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    window.aiTutor = this;
    this._readingTopic = 'Workplace';
    this.loadProgressData();
    this._scheduleInsights();
  }

  switchMode(mode, btn) {
    ['chat','practice','reading','listening','speaking'].forEach(m => {
      const el = document.getElementById(`ai-mode-${m}`);
      if (el) el.style.display = 'none';
    });
    const target = document.getElementById(`ai-mode-${mode}`);
    if (target) target.style.display = 'block';
    this._mode = mode;
    document.querySelectorAll('.tabs .tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    else {
      const tabBtn = document.getElementById(`tab-${mode}-btn`);
      if (tabBtn) tabBtn.classList.add('active');
    }
  }

  setReadingTopic(topic, btn) {
    this._readingTopic = topic;
    document.querySelectorAll('.topic-btn').forEach(b => {
      b.style.borderColor = 'var(--border)'; b.style.background = 'transparent'; b.style.color = 'var(--text)';
    });
    if (btn) { btn.style.borderColor = 'var(--blue)'; btn.style.background = 'var(--blue-l)'; btn.style.color = 'var(--blue-d)'; }
  }

  async loadProgressData() {
    const user = this.store.get('currentUser');
    if (!user) return;
    try {
      const [vocab, progress, pomodoro] = await Promise.all([
        this.db.select('vocabulary', { eq:{ user_id: user.id } }).catch(()=>[]),
        this.db.select('learning_progress', { eq:{ user_id: user.id } }).catch(()=>[]),
        this.db.select('pomodoro_sessions', { eq:{ user_id: user.id, completed:true } }).catch(()=>[]),
      ]);
      this._progressData = {
        totalWords: vocab.length, masteredWords: vocab.filter(w=>w.srs_level>=4).length,
        learningWords: vocab.filter(w=>w.srs_level>0&&w.srs_level<4).length,
        daysCompleted: progress.filter(p=>p.completed).length,
        pomodoroSessions: pomodoro.length, xp: user.xp||0, level: user.level||1, streak: user.streak||0,
        recentVocab: vocab.slice(0,8).map(w=>w.word),
        dueForReview: vocab.filter(w=>new Date(w.next_review)<=new Date()).length,
        categories: [...new Set(vocab.map(w=>w.category))],
      };
    } catch(e) { this._progressData = {}; }
  }

  _scheduleInsights() {
    // Auto AI insight after 3 minutes
    setTimeout(async () => {
      if (this._mode !== 'chat') return;
      await this.loadProgressData();
      const p = this._progressData || {};
      if (p.dueForReview > 0) {
        this._autoInsight(`💡 Nhắc nhỏ: Bạn có **${p.dueForReview} từ cần ôn** hôm nay! Ôn SRS giúp nhớ lâu hơn 80%. Bạn có muốn tôi tạo bài quiz ôn từ không?`);
      }
    }, 180000);
  }

  _autoInsight(msg) {
    const el = document.getElementById('aiMessages');
    if (!el) return;
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:10px;align-items:flex-start';
    div.innerHTML = `
      <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#ef4444);display:flex;align-items:center;justify-content:center;font-size:14px;color:white;flex-shrink:0">💡</div>
      <div style="max-width:80%;background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fcd34d;padding:12px 16px;border-radius:18px 18px 18px 4px;font-size:13px;line-height:1.6">${this._formatMessage(msg)}</div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  quickAsk(text) {
    this.switchMode('chat');
    const input = document.getElementById('aiInput');
    if (input) { input.value = text; this.send(); }
  }

  async analyzeProgress() {
    await this.loadProgressData();
    this.switchMode('chat');
    this.quickAsk('Phân tích chi tiết tiến độ học của tôi dựa trên dữ liệu thực. Cho tôi biết điểm mạnh, điểm yếu và kế hoạch cụ thể để cải thiện.');
  }

  async send() {
    const input = document.getElementById('aiInput');
    const text = input?.value?.trim();
    if (!text || this._loading) return;
    input.value = ''; input.style.height = 'auto';
    this.appendMessage('user', text);
    this._loading = true;
    const btn = document.getElementById('aiSendBtn');
    if (btn) { btn.disabled=true; btn.textContent='⏳'; }
    const typingId = this.appendTyping();
    try {
      await this.loadProgressData();
      const msgs = [...this._messages.slice(-12).map(m=>({role:m.role,content:m.content})), {role:'user',content:text}];
      const reply = await callAI(this._buildSystemPrompt(), msgs);
      this.removeTyping(typingId);
      this.appendMessage('assistant', reply);
      this._messages.push({role:'user',content:text},{role:'assistant',content:reply});
    } catch(e) {
      this.removeTyping(typingId);
      this.appendMessage('assistant', `❌ Lỗi AI: ${e.message}\n\n${
        !GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_KEY_HERE'
          ? '⚠️ Chưa điền Gemini API key! Mở AITutorPage.js dòng đầu và điền key vào.'
          : 'Thử lại sau ít giây. Nếu vẫn lỗi, kiểm tra key tại aistudio.google.com'
      }`);
    } finally {
      this._loading = false;
      if (btn) { btn.disabled=false; btn.textContent='➤'; }
    }
  }

  async generateReading() {
    const el = document.getElementById('readingContent');
    el.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted)"><div style="font-size:30px;margin-bottom:8px">⏳</div>AI đang tạo bài đọc...</div>`;
    try {
      const p = this._progressData || {};
      const prompt2 = `Tạo 1 bài đọc TOEIC Part 6-7 về chủ đề "${this._readingTopic||'Workplace'}".
Format JSON CHÍNH XÁC như sau (không có gì khác ngoài JSON):
{"passage":"đoạn văn 80-120 từ tiếng Anh có 2 chỗ trống đánh dấu [BLANK1] và [BLANK2]","questions":[{"q":"[BLANK1] is best completed by:","opts":["A. organize","B. organized","C. organizing","D. organization"],"ans":"B","exp":"Giải thích ngắn"},{"q":"[BLANK2] is best completed by:","opts":["A. however","B. therefore","C. although","D. besides"],"ans":"B","exp":"Giải thích ngắn"},{"q":"What is the main purpose of this email?","opts":["A. To announce a meeting","B. To request information","C. To confirm an order","D. To apply for a job"],"ans":"A","exp":"Giải thích ngắn"}],"vocab":[{"word":"word","meaning":"nghĩa"}]}`;
      const text = await callAI('Bạn là AI tạo bài tập TOEIC. Chỉ trả về JSON, không có gì khác.', [{role:'user',content:prompt2}]);
      const json = JSON.parse(text.replace(/```json|```/g,'').trim());
      this._renderReading(el, json);
    } catch(e) {
      el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--red)">❌ Lỗi tạo bài: ${e.message}</div>`;
    }
  }

  _renderReading(el, data) {
    const userAnswers = {};
    el.innerHTML = `
    <div>
      <div style="background:var(--bg2);border-radius:var(--r-lg);padding:18px;margin-bottom:18px;font-size:14px;line-height:1.9;border-left:3px solid var(--blue)">
        ${data.passage.replace('[BLANK1]','<span style="display:inline-block;min-width:100px;border-bottom:2px solid var(--blue);margin:0 4px" id="blank1">_____</span>').replace('[BLANK2]','<span style="display:inline-block;min-width:100px;border-bottom:2px solid var(--blue);margin:0 4px" id="blank2">_____</span>')}
      </div>
      <div id="reading-questions">
        ${data.questions.map((q,i)=>`
        <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;margin-bottom:10px">
          <div style="font-weight:600;margin-bottom:10px;font-size:13px">${i+1}. ${q.q}</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${q.opts.map(o=>`<button onclick="aiTutor._checkReading(${i},'${o.charAt(0)}','${q.ans}','${q.exp.replace(/'/g,"\\'")}',this)" style="text-align:left;padding:9px 14px;border-radius:var(--r-md);border:1.5px solid var(--border);background:transparent;cursor:pointer;font-size:13px;transition:all .15s" class="reading-opt-${i}">${o}</button>`).join('')}
          </div>
          <div id="reading-exp-${i}" style="display:none;margin-top:10px;font-size:12px;color:var(--muted);background:var(--bg2);padding:8px 12px;border-radius:var(--r-md)"></div>
        </div>`).join('')}
      </div>
      ${data.vocab?.length ? `<div style="margin-top:16px">
        <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:8px;font-family:var(--mono)">📚 TỪ VỰNG TRONG BÀI</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${data.vocab.map(v=>`<div style="background:var(--blue-l);border-radius:var(--r-md);padding:6px 12px;font-size:12px"><strong>${v.word}</strong>: ${v.meaning}</div>`).join('')}
        </div>
      </div>`:''}
      <div style="margin-top:16px;text-align:center">
        <button class="btn btn-primary" onclick="aiTutor.generateReading()">✨ Bài mới</button>
        <button class="btn btn-ghost" onclick="aiTutor.quickAsk('Giải thích chi tiết ngữ pháp trong bài đọc vừa rồi')" style="margin-left:8px">🤖 Hỏi AI</button>
      </div>
    </div>`;
  }

  _checkReading(qIdx, chosen, correct, exp, btn) {
    document.querySelectorAll(`.reading-opt-${qIdx}`).forEach(b => b.disabled = true);
    const isOk = chosen === correct;
    btn.style.background = isOk ? 'var(--green)' : 'rgba(239,68,68,0.1)';
    btn.style.borderColor = isOk ? 'var(--green)' : 'var(--red)';
    btn.style.color = isOk ? 'white' : 'var(--red)';
    if (!isOk) {
      document.querySelectorAll(`.reading-opt-${qIdx}`).forEach(b => {
        if (b.textContent.trim().startsWith(correct)) { b.style.background='var(--green)'; b.style.borderColor='var(--green)'; b.style.color='white'; }
      });
    }
    const expEl = document.getElementById(`reading-exp-${qIdx}`);
    if (expEl) { expEl.style.display='block'; expEl.textContent = (isOk?'✅ Chính xác! ':'❌ Sai rồi! ') + exp; }
    if (isOk) Toast.ok('Đúng rồi! 🎉'); else Toast.err('Sai! Xem giải thích bên dưới');
  }

  async generateListening() {
    const el = document.getElementById('listeningContent');
    el.innerHTML = `<div style="text-align:center;padding:30px"><div style="font-size:30px;margin-bottom:8px">⏳</div>AI đang tạo đoạn hội thoại...</div>`;
    try {
      const _aiText_listening = await callAI('Bạn là AI tạo bài tập TOEIC. Chỉ trả về JSON, không có gì khác.', [{role:'user',content:`Tạo 1 đoạn hội thoại TOEIC Part 3 (2 người, 4-6 dòng, chủ đề công sở). Format JSON:
{"dialogue":[{"speaker":"Man","text":"Hello, I wanted to ask about the meeting schedule."},{"speaker":"Woman","text":"The meeting has been moved to Thursday at 2 PM."}],"questions":[{"q":"What are they discussing?","opts":["A. A meeting time","B. A job application","C. A product order","D. A travel plan"],"ans":"A","exp":"Giải thích"},{"q":"When is the meeting?","opts":["A. Monday","B. Tuesday","C. Wednesday","D. Thursday"],"ans":"D","exp":"Giải thích"}],"tip":"Mẹo nghe: chú ý từ khóa về thời gian và địa điểm"}`}]);
      const json = JSON.parse(_aiText_listening.replace(/```json|```/g,'').trim());
      this._renderListening(el, json);
    } catch(e) {
      el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--red)">❌ Lỗi: ${e.message}</div>`;
    }
  }

  _renderListening(el, data) {
    const fullText = data.dialogue.map(d=>`${d.speaker}: ${d.text}`).join('. ');
    el.innerHTML = `
    <div>
      <div style="background:var(--bg2);border-radius:var(--r-lg);padding:18px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-size:13px;font-weight:600">📻 Đoạn hội thoại</div>
          <div style="display:flex;gap:8px">
            <button onclick="aiTutor._speak('${fullText.replace(/'/g,"\\'")}',0.85)" class="btn btn-primary btn-sm">🔊 Nghe (0.85x)</button>
            <button onclick="aiTutor._speak('${fullText.replace(/'/g,"\\'")}',1.0)" class="btn btn-ghost btn-sm">🔊 1x</button>
          </div>
        </div>
        <div id="dialogueText" style="filter:blur(4px);transition:filter .3s;font-size:13px;line-height:2;cursor:pointer" onclick="this.style.filter='none'" title="Click để xem transcript">
          ${data.dialogue.map(d=>`<div style="margin-bottom:6px"><span style="font-weight:600;color:var(--blue)">${d.speaker}:</span> ${d.text}</div>`).join('')}
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:8px;text-align:center">👆 Click vào transcript để hiện (nghe trước, đọc sau!)</div>
      </div>
      ${data.tip ? `<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fcd34d;border-radius:var(--r-md);padding:12px;margin-bottom:16px;font-size:12px">🔑 ${data.tip}</div>` : ''}
      <div>
        ${data.questions.map((q,i)=>`
        <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px;margin-bottom:10px">
          <div style="font-weight:600;font-size:13px;margin-bottom:10px">${i+1}. ${q.q}</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${q.opts.map(o=>`<button onclick="aiTutor._checkReading(${i},'${o.charAt(0)}','${q.ans}','${q.exp.replace(/'/g,"\\'")}',this)" style="text-align:left;padding:9px 14px;border-radius:var(--r-md);border:1.5px solid var(--border);background:transparent;cursor:pointer;font-size:13px" class="reading-opt-${i}">${o}</button>`).join('')}
          </div>
          <div id="reading-exp-${i}" style="display:none;margin-top:8px;font-size:12px;color:var(--muted);background:var(--bg2);padding:8px;border-radius:var(--r-md)"></div>
        </div>`).join('')}
      </div>
      <div style="text-align:center;margin-top:14px">
        <button class="btn btn-primary" onclick="aiTutor.generateListening()">✨ Bài mới</button>
      </div>
    </div>`;
  }

  async generateSpeaking() {
    const el = document.getElementById('speakingContent');
    el.innerHTML = `<div style="text-align:center;padding:30px"><div style="font-size:30px">⏳</div>AI đang tạo bài luyện nói...</div>`;
    try {
      const p = this._progressData || {};
      const _aiText_speaking = await callAI('Bạn là AI tạo bài tập TOEIC. Chỉ trả về JSON, không có gì khác.', [{role:'user',content:`Tạo bài luyện nói tiếng Anh TOEIC. Format JSON:
{"topic":"Introducing yourself in a business meeting","sentences":[{"en":"Good morning, I am delighted to meet you all today.","vi":"Chào buổi sáng, tôi rất vui được gặp tất cả mọi người hôm nay.","tip":"Nhấn vào 'delighted' và 'today'"},{"en":"My name is David and I work in the marketing department.","vi":"Tên tôi là David và tôi làm việc ở phòng marketing.","tip":"Nói rõ từng từ, đừng nói nhanh"}],"vocab":[{"word":"delighted","ipa":"/dɪˈlaɪtɪd/","meaning":"vui mừng"}],"exercise":"Hãy giới thiệu bản thân bạn trong 30 giây bằng tiếng Anh, đề cập tên, công việc và một điều bạn đang học."}`}]);
      const json = JSON.parse(_aiText_speaking.replace(/```json|```/g,'').trim());
      this._renderSpeaking(el, json);
    } catch(e) {
      el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--red)">❌ Lỗi: ${e.message}</div>`;
    }
  }

  _renderSpeaking(el, data) {
    el.innerHTML = `
    <div>
      <div style="background:linear-gradient(135deg,#fdf4ff,#f5f3ff);border-radius:var(--r-lg);padding:16px;margin-bottom:16px">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">📌 Chủ đề: ${data.topic}</div>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:600;color:var(--muted);font-family:var(--mono);margin-bottom:10px">📢 CÁC CÂU LUYỆN NÓI</div>
        ${data.sentences.map((s,i)=>`
        <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px;margin-bottom:10px">
          <div style="font-size:16px;font-weight:600;color:var(--text);margin-bottom:6px">${s.en}</div>
          <div style="font-size:13px;color:var(--muted);margin-bottom:8px">${s.vi}</div>
          ${s.tip ? `<div style="font-size:12px;color:var(--orange);margin-bottom:8px">💡 ${s.tip}</div>` : ''}
          <div style="display:flex;gap:8px">
            <button onclick="aiTutor._speak('${s.en.replace(/'/g,"\\'")}', 0.75)" class="btn btn-ghost btn-sm">🔊 Chậm (0.75x)</button>
            <button onclick="aiTutor._speak('${s.en.replace(/'/g,"\\'")}', 1.0)" class="btn btn-ghost btn-sm">🔊 Chuẩn (1x)</button>
            <button onclick="aiTutor._speak('${s.en.replace(/'/g,"\\'")}', 1.2)" class="btn btn-ghost btn-sm">🔊 Nhanh (1.2x)</button>
          </div>
        </div>`).join('')}
      </div>
      ${data.vocab?.length ? `<div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:600;color:var(--muted);font-family:var(--mono);margin-bottom:8px">🔤 PHÁT ÂM KEY WORDS</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${data.vocab.map(v=>`<div style="background:var(--blue-l);border-radius:var(--r-md);padding:8px 14px;font-size:13px;cursor:pointer" onclick="aiTutor._speak('${v.word}',0.8)">
            <strong>${v.word}</strong> <span style="color:var(--muted);font-family:var(--mono);font-size:11px">${v.ipa||''}</span><br>
            <span style="font-size:11px;color:var(--muted)">${v.meaning}</span>
          </div>`).join('')}
        </div>
      </div>`:''}
      ${data.exercise ? `<div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1px solid rgba(34,197,94,.3);border-radius:var(--r-lg);padding:14px;margin-bottom:16px">
        <div style="font-weight:600;margin-bottom:6px">🎯 Bài tập thực hành</div>
        <div style="font-size:13px;color:var(--muted)">${data.exercise}</div>
      </div>`:''}
      <div style="text-align:center">
        <button class="btn btn-primary" onclick="aiTutor.generateSpeaking()">✨ Bài mới</button>
        <button class="btn btn-ghost" style="margin-left:8px" onclick="aiTutor.quickAsk('Cho tôi feedback về cách luyện nói và phát âm tiếng Anh TOEIC hiệu quả')">🤖 Hỏi AI</button>
      </div>
    </div>`;
  }

  async practicePronunciation() {
    const p = this._progressData || {};
    const words = p.recentVocab?.slice(0,5) || ['office','meeting','document','schedule','confirm'];
    const el = document.getElementById('speakingContent');
    el.innerHTML = `
    <div>
      <div style="font-size:14px;font-weight:600;margin-bottom:14px">🔤 Luyện phát âm từ vựng của bạn</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${words.map(w=>`
        <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px;display:flex;align-items:center;gap:14px">
          <div style="font-size:20px;font-weight:700;min-width:140px">${w}</div>
          <div style="display:flex;gap:8px">
            <button onclick="aiTutor._speak('${w}',0.7)" class="btn btn-ghost btn-sm">🐢 0.7x</button>
            <button onclick="aiTutor._speak('${w}',1.0)" class="btn btn-ghost btn-sm">🔊 1x</button>
            <button onclick="aiTutor._speak('${w} ${w} ${w}',1.0)" class="btn btn-ghost btn-sm">🔁 x3</button>
          </div>
          <button onclick="aiTutor.quickAsk('Giải thích cách phát âm chuẩn của từ \\'${w}\\' và các lỗi phát âm thường gặp')" class="btn btn-ghost btn-sm" style="margin-left:auto">🤖 Giải thích</button>
        </div>`).join('')}
      </div>
      <div style="text-align:center;margin-top:14px">
        <button class="btn btn-ghost" onclick="aiTutor.generateSpeaking()">← Quay lại luyện nói</button>
      </div>
    </div>`;
  }

  startPractice(type) {
    this.switchMode(type);
    if (type === 'reading') this.generateReading();
    else if (type === 'listening') this.generateListening();
    else if (type === 'speaking') this.generateSpeaking();
    else if (type === 'grammar') this.quickAsk('Tạo 5 câu bài tập điền từ TOEIC Part 5 về thì động từ và từ loại, kèm đáp án và giải thích chi tiết');
  }

  _speak(text, rate = 1.0) {
    if (!window.speechSynthesis) { Toast.err('Trình duyệt không hỗ trợ TTS'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = rate; u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en-US') && v.name.includes('Female')) || voices.find(v => v.lang.startsWith('en'));
    if (enVoice) u.voice = enVoice;
    window.speechSynthesis.speak(u);
  }

  _buildSystemPrompt() {
    const user = this.store.get('currentUser');
    const p = this._progressData || {};
    return `Bạn là AI Tutor thông minh của StudyHub — app học TOEIC.

DỮ LIỆU THỰC CỦA HỌC VIÊN:
- Tên: ${user?.display_name || 'Học viên'} | XP: ${p.xp||0} | Level: ${p.level||1} | Streak: ${p.streak||0} ngày
- Từ vựng: ${p.totalWords||0} từ tổng | Thành thạo: ${p.masteredWords||0} | Đang học: ${p.learningWords||0}
- Cần ôn hôm nay: ${p.dueForReview||0} từ | Ngày hoàn thành lộ trình: ${p.daysCompleted||0}/30
- Pomodoro: ${p.pomodoroSessions||0} phiên | Từ gần nhất: ${(p.recentVocab||[]).slice(0,5).join(', ')||'chưa có'}
- Chủ đề đã học: ${(p.categories||[]).join(', ')||'chưa có'}

NHIỆM VỤ: Phân tích tiến độ cụ thể, gợi ý từ vựng, luyện Reading/Listening/Speaking TOEIC, tư vấn chiến lược 600+.
PHONG CÁCH: Thân thiện, dùng emoji, tiếng Việt, ngắn gọn súc tích. Luôn đưa ra action cụ thể. Dùng **bold** cho điểm quan trọng.`;
  }

  appendMessage(role, content) {
    const el = document.getElementById('aiMessages');
    if (!el) return;
    const isUser = role === 'user';
    const div = document.createElement('div');
    div.style.cssText = `display:flex;gap:10px;align-items:flex-start;${isUser?'flex-direction:row-reverse':''}`;
    div.innerHTML = `
      <div style="width:32px;height:32px;border-radius:50%;background:${isUser?'var(--blue)':'linear-gradient(135deg,#667eea,#764ba2)'};display:flex;align-items:center;justify-content:center;font-size:14px;color:white;flex-shrink:0">${isUser?'👤':'🤖'}</div>
      <div style="max-width:82%;background:${isUser?'var(--blue)':'var(--bg2)'};color:${isUser?'white':'var(--text)'};padding:12px 16px;border-radius:${isUser?'18px 18px 4px 18px':'18px 18px 18px 4px'};font-size:13px;line-height:1.7;white-space:pre-wrap">${this._formatMessage(content)}</div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  _formatMessage(text) {
    return text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/`(.*?)`/g,'<code style="background:rgba(0,0,0,0.1);padding:1px 5px;border-radius:3px;font-family:var(--mono)">$1</code>');
  }

  appendTyping() {
    const el = document.getElementById('aiMessages');
    const id = 'typing_' + Date.now();
    const div = document.createElement('div');
    div.id = id; div.style.cssText = 'display:flex;gap:10px;align-items:flex-start';
    div.innerHTML = `<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;color:white">🤖</div><div style="background:var(--bg2);padding:12px 16px;border-radius:18px 18px 18px 4px"><div style="display:flex;gap:4px">${[0,.2,.4].map(d=>`<div style="width:8px;height:8px;border-radius:50%;background:var(--muted);animation:bounce 1.2s infinite ${d}s"></div>`).join('')}</div></div>`;
    el.appendChild(div); el.scrollTop = el.scrollHeight;
    if (!document.getElementById('bounce-style')) {
      const s = document.createElement('style'); s.id='bounce-style';
      s.textContent='@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}';
      document.head.appendChild(s);
    }
    return id;
  }

  removeTyping(id) { document.getElementById(id)?.remove(); }
}