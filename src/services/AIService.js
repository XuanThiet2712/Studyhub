const KEY_STORAGE = 'sh_gemini_key';
const MDL_STORAGE = 'sh_gemini_model';

// Ordered by availability on free tier - most reliable first
const MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.0-pro',
];

export class AIService {
  constructor() {
    this._key = localStorage.getItem(KEY_STORAGE)||'';
    this._mdl = localStorage.getItem(MDL_STORAGE)||null;
  }
  getKey()    { return this._key; }
  hasKey()    { return this._key.length>20; }
  setKey(k)   { this._key=k.trim(); localStorage.setItem(KEY_STORAGE,this._key); this._mdl=null; localStorage.removeItem(MDL_STORAGE); }
  clearKey()  { this._key=''; localStorage.removeItem(KEY_STORAGE); localStorage.removeItem(MDL_STORAGE); }
  getModel()  { return this._mdl||'(auto)'; }

  async call(systemPrompt, messages, maxTokens=1000) {
    if(!this.hasKey()) throw new Error('NO_KEY');
    const contents=[
      {role:'user',  parts:[{text:systemPrompt}]},
      {role:'model', parts:[{text:'OK.'}]},
      ...messages.map(m=>({
        role: m.role==='assistant'?'model':'user',
        parts:[{text:String(m.content||'')}]
      }))
    ];
    const body={contents,generationConfig:{maxOutputTokens:maxTokens,temperature:0.75}};

    // Try cached model first
    const order = this._mdl ? [this._mdl,...MODELS.filter(m=>m!==this._mdl)] : MODELS;
    let lastErr;

    for (const model of order) {
      try {
        const url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this._key}`;
        const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        const data=await res.json();

        if(data.error) {
          const code=data.error.code||0;
          const msg=data.error.message||'';
          // Invalid key — stop immediately
          if(code===400) throw new Error('KEY_INVALID: '+msg);
          // Quota/not found — try next model
          lastErr=new Error(msg||`HTTP ${code}`);
          continue;
        }

        const text=data.candidates?.[0]?.content?.parts?.[0]?.text||'';
        if(!text) { lastErr=new Error('Empty response'); continue; }

        // Cache this working model
        this._mdl=model;
        localStorage.setItem(MDL_STORAGE,model);
        return text;
      } catch(e) {
        if(e.message.startsWith('KEY_INVALID')) throw e;
        lastErr=e;
      }
    }
    throw lastErr||new Error('Tất cả model đều lỗi');
  }

  async ask(prompt,maxTokens=600) {
    return this.call('Trả lời ngắn gọn bằng tiếng Việt.',
      [{role:'user',content:prompt}], maxTokens);
  }
}
export const aiService=new AIService();

export function showAPIKeyModal(onSuccess) {
  document.getElementById('apiKeyModal')?.remove();
  const hasKey=aiService.hasKey();
  const mdl=aiService.getModel();
  const m=document.createElement('div');
  m.id='apiKeyModal';
  m.style.cssText='position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(10,14,30,0.55);backdrop-filter:blur(6px)';
  m.innerHTML=`
  <div style="background:#fff;border-radius:22px;padding:28px 26px;max-width:430px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,0.22),0 0 0 1px rgba(99,102,241,0.1);animation:kfUp .28s cubic-bezier(.34,1.5,.64,1)">
    <div style="text-align:center;margin-bottom:22px">
      <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#4f6ef7,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 11px;box-shadow:0 6px 20px rgba(79,110,247,.3)">🔑</div>
      <div style="font-size:18px;font-weight:800;color:#0f1526;margin-bottom:4px">${hasKey?'Đổi API Key':'Kết nối Gemini AI'}</div>
      <div style="font-size:12px;color:#6b7280">Key lưu riêng trên máy · Không ai khác xem được</div>
      ${hasKey?`<div style="margin-top:8px;font-size:11px;color:#10b981;background:#ecfdf5;padding:4px 12px;border-radius:99px;display:inline-block">✅ Model đang dùng: ${mdl}</div>`:''}
    </div>
    <div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1px solid #86efac;border-radius:12px;padding:12px 14px;margin-bottom:16px;font-size:12px;line-height:1.8;color:#166534">
      <strong>✅ Lấy key miễn phí tại Google AI Studio:</strong><br>
      1. Vào <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#1d4ed8;font-weight:700">aistudio.google.com/apikey</a><br>
      2. Đăng nhập Gmail → <strong>Create API key → New project</strong><br>
      3. Copy key bắt đầu bằng <code style="background:#dcfce7;border-radius:4px;padding:1px 5px">AIzaSy...</code>
    </div>
    <label style="font-size:11px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px">API Key</label>
    <div style="position:relative;margin-bottom:12px">
      <input id="akIn" type="password" placeholder="AIzaSy..."
        style="width:100%;padding:10px 40px 10px 12px;border:2px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:monospace;outline:none;transition:border .2s;color:#0f1526"
        value="${aiService.getKey()}"
        onfocus="this.style.borderColor='#6366f1'" onblur="this.style.borderColor='#e5e7eb'"
        onkeydown="if(event.key==='Enter')window._akSave()">
      <button onclick="const i=document.getElementById('akIn');i.type=i.type==='password'?'text':'password'"
        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:#9ca3af">👁</button>
    </div>
    <div id="akSt" style="display:none;border-radius:10px;padding:9px 12px;margin-bottom:12px;font-size:12px;font-weight:500;line-height:1.5"></div>
    <div style="display:flex;gap:8px">
      <button onclick="document.getElementById('apiKeyModal').remove()"
        style="flex:1;padding:10px;border:2px solid #e5e7eb;border-radius:10px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#374151">Hủy</button>
      <button id="akBtn" onclick="window._akSave()"
        style="flex:2;padding:10px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:13px;font-weight:700;box-shadow:0 4px 12px rgba(79,70,229,.3)">
        🔑 Kiểm tra & Lưu
      </button>
    </div>
    ${hasKey?`<div style="text-align:center;margin-top:10px"><button onclick="aiService.clearKey();document.getElementById('apiKeyModal').remove()" style="background:none;border:none;cursor:pointer;font-size:11px;color:#f43f5e">🗑 Xóa key hiện tại</button></div>`:''}
  </div>
  <style>@keyframes kfUp{from{opacity:0;transform:scale(.93)translateY(14px)}to{opacity:1;transform:scale(1)translateY(0)}}</style>`;

  m.addEventListener('click',e=>{if(e.target===m)m.remove();});

  window._akSave=async()=>{
    const key=document.getElementById('akIn')?.value?.trim();
    const btn=document.getElementById('akBtn'),st=document.getElementById('akSt');
    if(!key||key.length<20){
      st.style.cssText='display:block;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:500';
      st.textContent='❌ Key không hợp lệ (quá ngắn)'; return;
    }
    btn.innerHTML='<span style="display:inline-block;animation:spin .8s linear infinite">⏳</span> Đang test...';
    btn.disabled=true; st.style.display='none';
    const prev=aiService.getKey();
    try{
      aiService.setKey(key);
      const reply=await aiService.ask('Reply with just: CONNECTED',8);
      st.style.cssText='display:block;background:#f0fdf4;color:#15803d;border:1px solid #86efac;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:500';
      st.innerHTML=`✅ <strong>Thành công!</strong> Model: ${aiService.getModel()}`;
      btn.innerHTML='✅ Đã lưu!'; btn.style.background='#16a34a';
      setTimeout(()=>{m.remove();if(onSuccess)onSuccess();},1000);
    }catch(e){
      aiService.setKey(prev);
      st.style.cssText='display:block;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:500;line-height:1.6';
      if(e.message.includes('KEY_INVALID')||e.message.includes('400'))
        st.innerHTML='❌ <strong>Key sai.</strong> Tạo key mới tại <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#1d4ed8">aistudio.google.com/apikey</a>';
      else if(e.message.includes('quota')||e.message.includes('429'))
        st.innerHTML='⚠️ <strong>Key đúng nhưng hết quota.</strong> Đợi vài phút hoặc tạo key mới.';
      else st.innerHTML='❌ '+e.message.slice(0,120);
      btn.innerHTML='🔑 Kiểm tra & Lưu'; btn.disabled=false; btn.style.background='linear-gradient(135deg,#4f46e5,#7c3aed)';
    }
  };
  document.head.insertAdjacentHTML('beforeend','<style>@keyframes spin{to{transform:rotate(360deg)}}</style>');
  document.body.appendChild(m);
  setTimeout(()=>document.getElementById('akIn')?.focus(),80);
}
