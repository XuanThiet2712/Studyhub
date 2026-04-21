import { Toast } from '../components/index.js';
import { User }  from '../models/index.js';

const STATS_DEF = {
  hp:  { name:'HP',        icon:'❤️', color:'#f43f5e', desc:'Máu',      base:100, per:20, cost:30 },
  mp:  { name:'Mana',      icon:'💙', color:'#4f6ef7', desc:'Năng lượng', base:50,  per:10, cost:25 },
  atk: { name:'Sức đánh',  icon:'⚔️', color:'#f97316', desc:'Dame/đòn',  base:15,  per:5,  cost:40 },
  crit:{ name:'Chí mạng',  icon:'🎯', color:'#f59e0b', desc:'% crit',    base:10,  per:3,  cost:50 },
  spd: { name:'Tốc đánh',  icon:'⚡', color:'#8b5cf6', desc:'Số đòn/lượt',base:1,  per:1,  cost:35 },
};

const MONSTERS = [
  { id:'slime',  name:'🌀 Slime Từ vựng', emoji:'🟢', hp:80,  atk:8,  reward:20, need:3,  diff:'Dễ',  color:'#10b981', bg:'#ecfdf5' },
  { id:'goblin', name:'👺 Goblin Ngữ pháp',emoji:'👺', hp:180, atk:18, reward:45, need:5,  diff:'TB',  color:'#f97316', bg:'#fff7ed' },
  { id:'orc',    name:'👹 Orc TOEIC',     emoji:'👹', hp:320, atk:28, reward:80, need:8,  diff:'Khó', color:'#f43f5e', bg:'#fff1f2' },
  { id:'dragon', name:'🐉 Rồng Boss',     emoji:'🐉', hp:600, atk:45, reward:160,need:12, diff:'Boss',color:'#8b5cf6', bg:'#f5f3ff' },
];

function getRaw(uid) { return JSON.parse(localStorage.getItem(`rpg_${uid}`) || '{}'); }
function saveRaw(uid, d) { localStorage.setItem(`rpg_${uid}`, JSON.stringify(d)); }
function calcStats(levels) {
  return Object.fromEntries(Object.entries(STATS_DEF).map(([k,d])=>[k, d.base + (levels[k]||0)*d.per]));
}

export class RPGPage {
  constructor(db,store,bus){ this.db=db;this.store=store;this.bus=bus; this._vocab=[]; this._b=null; }

  render() {
    const user = this.store.get('currentUser');
    const u = new User(user);
    const raw = getRaw(user.id);
    const levels = raw.levels || {};
    const stats = calcStats(levels);
    const currentHp = raw.currentHp ?? stats.hp;
    const currentMp = raw.currentMp ?? stats.mp;

    document.querySelector('.main').innerHTML=`
    <div class="page" style="max-width:960px">
      <div class="page-header-row page-header">
        <div>
          <h1 class="page-title">🗡️ StudyHub RPG</h1>
          <p class="page-sub">Nâng chỉ số · Đánh quái · PvP · Kiếm XP</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <div style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#78350f;padding:5px 14px;border-radius:99px;font-size:13px;font-weight:800;box-shadow:0 2px 8px rgba(245,158,11,.3)" id="rpgXP">⭐ ${u.xp||0} XP</div>
        </div>
      </div>

      <div class="tabs" style="margin-bottom:20px">
        <button class="tab active" onclick="rpgPage.tab('char',this)">🧙 Nhân vật</button>
        <button class="tab" onclick="rpgPage.tab('hunt',this)">⚔️ Săn quái</button>
        <button class="tab" onclick="rpgPage.tab('pvp',this)">🏆 PvP</button>
        <button class="tab" onclick="rpgPage.tab('rank',this)">👑 Xếp hạng</button>
      </div>
      <div id="rpgContent"></div>
    </div>`;

    window.rpgPage = this;
    this._loadVocab().then(()=>this._renderChar());
  }

