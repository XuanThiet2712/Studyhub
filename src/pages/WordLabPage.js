import { Toast } from '../components/index.js';

const ANATOMY_DATA = [
  {word:'impossible',parts:[{part:'im-',type:'prefix',meaning:'không, phủ định',color:'#ef4444',examples:['impolite','imperfect','impatient']},{part:'poss-',type:'root',meaning:'có thể (Latin: posse)',color:'#3b82f6',examples:['possible','possess','potential']},{part:'-ible',type:'suffix',meaning:'có thể được',color:'#22c55e',examples:['flexible','visible','possible']}],meaning:'không thể thực hiện được',family:['possible','possibility','impossibility'],ctx:'It is impossible to finish without more help.'},
  {word:'management',parts:[{part:'manu-',type:'prefix',meaning:'bàn tay (Latin)',color:'#ef4444',examples:['manual','manufacture','manuscript']},{part:'-age',type:'root',meaning:'hành động, quá trình',color:'#3b82f6',examples:['manage','package','storage']},{part:'-ment',type:'suffix',meaning:'kết quả, trạng thái',color:'#22c55e',examples:['department','agreement','payment']}],meaning:'sự quản lý, ban quản lý',family:['manage','manager','manageable','mismanagement'],ctx:'Good management is key to company success.'},
  {word:'international',parts:[{part:'inter-',type:'prefix',meaning:'giữa, liên',color:'#ef4444',examples:['internet','interview','interact']},{part:'nation-',type:'root',meaning:'quốc gia (Latin)',color:'#3b82f6',examples:['national','nationality','native']},{part:'-al',type:'suffix',meaning:'thuộc về',color:'#22c55e',examples:['national','financial','professional']}],meaning:'quốc tế',family:['nation','national','internationally'],ctx:'We are looking for candidates with international experience.'},
  {word:'productivity',parts:[{part:'pro-',type:'prefix',meaning:'hướng về phía trước',color:'#ef4444',examples:['produce','project','provide']},{part:'-duct-',type:'root',meaning:'dẫn, tạo ra (Latin)',color:'#3b82f6',examples:['product','conduct','reduce']},{part:'-ivity',type:'suffix',meaning:'tính chất, khả năng',color:'#22c55e',examples:['activity','creativity','sensitivity']}],meaning:'năng suất làm việc',family:['produce','product','productive','unproductive'],ctx:'Working from home can increase productivity.'},
  {word:'transportation',parts:[{part:'trans-',type:'prefix',meaning:'qua, xuyên, chuyển',color:'#ef4444',examples:['transfer','transaction','translate']},{part:'-port-',type:'root',meaning:'mang, vác (Latin)',color:'#3b82f6',examples:['import','export','portable','airport']},{part:'-ation',type:'suffix',meaning:'sự, hành động',color:'#22c55e',examples:['organization','presentation']}],meaning:'sự vận chuyển',family:['transport','portable','import','export'],ctx:'The company will cover all transportation costs.'},
  {word:'professional',parts:[{part:'pro-',type:'prefix',meaning:'hướng về phía trước',color:'#ef4444',examples:['produce','project']},{part:'-fess-',type:'root',meaning:'tuyên bố (Latin)',color:'#3b82f6',examples:['professor','confess','profession']},{part:'-ional',type:'suffix',meaning:'thuộc về, có tính chất',color:'#22c55e',examples:['national','functional','optional']}],meaning:'chuyên nghiệp, chuyên gia',family:['profession','professionally','professionalism'],ctx:'Please dress professionally for the client meeting.'},
];

