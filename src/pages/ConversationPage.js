// ── AI Conversation Page — sử dụng AIService ──
import { aiService, showAPIKeyModal } from '../services/AIService.js';

async function callGemini(systemPrompt, messages) {
  return aiService.call(systemPrompt, messages, 800);
}

export class ConversationPage {
  constructor(db, store, bus) {
    this.db = db; this.store = store; this.bus = bus;
    this._scenario = null;
    this._messages = [];
    this._loading = false;
    this._sessionStats = { turns: 0, wordsUsed: new Set(), startTime: null };
    this._ttsEnabled = true;
  }

  render() {
    document.querySelector('.main').innerHTML = `
    <div class="page" style="max-width:960px">
      <div class="page-header-row page-header">
        <div>
          <h1 class="page-title">🗣️ Giao tiếp cùng AI</h1>
          <p class="page-sub">Thực hành tiếng Anh trong tình huống thực tế với AI Gemini</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <label style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:5px;cursor:pointer">
            <input type="checkbox" id="ttsToggle" checked onchange="convPage._ttsEnabled=this.checked"> 🔊 Phát âm
          </label>
        </div>
      </div>

      <div id="convMain">
        <!-- SCENARIO SELECT -->
        <div id="scenarioSelect">
          <div style="margin-bottom:20px">
            <div style="font-size:15px;font-weight:600;margin-bottom:4px">Chọn tình huống thực hành:</div>
            <div style="font-size:13px;color:var(--muted)">AI sẽ đóng vai nhân vật, bạn luyện giao tiếp tiếng Anh thực tế</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
            ${SCENARIOS.map(s => `
            <div class="card" style="cursor:pointer;transition:all .15s;border:2px solid transparent" 
                 onclick="convPage.startScenario('${s.id}')"
                 onmouseover="this.style.borderColor='var(--blue)';this.style.transform='translateY(-2px)'"
                 onmouseout="this.style.borderColor='transparent';this.style.transform='none'">
              <div style="display:flex;align-items:flex-start;gap:12px">
                <div style="font-size:36px;line-height:1">${s.emoji}</div>
                <div style="flex:1">
                  <div style="font-size:14px;font-weight:700;margin-bottom:3px">${s.title}</div>
                  <div style="font-size:11px;color:var(--muted);margin-bottom:8px">${s.subtitle}</div>
                  <span style="background:${s.levelColor}18;color:${s.levelColor};padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600">${s.level}</span>
                </div>
              </div>
              <div style="margin-top:10px;display:flex;gap:4px;flex-wrap:wrap">
                ${s.vocab.slice(0,3).map(v => `<span style="background:var(--bg2);padding:2px 7px;border-radius:99px;font-size:10px;font-family:var(--mono)">${v}</span>`).join('')}
              </div>
            </div>`).join('')}
          </div>
        </div>

        <!-- CONVERSATION AREA -->
        <div id="convArea" style="display:none">
          <!-- Header -->
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);padding:14px 16px">
            <button onclick="convPage.exitConversation()" style="background:none;border:none;cursor:pointer;font-size:18px;color:var(--muted)">←</button>
            <div id="convScenarioIcon" style="font-size:28px"></div>
            <div style="flex:1">
              <div id="convScenarioTitle" style="font-size:14px;font-weight:700"></div>
              <div id="convScenarioSub" style="font-size:11px;color:var(--muted)"></div>
            </div>
            <div style="text-align:right">
              <div id="convTurns" style="font-family:var(--mono);font-size:13px;font-weight:600;color:var(--blue)">0 lượt</div>
              <div style="font-size:10px;color:var(--muted)">hội thoại</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 260px;gap:16px">
            <!-- Chat -->
            <div style="display:flex;flex-direction:column;gap:12px">
              <!-- Messages -->
              <div id="convMessages" style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);padding:16px;min-height:380px;max-height:480px;overflow-y:auto;display:flex;flex-direction:column;gap:10px"></div>

              <!-- Input -->
              <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);padding:12px">
                <textarea id="convInput" placeholder="Nhập câu trả lời bằng tiếng Anh... (Enter để gửi)" 
                  style="width:100%;border:none;outline:none;resize:none;font-size:14px;font-family:var(--font);min-height:60px;color:var(--text);background:transparent"
                  onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();convPage.sendMessage()}"
                ></textarea>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
                  <div style="display:flex;gap:6px">
                    <button class="btn btn-ghost btn-sm" onclick="convPage.getHint()" title="Gợi ý cách nói">💡 Gợi ý</button>
                    <button class="btn btn-ghost btn-sm" onclick="convPage.translateLast()" title="Dịch câu cuối của AI">🌐 Dịch</button>
                    <button class="btn btn-ghost btn-sm" onclick="convPage.repeatLast()" title="Nghe lại câu AI vừa nói">🔊 Nghe lại</button>
                  </div>
                  <button class="btn btn-primary btn-sm" onclick="convPage.sendMessage()" id="convSendBtn">Gửi ↵</button>
                </div>
              </div>
            </div>

            <!-- Sidebar -->
            <div style="display:flex;flex-direction:column;gap:12px">
              <!-- Tips -->
              <div class="card" id="convTips">
                <div class="card-title" style="font-size:12px">💡 Gợi ý hội thoại</div>
                <div id="convTipsList" style="font-size:12px;color:var(--muted);line-height:1.8"></div>
              </div>

              <!-- Vocab used -->
              <div class="card">
                <div class="card-title" style="font-size:12px">📊 Từ vựng đã dùng</div>
                <div id="convVocabUsed" style="font-size:11px;color:var(--muted)">Chưa có từ nào...</div>
              </div>

              <!-- Quick phrases -->
              <div class="card">
                <div class="card-title" style="font-size:12px">⚡ Câu mẫu nhanh</div>
                <div id="convQuickPhrases" style="display:flex;flex-direction:column;gap:5px"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    window.convPage = this;
  }

  startScenario(id) {
    this._scenario = SCENARIOS.find(s => s.id === id);
    if (!this._scenario) return;
    this._messages = [];
    this._sessionStats = { turns: 0, wordsUsed: new Set(), startTime: Date.now() };

    document.getElementById('scenarioSelect').style.display = 'none';
    document.getElementById('convArea').style.display = 'block';

    // Set header
    document.getElementById('convScenarioIcon').textContent = this._scenario.emoji;
    document.getElementById('convScenarioTitle').textContent = this._scenario.title;
    document.getElementById('convScenarioSub').textContent = this._scenario.subtitle;

    // Set tips
    document.getElementById('convTipsList').innerHTML = this._scenario.tips
      .map(t => `<div style="padding:4px 0;border-bottom:1px solid var(--border)">• ${t}</div>`).join('');

    // Quick phrases
    const phrases = [
      "Could you please repeat that?",
      "I'm sorry, I didn't catch that.",
      "Could you speak more slowly?",
      "Let me think about that...",
      "That's a good point.",
      "I completely agree.",
    ];
    document.getElementById('convQuickPhrases').innerHTML = phrases
      .map(p => `<button onclick="convPage.insertPhrase('${p.replace(/'/g,"\\'")}'')" 
        style="text-align:left;background:var(--bg2);border:none;border-radius:var(--r-md);padding:5px 8px;cursor:pointer;font-size:11px;color:var(--text)">
        ${p}
      </button>`).join('');

    // Add AI's opening message
    this._addMessage('assistant', this._scenario.starter);
    this._speak(this._scenario.starter);
  }

  async sendMessage() {
    const input = document.getElementById('convInput');
    const text = input.value.trim();
    if (!text || this._loading) return;
    if (!aiService.hasKey()) {
      showAPIKeyModal(() => Toast.ok('Key đã lưu! Gửi lại tin nhắn nhé.'));
      return;
    }

    input.value = '';
    this._addMessage('user', text);
    this._sessionStats.turns++;
    
    // Track vocab usage
    this._scenario.vocab.forEach(v => {
      if (text.toLowerCase().includes(v)) this._sessionStats.wordsUsed.add(v);
    });
    this._updateStats();

    this._loading = true;
    const btn = document.getElementById('convSendBtn');
    btn.textContent = '...'; btn.disabled = true;

    // Show typing indicator
    const typingId = 'typing_' + Date.now();
    this._addTypingIndicator(typingId);

    try {
      const response = await callGemini(this._scenario.systemPrompt, this._messages);
      this._removeTypingIndicator(typingId);
      this._addMessage('assistant', response);
      this._speak(response);
    } catch(e) {
      this._removeTypingIndicator(typingId);
      this._addMessage('assistant', `⚠️ Lỗi kết nối AI: ${e.message}. Kiểm tra API key và thử lại.`);
    } finally {
      this._loading = false;
      btn.textContent = 'Gửi ↵'; btn.disabled = false;
      document.getElementById('convInput').focus();
    }
  }

  async getHint() {
    if (this._loading) return;
    const lastAI = [...this._messages].reverse().find(m => m.role === 'assistant');
    if (!lastAI) return;

    this._loading = true;
    const hintPrompt = `Given this conversation context in a ${this._scenario.title} scenario, 
    the AI just said: "${lastAI.content}"
    Give 3 short, natural English responses the user could say. 
    Format as: 1. [response] | 2. [response] | 3. [response]
    Also give a brief Vietnamese translation hint. Keep it concise.`;

    try {
      const hint = await callGemini('You are an English learning assistant.', [{ role:'user', content: hintPrompt }]);
      const modal = document.createElement('div');
      modal.className = 'overlay open';
      modal.innerHTML = `<div class="modal modal-sm">
        <div class="modal-title">💡 Gợi ý cách trả lời</div>
        <div style="font-size:13px;line-height:1.8;white-space:pre-wrap">${hint}</div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="this.closest('.overlay').remove()">Đóng</button>
        </div>
      </div>`;
      modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
      document.body.appendChild(modal);
    } catch(e) { console.error(e); }
    this._loading = false;
  }

  async translateLast() {
    const lastAI = [...this._messages].reverse().find(m => m.role === 'assistant');
    if (!lastAI) return;
    const translatePrompt = `Translate this English text to Vietnamese naturally: "${lastAI.content}"
    Also explain any difficult vocabulary. Keep it concise.`;
    try {
      const result = await callGemini('You are a Vietnamese English translator.', [{ role:'user', content: translatePrompt }]);
      const modal = document.createElement('div');
      modal.className = 'overlay open';
      modal.innerHTML = `<div class="modal modal-sm">
        <div class="modal-title">🌐 Dịch câu AI vừa nói</div>
        <div style="background:var(--bg2);border-radius:var(--r-md);padding:10px;margin-bottom:10px;font-size:13px;font-style:italic">"${lastAI.content}"</div>
        <div style="font-size:13px;line-height:1.7">${result}</div>
        <div class="modal-footer"><button class="btn btn-primary" onclick="this.closest('.overlay').remove()">Đóng</button></div>
      </div>`;
      modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
      document.body.appendChild(modal);
    } catch(e) { console.error(e); }
  }

  repeatLast() {
    const lastAI = [...this._messages].reverse().find(m => m.role === 'assistant');
    if (lastAI) this._speak(lastAI.content);
  }

  insertPhrase(phrase) {
    const input = document.getElementById('convInput');
    if (input) { input.value = phrase; input.focus(); }
  }

  _addMessage(role, content) {
    this._messages.push({ role, content });
    const el = document.getElementById('convMessages');
    if (!el) return;

    const isUser = role === 'user';
    const div = document.createElement('div');
    div.style.cssText = `display:flex;gap:8px;align-items:flex-start;${isUser ? 'flex-direction:row-reverse' : ''}`;
    div.innerHTML = `
      <div style="width:32px;height:32px;border-radius:50%;background:${isUser ? 'var(--blue)' : 'var(--purple-l)'};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">
        ${isUser ? '👤' : this._scenario?.emoji || '🤖'}
      </div>
      <div style="max-width:75%;background:${isUser ? 'var(--blue)' : 'var(--bg2)'};color:${isUser ? 'white' : 'var(--text)'};border-radius:${isUser ? 'var(--r-xl) var(--r-md) var(--r-md) var(--r-xl)' : 'var(--r-md) var(--r-xl) var(--r-xl) var(--r-md)'};padding:10px 13px;font-size:13px;line-height:1.6">
        ${content}
        ${!isUser ? `<button onclick="convPage._speak(${JSON.stringify(content)})" style="display:block;margin-top:5px;background:none;border:none;cursor:pointer;font-size:11px;color:var(--muted)">🔊 nghe</button>` : ''}
      </div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  _addTypingIndicator(id) {
    const el = document.getElementById('convMessages');
    if (!el) return;
    const div = document.createElement('div');
    div.id = id;
    div.style.cssText = 'display:flex;gap:8px;align-items:flex-start';
    div.innerHTML = `
      <div style="width:32px;height:32px;border-radius:50%;background:var(--purple-l);display:flex;align-items:center;justify-content:center;font-size:14px">${this._scenario?.emoji || '🤖'}</div>
      <div style="background:var(--bg2);border-radius:var(--r-md) var(--r-xl) var(--r-xl) var(--r-md);padding:12px 16px">
        <div style="display:flex;gap:4px;align-items:center">
          <div style="width:7px;height:7px;border-radius:50%;background:var(--muted);animation:bounce 1s infinite"></div>
          <div style="width:7px;height:7px;border-radius:50%;background:var(--muted);animation:bounce 1s .2s infinite"></div>
          <div style="width:7px;height:7px;border-radius:50%;background:var(--muted);animation:bounce 1s .4s infinite"></div>
        </div>
      </div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
    // Add bounce animation if not present
    if (!document.getElementById('bounceAnim')) {
      const style = document.createElement('style');
      style.id = 'bounceAnim';
      style.textContent = '@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}';
      document.head.appendChild(style);
    }
  }

  _removeTypingIndicator(id) {
    document.getElementById(id)?.remove();
  }

  _updateStats() {
    document.getElementById('convTurns').textContent = `${this._sessionStats.turns} lượt`;
    const vocabEl = document.getElementById('convVocabUsed');
    if (vocabEl) {
      const used = [...this._sessionStats.wordsUsed];
      vocabEl.innerHTML = used.length
        ? used.map(v => `<span style="background:var(--green-l);color:var(--green);padding:2px 7px;border-radius:99px;font-size:10px;font-family:var(--mono);display:inline-block;margin:2px">${v} ✓</span>`).join('')
        : '<span style="font-size:11px;color:var(--muted)">Chưa có từ nào...</span>';
    }
  }

  _speak(text) {
    if (!this._ttsEnabled || !window.speechSynthesis) return;
    // Extract only English text (remove Vietnamese feedback in parentheses)
    const cleaned = text.replace(/\([^)]*[^\x00-\x7F][^)]*\)/g, '').trim();
    if (!cleaned) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(cleaned);
    u.lang = 'en-US'; u.rate = 0.85; u.pitch = 1;
    // Try to use a better voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === 'en-US' && v.name.includes('Natural')) 
                   || voices.find(v => v.lang === 'en-US' && !v.name.includes('Google'))
                   || voices.find(v => v.lang === 'en-US');
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  }

  exitConversation() {
    window.speechSynthesis?.cancel();
    // Save session stats
    const duration = Math.round((Date.now() - (this._sessionStats.startTime || Date.now())) / 60000);
    if (this._sessionStats.turns > 0) {
      const user = this.store.get('currentUser');
      if (user) {
        this.db.update('profiles', user.id, { xp: (user.xp || 0) + this._sessionStats.turns * 2 })
          .catch(() => {});
      }
    }
    this._scenario = null;
    this._messages = [];
    document.getElementById('convArea').style.display = 'none';
    document.getElementById('scenarioSelect').style.display = 'block';
  }
}
