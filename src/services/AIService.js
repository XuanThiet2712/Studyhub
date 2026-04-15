/**
 * AIService v2 — Fixed model endpoints, personal API key management
 */
const KEY_STORAGE = 'sh_gemini_key';

// Only use v1beta — v1 doesn't support all models
const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite', 
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
];

export class AIService {
  constructor() { this._key = localStorage.getItem(KEY_STORAGE) || ''; }
  getKey()   { return this._key; }
  hasKey()   { return this._key.length > 20; }
  setKey(k)  { this._key = k.trim(); localStorage.setItem(KEY_STORAGE, this._key); }
  clearKey() { this._key = ''; localStorage.removeItem(KEY_STORAGE); }

  async call(systemPrompt, messages, maxTokens = 1000) {
    if (!this.hasKey()) throw new Error('NO_KEY');
    const contents = [
      { role: 'user',  parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Đã hiểu. Sẵn sàng hỗ trợ!' }] },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || '' }]
      }))
    ];
    const body = { contents, generationConfig: { maxOutputTokens: maxTokens, temperature: 0.75 } };
    let lastErr;
    for (const model of MODELS) {
      try {
        // Always use v1beta — it supports all current models
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this._key}`;
        const res  = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
        const data = await res.json();
        if (data.error) {
          const code = data.error.code || res.status;
          const msg  = data.error.message || '';
          // Skip to next model on quota/not-found
          if (code === 429 || code === 404 || msg.includes('quota') || msg.includes('not found') || msg.includes('RESOURCE_EXHAUSTED')) {
            lastErr = new Error(msg); continue;
          }
          // Invalid key — stop immediately
          if (code === 400 && msg.includes('API_KEY_INVALID')) throw new Error('API_KEY_INVALID: ' + msg);
          throw new Error(msg || `HTTP ${code}`);
        }
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty response from AI');
        console.log(`✅ AI [${model}]:`, text.slice(0,60));
        return text;
      } catch(e) {
        lastErr = e;
        if (e.message?.includes('API_KEY_INVALID')) throw e; // don't retry bad key
        // continue on quota/network errors
      }
    }
    throw lastErr || new Error('Tất cả model đều lỗi. Kiểm tra API key tại aistudio.google.com');
  }

  async ask(prompt, maxTokens = 800) {
    return this.call('Trả lời ngắn gọn, chính xác bằng tiếng Việt.', [{ role:'user', content: prompt }], maxTokens);
  }
}

export const aiService = new AIService();

export function showAPIKeyModal(onSuccess) {
  document.getElementById('apiKeyModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'apiKeyModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(6px)';
  const hasKey = aiService.hasKey();
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:28px;max-width:460px;width:100%;box-shadow:0 30px 70px rgba(0,0,0,0.25);animation:kfSlideUp .3s cubic-bezier(.34,1.56,.64,1)">
      <div style="text-align:center;margin-bottom:22px">
        <div style="width:60px;height:60px;border-radius:16px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 12px">🔑</div>
        <div style="font-size:19px;font-weight:800;color:#0f172a;margin-bottom:5px">${hasKey ? '⚙️ Quản lý API Key' : 'Cấu hình AI của bạn'}</div>
        <div style="font-size:12px;color:#64748b;line-height:1.6">Key lưu trên máy bạn · Không ai khác đọc được</div>
      </div>

      ${!hasKey ? `<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:14px;margin-bottom:18px;font-size:12px;line-height:1.8">
        <div style="font-weight:700;color:#15803d;margin-bottom:5px">✅ Lấy Gemini API Key MIỄN PHÍ:</div>
        <div style="color:#166534">
          1. Vào <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#2563eb;font-weight:700">aistudio.google.com/apikey</a><br>
          2. Đăng nhập Gmail → <strong>Create API key</strong><br>
          3. Copy và dán vào ô dưới 👇
        </div>
      </div>` : `<div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:12px;padding:12px;margin-bottom:18px;font-size:12px;color:#1d4ed8">
        ✅ Bạn đã có API key. Nhập key mới để thay thế hoặc kiểm tra lại.
      </div>`}

      <div style="margin-bottom:14px">
        <label style="font-size:12px;font-weight:700;color:#374151;display:block;margin-bottom:6px">Gemini API Key</label>
        <div style="position:relative">
          <input id="apiKeyInput" type="password" placeholder="AIzaSy..."
            style="width:100%;padding:11px 42px 11px 13px;border:2px solid #e2e8f0;border-radius:10px;font-size:13px;font-family:monospace;outline:none;color:#0f172a;transition:border-color .2s"
            value="${aiService.getKey()}"
            onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e2e8f0'">
          <button onclick="const i=document.getElementById('apiKeyInput');i.type=i.type==='password'?'text':'password';this.textContent=i.type==='password'?'👁':'🙈'"
            style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px">👁</button>
        </div>
      </div>

      <div id="apiKeyStatus" style="display:none;border-radius:8px;padding:9px 12px;margin-bottom:14px;font-size:12px;font-weight:500"></div>

      <div style="display:flex;gap:8px;margin-bottom:${hasKey?'10px':'0'}">
        <button onclick="document.getElementById('apiKeyModal').remove()"
          style="flex:1;padding:11px;border:2px solid #e2e8f0;border-radius:10px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#374151">Hủy</button>
        <button onclick="window._doSaveKey()" id="apiKeySaveBtn"
          style="flex:2;padding:11px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;border:none;border-radius:10px;cursor:pointer;font-size:13px;font-weight:700">
          🔑 Kiểm tra & Lưu
        </button>
      </div>
      ${hasKey ? `<div style="text-align:center"><button onclick="aiService.clearKey();document.getElementById('apiKeyModal').remove();if(window._onKeySuccess)window._onKeySuccess()"
        style="background:none;border:none;cursor:pointer;font-size:12px;color:#ef4444;padding:4px">🗑 Xóa key hiện tại</button></div>` : ''}
    </div>
    <style>@keyframes kfSlideUp{from{opacity:0;transform:scale(.94) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}</style>`;

  modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
  window._onKeySuccess = onSuccess;
  window._doSaveKey = async () => {
    const key = document.getElementById('apiKeyInput').value.trim();
    const btn = document.getElementById('apiKeySaveBtn');
    const status = document.getElementById('apiKeyStatus');
    if (key.length < 20) {
      status.style.display='block'; status.style.background='#fef2f2'; status.style.color='#dc2626';
      status.textContent='❌ Key không hợp lệ (quá ngắn)'; return;
    }
    btn.innerHTML='<span style="display:inline-block;animation:spin .8s linear infinite">⏳</span> Đang kiểm tra...';
    btn.disabled=true; status.style.display='none';
    const prev = aiService.getKey();
    try {
      aiService.setKey(key);
      await aiService.ask('Nói "Xin chào" thôi.', 15);
      status.style.display='block'; status.style.background='#f0fdf4'; status.style.color='#16a34a';
      status.textContent='✅ Key hợp lệ! Đã lưu.';
      btn.innerHTML='✅ Đã lưu!';
      setTimeout(() => { modal.remove(); if(onSuccess) onSuccess(); }, 1000);
    } catch(e) {
      aiService.setKey(prev); // restore
      status.style.display='block'; status.style.background='#fef2f2'; status.style.color='#dc2626';
      if (e.message.includes('API_KEY_INVALID') || e.message.includes('400'))
        status.textContent='❌ Key sai hoặc không hợp lệ. Vào aistudio.google.com tạo key mới!';
      else if (e.message.includes('429') || e.message.includes('quota'))
        status.textContent='⚠️ Key đúng nhưng hết quota. Thử lại sau hoặc dùng key khác.';
      else
        status.textContent='❌ ' + e.message.slice(0,100);
      btn.innerHTML='🔑 Kiểm tra & Lưu'; btn.disabled=false;
    }
  };
  document.head.insertAdjacentHTML('beforeend','<style>@keyframes spin{to{transform:rotate(360deg)}}</style>');
  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('apiKeyInput')?.focus(), 100);
}
