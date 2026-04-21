import { Toast } from '../components/index.js';

export class PomodoroPage {
  constructor(db, store, bus) { this.db=db; this.store=store; this.bus=bus; this._t=null; this._run=false; this._phase='pomo'; this._secs=25*60; this._sess=0; this._daily=0; this._mins=0; }
  render() {
    document.querySelector('.main').innerHTML=`<div class="page">
      <div class="page-header"><h1 class="page-title">⏱️ Pomodoro Timer</h1><p class="page-sub">Học tập tập trung · Nghỉ ngơi đúng lúc</p></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:760px">
        <div class="card" style="text-align:center;padding:36px">
          <div style="font-size:11px;font-family:var(--mono);color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px" id="phaseLabel">🍅 POMODORO</div>
          <div style="font-family:'Lora',serif;font-style:italic;font-size:72px;font-weight:700;color:var(--blue);line-height:1" id="timerDisp">25:00</div>
          <div style="font-size:12px;color:var(--muted);font-family:var(--mono);margin:10px 0 20px" id="taskLabel">Chưa có tác vụ</div>
          <div style="display:flex;gap:8px;justify-content:center">
            <button class="btn btn-ghost" onclick="pomoPage.reset()">↺</button>
            <button class="btn btn-primary" id="startBtn" onclick="pomoPage.toggle()">▶ Bắt đầu</button>
            <button class="btn btn-ghost" onclick="pomoPage.skip()">⏭</button>
          </div>
          <div style="display:flex;gap:5px;justify-content:center;margin-top:16px" id="dots"></div>
          <div style="display:flex;gap:20px;justify-content:center;margin-top:18px">
            <div><div style="font-family:'Lora',serif;font-style:italic;font-size:24px;font-weight:700;color:var(--blue)" id="todaySess">0</div><div style="font-size:10px;color:var(--muted);font-family:var(--mono)">PHIÊN</div></div>
            <div><div style="font-family:'Lora',serif;font-style:italic;font-size:24px;font-weight:700;color:var(--orange)" id="todayMins">0</div><div style="font-size:10px;color:var(--muted);font-family:var(--mono)">PHÚT</div></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="card">
            <div class="card-title">⚙️ Cài đặt</div>
            <div class="form-group"><label class="form-label">Pomodoro (phút)</label><input class="form-input" type="number" id="cfgP" value="25" min="1" max="60" onchange="pomoPage.cfgUpdate()"></div>
            <div class="form-row"><div class="form-group"><label class="form-label">Nghỉ ngắn</label><input class="form-input" type="number" id="cfgS" value="5" min="1" onchange="pomoPage.cfgUpdate()"></div><div class="form-group"><label class="form-label">Nghỉ dài</label><input class="form-input" type="number" id="cfgL" value="15" min="5" onchange="pomoPage.cfgUpdate()"></div></div>
            <div class="form-group"><label class="form-label">Đang học</label><input class="form-input" id="cfgTask" placeholder="VD: Ôn Toán chương 3..." oninput="document.getElementById('taskLabel').textContent=this.value||'Chưa có tác vụ'"></div>
          </div>
        </div>
      </div></div>`;
    window.pomoPage=this;
    this._updateDisp();this._renderDots();
    this._daily=parseInt(localStorage.getItem('sh_pomo_sess')||'0');
    this._mins=parseInt(localStorage.getItem('sh_pomo_mins')||'0');
    document.getElementById('todaySess').textContent=this._daily;
    document.getElementById('todayMins').textContent=this._mins;
  }
  cfgUpdate(){if(!this._run){this._secs=parseInt(document.getElementById('cfgP').value)*60;this._updateDisp();}}
  _updateDisp(){const m=String(Math.floor(this._secs/60)).padStart(2,'0'),s=String(this._secs%60).padStart(2,'0');document.getElementById('timerDisp').textContent=`${m}:${s}`;}
  _renderDots(){const el=document.getElementById('dots');if(!el)return;el.innerHTML=Array.from({length:8},(_,i)=>{let c='rgba(0,0,0,0.1)';if(i<this._sess%8)c=i%4===3?'var(--green)':'var(--blue)';return`<div style="width:9px;height:9px;border-radius:50%;background:${c};transition:background .3s"></div>`;}).join('');}
  toggle(){this._run=!this._run;document.getElementById('startBtn').textContent=this._run?'⏸ Tạm dừng':'▶ Tiếp tục';if(this._run){this._t=setInterval(()=>{this._secs--;this._updateDisp();if(this._secs<=0){clearInterval(this._t);this._run=false;this._onEnd();}},1000);}else clearInterval(this._t);}
  reset(){clearInterval(this._t);this._run=false;this._phase='pomo';this._secs=parseInt(document.getElementById('cfgP').value)*60;document.getElementById('startBtn').textContent='▶ Bắt đầu';document.getElementById('phaseLabel').textContent='🍅 POMODORO';this._updateDisp();}
  skip(){clearInterval(this._t);this._run=false;document.getElementById('startBtn').textContent='▶ Bắt đầu';this._onEnd();}
  async _onEnd(){const u=this.store.get('currentUser');if(this._phase==='pomo'){this._sess++;this._daily++;const m=parseInt(document.getElementById('cfgP').value);this._mins+=m;localStorage.setItem('sh_pomo_sess',this._daily);localStorage.setItem('sh_pomo_mins',this._mins);document.getElementById('todaySess').textContent=this._daily;document.getElementById('todayMins').textContent=this._mins;this._renderDots();try{await this.db.insert('pomodoro_sessions',{user_id:u.id,task_name:document.getElementById('cfgTask').value,duration_min:m,phase:'pomo',completed:true,session_date:new Date().toISOString().slice(0,10)});await this.db.update('profiles',u.id,{xp:(u.xp||0)+10});}catch{}if(this._sess%4===0){this._phase='long';this._secs=parseInt(document.getElementById('cfgL').value)*60;document.getElementById('phaseLabel').textContent='☕ NGHỈ DÀI';Toast.ok('Nghỉ dài! Bạn xứng đáng 🎉');}else{this._phase='short';this._secs=parseInt(document.getElementById('cfgS').value)*60;document.getElementById('phaseLabel').textContent='🌿 NGHỈ NGẮN';Toast.ok('Xong 1 pomodoro! +10 XP ✓');}}else{this._phase='pomo';this._secs=parseInt(document.getElementById('cfgP').value)*60;document.getElementById('phaseLabel').textContent='🍅 POMODORO';Toast.info('Hết giờ nghỉ — học tiếp!');}this._updateDisp();}
}
