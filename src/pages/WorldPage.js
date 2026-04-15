import { Toast } from '../components/index.js';

const MAP_W=32, MAP_H=22, TILE=28;
const ZONES={
  library: {x:1,y:1,w:7,h:5,color:'#bfdbfe',label:'📚 Thư viện',desc:'Học từ vựng · Lộ trình'},
  farm:    {x:12,y:1,w:8,h:6,color:'#bbf7d0',label:'🌱 Nông trại',desc:'Trồng từ vựng SRS'},
  arena:   {x:24,y:1,w:7,h:5,color:'#fecdd3',label:'⚔️ Đấu trường',desc:'Word Battle · PvP'},
  market:  {x:1,y:12,w:7,h:7,color:'#fef08a',label:'🏪 Cửa hàng',desc:'Đổi XP · Nâng cấp'},
  cafe:    {x:12,y:11,w:7,h:7,color:'#ddd6fe',label:'☕ AI Café',desc:'Chat AI · Giao tiếp'},
  park:    {x:23,y:10,w:8,h:9,color:'#cffafe',label:'🌳 Công viên',desc:'Nghỉ ngơi · Bạn bè'},
};
const NPCS=[
  {id:'lib',x:3,y:3,emoji:'👩‍🏫',name:'Cô Lan',zone:'library'},
  {id:'farm',x:16,y:4,emoji:'👨‍🌾',name:'Chú Hùng',zone:'farm'},
  {id:'arena',x:27,y:3,emoji:'⚔️',name:'Thầy Dũng',zone:'arena'},
  {id:'shop',x:4,y:16,emoji:'🧙',name:'Ông Tùng',zone:'market'},
  {id:'ai',x:15,y:14,emoji:'🤖',name:'AI Bot',zone:'cafe'},
  {id:'elder',x:27,y:14,emoji:'🧓',name:'Ông Nam',zone:'park'},
];

export class WorldPage {
  constructor(db,store,bus){
    this.db=db;this.store=store;this.bus=bus;
    this._p={x:16,y:11,name:'Me'};
    this._others=[];this._crops=[];this._keys={};
    this._nearNPC=null;this._camX=0;this._camY=0;
    this._animFrame=null;this._presenceCh=null;
    this._lastMove=0;this._chatMsgs=[];this._chatOpen=false;
  }

