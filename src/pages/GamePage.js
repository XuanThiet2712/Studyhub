import { Toast }    from '../components/index.js';
import { User, GameRoom } from '../models/index.js';

export class GamePage {
  constructor(db, realtime, store, bus) {
    this.db       = db;
    this.realtime = realtime;
    this.store    = store;
    this.bus      = bus;
    this._room    = null;
    this._player  = null;
    this._questions = [];
    this._qIdx    = 0;
    this._timer   = null;
    this._roomSub = null;
  }

  render() {
    const user = new User(this.store.get('currentUser'));
    document.querySelector('.main').innerHTML = `
    <div class="page">
      <div class="page-header-row page-header">
        <div>
          <h1 class="page-title">⚔️ Word Battle</h1>
          <p class="page-sub">Thi đấu ôn từ vựng TOEIC — 1v1 và Battle Room</p>
        </div>
      </div>

      <div id="gameView">
        <!-- LOBBY -->
        <div id="gameLobby">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:720px;margin-bottom:28px">
            <!-- 1v1 -->
            <div class="game-card" onclick="gamePage.selectMode('1v1',this)">
              <div style="font-size:40px;margin-bottom:12px">⚔️</div>
              <div style="font-size:16px;font-weight:700;margin-bottom:6px">1v1 Speed</div>
              <div style="font-size:12px;color:var(--muted)">Ai trả lời nhanh hơn thắng. Tối đa 2 người.</div>
            </div>
            <!-- Battle -->
            <div class="game-card" onclick="gamePage.selectMode('battle',this)">
              <div style="font-size:40px;margin-bottom:12px">🏟️</div>
              <div style="font-size:16px;font-weight:700;margin-bottom:6px">Battle Room</div>
              <div style="font-size:12px;color:var(--muted)">Phòng nhiều người. Ai đúng nhiều nhất thắng.</div>
            </div>
          </div>

          <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-xl);padding:24px;max-width:720px;box-shadow:var(--shadow-sm)">
            <div id="modeSetup">
              <div style="text-align:center;color:var(--muted);font-size:14px;padding:20px">
                👆 Chọn chế độ chơi để bắt đầu
              </div>
            </div>
          </div>

          <div style="margin-top:24px;max-width:720px">
            <div class="sec-hd"><span class="sec-hd-title">Phòng đang chờ</span><button class="btn btn-ghost btn-sm" onclick="gamePage.loadRooms()">🔄 Làm mới</button></div>
            <div id="roomList"><div class="empty"><div class="empty-icon">🎮</div><div class="empty-text">Chưa có phòng nào</div></div></div>
          </div>
        </div>

        <!-- WAITING ROOM -->
        <div id="gameWaiting" style="display:none">
          <div style="max-width:560px;margin:0 auto;text-align:center">
            <div class="card" style="padding:32px">
              <div style="font-size:48px;margin-bottom:12px">⏳</div>
              <div style="font-family:var(--serif);font-size:22px;font-weight:700;margin-bottom:6px">Đang chờ người chơi...</div>
              <div style="font-size:13px;color:var(--muted);margin-bottom:20px">Chia sẻ mã phòng để bạn bè vào</div>
              <div style="background:var(--blue-l);border:2px dashed var(--blue);border-radius:var(--r-lg);padding:16px;margin-bottom:20px;cursor:pointer" onclick="gamePage.copyCode()">
                <div style="font-family:var(--mono);font-size:32px;font-weight:700;color:var(--blue-d);letter-spacing:4px" id="roomCodeDisplay">------</div>
                <div style="font-size:11px;color:var(--muted);margin-top:4px">Nhấp để sao chép</div>
              </div>
              <div id="waitingPlayers" style="display:flex;gap:16px;justify-content:center;margin-bottom:20px"></div>
              <div style="display:flex;gap:10px;justify-content:center">
                <button class="btn btn-ghost" onclick="gamePage.leaveRoom()">Thoát</button>
                <button class="btn btn-primary" id="startGameBtn" onclick="gamePage.startGame()" disabled>▶ Bắt đầu</button>
              </div>
            </div>
          </div>
        </div>

        <!-- GAME ARENA -->
        <div id="gameArena" style="display:none">
          <div style="max-width:700px;margin:0 auto">
            <!-- HUD -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <div style="font-family:var(--mono);font-size:12px;color:var(--muted)">Câu <span id="qNum">1</span>/<span id="qTotal">10</span></div>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="font-family:var(--serif);font-size:20px;font-weight:700;color:var(--blue)" id="myScore">0</div>
                <div style="font-size:13px;color:var(--muted)">điểm</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <div style="font-size:13px;color:var(--muted)">⏱</div>
                <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--red)" id="timerDisp">10</div>
              </div>
            </div>
            <!-- Timer bar -->
            <div style="height:5px;background:var(--bg3);border-radius:99px;overflow:hidden;margin-bottom:20px">
              <div id="timerBar" style="height:100%;background:var(--blue);border-radius:99px;transition:width .1s linear;width:100%"></div>
            </div>

            <!-- Question card -->
            <div class="card" style="text-align:center;padding:32px;margin-bottom:20px">
              <div style="font-size:11px;color:var(--muted);font-family:var(--mono);margin-bottom:8px" id="qType">Chọn NGHĨA TIẾNG VIỆT đúng</div>
              <div style="font-family:var(--serif);font-style:italic;font-size:36px;font-weight:700;color:var(--blue);margin-bottom:8px" id="qWord">—</div>
              <div style="font-family:var(--mono);font-size:14px;color:var(--muted)" id="qPhone"></div>
            </div>

            <!-- Options -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px" id="optionsGrid"></div>

            <!-- Opponent scores -->
            <div id="opponentScores" style="display:flex;gap:10px;flex-wrap:wrap"></div>
          </div>
        </div>

        <!-- RESULTS -->
        <div id="gameResults" style="display:none">
          <div style="max-width:560px;margin:0 auto;text-align:center">
            <div class="card" style="padding:36px">
              <div style="font-size:56px;margin-bottom:12px" id="resultEmoji">🏆</div>
              <div style="font-family:var(--serif);font-size:24px;font-weight:700;margin-bottom:6px" id="resultTitle">Kết quả</div>
              <div style="font-size:14px;color:var(--muted);margin-bottom:24px" id="resultSub"></div>
              <div id="finalScores" style="margin-bottom:24px"></div>
              <div style="display:flex;gap:10px;justify-content:center">
                <button class="btn btn-ghost" onclick="gamePage.backToLobby()">🏠 Về lobby</button>
                <button class="btn btn-primary" onclick="gamePage.playAgain()">🔄 Chơi lại</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    window.gamePage = this;
    this.loadRooms();
    this._buildQuestions();
  }

  selectMode(mode, el) {
    document.querySelectorAll('.game-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    const setup = document.getElementById('modeSetup');
    setup.innerHTML = `
    <div>
      <div style="font-size:14px;font-weight:600;margin-bottom:14px">${mode==='1v1'?'⚔️ 1v1 Speed':'🏟️ Battle Room'}</div>
      <div class="form-row" style="margin-bottom:14px">
        <div class="form-group">
          <label class="form-label">Số câu hỏi</label>
          <select class="form-select" id="qCount">
            <option value="5">5 câu (nhanh)</option>
            <option value="10" selected>10 câu</option>
            <option value="20">20 câu (dài)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Thời gian/câu (giây)</label>
          <select class="form-select" id="qTime">
            <option value="8">8 giây (khó)</option>
            <option value="12" selected>12 giây</option>
            <option value="20">20 giây (dễ)</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-primary" onclick="gamePage.createRoom('${mode}')">🚀 Tạo phòng mới</button>
        <button class="btn btn-ghost" onclick="gamePage.showJoinRoom()">🔑 Nhập mã phòng</button>
      </div>
    </div>`;
  }

  async createRoom(mode) {
    const user    = this.store.get('currentUser');
    const qCount  = parseInt(document.getElementById('qCount')?.value||10);
    const qTime   = parseInt(document.getElementById('qTime')?.value||12);
    const maxP    = mode==='1v1'?2:8;

    // Generate room code via DB function
    const code    = Array.from({length:6},()=>'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[~~(Math.random()*36)]).join('');
    try {
      const room = await this.db.insert('game_rooms', {
        room_code: code, mode, status:'waiting',
        host_id: user.id, max_players: maxP, question_count: qCount
      });
      await this.db.insert('game_players', { room_id: room.id, user_id: user.id });
      this._room    = new GameRoom(room);
      this._qTime   = qTime;
      this._qCount  = qCount;
      this._player  = { userId: user.id, score: 0 };
      this._showWaiting();
      this._subscribeRoom(room.id);
    } catch(e) { Toast.err('Tạo phòng thất bại!'); console.error(e); }
  }

  showJoinRoom() {
    const modal = document.createElement('div');
    modal.className='overlay open';
    modal.innerHTML=`
    <div class="modal modal-sm">
      <div class="modal-title">🔑 Nhập mã phòng</div>
      <div class="form-group">
        <label class="form-label">Mã phòng (6 ký tự)</label>
        <input class="form-input" id="joinCodeInput" placeholder="ABC123" style="font-family:var(--mono);font-size:18px;text-align:center;letter-spacing:3px;text-transform:uppercase" maxlength="6">
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Hủy</button>
        <button class="btn btn-primary" onclick="gamePage.joinRoom(document.getElementById('joinCodeInput').value)">Vào phòng</button>
      </div>
    </div>`;
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
    document.body.appendChild(modal);
  }

  async joinRoom(code) {
    if (!code || code.length<4) { Toast.err('Nhập mã phòng!'); return; }
    const user = this.store.get('currentUser');
    try {
      const room = await this.db.select('game_rooms', { eq:{room_code: code.toUpperCase()}, single:true });
      if (room.status !== 'waiting')  { Toast.err('Phòng đã bắt đầu hoặc kết thúc!'); return; }
      const players = await this.db.select('game_players', { eq:{room_id: room.id} });
      if (players.length >= room.max_players) { Toast.err('Phòng đã đầy!'); return; }
      if (players.find(p=>p.user_id===user.id)) { Toast.info('Bạn đã trong phòng này!'); }
      else await this.db.insert('game_players', { room_id: room.id, user_id: user.id });
      this._room   = new GameRoom(room);
      this._player = { userId: user.id, score: 0 };
      document.querySelector('.overlay')?.remove();
      this._showWaiting();
      this._subscribeRoom(room.id);
    } catch(e) { Toast.err('Không tìm thấy phòng!'); }
  }

  async _showWaiting() {
    document.getElementById('gameLobby').style.display  = 'none';
    document.getElementById('gameWaiting').style.display= 'block';
    document.getElementById('roomCodeDisplay').textContent = this._room?.roomCode || '------';
    await this._refreshWaitingPlayers();
  }

  async _refreshWaitingPlayers() {
    const room = this._room;
    if (!room) return;
    const players = await this.db.select('game_players', { eq:{room_id: room.id} });
    const uids    = players.map(p=>p.user_id);
    const profiles= uids.length ? await this.db.select('profiles',{select:'id,display_name,avatar_id',in:{id:uids}}) : [];
    const pMap    = Object.fromEntries(profiles.map(p=>[p.id,p]));

    const el = document.getElementById('waitingPlayers');
    if (el) el.innerHTML = players.map(p=>{
      const pr = pMap[p.user_id]||{};
      return `<div style="text-align:center">
        <img src="${User.avatarUrl(pr.avatar_id||1)}" style="width:48px;height:48px;border-radius:50%;border:2px solid var(--border)">
        <div style="font-size:11px;margin-top:4px;font-weight:500">${pr.display_name||'...'}</div>
      </div>`;
    }).join('');

    const me = this.store.get('currentUser');
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
      const canStart = room.hostId === me.id && players.length >= 2;
      startBtn.disabled = !canStart;
      startBtn.textContent = canStart ? '▶ Bắt đầu' : `Chờ người chơi... (${players.length}/${room.maxPlayers})`;
    }
  }

  _subscribeRoom(roomId) {
    if (this._roomSub) { try { this._roomSub.unsubscribe(); } catch(e){} }
    this._roomSub = this.realtime.subscribeToRoom(roomId, async (payload) => {
      if (payload.eventType === 'INSERT') this._refreshWaitingPlayers();
      if (payload.eventType === 'DELETE') {
        // A player left - refresh or check if room should close
        await this._refreshWaitingPlayers();
        // If waiting and all players gone, go back to lobby
        const waiting = document.getElementById('gameWaiting');
        if (waiting && waiting.style.display !== 'none') {
          const remaining = await this.db.select('game_players', { eq:{room_id:roomId} }).catch(()=>[]);
          if (!remaining?.length) { Toast.info('Phòng đã bị đóng.'); this.backToLobby(); }
        }
      }
      if (payload.new?.score !== undefined) this._updateOpponentScore(payload.new);
    });
    // Also listen for room status changes
    this.db.subscribe(`room-status-${roomId}`,
      { event:'UPDATE', schema:'public', table:'game_rooms', filter:`id=eq.${roomId}` },
      payload => {
        if (payload.new?.status === 'playing') this._showArena();
        if (payload.new?.status === 'finished') this._showResults();
      }
    );
    // Listen for room deletion
    this.db.subscribe(`room-delete-${roomId}`,
      { event:'DELETE', schema:'public', table:'game_rooms', filter:`id=eq.${roomId}` },
      () => { Toast.info('Phòng đã bị xóa.'); this.backToLobby(); }
    );
  }

  async startGame() {
    if (!this._room) return;
    await this.db.update('game_rooms', this._room.id, { status:'playing' });
  }

  async _buildQuestionsFromDB() {
    const user = this.store.get('currentUser');
    try {
      const rows = await this.db.select('vocabulary',{eq:{user_id:user.id},limit:300});
      if (rows.length >= 4) {
        const dbPool = rows.map(r=>({word:r.word,phonetic:r.phonetic||'',meaning:r.meaning_vi,type:'saved',example:r.example||''}));
        const fallback = this._getBuiltinPool();
        const seen = new Set(dbPool.map(x=>x.word));
        this._questionPool = [...dbPool, ...fallback.filter(x=>!seen.has(x.word))];
        return;
      }
    } catch(e) {}
    this._questionPool = this._getBuiltinPool();
  }

  _buildQuestions() {
    this._questionPool = this._getBuiltinPool();
    this._buildQuestionsFromDB(); // async upgrade
  }

  _getBuiltinPool() {
    const pool  = [
      // Built-in TOEIC words
      {word:'office',phonetic:'/ˈɒfɪs/',meaning:'văn phòng'},{word:'meeting',phonetic:'/ˈmiːtɪŋ/',meaning:'cuộc họp'},
      {word:'manager',phonetic:'/ˈmænɪdʒər/',meaning:'quản lý'},{word:'deadline',phonetic:'/ˈdedlaɪn/',meaning:'hạn chót'},
      {word:'invoice',phonetic:'/ˈɪnvɔɪs/',meaning:'hóa đơn'},{word:'discount',phonetic:'/ˈdɪskaʊnt/',meaning:'giảm giá'},
      {word:'shipment',phonetic:'/ˈʃɪpmənt/',meaning:'lô hàng'},{word:'contract',phonetic:'/ˈkɒntrækt/',meaning:'hợp đồng'},
      {word:'profit',phonetic:'/ˈprɒfɪt/',meaning:'lợi nhuận'},{word:'budget',phonetic:'/ˈbʌdʒɪt/',meaning:'ngân sách'},
      {word:'efficient',phonetic:'/ɪˈfɪʃnt/',meaning:'hiệu quả'},{word:'candidate',phonetic:'/ˈkændɪdət/',meaning:'ứng viên'},
      {word:'available',phonetic:'/əˈveɪləbl/',meaning:'sẵn sàng'},{word:'confirm',phonetic:'/kənˈfɜːm/',meaning:'xác nhận'},
      {word:'negotiate',phonetic:'/nɪˈɡəʊʃieɪt/',meaning:'đàm phán'},{word:'submit',phonetic:'/səbˈmɪt/',meaning:'nộp'},
      {word:'approve',phonetic:'/əˈpruːv/',meaning:'phê duyệt'},{word:'expense',phonetic:'/ɪkˈspens/',meaning:'chi phí'},
      {word:'account',phonetic:'/əˈkaʊnt/',meaning:'tài khoản'},{word:'salary',phonetic:'/ˈsæləri/',meaning:'lương'},
      {word:'delivery',phonetic:'/dɪˈlɪvəri/',meaning:'giao hàng'},{word:'warehouse',phonetic:'/ˈweəhaʊs/',meaning:'kho hàng'},
      {word:'freight',phonetic:'/freɪt/',meaning:'hàng hóa vận chuyển'},{word:'customs',phonetic:'/ˈkʌstəmz/',meaning:'hải quan'},
      {word:'receipt',phonetic:'/rɪˈsiːt/',meaning:'hóa đơn thanh toán'},{word:'reservation',phonetic:'/ˌrezəˈveɪʃn/',meaning:'đặt chỗ'},
      {word:'itinerary',phonetic:'/aɪˈtɪnərəri/',meaning:'lịch trình'},{word:'departure',phonetic:'/dɪˈpɑːtʃər/',meaning:'khởi hành'},
      {word:'productivity',phonetic:'/ˌprɒdʌkˈtɪvɪti/',meaning:'năng suất'},{word:'professional',phonetic:'/prəˈfeʃənl/',meaning:'chuyên nghiệp'},
    ];
    return pool.filter((v,i,a)=>a.findIndex(x=>x.word===v.word)===i && v.word && v.meaning);
  }

  _genQuestions(count=10) {
    const pool = [...this._questionPool].sort(()=>Math.random()-.5);
    const grammarQs = [
      {type:'grammar',question:'She ___ in this company for 5 years.',options:['work','works','has worked','is working'],correct:'has worked',tip:'Dùng Present Perfect với "for" chỉ khoảng thời gian'},
      {type:'grammar',question:'The meeting was ___ due to bad weather.',options:['cancel','cancels','cancelled','cancelling'],correct:'cancelled',tip:'Câu bị động: was + V3'},
      {type:'grammar',question:'Please ___ me know if you need anything.',options:['let','lets','letting','to let'],correct:'let',tip:'let + O + V nguyên mẫu'},
      {type:'grammar',question:'The report ___ be submitted by Friday.',options:['must','should','can','would'],correct:'must',tip:'must = bắt buộc, deadline cứng'},
      {type:'grammar',question:'___ arriving at the airport, she checked in.',options:['After','While','During','Before'],correct:'After',tip:'After + V-ing = sau khi'},
      {type:'grammar',question:"The product is ___ than the competitor's.",options:['cheap','cheaper','cheapest','more cheap'],correct:'cheaper',tip:'Tính từ ngắn: thêm -er để so sánh hơn'},
    ];
    const vocabSlice = pool.slice(0, Math.min(count, pool.length));
    const vocabQs = vocabSlice.map(item => {
      const wrongs = pool.filter(x=>x.word!==item.word).sort(()=>Math.random()-.5).slice(0,3);
      const opts = [...wrongs.map(w=>w.meaning), item.meaning].sort(()=>Math.random()-.5);
      return {type:'vocab', word:item.word, phonetic:item.phonetic||'', correct:item.meaning, options:opts, example:item.example||''};
    });
    // Mix vocab + grammar questions
    const grammarMix = grammarQs.sort(()=>Math.random()-.5).slice(0, Math.min(3, count-vocabQs.length));
    return [...vocabQs, ...grammarMix].sort(()=>Math.random()-.5).slice(0, count);
  }

  _showArena() {
    document.getElementById('gameWaiting').style.display= 'none';
    document.getElementById('gameArena').style.display  = 'block';
    this._questions = this._genQuestions(this._qCount||10);
    this._qIdx      = 0;
    this._myScore   = 0;
    this._showQuestion();
  }

  _showQuestion() {
    if (this._qIdx >= this._questions.length) { this._endGame(); return; }
    const q   = this._questions[this._qIdx];
    const sec = this._qTime||12;
    document.getElementById('qNum').textContent  = this._qIdx+1;
    document.getElementById('qTotal').textContent= this._questions.length;
    if (q.type === 'grammar') {
      document.getElementById('qWord').textContent = q.question || q.word;
      document.getElementById('qPhone').textContent = '📝 Câu hỏi ngữ pháp';
    } else {
      document.getElementById('qWord').textContent = q.word;
      document.getElementById('qPhone').textContent= q.phonetic;
    }
    document.getElementById('myScore').textContent=this._myScore;

    const grid = document.getElementById('optionsGrid');
    grid.innerHTML = q.options.map((opt,i)=>`
    <button class="btn btn-ghost" style="padding:14px;font-size:14px;height:auto;text-align:center;border-radius:var(--r-lg);border-width:2px" onclick="gamePage._answer('${opt.replace(/'/g,"\\'")}', this)">
      ${String.fromCharCode(65+i)}. ${opt}
    </button>`).join('');

    // Timer
    clearInterval(this._timer);
    let left=sec;
    document.getElementById('timerDisp').textContent=left;
    document.getElementById('timerBar').style.width='100%';
    document.getElementById('timerBar').style.background='var(--blue)';
    this._timer=setInterval(()=>{
      left-=0.1;
      const pct=Math.max(0,left/sec*100);
      document.getElementById('timerBar').style.width=pct+'%';
      document.getElementById('timerBar').style.background=pct>50?'var(--blue)':pct>25?'var(--orange)':'var(--red)';
      document.getElementById('timerDisp').textContent=Math.ceil(left);
      if(left<=0){clearInterval(this._timer);this._answer(null,null);}
    },100);
  }

  async _answer(choice, btn) {
    clearInterval(this._timer);
    const q       = this._questions[this._qIdx];
    const correct = choice === q.correct;

    // Visual feedback
    document.querySelectorAll('#optionsGrid .btn').forEach(b=>{
      if (b.textContent.includes(q.correct)) { b.style.background='var(--green)'; b.style.color='white'; b.style.borderColor='var(--green)'; }
      b.disabled=true;
    });
    if (btn && !correct) { btn.style.background='var(--red)'; btn.style.color='white'; btn.style.borderColor='var(--red)'; }

    if (correct) {
      const timeBonus = Math.ceil((this._timeLeft||0)/2);
      this._myScore += 10 + timeBonus;
      Toast.ok(`+${10+timeBonus} điểm! 🎉`, 800);
    } else if (q.tip) {
      Toast.info('💡 ' + q.tip, 2000);
    }

    // Update score in DB
    const user = this.store.get('currentUser');
    if (this._room) {
      const players = await this.db.select('game_players',{eq:{room_id:this._room.id,user_id:user.id},single:true}).catch(()=>null);
      if (players) {
        await this.db.update('game_players', players.id, {
          score: this._myScore,
          answers: (players.answers||0)+1,
          correct: (players.correct||0)+(correct?1:0)
        });
      }
    }

    this._qIdx++;
    setTimeout(()=>this._showQuestion(), 1200);
  }

  async _updateOpponentScore(playerData) {
    const el = document.getElementById('opponentScores');
    if (!el || !this._room) return;
    try {
      const players = await this.db.select('game_players', { eq:{ room_id: this._room.id } });
      const me = this.store.get('currentUser');
      const opponents = players.filter(p => p.user_id !== me?.id);
      if (!opponents.length) return;
      const uids = opponents.map(p => p.user_id);
      const profiles = await this.db.select('profiles', { select:'id,display_name,avatar_id', in:{id:uids} });
      const pMap = Object.fromEntries(profiles.map(p=>[p.id,p]));
      el.innerHTML = opponents.map(p => {
        const pr = pMap[p.user_id] || {};
        return `<div style="display:flex;align-items:center;gap:8px;background:var(--bg2);border-radius:var(--r-md);padding:8px 12px">
          <img src="${User.avatarUrl(pr.avatar_id||1)}" style="width:28px;height:28px;border-radius:50%">
          <span style="font-size:12px;font-weight:500">${pr.display_name||'Đối thủ'}</span>
          <span style="font-family:var(--mono);font-size:13px;font-weight:700;color:var(--red);margin-left:auto">${p.score||0} pts</span>
        </div>`;
      }).join('');
    } catch(e) {}
  }

  async _endGame() {
    clearInterval(this._timer);
    if (this._room) {
      await this.db.update('game_rooms', this._room.id, { status:'finished' });
    }
    this._showResults();
  }

  async _showResults() {
    document.getElementById('gameArena').style.display  = 'none';
    document.getElementById('gameResults').style.display= 'block';

    let scores = [];
    if (this._room) {
      const players  = await this.db.select('game_players',{eq:{room_id:this._room.id}});
      const uids     = players.map(p=>p.user_id);
      const profiles = await this.db.select('profiles',{select:'id,display_name,avatar_id,xp',in:{id:uids}});
      const pMap     = Object.fromEntries(profiles.map(p=>[p.id,p]));
      scores = players.sort((a,b)=>b.score-a.score).map((p,i)=>({
        rank: i+1, score:p.score, correct:p.correct, answers:p.answers,
        profile: pMap[p.user_id]||{}
      }));
    }

    const me      = this.store.get('currentUser');
    const myScore = scores.find(s=>s.profile.id===me?.id);
    const isWinner= myScore?.rank===1;

    document.getElementById('resultEmoji').textContent = isWinner?'🏆':myScore?.rank===2?'🥈':'🥉';
    document.getElementById('resultTitle').textContent = isWinner?'Bạn thắng!':myScore?.rank===scores.length?'Cố lên lần sau!':'Kết thúc!';
    document.getElementById('resultSub').textContent   = `Điểm của bạn: ${myScore?.score||0} | Đúng: ${myScore?.correct||0}/${myScore?.answers||0} câu`;

    document.getElementById('finalScores').innerHTML = scores.map(s=>`
    <div class="lb-row" style="margin-bottom:6px">
      <div class="lb-rank ${s.rank===1?'gold':s.rank===2?'silver':'bronze'}">${s.rank===1?'🥇':s.rank===2?'🥈':'🥉'}</div>
      <img src="${User.avatarUrl(s.profile.avatar_id||1)}" style="width:32px;height:32px;border-radius:50%">
      <div style="flex:1"><div style="font-size:13px;font-weight:500">${s.profile.display_name||'?'}</div></div>
      <div style="font-family:var(--mono);font-size:13px;font-weight:600;color:var(--blue)">${s.score} pts</div>
    </div>`).join('');

    // Award XP
    if (me && myScore) {
      const xpGained = isWinner ? 30 : 10;
      await this.db.update('profiles', me.id, { xp: (me.xp||0) + xpGained });
      Toast.ok(`+${xpGained} XP!`, 2000);
    }
  }

  copyCode() {
    const code = this._room?.roomCode;
    if (!code) return;
    navigator.clipboard.writeText(code).then(()=>Toast.ok('Đã sao chép mã phòng!'));
  }

  async leaveRoom() {
    if (this._room) {
      const user = this.store.get('currentUser');
      try {
        // Remove player from room
        const players = await this.db.select('game_players', { eq:{room_id:this._room.id, user_id:user.id} });
        if (players?.length) await this.db.client.from('game_players').delete().eq('id', players[0].id);
        // Check remaining players - if 0 left, delete room
        const remaining = await this.db.select('game_players', { eq:{room_id:this._room.id} });
        if (!remaining?.length) {
          await this.db.client.from('game_rooms').delete().eq('id', this._room.id);
        } else if (this._room.hostId === user.id && remaining.length > 0) {
          // Transfer host to next player
          await this.db.update('game_rooms', this._room.id, { host_id: remaining[0].user_id });
        }
      } catch(e) { console.error('leaveRoom error:', e); }
      if (this._roomSub) { try { this._roomSub.unsubscribe(); } catch(e){} this._roomSub = null; }
    }
    this._room = null;
    this._player = null;
    this.backToLobby();
  }

  backToLobby() {
    ['gameWaiting','gameArena','gameResults'].forEach(id=>document.getElementById(id).style.display='none');
    document.getElementById('gameLobby').style.display='block';
    this.loadRooms();
  }

  playAgain() { this.backToLobby(); }

  async loadRooms() {
    try {
      // Cleanup empty/stale waiting rooms (older than 2 hours)
      const twoHoursAgo = new Date(Date.now() - 2*60*60*1000).toISOString();
      try {
        await this.db.client.from('game_rooms').delete()
          .eq('status','waiting').lt('created_at', twoHoursAgo);
      } catch(_) {}
      const rooms = await this.db.select('game_rooms',{ eq:{status:'waiting'}, order:{col:'created_at',asc:false}, limit:10 });
      const el    = document.getElementById('roomList');
      if (!el) return;
      if (!rooms?.length) { el.innerHTML=`<div class="empty"><div class="empty-icon">🎮</div><div class="empty-text">Chưa có phòng nào. Tạo phòng đầu tiên!</div></div>`; return; }
      el.innerHTML = rooms.map(r=>`
      <div class="lb-row" style="margin-bottom:8px">
        <div style="font-size:20px">${r.mode==='1v1'?'⚔️':'🏟️'}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600;font-family:var(--mono)">${r.room_code}</div>
          <div style="font-size:11px;color:var(--muted)">${r.mode==='1v1'?'1v1 Speed':'Battle'} · ${r.question_count} câu</div>
        </div>
        <span class="badge badge-green">Đang chờ</span>
        <button class="btn btn-primary btn-sm" onclick="gamePage.joinRoom('${r.room_code}')">Vào →</button>
      </div>`).join('');
    } catch(e) { console.error(e); }
  }

  destroy() { clearInterval(this._timer); if(this._roomSub) this._roomSub.unsubscribe(); }
}