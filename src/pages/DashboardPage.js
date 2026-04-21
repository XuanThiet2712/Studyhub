import { User }        from '../models/index.js';
import { DayProgress } from '../models/index.js';

const MOTIVATIONS = [
  '🔥 Hôm nay tiến thêm 1 bước đến TOEIC 600+!',
  '⭐ Consistency beats perfection — học đều hơn học nhiều!',
  '🎯 Mỗi từ vựng học được là 1 viên gạch xây ước mơ!',
  '💪 Người giỏi không phải không có lúc khó — họ chỉ không bỏ!',
  '🌟 Streak của bạn là tài sản quý nhất. Đừng để mất!',
  '📚 TOEIC không khó — khó là ở chỗ chưa bắt đầu!',
];

export class DashboardPage {
  constructor(db, store, bus) { this.db=db; this.store=store; this.bus=bus; }

  render() {
    const user = new User(this.store.get('currentUser'));
    const online = (this.store.get('onlineUsers')||[]).length;
    const mot = MOTIVATIONS[Math.floor(Math.random()*MOTIVATIONS.length)];

    document.querySelector('.main').innerHTML = `
    <div class="page anim-fade">
      <!-- HERO BANNER -->
      <div style="background:linear-gradient(135deg,#0c1130,#1a1f4a,#251865);border-radius:var(--r-2xl);padding:28px 32px;margin-bottom:24px;position:relative;overflow:hidden">
        <div style="position:absolute;top:-60px;right:-40px;width:260px;height:260px;border-radius:50%;background:rgba(79,110,247,0.15);pointer-events:none"></div>
        <div style="position:absolute;bottom:-40px;right:100px;width:180px;height:180px;border-radius:50%;background:rgba(124,94,246,0.12);pointer-events:none"></div>
        <div style="position:relative;display:flex;align-items:center;gap:20px;flex-wrap:wrap">
          <div style="flex:1;min-width:200px">
            <div style="font-size:13px;color:rgba(255,255,255,.55);margin-bottom:6px">👋 Chào trở lại,</div>
            <h1 style="font-family:var(--display);font-size:28px;font-weight:900;color:white;margin-bottom:8px">${user.displayName}</h1>
            <p style="font-size:13px;color:rgba(255,255,255,.7);margin-bottom:16px">${mot}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-primary" onclick="app.router.navigate('/roadmap')">📅 Học ngay →</button>
              <button onclick="app.router.navigate('/ai-tutor')" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:white;padding:8px 16px;border-radius:var(--r-lg);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s" onmouseover="this.style.background='rgba(255,255,255,.2)'" onmouseout="this.style.background='rgba(255,255,255,.12)'">🤖 AI Tutor</button>
            </div>
          </div>
          <!-- Quick stats -->
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            ${[
              ['⭐','XP',user.xp,'#fbbf24'],
              ['🏆','Cấp',user.level,'#a78bfa'],
              ['🔥','Streak',(user.streak||0)+' ngày','#fb923c'],
              ['🟢','Online',online,'#4ade80'],
            ].map(([ic,lb,val,col])=>`
            <div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:var(--r-xl);padding:14px 18px;text-align:center;min-width:72px">
              <div style="font-size:20px;margin-bottom:4px">${ic}</div>
              <div style="font-family:var(--display);font-size:18px;font-weight:900;color:${col}">${val}</div>
              <div style="font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.4px">${lb}</div>
            </div>`).join('')}
          </div>
        </div>
        <!-- XP Progress -->
        <div style="margin-top:20px;position:relative">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;font-size:11px;color:rgba(255,255,255,.5)">
            <span>Cấp ${user.level}</span>
            <span>${user.xp % (user.level*100)} / ${user.level*100} XP</span>
            <span>Cấp ${user.level+1}</span>
          </div>
          <div style="height:6px;background:rgba(255,255,255,.12);border-radius:99px;overflow:hidden">
            <div style="height:100%;width:${Math.min(100,(user.xp%(user.level*100))/(user.level*100)*100)}%;background:linear-gradient(90deg,#60a5fa,#a78bfa);border-radius:99px;transition:width 1s ease"></div>
          </div>
        </div>
      </div>

      <!-- QUICK ACTIONS -->
      <div class="anim-stagger" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:24px">
        ${[
          ['/vocabulary','📚','Từ vựng','Thêm & ôn tập','var(--blue)','var(--blue-l)'],
          ['/roadmap','📅','Lộ trình','30 ngày TOEIC','var(--purple)','var(--purple-l)'],
          ['/ai-tutor','🤖','AI Tutor','Hỏi & luyện tập','var(--green)','var(--green-l)'],
          ['/game','⚔️','Word Battle','Thi đấu real-time','var(--red)','var(--red-l)'],
          ['/rpg','🗡️','RPG','Đánh quái ôn từ','var(--orange)','var(--orange-l)'],
          ['/world','🌍','World','Gặp gỡ online','var(--teal)','var(--teal-l)'],
        ].map(([r,ic,t,s,c,bg])=>`
        <div onclick="app.router.navigate('${r}')" style="background:${bg};border:1.5px solid ${c}22;border-radius:var(--r-xl);padding:16px;cursor:pointer;transition:all .2s" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 20px ${c}28'" onmouseout="this.style.transform='';this.style.boxShadow=''">
          <div style="font-size:28px;margin-bottom:8px">${ic}</div>
          <div style="font-family:var(--display);font-size:14px;font-weight:700;color:${c};margin-bottom:2px">${t}</div>
          <div style="font-size:11px;color:var(--muted)">${s}</div>
        </div>`).join('')}
      </div>

      <!-- STATS GRID -->
      <div class="grid-2" style="gap:16px;margin-bottom:20px">
        <!-- Vocab stats -->
        <div class="card">
          <div class="card-title">📚 Từ vựng hôm nay</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
            <div style="background:var(--blue-l);border-radius:var(--r-lg);padding:12px;text-align:center">
              <div style="font-family:var(--display);font-size:26px;font-weight:900;color:var(--blue)" id="dashTotalWords">—</div>
              <div style="font-size:11px;color:var(--muted)">Tổng từ</div>
            </div>
            <div style="background:var(--orange-l);border-radius:var(--r-lg);padding:12px;text-align:center">
              <div style="font-family:var(--display);font-size:26px;font-weight:900;color:var(--orange)" id="dashDueWords">—</div>
              <div style="font-size:11px;color:var(--muted)">Cần ôn</div>
            </div>
          </div>
          <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="app.router.navigate('/vocabulary')">Ôn tập ngay →</button>
        </div>

        <!-- Roadmap progress -->
        <div class="card">
          <div class="card-title">📅 Lộ trình 30 ngày</div>
          <div style="text-align:center;padding:8px 0 12px">
            <div style="font-family:var(--display);font-size:44px;font-weight:900;color:var(--purple)" id="dashDaysDone">—</div>
            <div style="font-size:13px;color:var(--muted)">/30 ngày hoàn thành</div>
          </div>
          <div class="prog-track" style="margin-bottom:12px">
            <div class="prog-fill" id="dashRoadmapBar" style="width:0%;background:linear-gradient(90deg,var(--purple),var(--blue))"></div>
          </div>
          <button class="btn btn-outline" style="width:100%;justify-content:center;color:var(--purple);border-color:var(--purple)" onclick="app.router.navigate('/roadmap')">Tiếp tục học →</button>
        </div>
      </div>

      <!-- RECENT ACTIVITY -->
      <div class="card">
        <div class="card-title">⚡ Truy cập nhanh</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${[
            ['/conversation','💬','Giao tiếp AI'],
            ['/custom-roadmap','📗','Tiếng Anh cơ bản'],
            ['/chat','💬','Cộng đồng'],
            ['/documents','📁','Tài liệu'],
            ['/leaderboard','🏆','BXH'],
            ['/friends','👥','Bạn bè'],
            ['/notes','📝','Ghi chú'],
            ['/pomodoro','⏱️','Pomodoro'],
          ].map(([r,ic,t])=>`
          <button onclick="app.router.navigate('${r}')" style="display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:99px;background:var(--bg2);border:1px solid var(--border-md);cursor:pointer;font-size:12px;font-weight:500;color:var(--text2);transition:all .15s;font-family:var(--font)" onmouseover="this.style.background='var(--blue-l)';this.style.borderColor='var(--blue)';this.style.color='var(--blue-d)'" onmouseout="this.style.background='var(--bg2)';this.style.borderColor='var(--border-md)';this.style.color='var(--text2)'">${ic} ${t}</button>`).join('')}
        </div>
      </div>
    </div>`;

    this._loadStats();
  }

  async _loadStats() {
    const user = this.store.get('currentUser');
    if (!user) return;
    try {
      const [vocab, progress] = await Promise.all([
        this.db.select('vocabulary',{eq:{user_id:user.id}}).catch(()=>[]),
        this.db.select('learning_progress',{eq:{user_id:user.id}}).catch(()=>[]),
      ]);
      const due = vocab.filter(v=>new Date(v.next_review)<=new Date()).length;
      const done = progress.filter(p=>p.completed).length;

      const tw=document.getElementById('dashTotalWords');
      const dw=document.getElementById('dashDueWords');
      const dd=document.getElementById('dashDaysDone');
      const rb=document.getElementById('dashRoadmapBar');

      if(tw) tw.textContent=vocab.length;
      if(dw){ dw.textContent=due; dw.style.color=due>0?'var(--orange)':'var(--green)'; }
      if(dd) dd.textContent=done;
      if(rb) rb.style.width=Math.round(done/30*100)+'%';
    } catch(e) { console.error(e); }
  }
}