export class WordLabPage {
  constructor(db, store, bus) { this.db=db; this.store=store; this.bus=bus; this._tab='anatomy'; this._curWord=null; this._game={score:0,streak:0,q:null}; }
  render() {
    document.querySelector('.main').innerHTML=`<div class="page">
      <div class="page-header"><h1 class="page-title">🔬 Word Lab</h1><p class="page-sub">Phân tách từ · Mini Game ôn từ vựng</p></div>
      <div class="tabs"><button class="tab active" onclick="wlPage.sw('anatomy',this)">🧬 Word Anatomy</button><button class="tab" onclick="wlPage.sw('game',this)">🎮 Solo Game</button></div>
      <div id="wl-anatomy">
        <div style="display:flex;gap:10px;margin-bottom:20px">
          <input class="form-input" id="anatInput" placeholder="Nhập từ để phân tách... (VD: impossible)" list="anatList" style="flex:1"><datalist id="anatList">${ANATOMY_DATA.map(w=>`<option value="${w.word}">`).join('')}</datalist>
          <button class="btn btn-primary" onclick="wlPage.analyze()">🔬 Phân tích</button>
          <button class="btn btn-ghost" onclick="wlPage.random()">🎲 Ngẫu nhiên</button>
        </div>
        <div id="anatResult"></div>
        <div style="margin-top:24px"><div class="sec-hd"><span class="sec-hd-title">📚 Prefix · Root · Suffix thường gặp trong TOEIC</span></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:12px">
          ${[{title:'PREFIX (Tiền tố)',col:'#ef4444',items:[['un-','không, phủ định','unhappy,unable'],['re-','lại, lần nữa','return,refund'],['im/in-','không, vào','impossible,income'],['pre-','trước','prepare,preview'],['pro-','hướng tới','produce,project'],['trans-','qua, chuyển','transport,transfer'],['inter-','giữa','international'],['over-','quá, vượt','overtime,overcome']]},{title:'ROOT (Gốc từ)',col:'#3b82f6',items:[['-port-','mang, vác','import,export,airport'],['-duct-','dẫn, tạo','product,conduct'],['-cept-','lấy, nhận','accept,concept'],['-mit-','gửi, để','submit,commit,permit'],['-vis-','thấy','visible,review,vision'],['-tract-','kéo','contract,attract'],['-scrib-','viết','describe,subscribe'],['-press-','ép, in','express,impress']]},{title:'SUFFIX (Hậu tố)',col:'#22c55e',items:[['-ment','kết quả, hành động','payment,agreement'],['-tion','sự, hành động','presentation,transaction'],['-able','có thể','available,flexible'],['-ity','tính chất','quality,productivity'],['-er/-or','người làm','manager,director'],['-al','thuộc về','national,financial'],['-ize','biến thành','organize,prioritize'],['-ness','trạng thái','business,awareness']]}].map(sec=>`<div class="card"><div style="font-size:11px;font-family:var(--mono);color:${sec.col};letter-spacing:.8px;text-transform:uppercase;margin-bottom:10px">${sec.title}</div>${sec.items.map(([p,m,e])=>`<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px"><div style="font-family:var(--mono);color:${sec.col};min-width:65px">${p}</div><div style="color:var(--muted)">${m}<br><span style="font-size:10px;color:var(--muted2)">${e}</span></div></div>`).join('')}</div>`).join('')}
        </div></div>
      </div>
      <div id="wl-game" style="display:none">
        <div style="max-width:540px;margin:0 auto">
          <div style="display:flex;gap:24px;justify-content:center;margin-bottom:16px">
            <div style="text-align:center"><div style="font-family:'Lora',serif;font-style:italic;font-size:28px;font-weight:700;color:var(--blue)" id="sgScore">0</div><div style="font-size:10px;color:var(--muted);font-family:var(--mono)">ĐIỂM</div></div>
            <div style="text-align:center"><div style="font-family:'Lora',serif;font-style:italic;font-size:28px;font-weight:700;color:var(--orange)" id="sgStreak">0</div><div style="font-size:10px;color:var(--muted);font-family:var(--mono)">🔥 STREAK</div></div>
            <div style="text-align:center"><div style="font-family:'Lora',serif;font-style:italic;font-size:28px;font-weight:700;color:var(--purple)" id="sgBest">${localStorage.getItem('sh_solo_best')||0}</div><div style="font-size:10px;color:var(--muted);font-family:var(--mono)">KỶ LỤC</div></div>
          </div>
          <div style="height:4px;background:var(--bg3);border-radius:99px;overflow:hidden;margin-bottom:16px"><div id="sgTimer" style="height:100%;background:var(--blue);border-radius:99px;transition:width .1s;width:100%"></div></div>
          <div class="card" style="text-align:center;padding:28px;margin-bottom:14px">
            <div style="font-size:11px;color:var(--muted);font-family:var(--mono);margin-bottom:10px">Nghĩa tiếng Việt của từ này?</div>
            <div style="font-family:'Lora',serif;font-style:italic;font-size:34px;font-weight:700;color:var(--blue);margin-bottom:6px" id="sgWord">—</div>
            <div style="font-family:var(--mono);font-size:13px;color:var(--muted)" id="sgPhone"></div>
            <button onclick="wlPage.sgSpeak()" style="margin-top:10px;background:var(--blue-l);border:1px solid rgba(59,130,246,.2);color:var(--blue);padding:5px 12px;border-radius:99px;font-size:12px;cursor:pointer">🔊</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px" id="sgOpts"></div>
          <div style="text-align:center"><button class="btn btn-primary" onclick="wlPage.sgNext()">▶ Câu tiếp theo</button></div>
        </div>
      </div>
    </div>`;
    window.wlPage=this;
    this.random();
    this.sgLoadPool();
  }
  sw(tab,btn){['anatomy','game'].forEach(t=>document.getElementById('wl-'+t).style.display='none');document.getElementById('wl-'+tab).style.display='block';document.querySelectorAll('.tabs .tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');if(tab==='game')this.sgNext();}
  analyze(){const w=document.getElementById('anatInput')?.value?.trim()?.toLowerCase();const found=ANATOMY_DATA.find(x=>x.word===w);if(!found){Toast.err(`Chưa có data cho "${w}". Thử: ${ANATOMY_DATA.map(x=>x.word).join(', ')}`);return;}this._curWord=found;this.renderAnatomy(found);}
  random(){const w=ANATOMY_DATA[~~(Math.random()*ANATOMY_DATA.length)];if(document.getElementById('anatInput'))document.getElementById('anatInput').value=w.word;this._curWord=w;this.renderAnatomy(w);}
  renderAnatomy(d){const el=document.getElementById('anatResult');if(!el)return;const tc={prefix:'#ef4444',root:'#3b82f6',suffix:'#22c55e'};el.innerHTML=`<div class="card" style="text-align:center;padding:28px;margin-bottom:14px">
    <div style="font-family:'Lora',serif;font-style:italic;font-size:36px;font-weight:700;color:var(--text);margin-bottom:6px">${d.word}</div>
    <div style="font-size:15px;color:var(--muted);margin-bottom:20px">🇻🇳 ${d.meaning}</div>
    <button onclick="wlPage.speak('${d.word}')" style="background:var(--blue-l);border:1px solid rgba(59,130,246,.2);color:var(--blue);padding:5px 14px;border-radius:99px;font-size:12px;cursor:pointer;margin-bottom:20px">🔊 Phát âm</button>
    <div style="display:flex;justify-content:center;align-items:stretch;gap:0;flex-wrap:wrap;margin-bottom:20px">
      ${d.parts.map((p,i)=>`${i>0?'<div style="font-size:22px;color:var(--muted);align-self:center;margin:0 8px">+</div>':''}
      <div style="background:${p.color}12;border:2px solid ${p.color}30;border-radius:var(--r-lg);padding:14px 16px;min-width:90px;text-align:center;transition:transform .2s;cursor:default" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
        <div style="font-family:'Lora',serif;font-style:italic;font-size:24px;font-weight:700;color:${p.color}">${p.part}</div>
        <div style="font-size:10px;font-family:var(--mono);color:${p.color};text-transform:uppercase;margin-top:3px">${p.type}</div>
        <div style="font-size:12px;font-weight:500;margin-top:5px">${p.meaning}</div>
      </div>`).join('')}
    </div>
    ${d.parts.map(p=>`<div style="font-size:12px;margin-bottom:6px"><span style="font-family:var(--mono);color:${p.color}">${p.part}</span> <span style="color:var(--muted)">→ "${p.meaning}" — cũng thấy trong:</span> ${p.examples.map(e=>`<span class="badge badge-blue" style="font-size:10px;cursor:pointer" onclick="document.getElementById('anatInput').value='${e}';wlPage.analyze()">${e}</span>`).join(' ')}</div>`).join('')}
    <div style="margin-top:14px"><div style="font-size:12px;color:var(--muted);margin-bottom:6px;font-family:var(--mono)">👨‍👩‍👧 Gia đình từ:</div><div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">${d.family.map(w=>`<span style="padding:5px 12px;border:1px solid var(--border2);border-radius:99px;font-size:12px;cursor:pointer;transition:all .15s" onmouseover="this.style.borderColor='var(--purple)';this.style.color='var(--purple)'" onmouseout="this.style.borderColor='var(--border2)';this.style.color=''" onclick="document.getElementById('anatInput').value='${w}';wlPage.analyze()">${w}</span>`).join('')}</div></div>
    <div style="background:var(--purple-l);border-left:3px solid var(--purple);border-radius:0 var(--r-md) var(--r-md) 0;padding:10px 14px;margin-top:14px;font-size:13px;color:var(--muted);font-style:italic;text-align:left">📋 "${d.ctx}" <button onclick="wlPage.speak('${d.ctx}')" style="background:none;border:none;cursor:pointer;font-size:13px">🔊</button></div>
  </div>`;}
  speak(t){if(!window.speechSynthesis)return;const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=0.85;window.speechSynthesis.cancel();window.speechSynthesis.speak(u);}

