/**
 * 🌍 StudyHub World — Thế giới học tập online
 * Game nông trại kết hợp học từ vựng:
 * - Di chuyển nhân vật bằng WASD / arrow keys
 * - Gặp NPC để nhận quest học tập
 * - Trồng "cây từ vựng" - ôn từ để cây lớn
 * - Gặp người chơi khác real-time
 * - Các khu vực: Library, Farm, Arena, Market, Café
 */
import { aiService, showAPIKeyModal } from '../services/AIService.js';
import { Toast } from '../components/index.js';

// Map data
const MAP_W = 40, MAP_H = 28, TILE = 32;
const ZONES = {
  library:  { x:2,  y:2,  w:8, h:6,  color:'#bfdbfe', label:'📚 Library',  desc:'Đọc và học từ vựng mới' },
  farm:     { x:14, y:2,  w:10,h:8,  color:'#bbf7d0', label:'🌱 Word Farm', desc:'Trồng "cây từ vựng" bằng SRS' },
  arena:    { x:28, y:2,  w:10,h:6,  color:'#fecdd3', label:'⚔️ Arena',    desc:'Thách đấu từ vựng với người khác' },
  market:   { x:2,  y:14, w:8, h:8,  color:'#fef08a', label:'🏪 Market',   desc:'Đổi XP lấy power-up' },
  cafe:     { x:14, y:14, w:8, h:8,  color:'#ddd6fe', label:'☕ AI Café',   desc:'Chat với AI Tutor' },
  park:     { x:26, y:12, w:12,h:10, color:'#cffafe', label:'🌳 Park',      desc:'Nghỉ ngơi & gặp bạn bè' },
};
const NPCS = [
  { id:'librarian', x:5,  y:5,  emoji:'👩‍🏫', name:'Cô Lan',    zone:'library', dialog:'Chào bạn! Hôm nay bạn muốn học từ nào?',     quest:'learn5' },
  { id:'farmer',    x:18, y:6,  emoji:'👨‍🌾', name:'Chú Hùng',  zone:'farm',    dialog:'Cây từ vựng của bạn đã lớn chưa?',             quest:'review3' },
  { id:'warrior',   x:32, y:5,  emoji:'⚔️', name:'Thầy Dũng',  zone:'arena',   dialog:'Sẵn sàng thách đấu chưa? +30 XP nếu thắng!',  quest:'battle' },
  { id:'merchant',  x:5,  y:18, emoji:'🧙', name:'Ông Tùng',   zone:'market',  dialog:'Tôi có power-up tốt lắm! 100 XP = x2 SRS.',    quest:'trade' },
  { id:'aibot',     x:18, y:18, emoji:'🤖', name:'AI Bot',     zone:'cafe',    dialog:'Tôi có thể giúp bạn luyện giao tiếp tiếng Anh!', quest:'chat' },
  { id:'elder',     x:31, y:17, emoji:'🧓', name:'Ông Nam',    zone:'park',    dialog:'Ngồi đây nghỉ ngơi. Kể về tiến độ học của bạn đi!', quest:'rest' },
];

export class WorldPage {
  constructor(db, store, bus) {
    this.db=db; this.store=store; this.bus=bus;
    this._player={ x:20, y:14, dir:'down', moving:false, name:'', avatar:'👤' };
    this._others=[]; this._crops=[]; this._keys={};
    this._nearNPC=null; this._dialog=null;
    this._animFrame=null; this._presenceCh=null;
    this._chatOpen=false; this._chatMsgs=[];
    this._lastMove=0; this._worldChatInput='';
  }