  render(){
    const user=this.store.get('currentUser');
    this._p.name=(user?.display_name||user?.username||'You').slice(0,8);
    document.querySelector('.main').innerHTML=`
    <div class="page" style="max-width:1100px">
      <div class="page-header-row page-header">
        <div>
          <h1 class="page-title">🌍 StudyHub World</h1>
          <p class="page-sub">Thế giới học tập trực tuyến · Gặp gỡ · Học tập · Chiến đấu</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <div id="worldOnlineBadge" style="font-size:12px;padding:5px 12px;border-radius:99px;background:var(--green-l);color:var(--green);font-weight:600">🟢 1 online</div>
          <button onclick="worldPage.toggleChat()" class="btn btn-ghost btn-sm">💬 Chat</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 280px;gap:16px;align-items:start">
        <!-- GAME AREA -->
        <div>
          <!-- Canvas -->
          <div style="background:#0f172a;border-radius:var(--r-xl);overflow:hidden;position:relative;box-shadow:var(--shadow-lg);border:2px solid rgba(255,255,255,0.1)">
            <canvas id="worldCanvas" style="display:block;cursor:crosshair"></canvas>
            <!-- Zone hint -->
            <div id="zoneHint" style="position:absolute;top:12px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.75);color:white;padding:5px 14px;border-radius:99px;font-size:12px;font-weight:600;pointer-events:none;opacity:0;transition:opacity .4s;white-space:nowrap"></div>
            <!-- NPC interaction hint -->
            <div id="npcHint" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:rgba(99,102,241,0.95);color:white;padding:8px 18px;border-radius:99px;font-size:12px;font-weight:600;pointer-events:none;opacity:0;transition:opacity .3s;white-space:nowrap;box-shadow:0 4px 12px rgba(99,102,241,0.4)"></div>
          </div>

          <!-- Controls -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:10px 14px;background:var(--white);border-radius:var(--r-lg);border:1px solid var(--border)">
            <div style="font-size:12px;color:var(--muted)">⬆⬇⬅➡ hoặc WASD · <strong>E/Space</strong> tương tác · Click chuột di chuyển</div>
            <div style="display:flex;gap:8px">
              ${[['⬆','w-up'],['⬇','w-down'],['⬅','w-left'],['➡','w-right']].map(([a,id])=>`<button id="${id}" style="width:30px;height:30px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg2);cursor:pointer;font-size:13px" onmousedown="worldPage._keyPress('${a==='⬆'?'ArrowUp':a==='⬇'?'ArrowDown':a==='⬅'?'ArrowLeft':'ArrowRight'}')">${a}</button>`).join('')}
              <button style="height:30px;padding:0 10px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg2);cursor:pointer;font-size:11px;font-weight:600" onmousedown="worldPage._keyPress(' ')">E</button>
            </div>
          </div>
        </div>

        <!-- SIDEBAR -->
        <div style="display:flex;flex-direction:column;gap:12px">
          <!-- Player card -->
          <div class="card" style="background:linear-gradient(135deg,#0f172a,#1e1b4b);color:white;border:none">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:20px">😊</div>
              <div>
                <div style="font-weight:700;font-size:14px">${this._p.name}</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.5)" id="worldZoneLabel">📍 Đang đứng ở...</div>
              </div>
            </div>
            <div style="display:flex;gap:8px">
              <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:10px;padding:8px;text-align:center">
                <div style="font-size:15px;font-weight:800;color:#60a5fa" id="wXP">${user?.xp||0}</div>
                <div style="font-size:9px;color:rgba(255,255,255,0.4)">XP</div>
              </div>
              <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:10px;padding:8px;text-align:center">
                <div style="font-size:15px;font-weight:800;color:#4ade80" id="wCrops">0</div>
                <div style="font-size:9px;color:rgba(255,255,255,0.4)">Cây từ</div>
              </div>
            </div>
          </div>

          <!-- Online players -->
          <div class="card">
            <div class="card-title">🟢 Người chơi online</div>
            <div id="worldPlayerList" style="display:flex;flex-direction:column;gap:6px">
              <div style="display:flex;align-items:center;gap:8px;padding:6px 0">
                <div style="width:8px;height:8px;border-radius:50%;background:var(--green);flex-shrink:0"></div>
                <div style="font-size:13px;font-weight:600">${this._p.name} <span style="font-size:10px;color:var(--muted)">(bạn)</span></div>
              </div>
            </div>
            <div style="font-size:11px;color:var(--muted);margin-top:8px;text-align:center">Những người chơi đang online sẽ hiện ở đây</div>
          </div>

          <!-- Word Farm status -->
          <div class="card">
            <div class="card-title">🌱 Nông trại từ vựng</div>
            <div id="farmStatus" style="font-size:12px;color:var(--muted);text-align:center;padding:8px">Đang tải...</div>
            <button onclick="app.router.navigate('/vocabulary')" class="btn btn-success btn-sm" style="width:100%;margin-top:10px;justify-content:center">💧 Đến ôn từ vựng</button>
          </div>

          <!-- World Chat -->
          <div class="card" id="worldChatPanel" style="display:none">
            <div class="card-title">💬 World Chat</div>
            <div id="worldChatMsgs" style="height:150px;overflow-y:auto;display:flex;flex-direction:column;gap:5px;margin-bottom:8px;padding:4px"></div>
            <div style="display:flex;gap:6px">
              <input id="worldChatInput" class="form-input" placeholder="Nhắn tin..." style="border-radius:99px;padding:6px 12px;font-size:12px" onkeydown="if(event.key==='Enter')worldPage.sendChat()">
              <button onclick="worldPage.sendChat()" class="btn btn-primary btn-sm" style="border-radius:99px">↗</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- NPC Dialog -->
    <div class="overlay" id="worldDialog">
      <div class="modal" style="max-width:460px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="font-size:36px" id="dlgEmoji">👾</div>
          <div>
            <div style="font-size:16px;font-weight:800" id="dlgName">NPC</div>
            <div style="font-size:12px;color:var(--muted)" id="dlgZone">Zone</div>
          </div>
          <button onclick="document.getElementById('worldDialog').classList.remove('open')" style="margin-left:auto;background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">✕</button>
        </div>
        <div id="dlgText" style="font-size:14px;line-height:1.7;margin-bottom:18px;background:var(--bg2);border-radius:var(--r-lg);padding:14px"></div>
        <div id="dlgActions" style="display:flex;gap:8px;flex-wrap:wrap"></div>
      </div>
    </div>`;

    window.worldPage=this;
    this._initCanvas();
    this._initControls();
    this._loadFarm();
    this._startPresence();
    this._loop();
  }