  // ── SOLO GAME ────────────────────────────────────
  _sgPool=[];_sgTimer=null;_sgLeft=12;
  async sgLoadPool(){const u=this.store.get('currentUser');let pool=[];try{const rows=await this.db.select('vocabulary',{eq:{user_id:u.id},limit:100});pool=rows.map(r=>({word:r.word,meaning:r.meaning_vi,phonetic:r.phonetic||''}));}catch{}const defaults=[{word:'office',meaning:'văn phòng',phonetic:'/ˈɒfɪs/'},{word:'invoice',meaning:'hóa đơn',phonetic:'/ˈɪnvɔɪs/'},{word:'deadline',meaning:'hạn chót',phonetic:'/ˈdedlaɪn/'},{word:'discount',meaning:'giảm giá',phonetic:'/ˈdɪskaʊnt/'},{word:'negotiate',meaning:'đàm phán',phonetic:'/nɪˈɡəʊʃieɪt/'},{word:'candidate',meaning:'ứng viên',phonetic:'/ˈkændɪdət/'},{word:'salary',meaning:'lương',phonetic:'/ˈsæləri/'},{word:'efficient',meaning:'hiệu quả',phonetic:'/ɪˈfɪʃnt/'},{word:'confirm',meaning:'xác nhận',phonetic:'/kənˈfɜːm/'},{word:'delivery',meaning:'giao hàng',phonetic:'/dɪˈlɪvəri/'}];const seen=new Set();this._sgPool=[...pool,...defaults].filter(v=>{if(seen.has(v.word))return false;seen.add(v.word);return true;});}
  sgNext(){if(!this._sgPool.length)return;clearInterval(this._sgTimer);const q=this._sgPool[~~(Math.random()*this._sgPool.length)];this._game.q=q;document.getElementById('sgWord').textContent=q.word;document.getElementById('sgPhone').textContent=q.phonetic;const wrongs=this._sgPool.filter(x=>x.word!==q.word).sort(()=>Math.random()-.5).slice(0,3);const opts=[...wrongs.map(w=>w.meaning),q.meaning].sort(()=>Math.random()-.5);document.getElementById('sgOpts').innerHTML=opts.map((o,i)=>`<button class="btn btn-ghost" style="padding:12px;font-size:13px;height:auto;text-align:center;border-radius:var(--r-lg);border-width:2px" onclick="wlPage.sgAnswer('${o.replace(/'/g,"\\'")}')">${String.fromCharCode(65+i)}. ${o}</button>`).join('');
    this._sgLeft=12;const bar=document.getElementById('sgTimer');if(bar)bar.style.width='100%';
    this._sgTimer=setInterval(()=>{this._sgLeft-=0.1;const p=Math.max(0,this._sgLeft/12*100);const b=document.getElementById('sgTimer');if(b){b.style.width=p+'%';b.style.background=p>50?'var(--blue)':p>25?'var(--orange)':'var(--red)';}if(this._sgLeft<=0){clearInterval(this._sgTimer);this.sgAnswer(null);}},100);}
  sgAnswer(choice){clearInterval(this._sgTimer);const q=this._game.q;if(!q)return;const ok=choice===q.meaning;document.querySelectorAll('#sgOpts .btn').forEach(b=>{if(b.textContent.includes(q.meaning)){b.style.background='var(--green)';b.style.color='white';b.style.borderColor='var(--green)';}b.disabled=true;});if(choice&&!ok){const bs=[...document.querySelectorAll('#sgOpts .btn')];const wb=bs.find(b=>b.textContent.includes(choice));if(wb){wb.style.background='var(--red)';wb.style.color='white';wb.style.borderColor='var(--red)';}}
    if(ok){this._game.score+=10+this._game.streak*2;this._game.streak++;Toast.ok(`+${10+this._game.streak*2}pts · Streak ${this._game.streak}🔥`,1000);}else{this._game.streak=0;Toast.err('Sai rồi 😅',1000);}
    const best=parseInt(localStorage.getItem('sh_solo_best')||0);if(this._game.score>best){localStorage.setItem('sh_solo_best',this._game.score);}
    document.getElementById('sgScore').textContent=this._game.score;document.getElementById('sgStreak').textContent=this._game.streak;document.getElementById('sgBest').textContent=Math.max(this._game.score,best);
    setTimeout(()=>this.sgNext(),1300);}
  sgSpeak(){this.speak(this._game.q?.word||'');}
}