  render() {
    const user=this.store.get('currentUser');
    this._player.name = user?.display_name||user?.username||'Player';
    this._player.avatar = user?.avatar_id ? '👤' : '👤';

    document.querySelector('.main').innerHTML=`
    <div style="position:relative;height:calc(100vh - 60px);overflow:hidden;background:#1a1d23;font-family:var(--font)">

      <!-- TOP HUD -->
      <div style="position:absolute;top:0;left:0;right:0;z-index:100;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);padding:8px 16px;display:flex;align-items:center;gap:16px;border-bottom:1px solid rgba(255,255,255,0.1)">
        <div style="font-size:14px;font-weight:800;color:white;display:flex;align-items:center;gap:6px">🌍 <span style="background:linear-gradient(135deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent">StudyHub World</span></div>
        <div style="flex:1"></div>
        <div style="font-size:12px;color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.1);padding:4px 12px;border-radius:99px">
          👤 <span id="worldPlayerName">${this._player.name}</span>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.1);padding:4px 12px;border-radius:99px" id="worldOnline">🟢 1 online</div>
        <div style="font-size:12px;color:#fbbf24;background:rgba(251,191,36,0.15);padding:4px 12px;border-radius:99px" id="worldXP">⭐ ${user?.xp||0} XP</div>
        <button onclick="worldPage.toggleChat()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;border-radius:99px;padding:4px 12px;font-size:12px;cursor:pointer">💬 Chat</button>
        <button onclick="app.router.navigate('/dashboard')" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;border-radius:99px;padding:4px 12px;font-size:12px;cursor:pointer">← Thoát</button>
      </div>

      <!-- GAME CANVAS -->
      <canvas id="worldCanvas" style="position:absolute;top:40px;left:0;cursor:none;image-rendering:pixelated"></canvas>

      <!-- MINIMAP -->
      <canvas id="minimap" style="position:absolute;top:52px;right:16px;border-radius:10px;border:2px solid rgba(255,255,255,0.2);width:120px;height:84px"></canvas>
      <div style="position:absolute;top:144px;right:16px;font-size:9px;color:rgba(255,255,255,0.5);text-align:center">Minimap</div>

      <!-- ZONE LABEL -->
      <div id="zoneLabel" style="position:absolute;top:56px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:white;padding:6px 16px;border-radius:99px;font-size:13px;font-weight:600;opacity:0;transition:opacity .4s;pointer-events:none;white-space:nowrap"></div>

      <!-- CONTROLS HINT -->
      <div style="position:absolute;bottom:16px;left:16px;background:rgba(0,0,0,0.6);border-radius:10px;padding:10px 14px;font-size:11px;color:rgba(255,255,255,0.7)">
        <div style="font-weight:700;margin-bottom:4px">Điều khiển</div>
        <div>⬆⬇⬅➡ hoặc WASD di chuyển</div>
        <div style="margin-top:2px">SPACE hoặc E để tương tác</div>
        <div style="margin-top:2px">Click chuột để di chuyển đến</div>
      </div>

      <!-- NEARBY ACTION -->
      <div id="nearbyAction" style="position:absolute;bottom:16px;left:50%;transform:translateX(-50%);opacity:0;transition:opacity .3s;pointer-events:none">
        <div style="background:rgba(0,0,0,0.85);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:10px 20px;text-align:center;color:white">
          <div style="font-size:13px;font-weight:700" id="nearbyActionText">Nhấn E để tương tác</div>
        </div>
      </div>

      <!-- DIALOG BOX -->
      <div id="dialogBox" style="position:absolute;bottom:80px;left:50%;transform:translateX(-50%);min-width:400px;max-width:600px;display:none;z-index:200">
        <div style="background:rgba(15,23,42,0.95);border:2px solid rgba(99,102,241,0.5);border-radius:16px;padding:20px;color:white;box-shadow:0 20px 60px rgba(0,0,0,0.6)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
            <div style="font-size:28px" id="dialogNPCEmoji">👾</div>
            <div style="font-size:14px;font-weight:700;color:#a78bfa" id="dialogNPCName">NPC</div>
            <button onclick="worldPage.closeDialog()" style="margin-left:auto;background:none;border:none;color:rgba(255,255,255,0.5);font-size:18px;cursor:pointer">✕</button>
          </div>
          <div id="dialogText" style="font-size:14px;line-height:1.7;margin-bottom:16px;color:rgba(255,255,255,0.9)"></div>
          <div id="dialogActions" style="display:flex;gap:8px;flex-wrap:wrap"></div>
        </div>
      </div>

      <!-- WORLD CHAT -->
      <div id="worldChat" style="position:absolute;top:52px;right:152px;width:260px;display:none;flex-direction:column;background:rgba(0,0,0,0.85);border:1px solid rgba(255,255,255,0.1);border-radius:14px;overflow:hidden;height:320px">
        <div style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.1);font-size:12px;font-weight:700;color:white">💬 World Chat</div>
        <div id="worldChatMsgs" style="flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:6px;font-size:11px"></div>
        <div style="padding:8px;border-top:1px solid rgba(255,255,255,0.1);display:flex;gap:6px">
          <input id="worldChatInput" placeholder="Nhắn tin..." style="flex:1;background:rgba(255,255,255,0.1);border:none;border-radius:8px;padding:6px 10px;color:white;font-size:12px;outline:none" onkeydown="if(event.key==='Enter')worldPage.sendWorldChat()">
          <button onclick="worldPage.sendWorldChat()" style="background:#4f46e5;border:none;border-radius:8px;padding:6px 10px;color:white;font-size:12px;cursor:pointer">→</button>
        </div>
      </div>

      <!-- INVENTORY / CROPS -->
      <div id="inventoryPanel" style="position:absolute;top:52px;left:16px;background:rgba(0,0,0,0.75);border-radius:12px;padding:10px;min-width:140px;display:none">
        <div style="font-size:11px;font-weight:700;color:white;margin-bottom:8px">🌱 Word Farm</div>
        <div id="cropsList" style="font-size:11px;color:rgba(255,255,255,0.8)"></div>
        <button onclick="worldPage.waterAllCrops()" style="margin-top:8px;background:#16a34a;border:none;border-radius:8px;padding:6px 10px;color:white;font-size:11px;cursor:pointer;width:100%">💧 Tưới tất cả</button>
      </div>
    </div>`;

    window.worldPage=this;
    this._initCanvas();
    this._initControls();
    this._loadCrops();
    this._startPresence();
    this._loop();
    Toast.ok('🌍 Chào mừng đến StudyHub World!');
  }

