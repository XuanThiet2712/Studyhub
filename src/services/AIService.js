const KEY_STORAGE = 'sh_gemini_key';
const MODEL_KEY   = 'sh_ai_model';

// Only use models confirmed available on v1beta free tier
// Note: gemini-1.5-flash is NOT available on all keys (region/project restricted)
// Use gemini-2.0-flash variants which are globally available
const MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-thinking-exp',
  'gemini-1.5-flash-latest',
];

export class AIService {
  constructor() {
    this._key   = localStorage.getItem(KEY_STORAGE) || '';
    this._model = localStorage.getItem(MODEL_KEY) || null;
  }
  getKey()   { return this._key; }
  hasKey()   { return this._key.length > 20; }
  setKey(k)  { this._key=k.trim(); localStorage.setItem(KEY_STORAGE,this._key); this._model=null; localStorage.removeItem(MODEL_KEY); }
  clearKey() { this._key=''; localStorage.removeItem(KEY_STORAGE); localStorage.removeItem(MODEL_KEY); }

  async call(systemPrompt, messages, maxTokens=1000) {
    if (!this.hasKey()) throw new Error('NO_KEY');
    const contents=[
      {role:'user',  parts:[{text: systemPrompt}]},
      {role:'model', parts:[{text:'OK.'}]},
      ...messages.map(m=>({role:m.role==='assistant'?'model':'user', parts:[{text:String(m.content||'')}]}))
    ];
    const body={contents, generationConfig:{maxOutputTokens:maxTokens, temperature:0.75}};
    const order=this._model ? [this._model,...MODELS.filter(m=>m!==this._model)] : MODELS;
    let lastErr;
    for (const model of order) {
      try {
        const url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this._key}`;
        const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        const data=await res.json();
        if (data.error) {
          const code=data.error.code, msg=data.error.message||'';
          if (code===400 && (msg.includes('API_KEY_INVALID')||msg.includes('invalid'))) throw new Error('KEY_INVALID');
          // skip on quota/not-found
          lastErr=new Error(msg); continue;
        }
        const text=data.candidates?.[0]?.content?.parts?.[0]?.text||'';
        if (!text) { lastErr=new Error('Empty response'); continue; }
        // Cache working model
        this._model=model; localStorage.setItem(MODEL_KEY,model);
        return text;
      } catch(e) {
        if (e.message==='KEY_INVALID') throw e;
        lastErr=e;
      }
    }
    throw lastErr||new Error('Không có model nào hoạt động');
  }

  async ask(prompt, maxTokens=800) {
    return this.call('Trả lời ngắn gọn bằng tiếng Việt.', [{role:'user',content:prompt}], maxTokens);
  }
}
export const aiService=new AIService();

export function showAPIKeyModal(onSuccess) {
  document.getElementById('apiKeyModal')?.remove();
  const modal=document.createElement('div');
  modal.id='apiKeyModal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(15,20,40,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(6px)';
  modal.innerHTML=`
    <div style="background:#fff;border-radius:20px;padding:28px;max-width:440px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,0.22);animation:kfUp .28s cubic-bezier(.34,1.5,.64,1)">
      <div style="text-align:center;margin-bottom:20px">
        <div style="width:58px;height:58px;border-radius:16px;background:linear-gradient(135deg,#4f6ef7,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 11px;box-shadow:0 6px 20px rgba(79,110,247,.35)">🔑</div>
        <div style="font-size:18px;font-weight:800;color:#111;margin-bottom:4px">Cấu hình Gemini AI</div>
        <div style="font-size:12px;color:#6b7280">Key lưu trên máy · Hoàn toàn riêng tư</div>
      </div>
      <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:13px;margin-bottom:16px;font-size:12px;line-height:1.75;color:#166534">
        <strong>✅ Lấy API Key MIỄN PHÍ:</strong><br>
        1. Vào <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#1d4ed8;font-weight:700">aistudio.google.com/apikey</a><br>
        2. Gmail → <strong>Create API key in new project</strong><br>
        3. Copy key <code style="background:#dcfce7;padding:1px 5px;border-radius:4px">AIzaSy...</code> → dán vào đây
      </div>
      <label style="font-size:12px;font-weight:700;color:#374151;display:block;margin-bottom:5px">Gemini API Key</label>
      <div style="position:relative;margin-bottom:12px">
        <input id="akInput" type="password" placeholder="AIzaSy..."
          style="width:100%;padding:10px 40px 10px 12px;border:2px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:monospace;outline:none"
          value="${aiService.getKey()}"
          onfocus="this.style.borderColor='#6366f1'" onblur="this.style.borderColor='#e5e7eb'">
        <button onclick="const i=document.getElementById('akInput');i.type=i.type==='password'?'text':'password'"
          style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:#9ca3af">👁</button>
      </div>
      <div id="akStatus" style="display:none;border-radius:10px;padding:9px 12px;margin-bottom:12px;font-size:12px;font-weight:500;line-height:1.5"></div>
      <div style="display:flex;gap:8px;margin-bottom:${aiService.hasKey()?'8px':'0'}">
        <button onclick="document.getElementById('apiKeyModal').remove()"
          style="flex:1;padding:10px;border:2px solid #e5e7eb;border-radius:10px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#374151">Hủy</button>
        <button onclick="window._doSave()" id="akSaveBtn"
          style="flex:2;padding:10px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:13px;font-weight:700">
          🔑 Kiểm tra & Lưu
        </button>
      </div>
      ${aiService.hasKey()?`<div style="text-align:center"><button onclick="aiService.clearKey();document.getElementById('apiKeyModal').remove()"
        style="background:none;border:none;cursor:pointer;font-size:11px;color:#ef4444">🗑 Xóa key</button></div>`:''}
    </div>
    <style>@keyframes kfUp{from{opacity:0;transform:scale(.93)translateY(14px)}to{opacity:1;transform:scale(1)translateY(0)}}</style>`;
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  window._doSave=async()=>{
    const key=document.getElementById('akInput').value.trim();
    const btn=document.getElementById('akSaveBtn'),st=document.getElementById('akStatus');
    if(key.length<20){st.style.display='block';st.style.background='#fef2f2';st.style.color='#dc2626';st.textContent='❌ Key quá ngắn';return;}
    btn.textContent='⏳ Đang kiểm tra...';btn.disabled=true;st.style.display='none';
    const prev=aiService.getKey();
    try{
      aiService.setKey(key);
      const r=await aiService.ask('Nói "OK" thôi.',8);
      st.style.display='block';st.style.background='#f0fdf4';st.style.color='#15803d';
      st.innerHTML=`✅ <strong>Key OK!</strong> AI phản hồi: "${r.slice(0,30)}"`;
      btn.textContent='✅ Đã lưu!';btn.style.background='#16a34a';
      setTimeout(()=>{modal.remove();if(onSuccess)onSuccess();},1000);
    }catch(e){
      aiService.setKey(prev);
      st.style.display='block';st.style.background='#fef2f2';st.style.color='#dc2626';
      if(e.message==='KEY_INVALID')st.innerHTML='❌ <strong>Key sai.</strong> Tạo key mới tại <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#1d4ed8">đây</a>';
      else if(e.message.includes('quota')||e.message.includes('429'))st.innerHTML='⚠️ <strong>Key đúng nhưng hết quota.</strong> Thử lại sau hoặc tạo key khác.';
      else st.innerHTML='❌ '+e.message.slice(0,100);
      btn.textContent='🔑 Kiểm tra & Lưu';btn.disabled=false;btn.style.background='linear-gradient(135deg,#4f46e5,#7c3aed)';
    }
  };
  document.body.appendChild(modal);
  setTimeout(()=>document.getElementById('akInput')?.focus(),80);
}
