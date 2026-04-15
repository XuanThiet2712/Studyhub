/**
 * AIService v3 — Triệt để fix model endpoints
 * Chỉ dùng v1beta, chỉ các model flash (không cần special access)
 */
const KEY_STORAGE = 'sh_gemini_key';

// Models guaranteed to work on free tier with v1beta
// gemini-1.5-pro requires special project access → REMOVED
const MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
];

export class AIService {
  constructor() {
    this._key = localStorage.getItem(KEY_STORAGE) || '';
    this._workingModel = localStorage.getItem('sh_ai_model') || null;
  }
  getKey()   { return this._key; }
  hasKey()   { return this._key.length > 20; }
  setKey(k)  { this._key = k.trim(); localStorage.setItem(KEY_STORAGE, this._key); this._workingModel = null; }
  clearKey() { this._key = ''; localStorage.removeItem(KEY_STORAGE); localStorage.removeItem('sh_ai_model'); }

  async call(systemPrompt, messages, maxTokens = 1000) {
    if (!this.hasKey()) throw new Error('NO_KEY');
    const contents = [
      { role: 'user',  parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'OK.' }] },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content || '') }]
      }))
    ];
    const body = { contents, generationConfig: { maxOutputTokens: maxTokens, temperature: 0.75 } };

    // Try cached working model first
    const tryOrder = this._workingModel
      ? [this._workingModel, ...MODELS.filter(m => m !== this._workingModel)]
      : MODELS;

    let lastErr;
    for (const model of tryOrder) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this._key}`;
        const res  = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.error) {
          const code = data.error.code;
          const msg  = data.error.message || '';
          // Invalid key — stop immediately, don't try other models
          if (code === 400 && (msg.includes('API_KEY_INVALID') || msg.includes('invalid'))) {
            throw new Error('KEY_INVALID:' + msg);
          }
          // Not found / quota — try next model
          if (code === 404 || code === 429 || msg.includes('not found') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
            lastErr = new Error(msg);
            if (this._workingModel === model) this._workingModel = null;
            continue;
          }
          throw new Error(msg || `HTTP ${code}`);
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) { lastErr = new Error('Empty AI response'); continue; }

        // Cache the working model
        this._workingModel = model;
        localStorage.setItem('sh_ai_model', model);
        return text;
      } catch(e) {
        if (e.message.startsWith('KEY_INVALID')) throw e;
        lastErr = e;
      }
    }
    throw lastErr || new Error('Không có model nào hoạt động. Kiểm tra API key tại aistudio.google.com');
  }

  async ask(prompt, maxTokens = 800) {
    return this.call('Trả lời ngắn gọn, chính xác.', [{ role: 'user', content: prompt }], maxTokens);
  }
}

export const aiService = new AIService();

export function showAPIKeyModal(onSuccess) {
  document.getElementById('apiKeyModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'apiKeyModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(6px)';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:22px;padding:28px;max-width:450px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,0.3);animation:kfUp .3s cubic-bezier(.34,1.56,.64,1)">
      <div style="text-align:center;margin-bottom:22px">
        <div style="width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 12px;box-shadow:0 8px 24px rgba(99,102,241,0.35)">🔑</div>
        <div style="font-size:18px;font-weight:800;margin-bottom:5px">Cấu hình Gemini AI</div>
        <div style="font-size:12px;color:#64748b">Key lưu trên máy bạn · Hoàn toàn riêng tư</div>
      </div>

      <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:14px;margin-bottom:18px;font-size:12px;line-height:1.8">
        <strong style="color:#15803d">✅ Lấy API Key MIỄN PHÍ:</strong><br>
        1. Vào <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#2563eb;font-weight:700;text-decoration:none">aistudio.google.com/apikey</a><br>
        2. Đăng nhập Gmail → <strong>Create API key in new project</strong><br>
        3. Copy key bắt đầu bằng <code style="background:#e5e7eb;padding:1px 5px;border-radius:4px">AIzaSy...</code> → dán vào đây
      </div>

      <div style="margin-bottom:14px">
        <label style="font-size:12px;font-weight:700;color:#374151;display:block;margin-bottom:6px">Gemini API Key</label>
        <div style="position:relative">
          <input id="apiKeyInput" type="password" placeholder="AIzaSy..."
            style="width:100%;padding:11px 42px 11px 13px;border:2px solid #e2e8f0;border-radius:10px;font-size:13px;font-family:monospace;outline:none;transition:border-color .2s"
            value="${aiService.getKey()}"
            onfocus="this.style.borderColor='#6366f1'" onblur="this.style.borderColor='#e2e8f0'">
          <button onclick="const i=document.getElementById('apiKeyInput');i.type=i.type==='password'?'text':'password'"
            style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;color:#6b7280">👁</button>
        </div>
      </div>

      <div id="apiKeyStatus" style="display:none;border-radius:10px;padding:10px 13px;margin-bottom:14px;font-size:12px;font-weight:500;line-height:1.5"></div>

      <div style="display:flex;gap:8px;margin-bottom:${aiService.hasKey()?'8px':'0'}">
        <button onclick="document.getElementById('apiKeyModal').remove()"
          style="flex:1;padding:11px;border:2px solid #e2e8f0;border-radius:10px;background:transparent;cursor:pointer;font-size:13px;font-weight:600;color:#374151;transition:border-color .2s"
          onmouseover="this.style.borderColor='#94a3b8'" onmouseout="this.style.borderColor='#e2e8f0'">Hủy</button>
        <button onclick="window._doSaveKey()" id="apiKeySaveBtn"
          style="flex:2;padding:11px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;border:none;border-radius:10px;cursor:pointer;font-size:13px;font-weight:700;box-shadow:0 4px 14px rgba(99,102,241,0.4);transition:filter .2s"
          onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter=''">
          🔑 Kiểm tra & Lưu
        </button>
      </div>
      ${aiService.hasKey() ? `<div style="text-align:center"><button onclick="aiService.clearKey();document.getElementById('apiKeyModal').remove()"
        style="background:none;border:none;cursor:pointer;font-size:11px;color:#ef4444;padding:4px">🗑 Xóa key hiện tại</button></div>` : ''}
    </div>
    <style>@keyframes kfUp{from{opacity:0;transform:scale(.93) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}</style>`;

  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  window._doSaveKey = async () => {
    const key = document.getElementById('apiKeyInput').value.trim();
    const btn = document.getElementById('apiKeySaveBtn');
    const status = document.getElementById('apiKeyStatus');
    if (key.length < 20) {
      status.style.display = 'block'; status.style.background = '#fef2f2'; status.style.color = '#dc2626';
      status.textContent = '❌ Key quá ngắn. Key Gemini thường bắt đầu bằng "AIzaSy..." và dài ~39 ký tự'; return;
    }
    btn.textContent = '⏳ Đang kiểm tra...'; btn.disabled = true; status.style.display = 'none';
    const prev = aiService.getKey();
    try {
      aiService.setKey(key);
      const reply = await aiService.ask('Nói "Xin chào!" thôi.', 10);
      status.style.display = 'block'; status.style.background = '#f0fdf4'; status.style.color = '#15803d';
      status.innerHTML = `✅ <strong>Key hợp lệ!</strong> AI đã trả lời: "${reply.slice(0,40)}"`;
      btn.textContent = '✅ Đã lưu!'; btn.style.background = '#16a34a';
      setTimeout(() => { modal.remove(); if (onSuccess) onSuccess(); }, 1200);
    } catch(e) {
      aiService.setKey(prev);
      status.style.display = 'block'; status.style.background = '#fef2f2'; status.style.color = '#dc2626';
      if (e.message.includes('KEY_INVALID') || e.message.includes('400'))
        status.innerHTML = '❌ <strong>Key sai hoặc không hợp lệ.</strong><br>Hãy tạo key mới tại <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#2563eb">aistudio.google.com/apikey</a>';
      else if (e.message.includes('quota') || e.message.includes('429'))
        status.innerHTML = '⚠️ <strong>Key đúng nhưng hết quota miễn phí.</strong><br>Thử lại sau hoặc tạo key mới ở project khác.';
      else
        status.innerHTML = '❌ ' + e.message.slice(0, 120);
      btn.textContent = '🔑 Kiểm tra & Lưu'; btn.disabled = false;
      btn.style.background = 'linear-gradient(135deg,#4f46e5,#7c3aed)';
    }
  };

  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('apiKeyInput')?.focus(), 100);
}
