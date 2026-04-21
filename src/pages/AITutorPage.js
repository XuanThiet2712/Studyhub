import { Toast } from '../components/index.js';
import { aiService, showAPIKeyModal } from '../services/AIService.js';

export class AITutorPage {
  constructor(db, store, bus) {
    this.db=db; this.store=store; this.bus=bus;
    this._msgs=[]; this._loading=false; this._mode='chat';
    this._readingTopic='Business'; this._pd=null;
    this._synth=window.speechSynthesis;
  }

  render() {
    document.querySelector('.main').innerHTML=`
    <div class="page" style="max-width:960px">
      <div class="page-header-row page-header">
        <div>
          <h1 class="page-title">🤖 AI Tutor</h1>
          <p class="page-sub">Luyện Reading · Listening · Speaking · Phân tích tiến độ</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <div id="aiKeyStatus" style="font-size:11px;padding:4px 10px;border-radius:99px;cursor:pointer" onclick="aiTutor.manageKey()"></div>
          <button class="btn btn-ghost btn-sm" onclick="aiTutor.manageKey()">🔑 API Key</button>
          <button class="btn btn-primary btn-sm" onclick="aiTutor.analyzeProgress()">📊 Phân tích</button>
        </div>
      </div>

      <div class="tabs" style="margin-bottom:20px">
        <button class="tab active" data-mode="chat"    onclick="aiTutor.switchMode('chat',this)">💬 Chat AI</button>
        <button class="tab"        data-mode="reading"  onclick="aiTutor.switchMode('reading',this)">📖 Đọc hiểu</button>
        <button class="tab"        data-mode="listening"onclick="aiTutor.switchMode('listening',this)">🎧 Nghe</button>
        <button class="tab"        data-mode="speaking" onclick="aiTutor.switchMode('speaking',this)">🎤 Nói</button>
        <button class="tab"        data-mode="grammar"  onclick="aiTutor.switchMode('grammar',this)">📐 Ngữ pháp</button>
      </div>

      <div id="aiModeContent"></div>
    </div>`;
    window.aiTutor=this;
    this.loadProgress().then(()=>{ this.updateKeyStatus(); this.switchMode('chat'); });
  }

  updateKeyStatus() {
    const el=document.getElementById('aiKeyStatus'); if(!el) return;
    if(aiService.hasKey()){el.style.background='#dcfce7';el.style.color='#16a34a';el.textContent='✅ AI sẵn sàng';}
    else{el.style.background='#fef2f2';el.style.color='#dc2626';el.textContent='❌ Chưa có API key';}
  }

  manageKey() { showAPIKeyModal(()=>{ this.updateKeyStatus(); Toast.ok('AI đã được kích hoạt! 🎉'); }); }

  async _ensureKey() {
    if(!aiService.hasKey()){
      showAPIKeyModal(()=>{
        this.updateKeyStatus();
        Toast.ok('🎉 AI đã sẵn sàng! Thử lại nhé.');
      });
      return false;
    }
    return true;
  }