  _initCanvas(){
    const canvas=document.getElementById('worldCanvas');
    const container=canvas.parentElement;
    const CW=Math.min(container.clientWidth||700, 780);
    const CH=Math.floor(CW*0.56);
    canvas.width=CW; canvas.height=CH;
    this._CW=CW; this._CH=CH;
    this._ctx=canvas.getContext('2d');
    this._camX=(this._p.x*TILE)-(CW/2);
    this._camY=(this._p.y*TILE)-(CH/2);
    canvas.addEventListener('click',e=>{
      const r=canvas.getBoundingClientRect();
      const wx=Math.floor((e.clientX-r.left+this._camX)/TILE);
      const wy=Math.floor((e.clientY-r.top+this._camY)/TILE);
      this._p.x=Math.max(0,Math.min(wx,MAP_W-1));
      this._p.y=Math.max(0,Math.min(wy,MAP_H-1));
    });
  }

  _initControls(){
    this._keys={};
    this._kd=e=>{
      this._keys[e.key]=true;
      if((e.key===' '||e.key==='e'||e.key==='E')&&this._nearNPC){e.preventDefault();this._openDialog(this._nearNPC);}
    };
    this._ku=e=>{this._keys[e.key]=false;};
    window.addEventListener('keydown',this._kd);
    window.addEventListener('keyup',this._ku);
  }

  _keyPress(key){
    const map={'ArrowUp':'w','ArrowDown':'s','ArrowLeft':'a','ArrowRight':'d',' ':' '};
    const dx=key==='ArrowLeft'?-1:key==='ArrowRight'?1:0;
    const dy=key==='ArrowUp'?-1:key==='ArrowDown'?1:0;
    if(dx||dy){this._p.x=Math.max(0,Math.min(this._p.x+dx,MAP_W-1));this._p.y=Math.max(0,Math.min(this._p.y+dy,MAP_H-1));}
    if(key===' '&&this._nearNPC) this._openDialog(this._nearNPC);
  }

  _loop(){
    const tick=()=>{this._update();this._draw();this._animFrame=requestAnimationFrame(tick);};
    this._animFrame=requestAnimationFrame(tick);
  }

  _update(){
    const now=Date.now(); if(now-this._lastMove<140) return;
    const K=this._keys; let dx=0,dy=0;
    if(K['ArrowLeft']||K['a']||K['A'])dx=-1;
    else if(K['ArrowRight']||K['d']||K['D'])dx=1;
    if(K['ArrowUp']||K['w']||K['W'])dy=-1;
    else if(K['ArrowDown']||K['s']||K['S'])dy=1;
    if(dx||dy){
      this._p.x=Math.max(0,Math.min(this._p.x+dx,MAP_W-1));
      this._p.y=Math.max(0,Math.min(this._p.y+dy,MAP_H-1));
      this._lastMove=now;
      // Broadcast
      if(now-this._lastBroadcast>400){
        this._lastBroadcast=now;
        this._presenceCh?.track?.({id:this.store.get('currentUser')?.id,name:this._p.name,x:this._p.x,y:this._p.y});
      }
    }
    // Check NPC
    let near=null;
    for(const n of NPCS){if(Math.abs(n.x-this._p.x)+Math.abs(n.y-this._p.y)<=2){near=n;break;}}
    this._nearNPC=near;
    const nh=document.getElementById('npcHint');
    if(nh){nh.style.opacity=near?'1':'0';if(near)nh.textContent=`Nhấn E để nói chuyện với ${near.name}`;}
    // Zone
    this._updateZone();
    // Camera smooth
    this._camX+=(this._p.x*TILE-this._CW/2-this._camX)*0.1;
    this._camY+=(this._p.y*TILE-this._CH/2-this._camY)*0.1;
    this._camX=Math.max(0,Math.min(this._camX,MAP_W*TILE-this._CW));
    this._camY=Math.max(0,Math.min(this._camY,MAP_H*TILE-this._CH));
  }

  _updateZone(){
    let curZone=null;
    for(const [id,z] of Object.entries(ZONES)){
      if(this._p.x>=z.x&&this._p.x<z.x+z.w&&this._p.y>=z.y&&this._p.y<z.y+z.h){curZone={id,...z};break;}
    }
    if(this._curZoneId!==curZone?.id){
      this._curZoneId=curZone?.id;
      const lbl=document.getElementById('worldZoneLabel');
      if(lbl)lbl.textContent=curZone?`📍 ${curZone.label}`:' 📍 Ngoài đường';
      const hint=document.getElementById('zoneHint');
      if(hint&&curZone){hint.textContent=`${curZone.label} — ${curZone.desc}`;hint.style.opacity='1';setTimeout(()=>{if(hint)hint.style.opacity='0';},2500);}
    }
  }

