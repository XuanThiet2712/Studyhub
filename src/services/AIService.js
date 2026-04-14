/**
 * AIService — Quản lý API key cá nhân + gọi AI (Gemini free)
 * Mỗi user lưu key riêng vào localStorage, không chia sẻ.
 */

const KEY_STORAGE = 'sh_gemini_key';
const MODEL_CANDIDATES = [
  { api:'v1beta', model:'gemini-2.0-flash' },
  { api:'v1beta', model:'gemini-2.0-flash-lite' },
  { api:'v1',     model:'gemini-1.5-flash' },
  { api:'v1',     model:'gemini-1.5-flash-8b' },
];

export class AIService {
  constructor() {
    this._key = localStorage.getItem(KEY_STORAGE) || '';
    this._modelIdx = 0;
  }

  getKey()       { return this._key; }
  hasKey()       { return !!this._key && this._key.length > 10; }
  setKey(k)      { this._key = k.trim(); localStorage.setItem(KEY_STORAGE, this._key); }
  clearKey()     { this._key = ''; localStorage.removeItem(KEY_STORAGE); }

  async call(systemPrompt, messages, maxTokens = 1000) {
    if (!this.hasKey()) throw new Error('NO_KEY');
    const contents = [
      { role:'user',  parts:[{ text: systemPrompt }] },
      { role:'model', parts:[{ text: 'Đã hiểu. Tôi sẵn sàng hỗ trợ.' }] },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts:[{ text: m.content }]
      }))
    ];
    const body = { contents, generationConfig:{ maxOutputTokens: maxTokens, temperature: 0.75 } };
    let lastErr;
    for (const { api, model } of MODEL_CANDIDATES) {
      try {
        const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${this._key}`;
        const res  = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) {
          const msg = data?.error?.message || `HTTP ${res.status}`;
          if (res.status===429||res.status===404||msg.includes('quota')||msg.includes('not found')) { lastErr=new Error(msg); continue; }
          throw new Error(msg);
        }
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch(e) {
        lastErr = e;
        if (e.message?.includes('quota')||e.message?.includes('not found')||e.message?.includes('429')) continue;
        throw e;
      }
    }
    throw lastErr || new Error('Tất cả model đều lỗi');
  }

  // Shortcut for single-turn
  async ask(prompt, maxTokens = 800) {
    return this.call('Bạn là AI assistant hữu ích. Trả lời ngắn gọn, chính xác.', [{ role:'user', content: prompt }], maxTokens);
  }
}

// Singleton
export const aiService = new AIService();

/**
 * Render modal để nhập/thay API key
 */
export function showAPIKeyModal(onSuccess) {
  const existing = document.getElementById('apiKeyModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'apiKeyModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)';
  modal.innerHTML = `
    <div style="background:white;border-radius:24px;padding:32px;max-width:480px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.3);animation:slideUp .3s ease">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:48px;margin-bottom:12px">🔑</div>
        <div style="font-size:20px;font-weight:800;margin-bottom:6px">Cấu hình AI của bạn</div>
        <div style="font-size:13px;color:#8896a5;line-height:1.6">Mỗi người dùng có API key riêng. Key được lưu trên máy bạn, không chia sẻ với ai.</div>
      </div>

      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:14px;margin-bottom:20px;font-size:12px;line-height:1.7">
        <div style="font-weight:700;color:#15803d;margin-bottom:6px">✅ Cách lấy Gemini API key MIỄN PHÍ:</div>
        <div style="color:#166534">
          1. Truy cập <a href="https://aistudio.google.com" target="_blank" style="color:#2563eb;font-weight:600">aistudio.google.com</a><br>
          2. Đăng nhập bằng Gmail<br>
          3. Nhấn <strong>Get API Key</strong> → <strong>Create API key</strong><br>
          4. Copy key và dán vào ô dưới
        </div>
      </div>

      <div style="margin-bottom:16px">
        <label style="font-size:12px;font-weight:700;color:#374151;display:block;margin-bottom:6px">Gemini API Key của bạn</label>
        <div style="position:relative">
          <input id="apiKeyInput" type="password" placeholder="AIzaSy..." 
            style="width:100%;padding:12px 44px 12px 14px;border:2px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:monospace;outline:none;transition:border .2s"
            value="${aiService.getKey()}"
            onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e5e7eb'">
          <button onclick="const i=document.getElementById('apiKeyInput');i.type=i.type==='password'?'text':'password'" 
            style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px">👁</button>
        </div>
      </div>

      <div id="apiKeyStatus" style="margin-bottom:16px;font-size:12px;display:none"></div>

      <div style="display:flex;gap:10px">
        <button onclick="document.getElementById('apiKeyModal').remove()" 
          style="flex:1;padding:12px;border:2px solid #e5e7eb;border-radius:10px;background:transparent;cursor:pointer;font-size:14px;font-weight:600">Hủy</button>
        <button onclick="window._testAndSaveKey()" id="apiKeySaveBtn"
          style="flex:2;padding:12px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:700">
          🔑 Kiểm tra & Lưu key
        </button>
      </div>

      ${aiService.hasKey() ? `<div style="text-align:center;margin-top:12px">
        <button onclick="aiService.clearKey();document.getElementById('apiKeyModal').remove()" 
          style="background:none;border:none;cursor:pointer;font-size:12px;color:#ef4444">🗑 Xóa key hiện tại</button>
      </div>` : ''}
    </div>
    <style>@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}</style>`;

  window._testAndSaveKey = async () => {
    const key = document.getElementById('apiKeyInput').value.trim();
    const btn = document.getElementById('apiKeySaveBtn');
    const status = document.getElementById('apiKeyStatus');
    if (!key || key.length < 10) { status.style.display='block'; status.style.color='#ef4444'; status.textContent='❌ Key không hợp lệ!'; return; }
    btn.textContent = '⏳ Đang kiểm tra...'; btn.disabled = true;
    status.style.display = 'none';
    try {
      aiService.setKey(key);
      await aiService.ask('Trả lời "OK" thôi.', 10);
      status.style.display='block'; status.style.color='#16a34a'; status.textContent='✅ Key hợp lệ! Đã lưu thành công.';
      btn.textContent='✅ Đã lưu!';
      setTimeout(() => { modal.remove(); if(onSuccess) onSuccess(); }, 1200);
    } catch(e) {
      aiService.clearKey();
      status.style.display='block'; status.style.color='#ef4444';
      status.textContent = e.message?.includes('API_KEY_INVALID')||e.message?.includes('400') ? '❌ Key sai hoặc không hợp lệ. Kiểm tra lại!' : `❌ Lỗi: ${e.message}`;
      btn.textContent='🔑 Kiểm tra & Lưu key'; btn.disabled=false;
    }
  };

  document.body.appendChild(modal);
}