  // ── CANVAS ────────────────────────────────────────────────────────────────
  _initCanvas() {
    const canvas=document.getElementById('worldCanvas');
    const cont=canvas.parentElement;
    const W=cont.clientWidth, H=cont.clientHeight-40;
    canvas.width=W; canvas.height=H;
    this._W=W; this._H=H;
    this._ctx=canvas.getContext('2d');
    this._camX=this._player.x*TILE-W/2;
    this._camY=this._player.y*TILE-H/2;

    // Minimap
    const mm=document.getElementById('minimap');
    mm.width=120; mm.height=84;
    this._mmCtx=mm.getContext('2d');

    canvas.addEventListener('click',(e)=>{
      const rect=canvas.getBoundingClientRect();
      const wx=Math.floor((e.clientX-rect.left+this._camX)/TILE);
      const wy=Math.floor((e.clientY-rect.top+this._camY)/TILE);
      this._moveTo(wx,wy);
    });
  }

  _initControls() {
    this._keys={};
    this._onKeyDown = (e) => {
      this._keys[e.key]=true;
      if((e.key===' '||e.key==='e'||e.key==='E')&&this._nearNPC) {
        e.preventDefault(); this._interactNPC(this._nearNPC);
      }
    };
    this._onKeyUp=(e)=>{ this._keys[e.key]=false; };
    window.addEventListener('keydown',this._onKeyDown);
    window.addEventListener('keyup',this._onKeyUp);
  }

  _loop() {
    const tick=()=>{
      this._update();
      this._draw();
      this._animFrame=requestAnimationFrame(tick);
    };
    this._animFrame=requestAnimationFrame(tick);
  }

  _update() {
    const now=Date.now(); if(now-this._lastMove<120) return;
    const K=this._keys; let dx=0,dy=0;
    if(K['ArrowLeft']||K['a']||K['A']) dx=-1;
    else if(K['ArrowRight']||K['d']||K['D']) dx=1;
    if(K['ArrowUp']||K['w']||K['W']) dy=-1;
    else if(K['ArrowDown']||K['s']||K['S']) dy=1;
    if(dx||dy) {
      this._movePlayer(dx,dy);
      this._lastMove=now;
    }
    // Check NPC proximity
    let near=null;
    for(const npc of NPCS) {
      const dist=Math.abs(npc.x-this._player.x)+Math.abs(npc.y-this._player.y);
      if(dist<=2){ near=npc; break; }
    }
    this._nearNPC=near;
    const na=document.getElementById('nearbyAction');
    if(na){na.style.opacity=near?'1':'0'; if(near)document.getElementById('nearbyActionText').textContent=`Nhấn E để nói chuyện với ${near.name}`;}
    // Zone detection
    this._detectZone();
    // Cam follow
    this._camX+=(this._player.x*TILE-this._W/2-this._camX)*0.12;
    this._camY+=(this._player.y*TILE-this._H/2-this._camY)*0.12;
    this._camX=Math.max(0,Math.min(this._camX,MAP_W*TILE-this._W));
    this._camY=Math.max(0,Math.min(this._camY,MAP_H*TILE-this._H));
  }