  switchMode(mode, btn) {
    this._mode=mode;
    document.querySelectorAll('.tabs .tab').forEach(b=>b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    else document.querySelector(`[data-mode="${mode}"]`)?.classList.add('active');
    const el=document.getElementById('aiModeContent'); if(!el) return;
    if(mode==='chat')      this._renderChat(el);
    else if(mode==='reading')   this._renderReading(el);
    else if(mode==='listening') this._renderListening(el);
    else if(mode==='speaking')  this._renderSpeaking(el);
    else if(mode==='grammar')   this._renderGrammar(el);
  }

  // ── CHAT ─────────────────────────────────────────────────────────────────
  _renderChat(el) {
    el.innerHTML=`
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
        ${[['📊','Phân tích tiến độ học của tôi chi tiết'],['📚','Gợi ý từ vựng TOEIC tôi nên học tiếp'],['🎯','Chiến lược thi TOEIC 600+'],['📅','Lập kế hoạch học 7 ngày cho tôi'],['💪','Nhận xét điểm mạnh yếu và động viên tôi'],['🧠','Giải thích cách dùng SRS hiệu quả']].map(([e,t])=>`<button class="btn btn-ghost btn-sm" onclick="aiTutor.quickAsk('${t}')">${e} ${t.slice(0,20)}...</button>`).join('')}
      </div>
      <div style="display:flex;flex-direction:column;height:calc(100vh-360px);min-height:400px;background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--shadow-sm)">
        <div id="aiMessages" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px">
          <div style="text-align:center;padding:28px">
            <div style="font-size:48px;margin-bottom:12px">🤖</div>
            <div style="font-size:17px;font-weight:700;margin-bottom:8px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">StudyHub AI Tutor</div>
            <div style="font-size:13px;color:var(--muted);max-width:400px;margin:0 auto;line-height:1.7">Phân tích dữ liệu học thực của bạn, tư vấn chiến lược TOEIC và luyện mọi kỹ năng</div>
            ${!aiService.hasKey()?`<button onclick="aiTutor.manageKey()" style="margin-top:14px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;border:none;border-radius:99px;padding:10px 24px;cursor:pointer;font-size:13px;font-weight:600">🔑 Cấu hình API Key để bắt đầu</button>`:''}
          </div>
        </div>
        <div style="border-top:1px solid var(--border);padding:12px 14px;display:flex;gap:10px;align-items:flex-end;background:var(--bg2)">
          <textarea id="aiInput" placeholder="Hỏi về tiến độ, từ vựng, ngữ pháp TOEIC..." style="flex:1;border:1.5px solid var(--border);border-radius:var(--r-lg);padding:10px 14px;font-size:13px;font-family:var(--font);resize:none;min-height:44px;max-height:120px;outline:none;background:var(--white);transition:border .15s" rows="1"
            oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"
            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();aiTutor.send()}"
            onfocus="this.style.borderColor='var(--blue)'" onblur="this.style.borderColor='var(--border)'"></textarea>
          <button onclick="aiTutor.send()" id="aiSendBtn" style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:white;flex-shrink:0">➤</button>
        </div>
      </div>`;
  }

  async send() {
    const input=document.getElementById('aiInput');
    const text=input?.value?.trim(); if(!text||this._loading) return;
    if(!await this._ensureKey()) return;
    input.value=''; input.style.height='auto';
    this._appendMsg('user',text);
    this._loading=true;
    const btn=document.getElementById('aiSendBtn'); if(btn){btn.disabled=true;btn.innerHTML='⏳';}
    const tid=this._appendTyping();
    try {
      const reply=await aiService.call(this._buildSystem(),[...this._msgs.slice(-12),{role:'user',content:text}]);
      document.getElementById(tid)?.remove();
      this._appendMsg('assistant',reply);
      this._msgs.push({role:'user',content:text},{role:'assistant',content:reply});
    } catch(e) {
      document.getElementById(tid)?.remove();
      if(e.message==='NO_KEY'){this.manageKey();}
      else this._appendMsg('assistant',`❌ Lỗi AI: ${e.message}`);
    } finally { this._loading=false; if(btn){btn.disabled=false;btn.innerHTML='➤';} }
  }

  quickAsk(text){ const i=document.getElementById('aiInput'); if(i){i.value=text; this.send();} }
  async analyzeProgress(){ await this.loadProgress(); this.switchMode('chat'); setTimeout(()=>this.quickAsk('Phân tích chi tiết tiến độ học của tôi dựa trên dữ liệu thực tế'),300); }

  // ── READING ───────────────────────────────────────────────────────────────
  _renderReading(el) {
    const topics=['Business','HR','Travel','Technology','Finance','Legal'];
    el.innerHTML=`
      <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);padding:24px;box-shadow:var(--shadow-sm)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
          <div><div style="font-size:16px;font-weight:700">📖 Luyện đọc hiểu TOEIC</div><div style="font-size:12px;color:var(--muted)">AI tạo bài đọc Part 6-7 theo level của bạn</div></div>
          <button class="btn btn-primary" onclick="aiTutor.generateReading()" id="readingGenBtn">✨ Tạo bài mới</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
          <span style="font-size:12px;color:var(--muted);font-weight:600">Chủ đề:</span>
          ${topics.map(t=>`<button onclick="aiTutor._readingTopic='${t}';document.querySelectorAll('.rtopic').forEach(b=>b.style.background='transparent');this.style.background='var(--blue-l)';this.style.borderColor='var(--blue)';this.style.color='var(--blue-d)'" class="rtopic" style="padding:4px 14px;border-radius:99px;font-size:12px;border:1.5px solid var(--border);background:${t===this._readingTopic?'var(--blue-l)':'transparent'};color:${t===this._readingTopic?'var(--blue-d)':'var(--muted)'};cursor:pointer">${t}</button>`).join('')}
        </div>
        <div id="readingContent"><div style="text-align:center;padding:50px;color:var(--muted)"><div style="font-size:48px;margin-bottom:12px">📖</div><div style="font-size:14px">Nhấn "Tạo bài mới" để AI tạo bài đọc TOEIC phù hợp với bạn</div></div></div>
      </div>`;
  }

  async generateReading() {
    if(!await this._ensureKey()) return;
    const btn=document.getElementById('readingGenBtn'); if(btn){btn.disabled=true;btn.textContent='⏳ Đang tạo...';}
    document.getElementById('readingContent').innerHTML=`<div style="text-align:center;padding:40px;color:var(--muted)">🤖 AI đang tạo bài đọc...</div>`;
    try {
      const p=this._pd||{};
      const prompt=`Tạo bài đọc TOEIC Part 6-7 theo format sau, chủ đề: ${this._readingTopic}, level phù hợp người có ${p.totalWords||20} từ vựng.

ĐỊNH DẠNG BẮT BUỘC (giữ nguyên):
---PASSAGE---
[Viết passage 120-180 từ: email/memo/notice/advertisement liên quan chủ đề ${this._readingTopic}. Để trống 4 chỗ điền bằng (A)(B)(C)(D) ở dạng: _____(1)_____ ]
---QUESTIONS---
[4 câu hỏi TOEIC: mỗi câu có 4 lựa chọn A/B/C/D]
---ANSWERS---
[Đáp án: 1-X, 2-X, 3-X, 4-X]
---EXPLANATION---
[Giải thích ngắn cho mỗi đáp án bằng tiếng Việt]`;
      const raw=await aiService.ask(prompt, 1200);
      this._renderReadingResult(raw);
    } catch(e) {
      document.getElementById('readingContent').innerHTML=`<div style="color:var(--red);text-align:center;padding:20px">❌ ${e.message==='NO_KEY'?'Cần cấu hình API key':e.message}</div>`;
    } finally { if(btn){btn.disabled=false;btn.textContent='✨ Tạo bài mới';} }
  }

  _renderReadingResult(raw) {
    const sec=(tag)=>{ const m=raw.match(new RegExp(`---${tag}---([\\s\\S]*?)(?=---|$)`)); return m?m[1].trim():''; };
    const passage=sec('PASSAGE')||raw;
    const questions=sec('QUESTIONS');
    const answers=sec('ANSWERS');
    const explanation=sec('EXPLANATION');
    document.getElementById('readingContent').innerHTML=`
      <div style="background:var(--bg2);border-radius:var(--r-lg);padding:16px;margin-bottom:16px;border-left:4px solid var(--blue)">
        <div style="font-size:11px;font-weight:700;color:var(--blue);margin-bottom:8px">📄 PASSAGE</div>
        <div style="font-size:13px;line-height:1.8;white-space:pre-wrap">${passage}</div>
      </div>
      ${questions?`<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:10px">❓ CÂU HỎI</div>
        <div style="font-size:13px;line-height:2;white-space:pre-wrap">${questions}</div>
      </div>`:''}
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block';this.textContent=this.textContent.includes('Xem')?'🙈 Ẩn':'✅ Xem đáp án'" style="background:var(--green-l);border:1px solid var(--green);color:var(--green);border-radius:99px;padding:6px 16px;font-size:12px;cursor:pointer;font-weight:600">✅ Xem đáp án</button>
        <div style="display:none;background:var(--bg2);border-radius:var(--r-md);padding:12px;width:100%;font-size:12px;line-height:1.7;white-space:pre-wrap">${answers}\n\n${explanation}</div>
        <button onclick="aiTutor.generateReading()" style="background:var(--blue-l);border:1px solid var(--blue);color:var(--blue-d);border-radius:99px;padding:6px 16px;font-size:12px;cursor:pointer">🔄 Bài khác</button>
      </div>`;
  }

  // ── LISTENING ─────────────────────────────────────────────────────────────
  _renderListening(el) {
    el.innerHTML=`
      <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);padding:24px;box-shadow:var(--shadow-sm)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
          <div><div style="font-size:16px;font-weight:700">🎧 Luyện nghe TOEIC</div><div style="font-size:12px;color:var(--muted)">AI tạo hội thoại • TTS phát âm • Câu hỏi Part 1-4</div></div>
          <div style="display:flex;gap:8px">
            <select id="listenPart" class="form-select" style="font-size:12px;padding:6px 10px"><option value="1-2">Part 1-2</option><option value="3-4" selected>Part 3-4</option></select>
            <select id="listenTopic" class="form-select" style="font-size:12px;padding:6px 10px"><option>Business</option><option>Travel</option><option>HR</option><option>Technology</option></select>
            <button class="btn btn-primary" onclick="aiTutor.generateListening()" id="listenGenBtn">✨ Tạo bài</button>
          </div>
        </div>
        <div style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-radius:var(--r-lg);padding:14px;margin-bottom:16px;font-size:12px;line-height:1.7">
          💡 <strong>Chiến lược:</strong> Đọc câu hỏi trước → Nghe lần 1 nắm ý chính → Nghe lần 2 tìm chi tiết → Chọn đáp án
        </div>
        <div id="listenContent"><div style="text-align:center;padding:50px;color:var(--muted)"><div style="font-size:48px;margin-bottom:12px">🎧</div><div>Chọn Part và chủ đề, nhấn "Tạo bài" để bắt đầu</div></div></div>
      </div>`;
  }

  async generateListening() {
    if(!await this._ensureKey()) return;
    const btn=document.getElementById('listenGenBtn'); if(btn){btn.disabled=true;btn.textContent='⏳';}
    const part=document.getElementById('listenPart')?.value||'3-4';
    const topic=document.getElementById('listenTopic')?.value||'Business';
    document.getElementById('listenContent').innerHTML=`<div style="text-align:center;padding:30px;color:var(--muted)">🤖 AI đang tạo bài nghe...</div>`;
    try {
      const prompt=`Tạo bài nghe TOEIC Part ${part} về chủ đề ${topic}.

FORMAT:
---SCRIPT---
[Hội thoại/monologue tiếng Anh, 80-120 từ, tự nhiên như TOEIC thật]
---QUESTIONS---
[3 câu hỏi Part ${part} với 4 lựa chọn A/B/C/D mỗi câu]
---ANSWERS---
[Đáp án: 1-X, 2-X, 3-X]
---VOCAB---
[3-5 từ vựng key trong bài kèm nghĩa tiếng Việt]`;
      const raw=await aiService.ask(prompt,1000);
      this._renderListeningResult(raw);
    } catch(e) {
      document.getElementById('listenContent').innerHTML=`<div style="color:var(--red);text-align:center;padding:20px">❌ ${e.message}</div>`;
    } finally { if(btn){btn.disabled=false;btn.textContent='✨ Tạo bài';} }
  }

  _renderListeningResult(raw) {
    const sec=(tag)=>{ const m=raw.match(new RegExp(`---${tag}---([\\s\\S]*?)(?=---|$)`)); return m?m[1].trim():''; };
    const script=sec('SCRIPT')||raw; const questions=sec('QUESTIONS'); const answers=sec('ANSWERS'); const vocab=sec('VOCAB');
    document.getElementById('listenContent').innerHTML=`
      <div style="background:linear-gradient(135deg,#f0f9ff,#f5f3ff);border-radius:var(--r-xl);padding:20px;margin-bottom:16px;text-align:center">
        <div style="font-size:14px;color:var(--muted);margin-bottom:12px">Nhấn để nghe bài hội thoại</div>
        <button onclick="aiTutor._tts('${script.replace(/'/g,'"').replace(/\n/g,' ').replace(/[^\x00-\x7F]/g,' ')}')" style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border:none;cursor:pointer;font-size:28px;color:white;box-shadow:0 4px 14px rgba(59,130,246,.4)">🔊</button>
        <div style="margin-top:8px;font-size:11px;color:var(--muted)">Tốc độ bình thường</div>
      </div>
      <div style="background:var(--bg2);border-radius:var(--r-lg);padding:14px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:11px;font-weight:700;color:var(--muted)">📜 TRANSCRIPT (ẩn khi luyện)</span>
          <button onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block'" style="font-size:11px;color:var(--blue);background:none;border:none;cursor:pointer">Hiện/Ẩn</button>
        </div>
        <div style="display:none;font-size:13px;line-height:1.8;white-space:pre-wrap">${script}</div>
      </div>
      ${questions?`<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px;margin-bottom:12px"><div style="font-size:11px;font-weight:700;margin-bottom:10px">❓ CÂU HỎI</div><div style="font-size:13px;line-height:2;white-space:pre-wrap">${questions}</div></div>`:''}
      ${vocab?`<div style="background:var(--yellow-l);border-radius:var(--r-md);padding:12px;margin-bottom:12px"><div style="font-size:11px;font-weight:700;color:var(--yellow);margin-bottom:6px">📚 TỪ VỰNG KEY</div><div style="font-size:12px;line-height:1.8;white-space:pre-wrap">${vocab}</div></div>`:''}
      <div style="display:flex;gap:8px">
        <button onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block';this.textContent=this.textContent.includes('Xem')?'🙈 Ẩn':'✅ Xem đáp án'" style="background:var(--green-l);border:1px solid var(--green);color:var(--green);border-radius:99px;padding:6px 16px;font-size:12px;cursor:pointer;font-weight:600">✅ Xem đáp án</button>
        <div style="display:none;padding:10px 14px;background:var(--bg2);border-radius:var(--r-md);font-size:12px;white-space:pre-wrap">${answers}</div>
        <button onclick="aiTutor.generateListening()" style="background:var(--blue-l);border:1px solid var(--blue);color:var(--blue-d);border-radius:99px;padding:6px 16px;font-size:12px;cursor:pointer">🔄 Bài khác</button>
      </div>`;
  }

  // ── SPEAKING ──────────────────────────────────────────────────────────────
  _renderSpeaking(el) {
    el.innerHTML=`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);padding:22px;box-shadow:var(--shadow-sm)">
          <div style="font-size:15px;font-weight:700;margin-bottom:6px">🎤 Luyện phát âm từ vựng</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Nghe → Nói → AI chấm điểm phát âm</div>
          <button class="btn btn-primary" style="width:100%;margin-bottom:10px" onclick="aiTutor.startPronunciation()">🎯 Bắt đầu luyện</button>
          <div id="pronArea"></div>
        </div>
        <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);padding:22px;box-shadow:var(--shadow-sm)">
          <div style="font-size:15px;font-weight:700;margin-bottom:6px">💬 Hội thoại AI</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Chọn tình huống và luyện nói thực tế cùng AI</div>
          <select id="convScenario" class="form-select" style="width:100%;margin-bottom:10px;font-size:13px">
            <option value="job_interview">💼 Phỏng vấn xin việc</option>
            <option value="business_meeting">🤝 Cuộc họp kinh doanh</option>
            <option value="hotel">🏨 Check-in khách sạn</option>
            <option value="restaurant">🍽️ Gọi món nhà hàng</option>
            <option value="airport">✈️ Sân bay</option>
            <option value="shopping">🛒 Mua sắm & Đàm phán</option>
            <option value="presentation">📊 Thuyết trình</option>
          </select>
          <button class="btn btn-primary" style="width:100%" onclick="app.router.navigate('/conversation')">🚀 Vào luyện giao tiếp</button>
        </div>
      </div>
      <div style="margin-top:16px;background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);padding:22px;box-shadow:var(--shadow-sm)">
        <div style="font-size:15px;font-weight:700;margin-bottom:6px">🎙 Luyện nói TOEIC Speaking</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:14px">AI tạo chủ đề → Bạn nói → AI chấm điểm và gợi ý cải thiện</div>
        <button class="btn btn-primary" onclick="aiTutor.generateSpeakingTask()" id="speakTaskBtn">✨ Tạo chủ đề luyện nói</button>
        <div id="speakTaskArea" style="margin-top:14px"></div>
      </div>`;
  }

  async startPronunciation() {
    const words=['achievement','negotiate','comprehensive','implement','mandatory','liability','proficient','delegate','expedite','revenue'];
    const w=words[Math.floor(Math.random()*words.length)];
    document.getElementById('pronArea').innerHTML=`
      <div style="text-align:center;padding:16px;background:var(--bg2);border-radius:var(--r-lg)">
        <div style="font-size:24px;font-weight:800;color:var(--blue);margin-bottom:4px">${w}</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Nhấn 🔊 nghe mẫu, rồi nhấn 🎤 để nói</div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button onclick="aiTutor._tts('${w}')" style="background:var(--blue-l);border:1px solid var(--blue);color:var(--blue-d);border-radius:99px;padding:8px 16px;cursor:pointer;font-size:13px">🔊 Nghe mẫu</button>
          <button id="pronBtn" onclick="aiTutor.recordPron('${w}',this)" style="background:var(--red);color:white;border:none;border-radius:99px;padding:8px 16px;cursor:pointer;font-size:13px">🎤 Nói</button>
        </div>
        <div id="pronResult" style="margin-top:10px;font-size:12px"></div>
      </div>`;
  }

  recordPron(targetWord, btn) {
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){Toast.err('Cần Chrome/Edge');return;}
    if(this._pronRecog){this._pronRecog.stop();return;}
    const recog=new SR(); recog.lang='en-US'; recog.continuous=false; recog.interimResults=false;
    this._pronRecog=recog;
    const result=document.getElementById('pronResult');
    recog.onstart=()=>{btn.textContent='⏹ Dừng';btn.style.background='var(--green)';result.textContent='🎙 Đang nghe...';};
    recog.onresult=(e)=>{
      const spoken=e.results[0][0].transcript.trim().toLowerCase();
      const conf=Math.round(e.results[0][0].confidence*100);
      const correct=spoken===targetWord.toLowerCase()||spoken.includes(targetWord.toLowerCase());
      result.innerHTML=`<div style="color:${correct?'var(--green)':'var(--orange)'}">Bạn nói: "<strong>${spoken}</strong>"${correct?` ✅ (${conf}%)`:' ⚠️ Thử lại!'}</div>`;
      setTimeout(()=>this.startPronunciation(),1800);
    };
    recog.onerror=()=>{result.textContent='❌ Không nghe thấy';this._pronRecog=null;};
    recog.onend=()=>{btn.textContent='🎤 Nói';btn.style.background='var(--red)';this._pronRecog=null;};
    recog.start();
  }

  async generateSpeakingTask() {
    if(!await this._ensureKey()) return;
    const btn=document.getElementById('speakTaskBtn'); if(btn){btn.disabled=true;btn.textContent='⏳';}
    try {
      const prompt=`Tạo 1 chủ đề luyện nói TOEIC tiếng Anh ngắn gọn:
FORMAT:
TOPIC: [Chủ đề 1 câu tiếng Anh]
DURATION: [1-2 phút]
GUIDE: [3 gợi ý nội dung bằng tiếng Việt]
SAMPLE: [1-2 câu mở đầu mẫu tiếng Anh]`;
      const raw=await aiService.ask(prompt,300);
      document.getElementById('speakTaskArea').innerHTML=`
        <div style="background:var(--purple-l);border:1px solid rgba(139,92,246,.3);border-radius:var(--r-lg);padding:16px">
          <div style="font-size:13px;line-height:1.8;white-space:pre-wrap">${raw}</div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button onclick="aiTutor._tts(document.querySelector('#speakTaskArea').textContent)" style="background:var(--blue-l);border:1px solid var(--blue);color:var(--blue-d);border-radius:99px;padding:6px 14px;font-size:12px;cursor:pointer">🔊 Nghe gợi ý</button>
            <button onclick="aiTutor.generateSpeakingTask()" style="background:none;border:1px solid var(--border);border-radius:99px;padding:6px 14px;font-size:12px;cursor:pointer">🔄 Chủ đề khác</button>
          </div>
        </div>`;
    } catch(e) { Toast.err(e.message); }
    finally { if(btn){btn.disabled=false;btn.textContent='✨ Tạo chủ đề luyện nói';} }
  }

  // ── GRAMMAR ───────────────────────────────────────────────────────────────
  _renderGrammar(el) {
    const points=['Câu bị động (Passive Voice)','Thì hiện tại hoàn thành','Mệnh đề quan hệ (Which/That)','Câu điều kiện loại 1-2','So sánh hơn và nhất','V-ing vs To-infinitive','Must/Have to/Should','Câu hỏi đuôi (Tag Questions)'];
    el.innerHTML=`
      <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);padding:24px;box-shadow:var(--shadow-sm)">
        <div style="font-size:16px;font-weight:700;margin-bottom:6px">📐 Luyện ngữ pháp TOEIC</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:16px">AI giải thích + Tạo bài tập Part 5 theo từng điểm ngữ pháp</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:20px">
          ${points.map(p=>`<button onclick="aiTutor.generateGrammar('${p}')" style="padding:12px;border:1.5px solid var(--border);border-radius:var(--r-lg);background:var(--white);cursor:pointer;text-align:left;font-size:13px;transition:all .15s" onmouseover="this.style.borderColor='var(--blue)';this.style.background='var(--blue-l)'" onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--white)'">📐 ${p}</button>`).join('')}
        </div>
        <div id="grammarContent"><div style="text-align:center;padding:30px;color:var(--muted)">Chọn điểm ngữ pháp để AI giải thích và tạo bài tập</div></div>
      </div>`;
  }

  async generateGrammar(point) {
    if(!await this._ensureKey()) return;
    document.getElementById('grammarContent').innerHTML=`<div style="text-align:center;padding:20px;color:var(--muted)">🤖 AI đang tạo bài tập...</div>`;
    try {
      const prompt=`Giải thích ngữ pháp TOEIC: "${point}" và tạo 4 câu bài tập Part 5.