  _draw(){
    const ctx=this._ctx,cx=this._camX,cy=this._camY,T=TILE;
    ctx.clearRect(0,0,this._CW,this._CH);
    // Bg
    ctx.fillStyle='#2d6a4f';ctx.fillRect(0,0,this._CW,this._CH);
    // Grass tiles
    for(let tx=0;tx<MAP_W;tx++)for(let ty=0;ty<MAP_H;ty++){
      const sx=tx*T-cx,sy=ty*T-cy;
      if(sx<-T||sx>this._CW||sy<-T||sy>this._CH)continue;
      ctx.fillStyle=(tx+ty)%2?'#2d6a4f':'#27ae60';
      ctx.fillRect(sx,sy,T,T);
    }
    // Roads
    ctx.fillStyle='#c8a96e';
    ctx.fillRect(10*T-cx,0-cy,2*T,MAP_H*T);
    ctx.fillRect(0-cx,10*T-cy,MAP_W*T,2*T);
    // Zones
    for(const z of Object.values(ZONES)){
      const sx=z.x*T-cx,sy=z.y*T-cy;
      if(sx>this._CW||sy>this._CH||sx+z.w*T<0||sy+z.h*T<0)continue;
      ctx.fillStyle=z.color+'cc';ctx.fillRect(sx,sy,z.w*T,z.h*T);
      ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.lineWidth=1.5;ctx.strokeRect(sx,sy,z.w*T,z.h*T);
      ctx.fillStyle='rgba(0,0,0,0.6)';ctx.font='bold 10px sans-serif';ctx.textAlign='center';
      ctx.fillText(z.label,sx+z.w*T/2,sy+12);
    }
    // Decorations
    [
      {x:10,y:0,e:'🌲'},{x:11,y:5,e:'🌲'},{x:10,y:9,e:'🌲'},
      {x:11,y:12,e:'🌊'},{x:11,y:10,e:'🌊'},{x:22,y:9,e:'🌊'},
      {x:9,y:4,e:'🌺'},{x:22,y:4,e:'🏠'},{x:9,y:16,e:'🌸'},
    ].forEach(d=>{
      const sx=d.x*T-cx,sy=d.y*T-cy;
      if(sx<-T||sx>this._CW)return;
      ctx.font=`${T-4}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(d.e,sx+T/2,sy+T/2);
    });
    // Crops
    this._crops.forEach(c=>{
      const sx=c.x*T-cx+T/2,sy=c.y*T-cy+T/2;
      if(sx<-T||sx>this._CW)return;
      const size=c.level>=3?20:c.level>=2?16:c.level>=1?13:10;
      ctx.font=`${size}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(c.level>=3?'🌳':c.level>=2?'🌿':c.level>=1?'🌱':'🌰',sx,sy);
    });
    // NPCs
    NPCS.forEach(n=>{
      const sx=n.x*T-cx,sy=n.y*T-cy;
      if(sx<-T||sx>this._CW)return;
      ctx.fillStyle='rgba(0,0,0,0.18)';ctx.beginPath();ctx.ellipse(sx+T/2,sy+T-2,9,4,0,0,Math.PI*2);ctx.fill();
      ctx.font=`${T-4}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n.emoji,sx+T/2,sy+T/2-1);
      // name
      ctx.fillStyle='rgba(0,0,0,0.65)';ctx.beginPath();ctx.roundRect?ctx.roundRect(sx+T/2-20,sy-13,40,13,4):ctx.rect(sx+T/2-20,sy-13,40,13);ctx.fill();
      ctx.fillStyle='white';ctx.font='bold 8px sans-serif';ctx.fillText(n.name,sx+T/2,sy-7);
      if(this._nearNPC?.id===n.id){ctx.fillStyle='#fbbf24';ctx.font='12px serif';ctx.fillText('❗',sx+T,sy);}
    });
    // Others
    this._others.forEach(o=>{
      const sx=o.x*T-cx,sy=o.y*T-cy;
      if(sx<-T||sx>this._CW)return;
      ctx.fillStyle='rgba(79,70,229,0.5)';ctx.beginPath();ctx.roundRect?ctx.roundRect(sx+3,sy+3,T-6,T-6,5):ctx.rect(sx+3,sy+3,T-6,T-6);ctx.fill();
      ctx.font=`${T-6}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🧑',sx+T/2,sy+T/2);
      ctx.fillStyle='rgba(79,70,229,0.9)';ctx.beginPath();ctx.roundRect?ctx.roundRect(sx+T/2-18,sy-13,36,13,4):ctx.rect(sx+T/2-18,sy-13,36,13);ctx.fill();
      ctx.fillStyle='white';ctx.font='bold 8px sans-serif';ctx.fillText((o.name||'?').slice(0,6),sx+T/2,sy-7);
    });
    // Player
    const px=this._p.x*T-cx,py=this._p.y*T-cy;
    ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(px+T/2,py+T-2,11,4,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.9)';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect?ctx.roundRect(px+2,py+2,T-4,T-4,7):ctx.rect(px+2,py+2,T-4,T-4);ctx.stroke();
    ctx.fillStyle='rgba(79,70,229,0.25)';ctx.fill();
    ctx.font=`${T-5}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('😊',px+T/2,py+T/2-1);
    ctx.fillStyle='#4f46e5';ctx.beginPath();ctx.roundRect?ctx.roundRect(px+T/2-22,py-14,44,14,5):ctx.rect(px+T/2-22,py-14,44,14);ctx.fill();
    ctx.fillStyle='white';ctx.font='bold 8px sans-serif';ctx.fillText(this._p.name,px+T/2,py-7);
  }

  _openDialog(npc){
    document.getElementById('dlgEmoji').textContent=npc.emoji;
    document.getElementById('dlgName').textContent=npc.name;
    document.getElementById('dlgZone').textContent=ZONES[npc.zone]?.label||'';
    const dialogs={
      lib:'Chào bạn! Thư viện luôn mở cửa. Hôm nay bạn muốn học từ vựng mới hay xem lộ trình 30 ngày?',
      farm:'Cây từ vựng của bạn cần được tưới! Ôn từ thì cây lớn, bỏ ôn cây héo. Vào Từ vựng để ôn nhé!',
      arena:'Sẵn sàng chiến đấu chưa? Vào Word Battle để thách đấu với người khác!',
      shop:'Xem tiến độ và bảng xếp hạng tại đây. Bạn đứng thứ mấy rồi?',
      ai:'Tôi là AI Bot! Tôi có thể giúp bạn luyện giao tiếp, phân tích tiến độ và tạo bài tập.',
      elder:'Nghỉ ngơi đôi chút rất quan trọng! Bạn học đều đặn chưa? Đến bạn bè xem ai đang online!',
    };
    document.getElementById('dlgText').textContent=dialogs[npc.id]||'Xin chào!';
    const acts=document.getElementById('dlgActions');acts.innerHTML='';
    const btn=(t,c,fn)=>{const b=document.createElement('button');b.textContent=t;b.className='btn btn-sm';b.style.cssText=`background:${c};color:white;border:none;font-weight:600`;b.onclick=fn;acts.appendChild(b);};
    if(npc.zone==='library'){btn('📚 Từ vựng','#3b82f6',()=>{this._close();app.router.navigate('/vocabulary');});btn('📅 Lộ trình','#8b5cf6',()=>{this._close();app.router.navigate('/roadmap');});}
    else if(npc.zone==='farm'){btn('💧 Ôn từ ngay','#16a34a',()=>{this._close();app.router.navigate('/vocabulary');});}
    else if(npc.zone==='arena'){btn('⚔️ Word Battle','#dc2626',()=>{this._close();app.router.navigate('/game');});btn('👥 Thách bạn','#f97316',()=>{this._close();app.router.navigate('/friends');});}
    else if(npc.zone==='market'){btn('📊 Tiến độ','#d97706',()=>{this._close();app.router.navigate('/dashboard');});btn('🏆 BXH','#b45309',()=>{this._close();app.router.navigate('/leaderboard');});}
    else if(npc.zone==='cafe'){btn('🤖 AI Tutor','#7c3aed',()=>{this._close();app.router.navigate('/ai-tutor');});btn('💬 Giao tiếp','#2563eb',()=>{this._close();app.router.navigate('/conversation');});}
    else if(npc.zone==='park'){btn('👥 Bạn bè','#0d9488',()=>{this._close();app.router.navigate('/friends');});}
    btn('Đóng','#6b7280',()=>this._close());
    document.getElementById('worldDialog').classList.add('open');
  }
  _close(){document.getElementById('worldDialog').classList.remove('open');}

  async _loadFarm(){
    const u=this.store.get('currentUser');
    try{
      const vocab=await this.db.select('vocabulary',{eq:{user_id:u.id}}).catch(()=>[]);
      this._crops=vocab.slice(0,15).map((v,i)=>({word:v.word,level:Math.min(v.srs_level||0,3),x:13+Math.floor(i%4)*2,y:2+Math.floor(i/4)*2}));
      const el=document.getElementById('farmStatus');
      const wCrops=document.getElementById('wCrops');
      if(wCrops)wCrops.textContent=this._crops.length;
      if(el){
        const due=vocab.filter(v=>new Date(v.next_review)<=new Date()).length;
        const mastered=vocab.filter(v=>v.srs_level>=4).length;
        el.innerHTML=`<div style="display:flex;flex-direction:column;gap:5px">
          <div style="display:flex;justify-content:space-between;font-size:12px"><span>🌳 Thành thạo</span><strong>${mastered}</strong></div>
          <div style="display:flex;justify-content:space-between;font-size:12px"><span>🌱 Đang học</span><strong>${vocab.length-mastered}</strong></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:${due>0?'var(--orange)':'var(--green)'}"><span>💧 Cần ôn hôm nay</span><strong>${due}</strong></div>
        </div>`;
      }
    }catch{}
  }

  toggleChat(){
    this._chatOpen=!this._chatOpen;
    const el=document.getElementById('worldChatPanel');
    if(el)el.style.display=this._chatOpen?'block':'none';
    if(this._chatOpen)document.getElementById('worldChatInput')?.focus();
  }

  sendChat(){
    const input=document.getElementById('worldChatInput');
    const text=input?.value?.trim();if(!text)return;
    input.value='';
    const user=this.store.get('currentUser');
    const msg={name:user?.display_name||'Bạn',text,time:Date.now()};
    this._addChatMsg(msg);
    try{this.db.client.channel('world-chat').send({type:'broadcast',event:'msg',payload:msg});}catch{}
  }

  _addChatMsg(msg){
    this._chatMsgs.push(msg);
    const el=document.getElementById('worldChatMsgs');if(!el)return;
    const d=document.createElement('div');
    d.style.cssText='font-size:11px;line-height:1.5;padding:3px 6px;border-radius:6px;background:var(--bg2)';
    d.innerHTML=`<span style="font-weight:700;color:var(--blue)">${msg.name}:</span> ${msg.text}`;
    el.appendChild(d);el.scrollTop=el.scrollHeight;
  }

  _startPresence(){
    const user=this.store.get('currentUser');if(!user)return;
    this._presenceCh=this.db.client.channel('world-presence',{config:{presence:{key:user.id}}});
    this._presenceCh
      .on('presence',{event:'sync'},()=>{
        const state=this._presenceCh.presenceState();
        this._others=Object.values(state).flat().filter(u=>u.id!==user.id).map(u=>({id:u.id,name:u.name,x:u.x||16,y:u.y||11}));
        const cnt=document.getElementById('worldOnlineBadge');
        if(cnt){cnt.textContent=`🟢 ${this._others.length+1} online`;cnt.style.background=this._others.length?'var(--green-l)':'var(--bg2)';cnt.style.color=this._others.length?'var(--green)':'var(--muted)';}
        this._updatePlayerList();
      })
      .on('broadcast',{event:'msg'},({payload})=>{this._addChatMsg(payload);})
      .subscribe(async s=>{if(s==='SUBSCRIBED'){await this._presenceCh.track({id:user.id,name:this._p.name,x:this._p.x,y:this._p.y});}});
    this._lastBroadcast=0;
  }

  _updatePlayerList(){
    const el=document.getElementById('worldPlayerList');if(!el)return;
    const all=[{name:this._p.name,self:true},...this._others];
    el.innerHTML=all.map(p=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--green);flex-shrink:0"></div>
      <div style="font-size:12px;font-weight:${p.self?700:500}">${p.name}${p.self?' (bạn)':''}</div>
    </div>`).join('');
  }

  destroy(){
    if(this._animFrame)cancelAnimationFrame(this._animFrame);
    window.removeEventListener('keydown',this._kd);
    window.removeEventListener('keyup',this._ku);
    if(this._presenceCh){try{this._presenceCh.untrack();this._presenceCh.unsubscribe();}catch{}}
  }
}
