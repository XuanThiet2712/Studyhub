import { Toast } from '../components/index.js';

// ★ THAY API KEY GEMINI TẠI ĐÂY nếu bị lỗi quota/429
// Lấy FREE tại: https://aistudio.google.com → Get API Key → Create API key
const _GEMINI_KEY = 'AIzaSyAdmzk-udHyq9z4ynlJqPEK70tcEi_16Nk';

const _GEMINI_MODELS = [
  { api: 'v1beta', model: 'gemini-2.5-flash-preview-04-17' },
  { api: 'v1beta', model: 'gemini-2.5-flash' },
  { api: 'v1beta', model: 'gemini-2.0-flash' },
  { api: 'v1beta', model: 'gemini-2.0-flash-lite' },
  { api: 'v1beta', model: 'gemini-1.5-flash' },
  { api: 'v1beta', model: 'gemini-1.5-flash-8b' },
];

async function _callGemini(systemPrompt, userMessage) {
  const contents = [
    { role: 'user',  parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Đã hiểu.' }] },
    { role: 'user',  parts: [{ text: userMessage }] },
  ];
  let lastErr;
  for (const { api, model } of _GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${_GEMINI_KEY}`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 1000, temperature: 0.7 } }) });
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
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch(e) {
      lastErr = e;
      if (!e.message.includes('quota') && !e.message.includes('not found') && !e.message.includes('429') && !e.message.includes('not supported')) throw e;
    }
  }
  throw new Error('⚠️ API Gemini hết quota.\nLấy key mới tại: https://aistudio.google.com → Get API Key\nSau đó thay vào dòng _GEMINI_KEY trong WordLabPage.js');
}

export class WordLabPage {
  constructor(db, store, bus) {
    this.db=db; this.store=store; this.bus=bus;
    this._tab='anatomy'; this._curWord=null;
    this._game={score:0,streak:0,q:null};
    this._aiLoading=false; this._sgPool=[];
    this._sgTimer=null; this._sgLeft=12;
  }

  render() {
    document.querySelector('.main').innerHTML=`
    <div class="page">
      <div class="page-header-row page-header">
        <div><h1 class="page-title">🔬 Word Lab</h1><p class="page-sub">Phân tích từ với AI · Học sâu · Mini Game</p></div>
      </div>
      <div class="tabs">
        <button class="tab active" onclick="wlPage.sw('anatomy',this)">🧬 AI Word Anatomy</button>
        <button class="tab" onclick="wlPage.sw('game',this)">🎮 Solo Game</button>
        <button class="tab" onclick="wlPage.sw('builder',this)">🏗️ Prefix/Root/Suffix</button>
      </div>

      <!-- AI ANATOMY TAB -->
      <div id="wl-anatomy">
        <div style="display:flex;gap:10px;margin-bottom:16px">
          <div style="flex:1;position:relative">
            <input class="form-input" id="anatInput" placeholder="Nhập bất kỳ từ tiếng Anh nào để AI phân tích..." style="padding-right:40px">
          </div>
          <button class="btn btn-primary" onclick="wlPage.analyzeAI()" id="aiAnalyzeBtn">🤖 AI Phân tích</button>
          <button class="btn btn-ghost" onclick="wlPage.randomWord()">🎲 Ngẫu nhiên</button>
        </div>

        <div id="anatResult">
          <div style="text-align:center;padding:40px;color:var(--muted)">
            <div style="font-size:48px;margin-bottom:12px">🔬</div>
            <div style="font-size:15px;font-weight:600;margin-bottom:6px">Nhập từ bất kỳ để AI phân tích</div>
            <div style="font-size:13px">AI sẽ phân tách tiền tố · gốc từ · hậu tố · gia đình từ · ví dụ TOEIC</div>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:16px;flex-wrap:wrap">
              ${['impossible','management','international','productivity','transportation','professional','qualification','responsibility'].map(w=>`<button onclick="document.getElementById('anatInput').value='${w}';wlPage.analyzeAI()" style="padding:5px 14px;border-radius:99px;border:1.5px solid var(--border);background:var(--white);cursor:pointer;font-size:12px">${w}</button>`).join('')}
            </div>
          </div>
        </div>

        <!-- AI CHAT for word questions -->
        <div id="wordChat" style="display:none;margin-top:16px">
          <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden">
            <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
              <div style="font-size:13px;font-weight:600">💬 Hỏi AI về từ này</div>
              <button onclick="document.getElementById('wordChat').style.display='none'" style="background:none;border:none;cursor:pointer;color:var(--muted)">✕</button>
            </div>
            <div id="wordChatMessages" style="max-height:200px;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px"></div>
            <div style="padding:10px;border-top:1px solid var(--border);display:flex;gap:8px">
              <input class="form-input" id="wordChatInput" placeholder="Hỏi về cách dùng, ngữ pháp, ví dụ..." style="flex:1" onkeydown="if(event.key==='Enter')wlPage.askWordAI()">
              <button class="btn btn-primary btn-sm" onclick="wlPage.askWordAI()">Hỏi</button>
            </div>
          </div>
        </div>
      </div>

      <!-- SOLO GAME TAB -->
      <div id="wl-game" style="display:none">
        <div style="max-width:560px;margin:0 auto">
          <div style="display:flex;gap:20px;justify-content:center;margin-bottom:16px">
            <div style="text-align:center"><div style="font-family:'Lora',serif;font-style:italic;font-size:30px;font-weight:700;color:var(--blue)" id="sgScore">0</div><div style="font-size:10px;color:var(--muted);font-family:var(--mono)">ĐIỂM</div></div>
            <div style="text-align:center"><div style="font-family:'Lora',serif;font-style:italic;font-size:30px;font-weight:700;color:var(--orange)" id="sgStreak">0</div><div style="font-size:10px;color:var(--muted);font-family:var(--mono)">🔥 STREAK</div></div>
            <div style="text-align:center"><div style="font-family:'Lora',serif;font-style:italic;font-size:30px;font-weight:700;color:var(--purple)" id="sgBest">${localStorage.getItem('sh_solo_best')||0}</div><div style="font-size:10px;color:var(--muted);font-family:var(--mono)">KỶ LỤC</div></div>
          </div>

          <!-- Game mode selector -->
          <div style="display:flex;gap:8px;margin-bottom:14px;justify-content:center">
            <button onclick="wlPage.setGameMode('meaning',this)" class="sgModeBtn" style="padding:6px 14px;border-radius:99px;font-size:12px;border:1.5px solid var(--blue);background:var(--blue-l);color:var(--blue-d);cursor:pointer">📝 Nghĩa</button>
            <button onclick="wlPage.setGameMode('word',this)" class="sgModeBtn" style="padding:6px 14px;border-radius:99px;font-size:12px;border:1.5px solid var(--border);background:transparent;color:var(--muted);cursor:pointer">🔤 Từ vựng</button>
            <button onclick="wlPage.setGameMode('fill',this)" class="sgModeBtn" style="padding:6px 14px;border-radius:99px;font-size:12px;border:1.5px solid var(--border);background:transparent;color:var(--muted);cursor:pointer">✍️ Điền từ</button>
          </div>

          <div style="height:4px;background:var(--bg3);border-radius:99px;overflow:hidden;margin-bottom:14px"><div id="sgTimer" style="height:100%;background:var(--blue);border-radius:99px;transition:width .1s;width:100%"></div></div>

          <div class="card" style="text-align:center;padding:26px;margin-bottom:12px" id="sgQuestion">
            <div style="font-size:11px;color:var(--muted);font-family:var(--mono);margin-bottom:10px" id="sgQLabel">Nghĩa tiếng Việt của từ này?</div>
            <div style="font-family:'Lora',serif;font-style:italic;font-size:34px;font-weight:700;color:var(--blue);margin-bottom:6px" id="sgWord">—</div>
            <div style="font-family:var(--mono);font-size:13px;color:var(--muted)" id="sgPhone"></div>
            <div style="font-size:12px;color:var(--muted);margin-top:6px;font-style:italic" id="sgExample"></div>
            <button onclick="wlPage.sgSpeak()" style="margin-top:10px;background:var(--blue-l);border:1px solid rgba(59,130,246,.2);color:var(--blue);padding:5px 14px;border-radius:99px;font-size:12px;cursor:pointer">🔊 Phát âm</button>
          </div>

          <div id="sgFillArea" style="display:none;margin-bottom:12px">
            <input class="form-input" id="sgFillInput" placeholder="Điền từ vào đây..." style="text-align:center;font-size:16px" onkeydown="if(event.key==='Enter')wlPage.sgCheckFill()">
            <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="wlPage.sgCheckFill()">✓ Kiểm tra</button>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px" id="sgOpts"></div>
          <div style="text-align:center">
            <button class="btn btn-ghost" onclick="wlPage.sgNext()">▶ Bỏ qua</button>
          </div>
        </div>
      </div>

      <!-- BUILDER TAB -->
      <div id="wl-builder" style="display:none">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
          ${[
            {title:'PREFIX — Tiền tố',col:'#ef4444',items:[['un-','không, phủ định','unhappy,unable,unclear'],['re-','lại, lần nữa','return,refund,review'],['im/in-','không, vào','impossible,income,input'],['pre-','trước','prepare,preview,prevent'],['pro-','hướng tới','produce,project,promote'],['trans-','qua, chuyển','transport,transfer,translate'],['inter-','giữa','international,interview'],['over-','quá, vượt','overtime,overcome,overwork'],['sub-','dưới, phụ','submit,subscribe,subtitle'],['mis-','sai, nhầm','misplace,misuse,misunderstand']]},
            {title:'ROOT — Gốc từ',col:'#3b82f6',items:[['-port-','mang, vác','import,export,airport,report'],['-duct-','dẫn, tạo','product,conduct,introduce'],['-cept-','lấy, nhận','accept,concept,except'],['-mit-','gửi, để','submit,commit,permit,admit'],['-vis-','thấy','visible,review,vision,visit'],['-tract-','kéo','contract,attract,extract'],['-scrib-','viết','describe,subscribe,prescribe'],['-press-','ép, in','express,impress,depress'],['-spec-','nhìn, quan sát','inspect,expect,respect'],['-fect-','làm, tạo','effect,affect,perfect']]},
            {title:'SUFFIX — Hậu tố',col:'#22c55e',items:[['-ment','kết quả, hành động','payment,agreement,management'],['-tion','sự, hành động','presentation,transaction,position'],['-able','có thể','available,flexible,reliable'],['-ity','tính chất','quality,productivity,ability'],['-er/-or','người làm','manager,director,employer'],['-al','thuộc về','national,financial,professional'],['-ize','biến thành','organize,prioritize,realize'],['-ness','trạng thái','business,awareness,fitness'],['-ful','đầy, có','successful,helpful,careful'],['-less','thiếu, không','careless,useless,jobless']]}
          ].map(sec=>`
          <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);padding:16px;box-shadow:var(--shadow-sm)">
            <div style="font-size:11px;font-family:var(--mono);color:${sec.col};letter-spacing:.8px;text-transform:uppercase;margin-bottom:12px;font-weight:700">${sec.title}</div>
            ${sec.items.map(([p,m,e])=>`
            <div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px" onclick="document.getElementById('anatInput').value='${e.split(',')[0]}';wlPage.sw('anatomy',document.querySelector('.tab'));wlPage.analyzeAI();" style="cursor:pointer">
              <div style="font-family:var(--mono);color:${sec.col};min-width:70px;font-weight:600">${p}</div>
              <div><div style="color:var(--text)">${m}</div><div style="font-size:10px;color:var(--muted2);margin-top:2px">${e}</div></div>
            </div>`).join('')}
          </div>`).join('')}
        </div>
      </div>
    </div>`;

    window.wlPage = this;
    this._gameMode = 'meaning';
    this.sgLoadPool();
    document.getElementById('anatInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.analyzeAI();
    });
  }

  sw(tab, btn) {
    ['anatomy','game','builder'].forEach(t => {
      const el = document.getElementById('wl-'+t);
      if (el) el.style.display = 'none';
    });
    document.getElementById('wl-'+tab).style.display = 'block';
    document.querySelectorAll('.tabs .tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (tab === 'game') this.sgNext();
  }

  setGameMode(mode, btn) {
    this._gameMode = mode;
    document.querySelectorAll('.sgModeBtn').forEach(b => {
      b.style.borderColor='var(--border)'; b.style.background='transparent'; b.style.color='var(--muted)';
    });
    btn.style.borderColor='var(--blue)'; btn.style.background='var(--blue-l)'; btn.style.color='var(--blue-d)';
    this.sgNext();
  }

  randomWord() {
    const samples = ['impossible','management','international','productivity','transportation','professional','qualification','responsibility','achievement','negotiation','sustainable','innovation'];
    const w = samples[Math.floor(Math.random()*samples.length)];
    document.getElementById('anatInput').value = w;
    this.analyzeAI();
  }

  async analyzeAI() {
    const word = document.getElementById('anatInput')?.value?.trim();
    if (!word) { Toast.err('Nhập từ cần phân tích!'); return; }
    if (this._aiLoading) return;

    const el = document.getElementById('anatResult');
    this._aiLoading = true;
    const btn = document.getElementById('aiAnalyzeBtn');
    if (btn) { btn.disabled=true; btn.textContent='⏳ Đang phân tích...'; }

    el.innerHTML = `<div style="text-align:center;padding:40px"><div style="font-size:40px;margin-bottom:12px">🤖</div><div style="color:var(--muted)">AI đang phân tích từ "<strong>${word}</strong>"...</div></div>`;

    try {
      const text = await _callGemini(
        'Bạn là AI phân tích từ vựng tiếng Anh. Chỉ trả về JSON, không có gì khác ngoài JSON.',
        `Phân tích từ tiếng Anh "${word}" theo format JSON sau (chỉ trả về JSON, không có gì khác):\n{"word":"${word}","ipa":"/phiên âm IPA/","meaning":"nghĩa tiếng Việt chính","parts":[{"part":"tiền tố/gốc/hậu tố","type":"prefix|root|suffix","meaning":"nghĩa của phần này","color":"#ef4444 cho prefix, #3b82f6 cho root, #22c55e cho suffix","examples":["ví dụ1","ví dụ2","ví dụ3"]}],"family":["từ cùng gốc 1","từ cùng gốc 2","từ cùng gốc 3","từ cùng gốc 4"],"toeicExample":"1 câu ví dụ TOEIC thực tế","collocations":["collocation phổ biến 1","collocation 2","collocation 3"],"level":"basic|intermediate|advanced","tip":"mẹo ghi nhớ từ này"}`
      );
      const json = JSON.parse(text.replace(/```json|```/g,'').trim());
      this._curWord = json;
      this.renderAIAnatomy(json);
      this._initWordChat(word);
    } catch(e) {
      el.innerHTML = `<div style="text-align:center;padding:30px;color:var(--red)">❌ Lỗi phân tích: ${e.message}<br><button class="btn btn-ghost btn-sm" onclick="wlPage.analyzeAI()" style="margin-top:10px">Thử lại</button></div>`;
    } finally {
      this._aiLoading = false;
      if (btn) { btn.disabled=false; btn.textContent='🤖 AI Phân tích'; }
    }
  }

  renderAIAnatomy(d) {
    const el = document.getElementById('anatResult');
    el.innerHTML = `
    <div>
      <div class="card" style="text-align:center;padding:28px;margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:10px">
          <div style="font-family:'Lora',serif;font-style:italic;font-size:38px;font-weight:700">${d.word}</div>
          <span style="padding:3px 10px;border-radius:99px;font-size:11px;background:var(--blue-l);color:var(--blue-d);font-family:var(--mono)">${d.level||'intermediate'}</span>
        </div>
        <div style="font-size:13px;color:var(--muted);font-family:var(--mono);margin-bottom:4px">${d.ipa||''}</div>
        <div style="font-size:16px;color:var(--muted);margin-bottom:16px">🇻🇳 ${d.meaning}</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:18px">
          <button onclick="wlPage._speak('${d.word}',0.8)" style="background:var(--blue-l);border:1px solid rgba(59,130,246,.2);color:var(--blue);padding:5px 14px;border-radius:99px;font-size:12px;cursor:pointer">🔊 Chậm</button>
          <button onclick="wlPage._speak('${d.word}',1.0)" style="background:var(--green-l,#f0fdf4);border:1px solid rgba(34,197,94,.2);color:var(--green);padding:5px 14px;border-radius:99px;font-size:12px;cursor:pointer">🔊 Chuẩn</button>
        </div>
        ${d.parts?.length ? `<div style="display:flex;justify-content:center;align-items:stretch;gap:4px;flex-wrap:wrap;margin-bottom:18px">
          ${d.parts.map((p,i)=>`${i>0?'<div style="font-size:22px;color:var(--muted);align-self:center;margin:0 6px">+</div>':''}
          <div style="background:${p.color}12;border:2px solid ${p.color}30;border-radius:var(--r-lg);padding:12px 16px;min-width:85px;text-align:center;transition:transform .2s" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
            <div style="font-family:'Lora',serif;font-style:italic;font-size:22px;font-weight:700;color:${p.color}">${p.part}</div>
            <div style="font-size:9px;font-family:var(--mono);color:${p.color};text-transform:uppercase;margin-top:2px">${p.type}</div>
            <div style="font-size:11px;font-weight:500;margin-top:4px">${p.meaning}</div>
          </div>`).join('')}
        </div>` : ''}
        ${d.parts?.map(p=>`<div style="font-size:12px;margin-bottom:5px"><span style="font-family:var(--mono);color:${p.color};font-weight:600">${p.part}</span> → "${p.meaning}" • Xem thêm: ${(p.examples||[]).map(e=>`<span style="cursor:pointer;color:var(--blue);text-decoration:underline" onclick="document.getElementById('anatInput').value='${e}';wlPage.analyzeAI()">${e}</span>`).join(' · ')}</div>`).join('')||''}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
        ${d.family?.length ? `<div class="card">
          <div style="font-size:11px;color:var(--muted);font-family:var(--mono);margin-bottom:8px">👨‍👩‍👧 GIA ĐÌNH TỪ</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${d.family.map(w=>`<span onclick="document.getElementById('anatInput').value='${w}';wlPage.analyzeAI()" style="padding:4px 12px;border:1px solid var(--border2);border-radius:99px;font-size:12px;cursor:pointer;transition:all .15s" onmouseover="this.style.borderColor='var(--purple)';this.style.color='var(--purple)'" onmouseout="this.style.borderColor='var(--border2)';this.style.color=''">${w}</span>`).join('')}
          </div>
        </div>` : ''}
        ${d.collocations?.length ? `<div class="card">
          <div style="font-size:11px;color:var(--muted);font-family:var(--mono);margin-bottom:8px">🔗 COLLOCATIONS</div>
          ${d.collocations.map(c=>`<div style="font-size:12px;padding:4px 0;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px"><span style="color:var(--blue)">•</span> ${c} <button onclick="wlPage._speak('${c}',0.9)" style="background:none;border:none;cursor:pointer;font-size:11px;color:var(--muted);margin-left:auto">🔊</button></div>`).join('')}
        </div>` : ''}
      </div>

      ${d.toeicExample ? `<div style="background:var(--purple-l);border-left:3px solid var(--purple);border-radius:0 var(--r-md) var(--r-md) 0;padding:12px 16px;margin-bottom:12px;font-size:13px;color:var(--muted);font-style:italic">
        📋 "${d.toeicExample}" <button onclick="wlPage._speak('${d.toeicExample.replace(/'/g,"\\'")}',0.85)" style="background:none;border:none;cursor:pointer">🔊</button>
      </div>` : ''}

      ${d.tip ? `<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fcd34d;border-radius:var(--r-lg);padding:12px 16px;margin-bottom:14px;font-size:13px">
        💡 <strong>Mẹo nhớ:</strong> ${d.tip}
      </div>` : ''}

      <div style="display:flex;gap:8px">
        <button onclick="document.getElementById('wordChat').style.display='block'" class="btn btn-ghost btn-sm">💬 Hỏi AI thêm</button>
        <button onclick="wlPage._saveToVocab('${d.word}','${d.meaning.replace(/'/g,"\\'")}','${d.ipa||''}')" class="btn btn-primary btn-sm">💾 Lưu vào từ vựng</button>
      </div>
    </div>`;
  }

  _initWordChat(word) {
    const el = document.getElementById('wordChatMessages');
    if (el) el.innerHTML = '';
    document.getElementById('wordChat').style.display = 'block';
    document.getElementById('wordChatInput').placeholder = `Hỏi về "${word}": cách dùng, ví dụ, ngữ pháp...`;
    this._currentWordForChat = word;
    this._wordChatMessages = [];
  }

  async askWordAI() {
    const input = document.getElementById('wordChatInput');
    const text = input?.value?.trim();
    if (!text || !this._currentWordForChat) return;
    input.value = '';
    const el = document.getElementById('wordChatMessages');
    const addMsg = (role, content) => {
      const div = document.createElement('div');
      div.style.cssText = `display:flex;gap:6px;${role==='user'?'flex-direction:row-reverse':''}`;
      div.innerHTML = `<div style="font-size:11px;padding:6px 10px;border-radius:12px;background:${role==='user'?'var(--blue)':'var(--bg2)'};color:${role==='user'?'white':'var(--text)'};max-width:85%;line-height:1.5">${content}</div>`;
      el.appendChild(div); el.scrollTop = el.scrollHeight;
    };
    addMsg('user', text);
    addMsg('assistant', '⏳...');
    try {
      const reply = await _callGemini(
        `Bạn là trợ lý phân tích từ vựng tiếng Anh TOEIC. Đang phân tích từ "${this._currentWordForChat}". Trả lời ngắn gọn bằng tiếng Việt, dùng emoji.`,
        [...this._wordChatMessages.slice(-6).map(m => m.role+': '+m.content), text].join('\n')
      );
      el.lastChild?.remove();
      addMsg('assistant', reply);
      this._wordChatMessages.push({role:'user',content:text},{role:'assistant',content:reply});
    } catch(e) { el.lastChild.textContent = '❌ Lỗi'; }
  }

  async _saveToVocab(word, meaning, phonetic) {
    const user = this.store.get('currentUser');
    if (!user) return;
    try {
      await this.db.insert('vocabulary', {
        user_id: user.id, word, meaning_vi: meaning, phonetic,
        word_type: 'n', category: 'TOEIC', srs_level: 0,
        review_count: 0, next_review: new Date().toISOString()
      });
      Toast.ok(`Đã lưu "${word}" vào từ vựng! 📚`);
      this.bus.emit('vocab:updated');
    } catch(e) { Toast.err('Lỗi lưu: ' + e.message); }
  }

  _speak(text, rate=1.0) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang='en-US'; u.rate=rate;
    window.speechSynthesis.speak(u);
  }

  // ── SOLO GAME ────────────────────────────────────────────
  async sgLoadPool() {
    const user = this.store.get('currentUser');
    let pool = [];
    try {
      const rows = await this.db.select('vocabulary',{eq:{user_id:user.id},limit:200});
      pool = rows.map(r=>({word:r.word,meaning:r.meaning_vi,phonetic:r.phonetic||'',example:r.example||''}));
    } catch{}
    const defaults = [
      {word:'office',meaning:'văn phòng',phonetic:'/ˈɒfɪs/',example:'She works in the main office.'},
      {word:'invoice',meaning:'hóa đơn',phonetic:'/ˈɪnvɔɪs/',example:'Please send the invoice by email.'},
      {word:'deadline',meaning:'hạn chót',phonetic:'/ˈdedlaɪn/',example:'The deadline is next Friday.'},
      {word:'discount',meaning:'giảm giá',phonetic:'/ˈdɪskaʊnt/',example:'We offer a 20% discount for bulk orders.'},
      {word:'negotiate',meaning:'đàm phán',phonetic:'/nɪˈɡəʊʃieɪt/',example:'They need to negotiate the contract terms.'},
      {word:'candidate',meaning:'ứng viên',phonetic:'/ˈkændɪdət/',example:'The candidate has excellent qualifications.'},
      {word:'salary',meaning:'lương',phonetic:'/ˈsæləri/',example:'She received a salary increase last month.'},
      {word:'efficient',meaning:'hiệu quả',phonetic:'/ɪˈfɪʃnt/',example:'The new system is more efficient.'},
      {word:'confirm',meaning:'xác nhận',phonetic:'/kənˈfɜːm/',example:'Please confirm your attendance.'},
      {word:'delivery',meaning:'giao hàng',phonetic:'/dɪˈlɪvəri/',example:'The delivery will arrive tomorrow.'},
      {word:'schedule',meaning:'lịch trình',phonetic:'/ˈʃedjuːl/',example:'Check the schedule for available slots.'},
      {word:'proposal',meaning:'đề xuất',phonetic:'/prəˈpəʊzəl/',example:'She submitted a detailed proposal.'},
    ];
    const seen = new Set();
    this._sgPool = [...pool,...defaults].filter(v=>{if(seen.has(v.word))return false;seen.add(v.word);return true;});
  }

  sgNext() {
    if (!this._sgPool.length) return;
    clearInterval(this._sgTimer);
    const q = this._sgPool[Math.floor(Math.random()*this._sgPool.length)];
    this._game.q = q;

    document.getElementById('sgFillArea').style.display = 'none';
    document.getElementById('sgOpts').style.display = 'grid';

    if (this._gameMode === 'meaning') {
      document.getElementById('sgQLabel').textContent = 'Nghĩa tiếng Việt của từ này là?';
      document.getElementById('sgWord').textContent = q.word;
      document.getElementById('sgPhone').textContent = q.phonetic;
      document.getElementById('sgExample').textContent = q.example ? `"${q.example}"` : '';
      const wrongs = this._sgPool.filter(x=>x.word!==q.word).sort(()=>Math.random()-.5).slice(0,3);
      const opts = [...wrongs.map(w=>w.meaning), q.meaning].sort(()=>Math.random()-.5);
      document.getElementById('sgOpts').innerHTML = opts.map((o,i)=>`<button class="btn btn-ghost" style="padding:12px;font-size:13px;height:auto;text-align:center;border-radius:var(--r-lg);border-width:2px" onclick="wlPage.sgAnswer('${o.replace(/'/g,"\\'")}','meaning')">${String.fromCharCode(65+i)}. ${o}</button>`).join('');
    } else if (this._gameMode === 'word') {
      document.getElementById('sgQLabel').textContent = 'Từ tiếng Anh nào có nghĩa này?';
      document.getElementById('sgWord').textContent = q.meaning;
      document.getElementById('sgPhone').textContent = '';
      document.getElementById('sgExample').textContent = '';
      const wrongs = this._sgPool.filter(x=>x.word!==q.word).sort(()=>Math.random()-.5).slice(0,3);
      const opts = [...wrongs.map(w=>w.word), q.word].sort(()=>Math.random()-.5);
      document.getElementById('sgOpts').innerHTML = opts.map((o,i)=>`<button class="btn btn-ghost" style="padding:12px;font-size:13px;height:auto;text-align:center;border-radius:var(--r-lg);border-width:2px" onclick="wlPage.sgAnswer('${o}','word')">${String.fromCharCode(65+i)}. ${o}</button>`).join('');
    } else { // fill
      document.getElementById('sgQLabel').textContent = 'Điền từ tiếng Anh có nghĩa:';
      document.getElementById('sgWord').textContent = q.meaning;
      document.getElementById('sgPhone').textContent = q.phonetic ? `Gợi ý: ${q.phonetic}` : '';
      document.getElementById('sgExample').textContent = '';
      document.getElementById('sgOpts').style.display = 'none';
      document.getElementById('sgFillArea').style.display = 'block';
      document.getElementById('sgFillInput').value = '';
      setTimeout(()=>document.getElementById('sgFillInput')?.focus(), 100);
    }

    this._sgLeft = 15;
    const bar = document.getElementById('sgTimer');
    if (bar) bar.style.width='100%';
    this._sgTimer = setInterval(()=>{
      this._sgLeft -= 0.1;
      const p = Math.max(0,this._sgLeft/15*100);
      const b = document.getElementById('sgTimer');
      if (b) { b.style.width=p+'%'; b.style.background=p>60?'var(--blue)':p>30?'var(--orange)':'var(--red)'; }
      if (this._sgLeft<=0) { clearInterval(this._sgTimer); this.sgAnswer(null,'timeout'); }
    },100);
  }

  sgCheckFill() {
    const val = document.getElementById('sgFillInput')?.value?.trim().toLowerCase();
    this.sgAnswer(val, 'fill');
  }

  sgAnswer(choice, mode) {
    clearInterval(this._sgTimer);
    const q = this._game.q;
    if (!q) return;

    let ok = false;
    if (mode === 'meaning') ok = choice === q.meaning;
    else if (mode === 'word') ok = choice === q.word;
    else if (mode === 'fill') ok = choice === q.word.toLowerCase();
    else ok = false; // timeout

    if (ok) {
      const timeBonus = Math.ceil(this._sgLeft);
      const pts = 10 + timeBonus;
      this._game.score += pts;
      this._game.streak++;
      Toast.ok(`+${pts} điểm! 🎉 Streak: ${this._game.streak}🔥`);
    } else {
      this._game.streak = 0;
      if (mode !== 'timeout') Toast.err(`Sai! Đáp án: ${q.word} = ${q.meaning}`);
      else Toast.err(`Hết giờ! "${q.word}" = ${q.meaning}`);
    }

    document.querySelectorAll('#sgOpts .btn').forEach(b => {
      if (b.textContent.includes(q.meaning)||b.textContent.includes(q.word)) { b.style.background='var(--green)';b.style.color='white';b.style.borderColor='var(--green)'; }
      if (!ok && choice && b.textContent.includes(choice)) { b.style.background='rgba(239,68,68,0.15)';b.style.borderColor='var(--red)'; }
      b.disabled=true;
    });

    const best = parseInt(localStorage.getItem('sh_solo_best')||0);
    if (this._game.score > best) localStorage.setItem('sh_solo_best', this._game.score);

    const _sgScore = document.getElementById('sgScore');
    const _sgStreak = document.getElementById('sgStreak');
    const _sgBest = document.getElementById('sgBest');
    if (_sgScore) _sgScore.textContent = this._game.score;
    if (_sgStreak) _sgStreak.textContent = this._game.streak;
    if (_sgBest) _sgBest.textContent = Math.max(best, this._game.score);

    setTimeout(()=>this.sgNext(), ok?800:1200);
  }

  sgSpeak() { if (this._game.q) this._speak(this._game.q.word, 0.85); }
}