FORMAT:
---EXPLAIN---
[Giải thích rõ ràng bằng tiếng Việt, có ví dụ tiếng Anh, 80-100 từ]
---EXERCISES---
[4 câu bài tập điền từ, format TOEIC Part 5 thật sự]
---ANSWERS---
[Đáp án + giải thích ngắn bằng tiếng Việt]`;
      const raw=await aiService.ask(prompt,900);
      const sec=(tag)=>{ const m=raw.match(new RegExp(`---${tag}---([\\s\\S]*?)(?=---|$)`)); return m?m[1].trim():''; };
      document.getElementById('grammarContent').innerHTML=`
        <div style="background:var(--purple-l);border-radius:var(--r-lg);padding:16px;margin-bottom:14px;border-left:4px solid var(--purple)">
          <div style="font-size:11px;font-weight:700;color:var(--purple);margin-bottom:8px">📐 GIẢI THÍCH: ${point}</div>
          <div style="font-size:13px;line-height:1.8;white-space:pre-wrap">${sec('EXPLAIN')||raw}</div>
        </div>
        ${sec('EXERCISES')?`<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;margin-bottom:10px">✏️ BÀI TẬP PART 5</div>
          <div style="font-size:13px;line-height:2.2;white-space:pre-wrap">${sec('EXERCISES')}</div>
        </div>`:''}
        <div style="display:flex;gap:8px">
          <button onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block';this.textContent=this.textContent.includes('Xem')?'🙈 Ẩn':'✅ Xem đáp án'" style="background:var(--green-l);border:1px solid var(--green);color:var(--green);border-radius:99px;padding:6px 16px;font-size:12px;cursor:pointer;font-weight:600">✅ Xem đáp án</button>
          <div style="display:none;padding:12px;background:var(--bg2);border-radius:var(--r-md);font-size:12px;white-space:pre-wrap;width:100%">${sec('ANSWERS')}</div>
        </div>`;
    } catch(e) { document.getElementById('grammarContent').innerHTML=`<div style="color:var(--red);padding:20px">❌ ${e.message}</div>`; }
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  _tts(text) {
    if(!this._synth) return; this._synth.cancel();
    const u=new SpeechSynthesisUtterance(text); u.lang='en-US'; u.rate=0.85;
    const v=this._synth.getVoices().find(v=>v.lang.startsWith('en')&&v.name.includes('Google'))||this._synth.getVoices().find(v=>v.lang.startsWith('en'));
    if(v) u.voice=v; this._synth.speak(u);
  }

  _appendMsg(role,content) {
    const el=document.getElementById('aiMessages'); if(!el) return;
    const isUser=role==='user';
    const div=document.createElement('div');
    div.style.cssText=`display:flex;gap:10px;align-items:flex-start;${isUser?'flex-direction:row-reverse':''}`;
    div.innerHTML=`<div style="width:32px;height:32px;border-radius:50%;background:${isUser?'var(--blue)':'linear-gradient(135deg,#667eea,#764ba2)'};display:flex;align-items:center;justify-content:center;font-size:14px;color:white;flex-shrink:0">${isUser?'👤':'🤖'}</div>
      <div style="max-width:82%;background:${isUser?'var(--blue)':'var(--bg2)'};color:${isUser?'white':'var(--text)'};padding:12px 16px;border-radius:${isUser?'18px 4px 18px 18px':'4px 18px 18px 18px'};font-size:13px;line-height:1.7;white-space:pre-wrap">${this._fmt(content)}</div>`;
    el.appendChild(div); el.scrollTop=el.scrollHeight;
  }

  _appendTyping() {
    const el=document.getElementById('aiMessages'); if(!el) return '';
    const id='t'+Date.now(); const div=document.createElement('div');
    div.id=id; div.style.cssText='display:flex;gap:10px;align-items:flex-start';
    div.innerHTML=`<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;color:white">🤖</div>
      <div style="background:var(--bg2);padding:12px 16px;border-radius:4px 18px 18px 18px"><div style="display:flex;gap:4px">${[0,.2,.4].map(d=>`<div style="width:8px;height:8px;border-radius:50%;background:var(--muted);animation:bounce 1.2s ${d}s infinite"></div>`).join('')}</div></div>`;
    el.appendChild(div); el.scrollTop=el.scrollHeight;
    if(!document.getElementById('bs')){const s=document.createElement('style');s.id='bs';s.textContent='@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}';document.head.appendChild(s);}
    return id;
  }

  _fmt(t){ return t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/`(.*?)`/g,'<code style="background:rgba(0,0,0,.1);padding:1px 5px;border-radius:3px;font-family:var(--mono)">$1</code>'); }

  async loadProgress() {
    const u=this.store.get('currentUser'); if(!u) return;
    try {
      const [v,p,pm]=await Promise.all([
        this.db.select('vocabulary',{eq:{user_id:u.id}}).catch(()=>[]),
        this.db.select('learning_progress',{eq:{user_id:u.id}}).catch(()=>[]),
        this.db.select('pomodoro_sessions',{eq:{user_id:u.id,completed:true}}).catch(()=>[]),
      ]);
      this._pd={totalWords:v.length,masteredWords:v.filter(x=>x.srs_level>=4).length,dueForReview:v.filter(x=>new Date(x.next_review)<=new Date()).length,daysCompleted:p.filter(x=>x.completed).length,pomodoroSessions:pm.length,xp:u.xp||0,level:u.level||1,streak:u.streak||0};
    } catch{}
  }

  _buildSystem() {
    const u=this.store.get('currentUser'); const p=this._pd||{};
    return `Bạn là AI Tutor thông minh của StudyHub — ứng dụng học TOEIC.
Người dùng: ${u?.display_name||'Học viên'} | XP:${p.xp||0} | Streak:${p.streak||0} ngày
Từ vựng: ${p.totalWords||0} tổng | ${p.masteredWords||0} thành thạo | ${p.dueForReview||0} cần ôn hôm nay
Lộ trình: ${p.daysCompleted||0}/30 ngày | Pomodoro: ${p.pomodoroSessions||0} phiên
Trả lời tiếng Việt, thân thiện, dùng số liệu thực, ngắn gọn, có emoji. Đưa ra action cụ thể.`;
  }
}