  async _loadVocab(){
    const u=this.store.get('currentUser');
    try { this._vocab=await this.db.select('vocabulary',{eq:{user_id:u.id}}).catch(()=>[]); } catch{}
  }

  tab(t,btn){
    document.querySelectorAll('.tabs .tab').forEach(b=>b.classList.remove('active'));
    if(btn)btn.classList.add('active');
    const el=document.getElementById('rpgContent');
    if(t==='char')this._renderChar(el);
    else if(t==='hunt')this._renderHunt(el);
    else if(t==='pvp')this._renderPvP(el);
    else if(t==='rank')this._renderRank(el);
  }

  _renderChar(el) {
    el=el||document.getElementById('rpgContent');
    const user=this.store.get('currentUser');
    const u=new User(user);
    const raw=getRaw(user.id);
    const levels=raw.levels||{};
    const stats=calcStats(levels);
    const hp=raw.currentHp??stats.hp, mp=raw.currentMp??stats.mp;
    const xp=user.xp||0;

    el.innerHTML=`
    <div class="grid-2" style="gap:20px;align-items:start">
      <!-- LEFT: Character Card -->
      <div class="rpg-hero" style="padding:24px;color:white;position:relative;overflow:hidden">
        <div style="position:absolute;top:-30px;right:-30px;width:160px;height:160px;border-radius:50%;background:rgba(139,92,246,0.12)"></div>
        <div style="position:absolute;bottom:-20px;left:-20px;width:100px;height:100px;border-radius:50%;background:rgba(79,110,247,0.1)"></div>

        <!-- Avatar + name -->
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;position:relative">
          <div style="width:60px;height:60px;border-radius:50%;background:var(--accent-g);display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 6px 20px rgba(79,110,247,.4)">🧙</div>
          <div>
            <div style="font-size:17px;font-weight:800">${u.displayName}</div>
            <div style="font-size:11px;color:rgba(255,255,255,.5)">Level ${user.level||1} · TOEIC Warrior</div>
          </div>
          <div style="margin-left:auto;text-align:right">
            <div style="font-size:13px;font-weight:700;color:#fbbf24">⭐ ${xp} XP</div>
            <div style="font-size:10px;color:rgba(255,255,255,.4)">Tổng XP</div>
          </div>
        </div>

        <!-- HP Bar -->
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.6);margin-bottom:5px">
            <span>${STATS_DEF.hp.icon} HP</span>
            <span style="font-family:var(--mono);font-weight:700">${hp} / ${stats.hp}</span>
          </div>
          <div class="hp-bar"><div class="hp-fill" style="width:${Math.round(hp/stats.hp*100)}%"></div></div>
        </div>
        <!-- MP Bar -->
        <div style="margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.6);margin-bottom:5px">
            <span>${STATS_DEF.mp.icon} Mana</span>
            <span style="font-family:var(--mono);font-weight:700">${mp} / ${stats.mp}</span>
          </div>
          <div class="mp-bar"><div class="mp-fill" style="width:${Math.round(mp/stats.mp*100)}%"></div></div>
        </div>

        <!-- Combat Stats Grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          ${[['atk','⚔️'],['crit','🎯'],['spd','⚡']].map(([k,icon])=>`
          <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px;text-align:center">
            <div style="font-size:18px;margin-bottom:3px">${icon}</div>
            <div style="font-size:17px;font-weight:800;color:${STATS_DEF[k].color};font-family:var(--mono)">${stats[k]}${k==='crit'?'%':''}</div>
            <div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px">${STATS_DEF[k].name}</div>
            <div style="font-size:9px;color:rgba(255,255,255,.25)">Lv${levels[k]||0}</div>
          </div>`).join('')}
        </div>

        <!-- Restore button -->
        <button onclick="rpgPage.restoreHP()" style="margin-top:14px;width:100%;background:rgba(16,185,129,.2);border:1px solid rgba(16,185,129,.4);color:#6ee7b7;border-radius:var(--r-md);padding:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font)" ${hp>=stats.hp&&mp>=stats.mp?'disabled':''}>💊 Hồi phục HP/MP</button>
      </div>

      <!-- RIGHT: Upgrade Stats -->
      <div>
        <div class="card" style="margin-bottom:14px">
          <div class="card-title">⬆️ Nâng chỉ số</div>
          <div style="background:var(--yellow-l);border:1px solid rgba(245,158,11,.3);border-radius:var(--r-md);padding:9px 12px;margin-bottom:14px;font-size:12px">
            <strong style="color:#92400e">⭐ XP còn lại: ${xp}</strong> · Dùng XP để nâng chỉ số chiến đấu
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${Object.entries(STATS_DEF).map(([k,d])=>`
            <div class="stat-upgrade-card">
              <div style="font-size:22px">${d.icon}</div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:700">${d.name}</div>
                <div style="font-size:11px;color:var(--muted)">${d.desc} · Lv${levels[k]||0} → ${stats[k]}${k==='crit'?'%':''}</div>
                <!-- mini progress -->
                <div style="height:4px;background:var(--bg3);border-radius:99px;margin-top:5px;overflow:hidden">
                  <div style="width:${Math.min((levels[k]||0)*10,100)}%;height:100%;background:${d.color};border-radius:99px"></div>
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:11px;color:var(--orange);font-weight:700;margin-bottom:4px">⭐${d.cost}/lv</div>
                <button onclick="rpgPage.upgradeStat('${k}')" class="btn btn-primary btn-sm" ${xp<d.cost?'disabled':''}>▲ Nâng</button>
              </div>
            </div>`).join('')}
          </div>
        </div>

        <!-- Achievements mini -->
        <div class="card">
          <div class="card-title">🏅 Thống kê chiến đấu</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${[
              ['⚔️','Quái đã giết',(raw.kills||0),'var(--red)'],
              ['🏆','PvP thắng',(raw.pvpWins||0),'var(--yellow)'],
              ['📚','Từ trong kho',this._vocab.length,'var(--blue)'],
              ['⭐','Tổng XP kiếm được',(raw.totalXPGained||0),'var(--green)'],
            ].map(([ic,lb,val,c])=>`<div style="background:var(--bg2);border-radius:var(--r-md);padding:10px;border:1px solid var(--border)">
              <div style="font-size:18px">${ic}</div>
              <div style="font-size:17px;font-weight:800;color:${c};font-family:var(--mono)">${val}</div>
              <div style="font-size:10px;color:var(--muted);margin-top:1px">${lb}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  }

