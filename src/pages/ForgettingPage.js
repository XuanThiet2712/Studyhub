import { Toast } from '../components/index.js';

export class ForgettingPage {
  constructor(db, store, bus) { this.db=db; this.store=store; this.bus=bus; this._topics=[]; this._ctx=null; }

  render() {
    document.querySelector('.main').innerHTML = `
    <div class="page">
      <div class="page-header-row page-header">
        <div><h1 class="page-title">🧠 Đường cong lãng quên</h1><p class="page-sub">Ebbinghaus · Ôn đúng lúc = nhớ mãi · Dữ liệu lưu Supabase</p></div>
        <button class="btn btn-primary" onclick="forgPage.openAdd()">＋ Thêm chủ đề</button>
      </div>
      <div style="background:linear-gradient(135deg,var(--blue-l),var(--purple-l));border:1px solid rgba(59,130,246,.2);border-radius:var(--r-lg);padding:14px 18px;margin-bottom:22px;font-size:13px;line-height:1.8">
        🧬 Sau <strong>1 ngày</strong> không ôn → quên <strong style="color:var(--red)">56%</strong>. Sau <strong>1 tuần</strong> → quên <strong style="color:var(--red)">77%</strong>. Ôn đúng thời điểm → đường cong "reset" → nhớ lâu hơn. <em style="color:var(--orange)">"Just do it first!"</em>
      </div>
      <div class="tabs">
        <button class="tab active" onclick="forgPage.sw('curve',this)">📈 Đường cong</button>
        <button class="tab" onclick="forgPage.sw('topics',this)">📚 Chủ đề</button>
        <button class="tab" onclick="forgPage.sw('schedule',this)">📅 Lịch ôn</button>
      </div>
      <div id="fp-curve">
        <div style="display:grid;grid-template-columns:1fr 280px;gap:20px">
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px;box-shadow:var(--shadow-sm)">
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:14px">
              <label style="font-size:12px;color:var(--muted);font-family:var(--mono)">Số lần ôn:</label>
              <input type="range" id="revSlider" min="0" max="6" value="0" oninput="forgPage.draw()" style="flex:1;max-width:200px">
              <span style="font-family:var(--mono);font-size:13px;color:var(--blue)" id="revVal">0 lần</span>
              <label style="font-size:12px;color:var(--muted);font-family:var(--mono)">Ngày xem:</label>
              <input type="range" id="dayRange" min="7" max="60" value="30" oninput="forgPage.draw()" style="flex:1;max-width:160px">
              <span style="font-family:var(--mono);font-size:12px;color:var(--muted)" id="dayVal">30d</span>
            </div>
            <canvas id="fCanvas" height="280" style="display:block;width:100%;border-radius:var(--r-sm)"></canvas>
            <div style="display:flex;gap:14px;margin-top:10px;flex-wrap:wrap">
              <span style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:4px"><span style="width:20px;height:2px;background:rgba(239,68,68,.6);display:inline-block"></span>Không ôn</span>
              <span style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:4px"><span style="width:20px;height:2px;background:var(--blue);display:inline-block"></span>1-2 lần</span>
              <span style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:4px"><span style="width:20px;height:2px;background:var(--green);display:inline-block"></span>3+ lần</span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="card">
              <div class="card-title">🧮 Tính mức ghi nhớ</div>
              <div class="form-group"><label class="form-label">Số ngày từ lúc học</label><input class="form-input" type="number" id="calcD" value="3" min="0" oninput="forgPage.calc()"></div>
              <div class="form-group"><label class="form-label">Số lần đã ôn</label><input class="form-input" type="number" id="calcR" value="0" min="0" oninput="forgPage.calc()"></div>
              <div style="text-align:center;padding:10px 0"><div style="font-family:var(--serif);font-style:italic;font-size:44px;font-weight:700" id="calcOut">58%</div><div style="font-size:12px;color:var(--muted)" id="calcLbl">⚠️ Bắt đầu quên</div></div>
              <div class="prog-track"><div class="prog-fill" id="calcBar" style="width:58%;background:var(--orange)"></div></div>
            </div>
            <div class="card">
              <div class="card-title">📅 Lịch ôn tối ưu</div>
              ${[1,3,7,14,30,60].map((d,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px"><div style="width:50px;color:var(--muted);font-family:var(--mono)">+${d}d</div><div style="flex:1;background:var(--bg3);border-radius:99px;height:4px"><div style="width:${74+i*4}%;background:var(--green);height:100%;border-radius:99px"></div></div><div style="font-family:var(--mono);color:var(--green);font-size:11px">${74+i*4}%</div></div>`).join('')}
            </div>
          </div>
        </div>
      </div>
      <div id="fp-topics" style="display:none"><div class="grid-auto" id="topicGrid"></div><div class="empty" id="topicEmpty" style="display:none"><div class="empty-icon">📚</div><div class="empty-text">Chưa có chủ đề</div></div></div>
      <div id="fp-schedule" style="display:none"><div id="schedGrid"></div></div>
    </div>
    <div class="modal-overlay" id="addTopicModal"><div class="modal modal-sm">
      <div class="modal-title">＋ Thêm chủ đề ôn tập</div>
      <div class="form-group"><label class="form-label">Tên chủ đề *</label><input class="form-input" id="tName" placeholder="VD: Toán C5 - Tích phân"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Môn học</label><input class="form-input" id="tSubj" placeholder="Toán học"></div><div class="form-group"><label class="form-label">Ngày học</label><input class="form-input" type="date" id="tDate"></div></div>
      <div class="form-group"><label class="form-label">Ghi chú</label><textarea class="form-textarea" id="tNote" rows="2"></textarea></div>
      <div class="modal-footer"><button class="btn btn-ghost" onclick="document.getElementById('addTopicModal').classList.remove('open')">Hủy</button><button class="btn btn-primary" onclick="forgPage.saveTopic()">💾 Lưu</button></div>
    </div></div>`;
    window.forgPage=this;
    document.getElementById('tDate').valueAsDate=new Date();
    this.loadTopics();
    setTimeout(()=>{ this.initCanvas(); this.calc(); },80);
    window.addEventListener('resize',()=>this.draw());
  }

  sw(tab,btn) { ['curve','topics','schedule'].forEach(t=>document.getElementById('fp-'+t).style.display='none'); document.getElementById('fp-'+tab).style.display='block'; document.querySelectorAll('.tabs .tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); if(tab==='topics')this.renderTopics(); if(tab==='schedule')this.renderSchedule(); if(tab==='curve')setTimeout(()=>this.initCanvas(),80); }
  openAdd() { document.getElementById('addTopicModal').classList.add('open'); }

  R(t,r=0){const S=[1.5,3,7,14,28,56,112][Math.min(r,6)];return Math.max(0,Math.exp(-Math.max(0,t)/S)*100);}
  effR(t,rc){const SRS=[1,3,7,14,30,60];const pr=SRS.slice(0,rc).filter(d=>d<=t);const lr=pr.slice(-1)[0]||0;return this.R(t-lr,pr.length);}

  initCanvas(){
    const c=document.getElementById('fCanvas');if(!c)return;
    this._ctx=c.getContext('2d');this.draw();
  }
  draw(){
    const c=document.getElementById('fCanvas');if(!c||!this._ctx)return;
    const dpr=window.devicePixelRatio||1,W=c.clientWidth,H=280;
    c.width=W*dpr;c.height=H*dpr;this._ctx.scale(dpr,dpr);
    const rev=parseInt(document.getElementById('revSlider')?.value||0);
    const DAYS=parseInt(document.getElementById('dayRange')?.value||30);
    document.getElementById('revVal').textContent=rev+' lần';
    document.getElementById('dayVal').textContent=DAYS+'d';
    const ctx=this._ctx,PAD={l:40,r:12,t:12,b:28},CW=W-PAD.l-PAD.r,CH=H-PAD.t-PAD.b;
    ctx.clearRect(0,0,W,H);
    [0,25,50,75,100].forEach(p=>{const y=PAD.t+CH-(p/100)*CH;ctx.strokeStyle='rgba(0,0,0,0.05)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(PAD.l,y);ctx.lineTo(PAD.l+CW,y);ctx.stroke();ctx.fillStyle='rgba(100,116,139,0.7)';ctx.font='10px JetBrains Mono,monospace';ctx.textAlign='right';ctx.fillText(p+'%',PAD.l-4,y+3);});
    [0,7,14,21,30,45,60].filter(d=>d<=DAYS).forEach(d=>{const x=PAD.l+(d/DAYS)*CW;ctx.strokeStyle='rgba(0,0,0,0.05)';ctx.beginPath();ctx.moveTo(x,PAD.t);ctx.lineTo(x,PAD.t+CH);ctx.stroke();ctx.fillStyle='rgba(100,116,139,0.7)';ctx.textAlign='center';ctx.fillText(d+'d',x,PAD.t+CH+16);});
    const dy=PAD.t+CH-0.4*CH;ctx.setLineDash([5,4]);ctx.strokeStyle='rgba(139,92,246,0.4)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(PAD.l,dy);ctx.lineTo(PAD.l+CW,dy);ctx.stroke();ctx.setLineDash([]);
    const drawL=(rc,sc,fc,lw)=>{const pts=[];for(let i=0;i<=400;i++){const t=i/400*DAYS;pts.push([PAD.l+(t/DAYS)*CW,PAD.t+CH-(this.effR(t,rc)/100)*CH]);}
      if(fc){ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.lineTo(PAD.l+CW,PAD.t+CH);ctx.lineTo(PAD.l,PAD.t+CH);ctx.closePath();ctx.fillStyle=fc;ctx.fill();}
      ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=sc;ctx.lineWidth=lw;ctx.stroke();};
    drawL(0,'rgba(239,68,68,0.5)','rgba(239,68,68,0.04)',1.5);
    if(rev>0){const c2=rev<3?'rgba(59,130,246,0.9)':'rgba(34,197,94,0.9)',f2=rev<3?'rgba(59,130,246,0.06)':'rgba(34,197,94,0.06)';drawL(rev,c2,f2,2.5);
      const SRS=[1,3,7,14,30,60];ctx.save();ctx.translate(PAD.l,PAD.t);
      SRS.slice(0,rev).forEach((d,i)=>{if(d>DAYS)return;const pb=SRS.slice(0,i).filter(x=>x<=d);const lb=pb.slice(-1)[0]||0;const r=this.R(d-lb,i);const x=(d/DAYS)*CW,y=CH-(r/100)*CH;
        const g=ctx.createRadialGradient(x,y,0,x,y,10);g.addColorStop(0,'rgba(34,197,94,0.4)');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle='#22c55e';ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle='rgba(34,197,94,.9)';ctx.font='bold 9px JetBrains Mono,monospace';ctx.textAlign='center';ctx.fillText('R'+(i+1),x,y-11);});
      ctx.restore();}
  }
  calc(){const d=parseInt(document.getElementById('calcD')?.value||0);const r=parseInt(document.getElementById('calcR')?.value||0);const pct=Math.round(this.effR(d,r));const c=pct>70?'var(--green)':pct>40?'var(--orange)':'var(--red)';const l=pct>80?'✅ Còn nhớ tốt':pct>60?'👍 Ổn':pct>40?'⚠️ Bắt đầu quên':pct>20?'❌ Quên nhiều':'💀 Quên gần hết';document.getElementById('calcOut').textContent=pct+'%';document.getElementById('calcOut').style.color=c;document.getElementById('calcLbl').textContent=l;document.getElementById('calcBar').style.width=pct+'%';document.getElementById('calcBar').style.background=c;}

  async loadTopics(){const u=this.store.get('currentUser');try{const rows=await this.db.select('forgetting_topics',{eq:{user_id:u.id},order:{col:'created_at',asc:false}});this._topics=rows;}catch(e){console.error(e);}this.renderTopics();this.renderSchedule();}
  renderTopics(){
    const el=document.getElementById('topicGrid'),em=document.getElementById('topicEmpty');if(!el)return;
    if(!this._topics.length){el.innerHTML='';em.style.display='block';return;}em.style.display='none';
    const SRS=[1,3,7,14,30,60];
    el.innerHTML=this._topics.map(t=>{
      const studied=new Date(t.studied_at).getTime(),done=t.review_count||0,now=Date.now();
      const days=(now-studied)/86400000,lr=SRS.slice(0,done).slice(-1)[0]||0;
      const pct=Math.round(this.effR(days-lr,done)),nd=SRS[done],ndate=nd?studied+nd*86400000:null;
      const dl=ndate?Math.ceil((ndate-now)/86400000):null,over=dl!==null&&dl<=0&&done<SRS.length;
      const c=pct>70?'var(--green)':pct>40?'var(--orange)':'var(--red)';
      return `<div class="card" style="border-color:${over?'rgba(249,115,22,.4)':'var(--border)'}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div><div style="font-size:15px;font-weight:600">${t.name}</div><div style="font-size:11px;color:var(--muted);font-family:var(--mono)">${t.subject||'Chung'}</div></div>
          ${over?'<span class="badge badge-orange">⏰ Ôn ngay!</span>':dl?`<span class="badge badge-blue">${dl}d nữa</span>`:'<span class="badge badge-green">✅</span>'}
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <div style="text-align:center;min-width:54px"><div style="font-family:var(--serif);font-style:italic;font-size:26px;font-weight:700;color:${c}">${pct}%</div><div style="font-size:10px;color:var(--muted)">còn nhớ</div></div>
          <div style="flex:1"><div class="prog-track"><div class="prog-fill" style="width:${pct}%;background:${c}"></div></div><div style="font-size:11px;color:var(--muted);font-family:var(--mono);margin-top:4px">${done}/${SRS.length} lần ôn</div><div style="display:flex;gap:3px;margin-top:5px">${SRS.map((_,i)=>`<div style="flex:1;height:4px;border-radius:99px;background:${i<done?'var(--green)':i===done?'var(--orange)':'var(--bg3)'}"></div>`).join('')}</div></div>
        </div>
        ${t.note?`<div style="font-size:12px;color:var(--muted);border-left:2px solid var(--border2);padding-left:8px;font-style:italic;margin-bottom:8px">${t.note}</div>`:''}
        <div style="display:flex;gap:6px">${over&&done<SRS.length?`<button class="btn btn-success btn-sm" onclick="forgPage.markReview('${t.id}')">✅ Đã ôn</button>`:''}<button class="btn btn-danger btn-sm" onclick="forgPage.del('${t.id}')">🗑</button></div>
      </div>`;}).join('');}
  renderSchedule(){const el=document.getElementById('schedGrid');if(!el)return;const SRS=[1,3,7,14,30,60],SRL=['1 ngày','3 ngày','7 ngày','2 tuần','1 tháng','2 tháng'];const sorted=[...this._topics].map(t=>{const studied=new Date(t.studied_at).getTime(),done=t.review_count||0,now=Date.now();const days=(now-studied)/86400000,lr=SRS.slice(0,done).slice(-1)[0]||0;const pct=Math.round(this.effR(days-lr,done));const nd=SRS[done],ndate=nd?studied+nd*86400000:null;const dl=ndate?Math.ceil((ndate-now)/86400000):null,over=dl!==null&&dl<=0&&done<SRS.length;return{t,pct,dl,over,done};}).filter(x=>x.done<SRS.length).sort((a,b)=>{if(a.over&&!b.over)return -1;if(!a.over&&b.over)return 1;return(a.dl||999)-(b.dl||999);});
    if(!sorted.length){el.innerHTML='<div class="empty"><div class="empty-icon">🎉</div><div class="empty-text">Không có gì cần ôn!</div></div>';return;}
    el.innerHTML=sorted.map(({t,pct,dl,over})=>{const c=pct>70?'var(--green)':pct>40?'var(--orange)':'var(--red)';const when=over?'🔴 QUÁ HẠN':dl===0?'🟡 HÔM NAY':dl===1?'🟡 NGÀY MAI':`🟢 ${dl}d nữa`;return`<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface);border:1px solid ${over?'rgba(249,115,22,.4)':'var(--border)'};border-radius:var(--r-md);margin-bottom:8px;box-shadow:var(--shadow-sm)"><div style="font-family:var(--serif);font-style:italic;font-size:20px;font-weight:700;color:${c};min-width:50px;text-align:center">${pct}%</div><div style="flex:1"><div style="font-size:14px;font-weight:500">${t.name}</div><div style="font-size:11px;color:var(--muted);font-family:var(--mono)">${t.subject||'Chung'}</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px"><span style="font-size:11px;font-family:var(--mono);color:${over?'var(--red)':dl<=1?'var(--orange)':'var(--green)'}">${when}</span>${over?`<button class="btn btn-success btn-sm" onclick="forgPage.markReview('${t.id}')">✅ Đã ôn</button>`:''}</div></div>`;}).join('');}
  async saveTopic(){const name=document.getElementById('tName').value.trim();if(!name){Toast.err('Nhập tên!');return;}const u=this.store.get('currentUser');const dv=document.getElementById('tDate').value;const row=await this.db.insert('forgetting_topics',{user_id:u.id,name,subject:document.getElementById('tSubj').value.trim(),note:document.getElementById('tNote').value.trim(),studied_at:dv?new Date(dv).toISOString():new Date().toISOString(),review_count:0,review_history:[]});this._topics.unshift(row);document.getElementById('addTopicModal').classList.remove('open');['tName','tSubj','tNote'].forEach(i=>document.getElementById(i).value='');document.getElementById('tDate').valueAsDate=new Date();this.renderTopics();this.renderSchedule();Toast.ok(`Đã thêm "${name}"`);}
  async markReview(id){const t=this._topics.find(x=>x.id===id);if(!t)return;t.review_count=(t.review_count||0)+1;t.review_history=[...(t.review_history||[]),new Date().toISOString()];await this.db.update('forgetting_topics',id,{review_count:t.review_count,review_history:t.review_history});this.renderTopics();this.renderSchedule();Toast.ok(`Ôn lần ${t.review_count} xong ✅`);}
  async del(id){if(!confirm('Xóa?'))return;await this.db.delete('forgetting_topics',id);this._topics=this._topics.filter(t=>t.id!==id);this.renderTopics();this.renderSchedule();}
}