  _movePlayer(dx,dy) {
    const nx=this._player.x+dx, ny=this._player.y+dy;
    if(nx<0||nx>=MAP_W||ny<0||ny>=MAP_H) return;
    // Water collision (decorative tiles)
    this._player.x=nx; this._player.y=ny;
    this._player.dir=dy<0?'up':dy>0?'down':dx<0?'left':'right';
    // Broadcast position
    if(this._presenceCh&&Date.now()-this._lastBroadcast>300) {
      this._lastBroadcast=Date.now();
      this._presenceCh.track({ id:this.store.get('currentUser')?.id, name:this._player.name, x:this._player.x, y:this._player.y });
    }
  }

  _moveTo(tx,ty) {
    // Simple path - just teleport with animation
    this._player.x=Math.max(0,Math.min(tx,MAP_W-1));
    this._player.y=Math.max(0,Math.min(ty,MAP_H-1));
  }

  _detectZone() {
    for(const [zid,z] of Object.entries(ZONES)) {
      if(this._player.x>=z.x&&this._player.x<z.x+z.w&&this._player.y>=z.y&&this._player.y<z.y+z.h) {
        if(this._curZone!==zid) {
          this._curZone=zid;
          const lbl=document.getElementById('zoneLabel');
          if(lbl){lbl.textContent=`${z.label} — ${z.desc}`;lbl.style.opacity='1';setTimeout(()=>{if(lbl)lbl.style.opacity='0';},3000);}
          if(zid==='farm'){document.getElementById('inventoryPanel').style.display='block';}
          else{document.getElementById('inventoryPanel').style.display='none';}
        }
        return;
      }
    }
    this._curZone=null;
    document.getElementById('inventoryPanel').style.display='none';
  }