  async upgradeStat(k){
    const user=this.store.get('currentUser');
    const cost=STATS_DEF[k].cost;
    if((user.xp||0)<cost){Toast.err(`Cần ${cost} XP!`);return;}
    const raw=getRaw(user.id);
    raw.levels=raw.levels||{};
    raw.levels[k]=(raw.levels[k]||0)+1;
    const stats=calcStats(raw.levels);
    // Restore HP/MP on upgrade
    raw.currentHp=stats.hp; raw.currentMp=stats.mp;
    saveRaw(user.id,raw);
    const newXp=(user.xp||0)-cost;
    await this.db.update('profiles',user.id,{xp:newXp});
    this.store.set('currentUser',{...user,xp:newXp});
    document.getElementById('rpgXP').textContent=`⭐ ${newXp} XP`;
    Toast.ok(`${STATS_DEF[k].icon} ${STATS_DEF[k].name} nâng lên Lv${raw.levels[k]}! 🎉`);
    this._renderChar();
  }

  restoreHP(){
    const user=this.store.get('currentUser');
    const raw=getRaw(user.id);
    const stats=calcStats(raw.levels||{});
    raw.currentHp=stats.hp; raw.currentMp=stats.mp;
    saveRaw(user.id,raw);
    Toast.ok('💊 HP/MP đã hồi phục đầy!');
    this._renderChar();
  }