  // ── DRAW ──────────────────────────────────────────────────────────────────
  _draw() {
    const ctx=this._ctx, cx=this._camX, cy=this._camY, T=TILE;
    ctx.clearRect(0,0,this._W,this._H);

    // Background grass
    ctx.fillStyle='#4ade80';
    ctx.fillRect(0,0,this._W,this._H);

    // Grass texture pattern
    for(let tx=0;tx<MAP_W;tx++) for(let ty=0;ty<MAP_H;ty++) {
      const sx=tx*T-cx, sy=ty*T-cy;
      if(sx<-T||sx>this._W||sy<-T||sy>this._H) continue;
      const isDark=(tx+ty)%2===0;
      ctx.fillStyle=isDark?'#4ade80':'#22c55e';
      ctx.fillRect(sx,sy,T,T);
      // Tiny grass dots
      if((tx*7+ty*3)%5===0){ctx.fillStyle='rgba(0,0,0,0.05)';ctx.fillRect(sx+4,sy+4,2,2);}
    }

    // Draw zones
    for(const z of Object.values(ZONES)) {
      const sx=z.x*T-cx, sy=z.y*T-cy;
      // Zone floor
      ctx.fillStyle=z.color;
      ctx.fillRect(sx,sy,z.w*T,z.h*T);
      // Zone border
      ctx.strokeStyle='rgba(0,0,0,0.2)';
      ctx.lineWidth=2;
      ctx.strokeRect(sx,sy,z.w*T,z.h*T);
      // Zone label
      if(sx>-100&&sx<this._W&&sy>-20&&sy<this._H) {
        ctx.fillStyle='rgba(0,0,0,0.6)';
        ctx.font='bold 11px sans-serif';
        ctx.textAlign='center';
        ctx.fillText(z.label,sx+z.w*T/2,sy+14);
      }
    }

    // Draw paths (roads)
    ctx.fillStyle='#d6b896';
    ctx.fillRect(12*T-cx,0*T-cy,2*T,MAP_H*T);  // vertical road
    ctx.fillRect(0*T-cx,12*T-cy,MAP_W*T,2*T);  // horizontal road

    // Draw decorations
    this._drawDecorations(ctx,cx,cy,T);

    // Draw crops
    for(const crop of this._crops) {
      const sx=crop.x*T-cx+T/2, sy=crop.y*T-cy+T/2;
      if(sx<-T||sx>this._W) continue;
      const size=crop.level>=3?22:crop.level>=2?18:crop.level>=1?14:10;
      ctx.font=`${size}px serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(crop.level>=3?'🌳':crop.level>=2?'🌿':crop.level>=1?'🌱':'🌰',sx,sy);
    }

    // Draw NPCs
    for(const npc of NPCS) {
      const sx=npc.x*T-cx, sy=npc.y*T-cy;
      if(sx<-T||sx>this._W) continue;
      // Shadow
      ctx.fillStyle='rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(sx+T/2,sy+T-4,10,4,0,0,Math.PI*2); ctx.fill();
      // Emoji
      ctx.font='24px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(npc.emoji,sx+T/2,sy+T/2-2);
      // Name
      ctx.fillStyle='rgba(0,0,0,0.75)'; ctx.beginPath(); ctx.roundRect(sx+T/2-24,sy-14,48,14,4); ctx.fill();
      ctx.fillStyle='white'; ctx.font='bold 9px sans-serif';
      ctx.fillText(npc.name,sx+T/2,sy-7);
      // Interaction indicator
      if(this._nearNPC?.id===npc.id){ctx.fillStyle='#fbbf24';ctx.font='14px serif';ctx.fillText('!',sx+T-4,sy);}
    }

    // Draw other players
    for(const other of this._others) {
      const sx=other.x*T-cx, sy=other.y*T-cy;
      if(sx<-T||sx>this._W) continue;
      ctx.fillStyle='rgba(99,102,241,0.6)'; ctx.beginPath(); ctx.roundRect(sx+4,sy+4,T-8,T-8,6); ctx.fill();
      ctx.font='18px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('🧑',sx+T/2,sy+T/2-2);
      ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.beginPath(); ctx.roundRect(sx+T/2-20,sy-14,40,14,4); ctx.fill();
      ctx.fillStyle='white'; ctx.font='8px sans-serif'; ctx.fillText(other.name||'?',sx+T/2,sy-7);
    }

    // Draw player
    const px=this._player.x*T-cx, py=this._player.y*T-cy;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(px+T/2,py+T-3,12,5,0,0,Math.PI*2); ctx.fill();
    // Body (highlight ring)
    ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.roundRect(px+2,py+2,T-4,T-4,8); ctx.stroke();
    ctx.fillStyle='rgba(79,70,229,0.3)'; ctx.beginPath(); ctx.roundRect(px+2,py+2,T-4,T-4,8); ctx.fill();
    // Player emoji
    ctx.font='22px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('😊',px+T/2,py+T/2-2);
    // Name tag
    ctx.fillStyle='rgba(79,70,229,0.9)'; ctx.beginPath(); ctx.roundRect(px+T/2-24,py-16,48,16,5); ctx.fill();
    ctx.fillStyle='white'; ctx.font='bold 9px sans-serif';
    ctx.fillText(this._player.name.slice(0,8),px+T/2,py-8);

    // Draw minimap
    this._drawMinimap();
  }

  _drawDecorations(ctx,cx,cy,T) {
    const deco=[
      {x:11,y:0,e:'🌲'},{x:11,y:4,e:'🌲'},{x:11,y:8,e:'🌲'},
      {x:13,y:12,e:'🌊'},{x:13,y:11,e:'🌊'},
      {x:25,y:12,e:'🌊'},{x:25,y:13,e:'🌊'},
      {x:24,y:2,e:'🏠'},{x:24,y:6,e:'🏠'},
      {x:1,y:12,e:'🌺'},{x:8,y:1,e:'🌸'},
    ];
    for(const d of deco){
      const sx=d.x*T-cx,sy=d.y*T-cy;
      if(sx<-T||sx>this._W) continue;
      ctx.font='20px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(d.e,sx+T/2,sy+T/2);
    }
  }

  _drawMinimap() {
    const ctx=this._mmCtx, mw=120, mh=84;
    const scx=mw/MAP_W, scy=mh/MAP_H;
    ctx.fillStyle='#166534'; ctx.fillRect(0,0,mw,mh);
    // Zones
    for(const z of Object.values(ZONES)){ctx.fillStyle=z.color+'aa';ctx.fillRect(z.x*scx,z.y*scy,z.w*scx,z.h*scy);}
    // Others
    for(const o of this._others){ctx.fillStyle='#818cf8';ctx.fillRect(o.x*scx-1.5,o.y*scy-1.5,3,3);}
    // Player
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(this._player.x*scx,this._player.y*scy,3,0,Math.PI*2);ctx.fill();
    // Viewport rect
    ctx.strokeStyle='rgba(255,255,255,0.5)';ctx.lineWidth=1;
    ctx.strokeRect(this._camX/TILE*scx,this._camY/TILE*scy,this._W/TILE*scx,this._H/TILE*scy);
  }

  // ── NPC INTERACTIONS ──────────────────────────────────────────────────────
  _interactNPC(npc) {
    const dlg=document.getElementById('dialogBox');
    document.getElementById('dialogNPCEmoji').textContent=npc.emoji;
    document.getElementById('dialogNPCName').textContent=npc.name;
    document.getElementById('dialogText').textContent=npc.dialog;
    const acts=document.getElementById('dialogActions');
    acts.innerHTML='';
    const addBtn=(label,color,fn)=>{const b=document.createElement('button');b.textContent=label;b.style.cssText=`background:${color};color:white;border:none;border-radius:99px;padding:8px 16px;font-size:12px;cursor:pointer;font-weight:600`;b.onclick=fn;acts.appendChild(b);};

    if(npc.zone==='library'){
      addBtn('📚 Học từ vựng','#3b82f6',()=>{ this.closeDialog(); app.router.navigate('/vocabulary'); });
      addBtn('📅 Xem lộ trình','#8b5cf6',()=>{ this.closeDialog(); app.router.navigate('/roadmap'); });
    } else if(npc.zone==='farm'){
      addBtn('🌱 Trồng từ mới','#16a34a',()=>this._plantCrop());
      addBtn('💧 Ôn tập (tưới cây)','#0891b2',()=>this._waterCrop());
    } else if(npc.zone==='arena'){
      addBtn('⚔️ Vào Word Battle','#dc2626',()=>{ this.closeDialog(); app.router.navigate('/game'); });
      addBtn('👥 Thách bạn bè','#f97316',()=>{ this.closeDialog(); app.router.navigate('/friends'); });
    } else if(npc.zone==='cafe'){
      addBtn('🤖 Chat AI Tutor','#7c3aed',()=>{ this.closeDialog(); app.router.navigate('/ai-tutor'); });
      addBtn('💬 Luyện giao tiếp','#2563eb',()=>{ this.closeDialog(); app.router.navigate('/conversation'); });
    } else if(npc.zone==='market'){
      addBtn('📊 Xem tiến độ','#d97706',()=>{ this.closeDialog(); app.router.navigate('/dashboard'); });
      addBtn('🏆 Bảng xếp hạng','#b45309',()=>{ this.closeDialog(); app.router.navigate('/leaderboard'); });
    } else if(npc.zone==='park'){
      addBtn('😌 Nghỉ ngơi (+XP)','#0d9488',()=>{ this._restInPark(); });
      addBtn('👥 Xem bạn bè','#4f46e5',()=>{ this.closeDialog(); app.router.navigate('/friends'); });
    }
    addBtn('Đóng','rgba(255,255,255,0.2)',()=>this.closeDialog());
    dlg.style.display='block';
  }

  closeDialog() { document.getElementById('dialogBox').style.display='none'; }

  // ── FARM MECHANICS ────────────────────────────────────────────────────────
  async _loadCrops() {
    const user=this.store.get('currentUser');
    try {
      const vocab=await this.db.select('vocabulary',{eq:{user_id:user.id}}).catch(()=>[]);
      // Convert SRS vocab to crops
      this._crops=vocab.slice(0,20).map((v,i)=>({
        word:v.word, level:Math.min(v.srs_level||0,3),
        x:15+Math.floor(i%5)*2, y:3+Math.floor(i/5)*2,
        nextReview:v.next_review, id:v.id
      }));
      this._renderCropsList();
    } catch{}
  }

  _renderCropsList() {
    const el=document.getElementById('cropsList'); if(!el) return;
    el.innerHTML=this._crops.slice(0,8).map(c=>`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
      <span>${c.level>=3?'🌳':c.level>=2?'🌿':c.level>=1?'🌱':'🌰'}</span>
      <span style="font-size:10px">${c.word}</span>
      <span style="margin-left:auto;font-size:9px;color:rgba(255,255,255,0.5)">Lv${c.level}</span>
    </div>`).join('');
  }

  _plantCrop() {
    Toast.info('Đến trang Từ vựng để thêm từ mới vào nông trại!');
    this.closeDialog();
    setTimeout(()=>app.router.navigate('/vocabulary'),1000);
  }

  _waterCrop() {
    const dueCrops=this._crops.filter(c=>new Date(c.nextReview)<=new Date());
    if(!dueCrops.length){Toast.ok('Tất cả cây đã được tưới hôm nay! 🌳');this.closeDialog();return;}
    Toast.ok(`${dueCrops.length} từ cần ôn tập! Chuyển đến Flashcard...`);
    this.closeDialog();
    setTimeout(()=>app.router.navigate('/vocabulary'),800);
  }

  async waterAllCrops() { this._waterCrop(); }

  async _restInPark() {
    const user=this.store.get('currentUser');
    try {
      await this.db.update('profiles',user.id,{xp:(user.xp||0)+5});
      Toast.ok('+5 XP cho việc nghỉ ngơi! 😌');
    } catch{}
    this.closeDialog();
  }

  // ── WORLD CHAT ─────────────────────────────────────────────────────────────
  toggleChat() {
    const el=document.getElementById('worldChat');
    this._chatOpen=!this._chatOpen;
    el.style.display=this._chatOpen?'flex':'none';
    if(this._chatOpen) document.getElementById('worldChatInput')?.focus();
  }

  async sendWorldChat() {
    const input=document.getElementById('worldChatInput');
    const text=input?.value?.trim(); if(!text) return;
    input.value='';
    const user=this.store.get('currentUser');
    const msg={name:user?.display_name||'You',text,time:Date.now()};
    this._addWorldChatMsg(msg);
    // Broadcast via Supabase
    try {
      this.db.client.channel('world-chat').send({type:'broadcast',event:'msg',payload:msg});
    } catch{}
  }

  _addWorldChatMsg(msg) {
    this._chatMsgs.push(msg);
    if(this._chatMsgs.length>50) this._chatMsgs=this._chatMsgs.slice(-50);
    const el=document.getElementById('worldChatMsgs'); if(!el) return;
    const div=document.createElement('div');
    div.innerHTML=`<span style="color:#a78bfa;font-weight:700">${msg.name}:</span> <span style="color:rgba(255,255,255,0.85)">${msg.text}</span>`;
    el.appendChild(div); el.scrollTop=el.scrollHeight;
  }

  // ── PRESENCE ──────────────────────────────────────────────────────────────
  _startPresence() {
    const user=this.store.get('currentUser'); if(!user) return;
    this._presenceCh=this.db.client.channel('world-presence',{config:{presence:{key:user.id}}});
    this._presenceCh
      .on('presence',{event:'sync'},()=>{
        const state=this._presenceCh.presenceState();
        this._others=Object.values(state).flat()
          .filter(u=>u.id!==user.id)
          .map(u=>({id:u.id,name:u.name,x:u.x,y:u.y}));
        const cnt=document.getElementById('worldOnline');
        if(cnt) cnt.textContent=`🟢 ${this._others.length+1} online`;
      })
      .on('broadcast',{event:'msg'},({payload})=>{
        if(payload.name!==this._player.name) this._addWorldChatMsg(payload);
      })
      .subscribe(async(status)=>{
        if(status==='SUBSCRIBED'){
          await this._presenceCh.track({id:user.id,name:this._player.name,x:this._player.x,y:this._player.y});
        }
      });
    this._lastBroadcast=0;
  }

  destroy() {
    if(this._animFrame) cancelAnimationFrame(this._animFrame);
    window.removeEventListener('keydown',this._onKeyDown);
    window.removeEventListener('keyup',this._onKeyUp);
    if(this._presenceCh){try{this._presenceCh.untrack();this._presenceCh.unsubscribe();}catch{}}
  }
}