  // ── HUNT ─────────────────────────────────────────────────────────────────
  _renderHunt(el){
    el=el||document.getElementById('rpgContent');
    el.innerHTML=`
    <div>
      <div style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:14px">🗺️ Chọn kẻ địch để chiến đấu · Trả lời từ vựng đúng để tấn công!</div>
      <div class="grid-2" style="gap:12px;margin-bottom:20px">
        ${MONSTERS.map(m=>`
        <div onclick="rpgPage.startBattle('${m.id}')" style="background:${m.bg};border:2px solid ${m.color}30;border-radius:var(--r-xl);padding:20px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden" onmouseover="this.style.borderColor='${m.color}';this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px ${m.color}30'" onmouseout="this.style.borderColor='${m.color}30';this.style.transform='';this.style.boxShadow=''">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
            <div style="font-size:44px;line-height:1">${m.emoji}</div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:800">${m.name}</div>
              <div style="display:flex;gap:6px;margin-top:5px;flex-wrap:wrap">
                <span style="font-size:10px;padding:2px 7px;border-radius:99px;background:${m.color}20;color:${m.color};font-weight:700">${m.diff}</span>
                <span style="font-size:10px;padding:2px 7px;border-radius:99px;background:rgba(245,158,11,.15);color:#b45309;font-weight:700">+${m.reward} XP</span>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:14px;font-size:12px;color:var(--muted)">
            <span>❤️ HP: <strong>${m.hp}</strong></span>
            <span>⚔️ ATK: <strong>${m.atk}</strong></span>
            <span>📚 Cần: <strong>${m.need} từ</strong></span>
          </div>
        </div>`).join('')}
      </div>
      <div id="battleArea"></div>
    </div>`;
  }

  async startBattle(mid){
    const m=MONSTERS.find(x=>x.id===mid);
    if(!m) return;
    if(this._vocab.length<m.need){Toast.err(`Cần ${m.need} từ vựng! Bạn có ${this._vocab.length}.`);return;}
    const user=this.store.get('currentUser');
    const raw=getRaw(user.id);
    const stats=calcStats(raw.levels||{});
    const hp=raw.currentHp??stats.hp;
    if(hp<=0){Toast.err('HP = 0! Hồi phục HP trước ở tab Nhân vật.');return;}
    this._b={
      m:{...m,curHp:m.hp},
      p:{...stats,curHp:hp,curMp:raw.currentMp??stats.mp},
      round:0, log:[], vocab:this._pickQ(m.need), qi:0,
    };
    this._drawBattle();
  }

  _pickQ(n){
    const pool=[...this._vocab].filter(v=>v.meaning_vi||v.meaningVi).sort(()=>Math.random()-.5).slice(0,n);
    return pool.map(v=>{
      const others=this._vocab.filter(w=>w.id!==v.id&&(w.meaning_vi||w.meaningVi)).sort(()=>Math.random()-.5).slice(0,3);
      const correct=v.meaning_vi||v.meaningVi||'?';
      const choices=[correct,...others.map(w=>w.meaning_vi||w.meaningVi||'?')].sort(()=>Math.random()-.5);
      return {word:v.word,phonetic:v.phonetic||'',correct,choices,correctIdx:choices.indexOf(correct)};
    });
  }

  _drawBattle(){
    const b=this._b;
    const el=document.getElementById('battleArea')||document.getElementById('rpgContent');
    const pHp=Math.max(0,Math.round(b.p.curHp/b.p.hp*100));
    const mHp=Math.max(0,Math.round(b.m.curHp/b.m.hp*100));
    const q=b.vocab[b.qi];
    el.innerHTML=`
    <div class="rpg-hero" style="padding:22px;color:white">
      <!-- HUD -->
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center;margin-bottom:18px">
        <div>
          <div style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:4px">🧙 Bạn</div>
          <div style="font-size:11px;color:#fb7185;margin-bottom:3px">❤️ ${b.p.curHp}/${b.p.hp}</div>
          <div class="hp-bar" style="margin-bottom:4px"><div class="hp-fill" style="width:${pHp}%"></div></div>
          <div style="font-size:10px;color:#818cf8;margin-bottom:2px">💙 ${b.p.curMp}/${b.p.mp}</div>
          <div class="mp-bar"><div class="mp-fill" style="width:${Math.round(b.p.curMp/b.p.mp*100)}%"></div></div>
          <div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:5px">⚔️${b.p.atk} 🎯${b.p.crit}% ⚡${b.p.spd}</div>
        </div>
        <div style="font-size:24px;font-weight:900;color:rgba(255,255,255,.2)">VS</div>
        <div style="text-align:right">
          <div style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:4px">${b.m.name}</div>
          <div style="font-size:11px;color:#fb7185;margin-bottom:3px">❤️ ${b.m.curHp}/${b.m.hp}</div>
          <div class="hp-bar"><div class="hp-fill" style="width:${mHp}%;background:linear-gradient(90deg,${b.m.color},${b.m.color}aa)"></div></div>
          <div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:5px">${b.m.emoji} ⚔️${b.m.atk}</div>
        </div>
      </div>

      <!-- Question -->
      ${q?`<div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:var(--r-xl);padding:18px;margin-bottom:14px;text-align:center">
        <div style="font-size:10px;color:rgba(255,255,255,.45);margin-bottom:10px">Câu ${b.qi+1}/${b.vocab.length} · Trả lời ĐÚNG → tấn công · SAI → nhận dame!</div>
        <div style="font-size:28px;font-weight:800;color:#a5b4fc;font-family:'Lora',serif;margin-bottom:4px">${q.word}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.4);font-family:var(--mono);margin-bottom:14px">${q.phonetic}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${q.choices.map((c,i)=>`<button id="ab${i}" onclick="rpgPage.answer(${i},${q.correctIdx})"
            style="padding:11px 12px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.12);border-radius:var(--r-lg);color:rgba(255,255,255,.85);cursor:pointer;font-size:12px;text-align:left;transition:all .15s;font-family:var(--font)"
            onmouseover="this.style.background='rgba(99,102,241,.3)';this.style.borderColor='#818cf8'"
            onmouseout="if(!this.disabled){this.style.background='rgba(255,255,255,.07)';this.style.borderColor='rgba(255,255,255,.12)'}">
            <span style="font-weight:700;color:rgba(255,255,255,.35);margin-right:7px">${'ABCD'[i]}</span>${c}
          </button>`).join('')}
        </div>
      </div>`:''}

      <!-- Battle log -->
      <div style="background:rgba(0,0,0,.35);border-radius:var(--r-lg);padding:10px 12px;font-family:var(--mono);font-size:11px;max-height:100px;overflow-y:auto;margin-bottom:12px">
        ${b.log.slice(-5).map(l=>`<div style="color:${l.startsWith('✅')?'#4ade80':l.startsWith('❌')?'#f87171':l.startsWith('💥')?'#fbbf24':'rgba(255,255,255,.5)'};margin-bottom:2px">${l}</div>`).join('') || '<div style="color:rgba(255,255,255,.3)">⚔️ Chiến đấu bắt đầu!</div>'}
      </div>
      <button onclick="rpgPage.tab('hunt')" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.6);border-radius:var(--r-md);padding:7px 14px;font-size:12px;cursor:pointer">← Bỏ cuộc</button>
    </div>`;
  }

  async answer(chosen, correct){
    const b=this._b, isOk=chosen===correct;
    ['ab0','ab1','ab2','ab3'].forEach((id,i)=>{
      const el=document.getElementById(id); if(!el) return;
      el.disabled=true;
      if(i===correct){el.style.background='rgba(16,185,129,.4)';el.style.borderColor='#10b981';}
      else if(i===chosen&&!isOk){el.style.background='rgba(244,63,94,.3)';el.style.borderColor='#f43f5e';}
    });
    const user=this.store.get('currentUser');
    const raw=getRaw(user.id);
    if(isOk){
      const isCrit=Math.random()*100<b.p.crit;
      const dmg=Math.floor(b.p.atk*(isCrit?1.8:1)*(0.85+Math.random()*.3));
      b.m.curHp=Math.max(0,b.m.curHp-dmg);
      b.log.push(`✅ ${b.vocab[b.qi].word} Đúng! Gây ${dmg} dame${isCrit?' 💥CRIT!':''}`);
    } else {
      const dmg=Math.floor(b.m.atk*(0.7+Math.random()*.5));
      b.p.curHp=Math.max(0,b.p.curHp-dmg);
      b.log.push(`❌ Sai! ${b.m.name} phản đòn ${dmg} dame`);
      raw.currentHp=b.p.curHp; saveRaw(user.id,raw);
    }
    b.round++; b.qi++;
    setTimeout(async()=>{
      if(b.p.curHp<=0) await this._endBattle(false);
      else if(b.m.curHp<=0) await this._endBattle(true);
      else if(b.qi>=b.vocab.length){b.vocab=this._pickQ(b.m.need);b.qi=0;b.log.push('🔄 Vòng mới!');this._drawBattle();}
      else this._drawBattle();
    },1100);
  }

  async _endBattle(won){
    const user=this.store.get('currentUser');
    const raw=getRaw(user.id);
    const b=this._b;
    raw.currentHp=b.p.curHp; raw.currentMp=b.p.curMp;
    if(won){ raw.kills=(raw.kills||0)+1; raw.totalXPGained=(raw.totalXPGained||0)+b.m.reward; }
    saveRaw(user.id,raw);
    let newXp=user.xp||0;
    if(won){ newXp+=b.m.reward; await this.db.update('profiles',user.id,{xp:newXp}); this.store.set('currentUser',{...user,xp:newXp}); document.getElementById('rpgXP').textContent=`⭐ ${newXp} XP`; }
    const el=document.getElementById('battleArea')||document.getElementById('rpgContent');
    el.innerHTML=`
    <div style="background:${won?'linear-gradient(135deg,#052e16,#14532d)':'linear-gradient(135deg,#1c0404,#450a0a)'};border-radius:var(--r-2xl);padding:40px;text-align:center;color:white">
      <div style="font-size:72px;margin-bottom:14px;animation:bounceIn .5s">${won?'🏆':'💀'}</div>
      <div style="font-size:22px;font-weight:900;margin-bottom:8px">${won?'CHIẾN THẮNG!':'THẤT BẠI...'}</div>
      <div style="font-size:14px;color:rgba(255,255,255,.7);margin-bottom:24px">${won?`+${b.m.reward} XP! ${b.m.name} đã bị tiêu diệt 🎉`:`HP còn lại: ${b.p.curHp}. Hồi phục và thử lại!`}</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button onclick="rpgPage.tab('hunt')" class="btn btn-ghost" style="border-color:rgba(255,255,255,.25);color:white">🗺️ Chọn quái khác</button>
        ${won?`<button onclick="rpgPage.startBattle('${b.m.id}')" class="btn btn-primary">🔄 Chiến lại</button>`:''}
        <button onclick="rpgPage.tab('char')" class="btn" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none">⬆️ Nâng chỉ số</button>
      </div>
    </div>`;
    this._b=null;
  }

  _renderPvP(el){
    el=el||document.getElementById('rpgContent');
    const online=(this.store.get('onlineUsers')||[]);
    el.innerHTML=`
    <div class="grid-2" style="gap:16px;align-items:start">
      <div class="card">
        <div class="card-title">🟢 Online (${online.length+1})</div>
        ${online.length?online.map(u=>`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
          <div style="width:8px;height:8px;border-radius:50%;background:var(--green);flex-shrink:0"></div>
          <div style="flex:1;font-size:13px;font-weight:600">${u.display_name||u.username||'?'}</div>
          <button onclick="rpgPage.challengePvP('${u.id}','${(u.display_name||u.username||'?').replace(/'/g,'_')}')" class="btn btn-danger btn-sm">⚔️ Thách</button>
        </div>`).join(''):'<div class="empty" style="padding:20px"><div class="empty-icon" style="font-size:32px">🌙</div><div class="empty-text">Không có ai online</div></div>'}
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="card">
          <div class="card-title">🤖 Luyện với AI Bot</div>
          <div style="font-size:13px;color:var(--muted);margin-bottom:12px">Thi từ vựng với AI để rèn luyện trước khi PvP thật</div>
          <button onclick="rpgPage.startBattle('slime')" class="btn btn-primary" style="width:100%;justify-content:center">🤖 Chiến với AI (Slime)</button>
        </div>
        <div class="card" style="background:linear-gradient(135deg,var(--purple-l),var(--blue-l));border-color:rgba(99,102,241,.2)">
          <div style="font-size:13px;font-weight:700;margin-bottom:8px">⚔️ PvP Real-time</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Dùng Word Battle để thi đấu PvP từ vựng real-time với tất cả mọi người</div>
          <button onclick="app.router.navigate('/game')" class="btn btn-primary" style="width:100%;justify-content:center">🏟️ Vào Word Battle</button>
        </div>
      </div>
    </div>`;
  }

  challengePvP(toId,toName){
    Toast.info(`Đã gửi thách đấu đến ${toName}!`);
    try{const ch=this.db.client.channel(`notify:${toId}`,{config:{broadcast:{self:false}}});ch.subscribe(s=>{if(s==='SUBSCRIBED')ch.send({type:'broadcast',event:'challenge',payload:{from:new User(this.store.get('currentUser')).displayName}});});}catch{}
    setTimeout(()=>app.router.navigate('/game'),700);
  }

  async _renderRank(el){
    el=el||document.getElementById('rpgContent');
    el.innerHTML='<div style="text-align:center;padding:30px;color:var(--muted)">⏳ Đang tải...</div>';
    try{
      const {data}=await this.db.client.from('profiles').select('id,display_name,username,xp,level,avatar_id').order('xp',{ascending:false}).limit(20);
      const user=this.store.get('currentUser');
      const medals=['🥇','🥈','🥉'];
      el.innerHTML=`<div class="card">
        <div class="card-title">👑 Bảng xếp hạng RPG · Theo XP</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${(data||[]).map((p,i)=>{
            const isMe=p.id===user?.id;
            const raw2=getRaw(p.id); const stats2=calcStats(raw2.levels||{});
            return `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--r-lg);border:1px solid ${isMe?'var(--blue)':'var(--border)'};background:${isMe?'var(--blue-l)':'var(--white)'};box-shadow:var(--shadow-xs)">
              <div style="font-size:18px;width:26px;text-align:center">${medals[i]||`#${i+1}`}</div>
              <img src="${User.avatarUrl(p.avatar_id||1)}" style="width:34px;height:34px;border-radius:50%;border:2px solid ${isMe?'var(--blue)':'var(--border)'}" onerror="this.style.display='none'">
              <div style="flex:1"><div style="font-size:13px;font-weight:700">${p.display_name||p.username}${isMe?' 👈':''}</div>
              <div style="font-size:11px;color:var(--muted)">Lv${p.level||1} · ⚔️${stats2.atk} ❤️${stats2.hp}</div></div>
              <div style="font-size:15px;font-weight:800;color:#f59e0b;font-family:var(--mono)">⭐${p.xp||0}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }catch(e){el.innerHTML=`<div style="color:var(--red);padding:20px">❌ ${e.message}</div>`;}
  }
}
