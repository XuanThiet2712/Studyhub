import { DayProgress } from '../models/index.js';
import { Toast }       from '../components/index.js';

const TOEIC_DAYS = [
  { day:1,  title:'Giới thiệu & Chào hỏi',      theme:'Workplace',   grammar:'TO BE (am/is/are)',            vocab:['office','meeting','manager','colleague','department'],     reviewDays:[] },
  { day:2,  title:'Văn phòng phẩm & Thiết bị',  theme:'Workplace',   grammar:'Danh từ số ít / số nhiều',    vocab:['computer','printer','document','deadline','schedule'],      reviewDays:[1] },
  { day:3,  title:'Email & Điện thoại',          theme:'Workplace',   grammar:'Thì hiện tại đơn',             vocab:['reply','attachment','confirm','urgent','available'],        reviewDays:[1,2] },
  { day:4,  title:'Lịch hẹn & Cuộc họp',        theme:'Workplace',   grammar:'Will & Be going to',           vocab:['appointment','postpone','agenda','minutes','presentation'], reviewDays:[1,3] },
  { day:5,  title:'Ôn tập Tuần 1',               theme:'Workplace',   grammar:'Ôn tổng hợp tuần 1',          vocab:['efficient','approve','submit','policy','budget'],           reviewDays:[1,2,3,4] },
  { day:6,  title:'Mua bán & Đặt hàng',         theme:'Business',    grammar:'Câu bị động hiện tại',         vocab:['invoice','purchase','discount','shipment','quantity'],      reviewDays:[1,3,5] },
  { day:7,  title:'Tài chính & Ngân hàng',       theme:'Business',    grammar:'So sánh hơn/nhất',            vocab:['transaction','account','profit','expense','interest'],      reviewDays:[2,4,6] },
  { day:8,  title:'Vận chuyển & Giao nhận',     theme:'Business',    grammar:'Giới từ at/on/in',             vocab:['delivery','tracking','customs','freight','warehouse'],      reviewDays:[1,5,7] },
  { day:9,  title:'Nhà hàng & Tiếp khách',      theme:'Business',    grammar:'Can/Could/Would',              vocab:['reservation','hospitality','menu','receipt','entertain'],   reviewDays:[2,6,8] },
  { day:10, title:'Ôn tập Tuần 2',               theme:'Business',    grammar:'Ôn tổng hợp tuần 2',          vocab:['negotiate','contract','refund','wholesale','retail'],       reviewDays:[1,3,5,7,9] },
  { day:11, title:'Tuyển dụng & Phỏng vấn',     theme:'HR',          grammar:'Câu hỏi WH-',                 vocab:['candidate','resume','qualification','position','salary'],   reviewDays:[2,5,8,10] },
  { day:12, title:'Hợp đồng lao động',          theme:'HR',          grammar:'Must/Have to/Should',          vocab:['probation','benefit','overtime','resignation','promotion'], reviewDays:[3,6,9,11] },
  { day:13, title:'Đào tạo & Phát triển',       theme:'HR',          grammar:'Thì hiện tại hoàn thành',     vocab:['training','seminar','certificate','mentor','evaluate'],     reviewDays:[4,7,10,12] },
  { day:14, title:'Hiệu suất & Đánh giá',       theme:'HR',          grammar:'Too/Enough + adj',             vocab:['performance','appraisal','target','feedback','reward'],     reviewDays:[5,8,11,13] },
  { day:15, title:'Ôn tập Tuần 3',               theme:'HR',          grammar:'Ôn tổng hợp tuần 3',          vocab:['productivity','teamwork','leadership','deadline','goal'],   reviewDays:[1,5,10,14] },
  { day:16, title:'Sân bay & Vé máy bay',       theme:'Travel',      grammar:'Hiện tại hoàn thành',         vocab:['itinerary','departure','boarding','baggage','layover'],     reviewDays:[2,6,10,14] },
  { day:17, title:'Khách sạn & Đặt phòng',      theme:'Travel',      grammar:'Câu điều kiện loại 1',        vocab:['accommodation','check-in','suite','amenity','concierge'],   reviewDays:[3,7,11,15] },
  { day:18, title:'Giao thông & Di chuyển',      theme:'Travel',      grammar:'Câu bị động quá khứ',         vocab:['shuttle','transit','fare','route','terminal'],              reviewDays:[4,8,12,16] },
  { day:19, title:'Hội nghị & Triển lãm',       theme:'Travel',      grammar:'So sánh bằng (as...as)',      vocab:['convention','exhibit','booth','delegate','keynote'],        reviewDays:[5,9,13,17] },
  { day:20, title:'Ôn tập Tuần 4',               theme:'Travel',      grammar:'Ôn tổng hợp tuần 4',          vocab:['expense','reimburse','per diem','currency','exchange'],     reviewDays:[1,5,10,15,19] },
  { day:21, title:'Marketing & Quảng cáo',      theme:'Marketing',   grammar:'Câu quan hệ (which/that)',    vocab:['campaign','target','brand','promotion','awareness'],        reviewDays:[2,7,12,16,20] },
  { day:22, title:'Bán hàng & Khách hàng',      theme:'Marketing',   grammar:'V-ing vs To-infinitive',      vocab:['revenue','customer','loyalty','complaint','satisfaction'],  reviewDays:[3,8,13,17,21] },
  { day:23, title:'Nghiên cứu & Phát triển',    theme:'Marketing',   grammar:'Câu hỏi đuôi (tag Q)',        vocab:['innovation','launch','prototype','patent','feasibility'],   reviewDays:[4,9,14,18,22] },
  { day:24, title:'Công nghệ thông tin',        theme:'Technology',  grammar:'Mệnh đề danh từ',             vocab:['software','database','server','encrypt','interface'],       reviewDays:[5,10,15,19,23] },
  { day:25, title:'Ôn tập Tuần 5',               theme:'Technology',  grammar:'Ôn tổng hợp tuần 5',          vocab:['upgrade','bandwidth','cloud','cybersecurity','backup'],    reviewDays:[1,5,10,15,20,24] },
  { day:26, title:'Môi trường & Bền vững',      theme:'Environment', grammar:'Câu điều kiện loại 2',        vocab:['sustainable','emission','recycle','renewable','carbon'],    reviewDays:[2,7,12,17,21,25] },
  { day:27, title:'Luật & Quy định',            theme:'Legal',       grammar:'Động từ khuyết thiếu bị động',vocab:['regulation','compliance','liability','clause','dispute'],   reviewDays:[3,8,13,18,22,26] },
  { day:28, title:'Báo cáo & Phân tích',        theme:'Analysis',    grammar:'Phó từ chỉ tần suất',         vocab:['quarterly','forecast','revenue','indicator','benchmark'],   reviewDays:[4,9,14,19,23,27] },
  { day:29, title:'Thư tín & Văn bản',          theme:'Writing',     grammar:'Ôn viết email chuẩn TOEIC',   vocab:['regarding','enclosed','attached','sincerely','appreciate'],reviewDays:[5,10,15,20,24,28] },
  { day:30, title:'TOEIC Full Review & Mock',   theme:'Review',      grammar:'Tổng ôn 600+ TOEIC',          vocab:['comprehensive','strategic','optimal','leverage','maximize'],reviewDays:[1,5,10,15,20,25,29] },
];

const VOCAB_DETAIL = {
  office:{vi:'văn phòng',phone:'/ˈɒfɪs/',ex:'She works in a large office.',tip:'off+ice → văn phòng lạnh 😄'},
  meeting:{vi:'cuộc họp',phone:'/ˈmiːtɪŋ/',ex:'We have a meeting at 9 AM.',tip:'meet+ing = đang gặp nhau'},
  manager:{vi:'quản lý',phone:'/ˈmænɪdʒər/',ex:'The manager approved the report.',tip:'manage+r = người quản lý'},
  colleague:{vi:'đồng nghiệp',phone:'/ˈkɒliːɡ/',ex:'My colleague helped me finish.',tip:'col+league = cùng nhóm'},
  department:{vi:'phòng ban',phone:'/dɪˈpɑːtmənt/',ex:'She works in HR department.',tip:'depart+ment = phần tách ra'},
  invoice:{vi:'hóa đơn',phone:'/ˈɪnvɔɪs/',ex:'Please pay within 30 days.',tip:'in+voice = tiếng nói về hàng'},
  purchase:{vi:'mua hàng',phone:'/ˈpɜːtʃɪs/',ex:'We purchase supplies monthly.',tip:'pur+chase = đuổi để mua'},
  discount:{vi:'giảm giá',phone:'/ˈdɪskaʊnt/',ex:'20% discount for bulk orders.',tip:'dis+count = tính bớt đi'},
  shipment:{vi:'lô hàng',phone:'/ˈʃɪpmənt/',ex:'The shipment arrives Monday.',tip:'ship+ment = hàng được gửi'},
  quantity:{vi:'số lượng',phone:'/ˈkwɒntɪti/',ex:'What quantity do you need?',tip:'quant+ity = bao nhiêu cái'},
  candidate:{vi:'ứng viên',phone:'/ˈkændɪdət/',ex:'We interviewed 10 candidates.',tip:'candid = thành thật → người tự giới thiệu'},
  salary:{vi:'lương',phone:'/ˈsæləri/',ex:'What is the starting salary?',tip:'sal (muối Latin) → ngày xưa trả lương bằng muối'},
};

export class RoadmapPage {
  constructor(db, store, bus) {
    this.db         = db;
    this.store      = store;
    this.bus        = bus;
    this._progress  = {};
    this._activeDay = 1;
    this._activeWeek= 0;
    this._timer     = null;
    this._elapsed   = 0;
  }

  render() {
    document.querySelector('.main').innerHTML = `
    <div class="page">
      <div class="page-header-row page-header">
        <div><h1 class="page-title">📅 Lộ trình TOEIC 30 ngày</h1><p class="page-sub">Beginner → 600+ · 30 phút/ngày · Spaced Repetition</p></div>
        <div style="text-align:right">
          <div style="font-family:var(--serif);font-style:italic;font-size:24px;font-weight:700;color:var(--blue)" id="overallPct">0%</div>
          <div style="font-size:11px;color:var(--muted);font-family:var(--mono)" id="overallLabel">0/30 ngày</div>
        </div>
      </div>

      <!-- Overall progress bar -->
      <div style="margin-bottom:24px">
        <div class="prog-track" style="height:8px"><div class="prog-fill" id="mainBar" style="width:0%;background:linear-gradient(90deg,var(--blue),var(--purple))"></div></div>
      </div>

      <!-- Week tabs -->
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px" id="weekTabs"></div>

      <!-- Day grid -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:24px" id="dayGrid"></div>

      <!-- Lesson area -->
      <div id="lessonArea"></div>
    </div>`;

    window.roadmapPage = this;
    this.loadProgress();
  }

  async loadProgress() {
    const user = this.store.get('currentUser');
    try {
      const rows = await this.db.select('learning_progress',{ eq:{ user_id: user.id } });
      rows.forEach(r => { this._progress[r.day_number] = new DayProgress(r); });
    } catch(e) { console.error(e); }
    const saved = parseInt(localStorage.getItem('sh_roadmap_activeDay')||'1');
    this._activeDay  = saved;
    this._activeWeek = Math.floor((saved-1)/5);
    this.renderWeekTabs();
    this.renderDayGrid();
    this.renderLesson();
  }

  renderWeekTabs() {
    const weeks=[
      {w:1,label:'🏢 Workplace',color:'var(--blue)'},
      {w:2,label:'💼 Business',color:'var(--green)'},
      {w:3,label:'👥 HR',color:'var(--purple)'},
      {w:4,label:'✈️ Travel',color:'var(--orange)'},
      {w:5,label:'💻 Tech+',color:'var(--teal)'},
      {w:6,label:'📝 Review',color:'var(--red)'},
    ];
    const el = document.getElementById('weekTabs');
    el.innerHTML = weeks.map((w,i)=>`
    <button onclick="roadmapPage.selectWeek(${i})"
      style="padding:7px 14px;border-radius:99px;font-size:12px;border:1.5px solid ${i===this._activeWeek?w.color:'var(--border)'};background:${i===this._activeWeek?w.color+'18':'transparent'};color:${i===this._activeWeek?w.color:'var(--muted)'};cursor:pointer;font-family:var(--font);transition:all .15s">
      ${w.label}
    </button>`).join('');
  }

  selectWeek(wi) {
    this._activeWeek = wi;
    const firstDay = wi*5+1;
    this._activeDay = Math.min(firstDay, 30);
    this.renderWeekTabs();
    this.renderDayGrid();
    this.renderLesson();
  }

  renderDayGrid() {
    const start = this._activeWeek*5+1;
    const days  = TOEIC_DAYS.slice(start-1, start+5);
    const el    = document.getElementById('dayGrid');
    el.innerHTML = days.map(d => {
      const dp      = this._progress[d.day];
      const done    = dp?.completed;
      const active  = d.day === this._activeDay;
      const hasReview = d.reviewDays.some(r => this._progress[r]?.completed);
      return `<button onclick="roadmapPage.selectDay(${d.day})"
        style="padding:12px 6px;border-radius:var(--r-lg);border:2px solid ${active?'var(--blue)':done?'var(--green)':'var(--border)'};background:${active?'var(--blue-l)':done?'var(--green-l)':'var(--surface)'};cursor:pointer;text-align:center;transition:all .15s;font-family:var(--font)">
        <div style="font-family:var(--serif);font-style:italic;font-size:20px;font-weight:700;color:${active?'var(--blue)':done?'var(--green)':'var(--text)'}">${d.day}</div>
        <div style="font-size:9px;color:var(--muted);margin:2px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%">${d.title.length>12?d.title.slice(0,12)+'…':d.title}</div>
        <div style="font-size:13px">${done?'✅':hasReview?'🔁':'○'}</div>
        ${dp&&!done?`<div style="height:3px;background:var(--bg3);border-radius:99px;overflow:hidden;margin-top:4px"><div style="width:${dp.progressPct}%;height:100%;background:var(--orange);border-radius:99px"></div></div>`:''}
      </button>`;
    }).join('');
  }

  selectDay(day) {
    this._activeDay = day;
    localStorage.setItem('sh_roadmap_activeDay', day);
    this._activeWeek = Math.floor((day-1)/5);
    this.renderWeekTabs();
    this.renderDayGrid();
    this.renderLesson();
  }

  renderLesson() {
    const d  = TOEIC_DAYS.find(x=>x.day===this._activeDay);
    if (!d) return;
    const dp = this._progress[d.day] || new DayProgress({ day_number: d.day });
    const done = this._progress[d.day]?.completed;
    const user = this.store.get('currentUser');

    // Update overall stats
    const totalDone = Object.values(this._progress).filter(p=>p.completed).length;
    const pct = Math.round(totalDone/30*100);
    document.getElementById('overallPct').textContent  = pct+'%';
    document.getElementById('overallLabel').textContent = `${totalDone}/30 ngày`;
    document.getElementById('mainBar').style.width      = pct+'%';

    // Spaced repetition review notice
    const reviewNotice = d.reviewDays.filter(r=>this._progress[r]?.completed).length > 0 ? `
    <div style="background:var(--orange-l);border:1px solid rgba(249,115,22,.3);border-radius:var(--r-md);padding:12px 14px;margin-bottom:16px;font-size:13px">
      🔁 <strong>Ôn lại hôm nay (Spaced Repetition):</strong> Từ vựng của ngày ${d.reviewDays.join(', ')} cần được ôn.
      <button class="btn btn-ghost btn-sm" style="margin-left:8px" onclick="roadmapPage.showReviewWords(${JSON.stringify(d.reviewDays)})">Ôn ngay →</button>
    </div>` : '';

    const el = document.getElementById('lessonArea');
    el.innerHTML = `
    ${reviewNotice}
    <div style="display:grid;grid-template-columns:1fr 320px;gap:18px">
      <div style="display:flex;flex-direction:column;gap:14px">

        <!-- GRAMMAR -->
        <div class="card">
          <div class="card-title" style="color:var(--purple)">📐 Ngữ pháp — ${d.grammar}</div>
          <div style="background:var(--purple-l);border-radius:var(--r-md);padding:12px;font-family:var(--mono);font-size:13px;color:#7c3aed;margin-bottom:10px">
            Chủ đề: <strong>${d.grammar}</strong>
          </div>
          <div style="font-size:13px;color:var(--muted);line-height:1.8">
            Học cấu trúc ngữ pháp TOEIC quan trọng này. Xem ví dụ và làm bài tập Part 5-6.
          </div>
          <div style="margin-top:10px;display:flex;gap:6px">
            <button class="btn btn-ghost btn-sm" onclick="vocabPage&&vocabPage.quickDict('${d.grammar.split(' ')[0].toLowerCase()}')">📖 Tra từ điển</button>
            <button class="btn ${dp.grammarDone?'btn-success':'btn-ghost'} btn-sm" onclick="roadmapPage.markSection('grammar')">
              ${dp.grammarDone?'✅ Đã học':'○ Đánh dấu hoàn thành'}
            </button>
          </div>
        </div>

        <!-- VOCAB -->
        <div class="card">
          <div class="card-title" style="color:var(--blue)">📖 Từ vựng TOEIC (${d.vocab.length} từ mới)</div>
          ${d.vocab.map(w=>{
            const det = VOCAB_DETAIL[w]||{vi:'(xem từ điển)',phone:'',ex:'',tip:''};
            return `<div style="border-bottom:1px solid var(--border);padding:12px 0">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span style="font-family:var(--serif);font-style:italic;font-size:20px;font-weight:700;color:var(--blue)">${w}</span>
                <button onclick="roadmapPage.speak('${w}')" style="background:none;border:none;cursor:pointer;font-size:14px">🔊</button>
                <span style="font-family:var(--mono);font-size:11px;color:var(--muted)">${det.phone}</span>
              </div>
              <div style="font-size:13px;font-weight:500;margin:4px 0">🇻🇳 ${det.vi}</div>
              ${det.ex?`<div style="font-size:12px;color:var(--muted);font-style:italic;border-left:2px solid var(--border2);padding-left:8px;margin-bottom:4px">"${det.ex}"</div>`:''}
              ${det.tip?`<div style="font-size:11px;color:var(--orange);background:var(--orange-l);padding:3px 8px;border-radius:6px;display:inline-block">💡 ${det.tip}</div>`:''}
              <button class="btn btn-ghost btn-sm" style="margin-top:6px" onclick="roadmapPage.saveToVocab('${w}','${det.vi}','${det.phone}')">＋ Lưu vào từ vựng</button>
            </div>`;
          }).join('')}
          <button class="btn ${dp.vocabDone?'btn-success':'btn-ghost'} btn-sm" style="margin-top:10px" onclick="roadmapPage.markSection('vocab')">
            ${dp.vocabDone?'✅ Đã học từ vựng':'○ Đã học hết từ mới'}
          </button>
        </div>

        <!-- LISTENING -->
        <div class="card">
          <div class="card-title" style="color:var(--green)">🎧 Luyện nghe <span class="badge badge-green" style="font-size:10px">TOEIC Part 1-4</span></div>
          <div style="background:var(--green-l);border-radius:var(--r-lg);padding:14px;margin-bottom:12px">
            <div style="font-size:13px;font-weight:600;color:#16a34a;margin-bottom:8px">🎯 Bài tập luyện nghe — Chủ đề: ${d.theme}</div>
            <div style="font-size:12px;color:var(--text);line-height:1.9">
              <strong>Bước 1 · Part 1 (Ảnh mô tả):</strong> Nhìn ảnh văn phòng/công sở, đoán 4 câu mô tả, chọn câu đúng nhất.<br>
              <strong>Bước 2 · Part 2 (Hỏi-đáp):</strong> Nghe câu hỏi → chọn câu trả lời A/B/C phù hợp nhất.<br>
              <strong>Bước 3 · Part 3 (Hội thoại):</strong> Nghe đoạn hội thoại 3 người về <em>${d.theme.toLowerCase()}</em> → trả lời 3 câu hỏi.<br>
              <strong>Bước 4 · Part 4 (Bài nói):</strong> Nghe thông báo/bài phát biểu liên quan chủ đề → trả lời 3 câu.
            </div>
          </div>
          <div style="background:var(--bg2);border-radius:var(--r-md);padding:10px 12px;font-size:12px;margin-bottom:10px;border-left:3px solid var(--green)">
            <strong>📌 Chiến lược thi:</strong><br>
            • Đọc câu hỏi <strong>trước</strong> khi audio bắt đầu (dùng thời gian chuyển slide)<br>
            • Part 1: chú ý <em>chủ ngữ + động từ</em> — tránh bẫy "trông giống nhưng sai"<br>
            • Part 3-4: gạch chân từ khoá trong câu hỏi, scan đáp án song song khi nghe<br>
            • Không hiểu → đoán ngay, KHÔNG bỏ trống, chuyển câu tiếp theo
          </div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:10px">
            💬 <strong>Từ khoá cần nghe:</strong> ${d.vocab.slice(0,4).map(w=>`<span style="background:var(--green-l);padding:2px 7px;border-radius:99px;margin:2px;display:inline-block;font-family:var(--mono);font-size:11px">${w}</span>`).join('')}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="roadmapPage.speak('${d.vocab[0]||'meeting'} is scheduled for tomorrow morning.')">▶ Nghe câu mẫu</button>
            <button class="btn ${dp.listeningDone?'btn-success':'btn-ghost'} btn-sm" onclick="roadmapPage.markSection('listening')">
              ${dp.listeningDone?'✅ Đã luyện nghe':'○ Đánh dấu hoàn thành'}
            </button>
          </div>
        </div>

        <!-- READING -->
        <div class="card">
          <div class="card-title" style="color:var(--orange)">📄 Đọc hiểu <span class="badge badge-orange" style="font-size:10px">TOEIC Part 5-7</span></div>
          <div style="background:var(--orange-l);border-radius:var(--r-lg);padding:14px;margin-bottom:12px">
            <div style="font-size:13px;font-weight:600;color:#c2410c;margin-bottom:8px">🎯 Bài tập đọc hiểu — Chủ đề: ${d.theme}</div>
            <div style="font-size:12px;color:var(--text);line-height:1.9">
              <strong>Bước 1 · Part 5 (Điền từ):</strong> Hoàn thành câu bằng cách chọn từ đúng (danh từ/động từ/tính từ/trạng từ). Áp dụng ngữ pháp: <em>${d.grammar}</em><br>
              <strong>Bước 2 · Part 6 (Điền đoạn):</strong> Đọc email/thư từ và chọn câu/từ phù hợp điền vào 4 chỗ trống.<br>
              <strong>Bước 3 · Part 7 (Đọc bài):</strong> Đọc email, thông báo, quảng cáo về <em>${d.theme.toLowerCase()}</em> và trả lời câu hỏi.
            </div>
          </div>
          <div style="background:var(--bg2);border-radius:var(--r-md);padding:10px 12px;font-size:12px;margin-bottom:12px;border-left:3px solid var(--orange)">
            <strong>📌 Chiến lược thi:</strong><br>
            • Part 5: 30 giây/câu — đọc đầu-cuối câu trước, xác định từ loại cần điền<br>
            • Part 6: đọc toàn đoạn trước → hiểu context → mới chọn câu/từ điền<br>
            • Part 7 Single: đọc câu hỏi → scan bài → locate đáp án (không đọc từ đầu đến cuối!)<br>
            • Part 7 Multiple: đọc câu hỏi so sánh 2 bài → chỉ đọc phần liên quan
          </div>
          <div style="font-size:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:10px;margin-bottom:10px">
            <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:6px">📝 MẪU CÂU PART 5 — Dùng ngữ pháp: ${d.grammar}</div>
            <div style="font-size:12px;color:var(--text);font-style:italic">
              "The ${d.vocab[0]||'manager'} was ___ by the board of directors." → <strong>approved / approving / approval / approvingly</strong>
            </div>
          </div>
          <button class="btn ${dp.readingDone?'btn-success':'btn-ghost'} btn-sm" onclick="roadmapPage.markSection('reading')">
            ${dp.readingDone?'✅ Đã đọc hiểu':'○ Đánh dấu hoàn thành'}
          </button>
        </div>

        <!-- WRITING -->
        <div class="card">
          <div class="card-title" style="color:var(--teal)">✍️ Luyện viết <span style="background:#ccfbf1;color:#0f766e;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600">Email · Note · Report</span></div>
          <div style="background:#f0fdfa;border-radius:var(--r-lg);padding:14px;margin-bottom:12px">
            <div style="font-size:13px;font-weight:600;color:#0f766e;margin-bottom:8px">🎯 Bài tập viết — Chủ đề: ${d.theme}</div>
            <div style="font-size:12px;color:var(--text);line-height:1.9">
              <strong>Bài tập 1 · Viết email (10 phút):</strong><br>
              Viết email ngắn (50-80 từ) liên quan đến <em>${d.theme.toLowerCase()}</em>. Sử dụng các từ: <em>${d.vocab.slice(0,3).join(', ')}</em><br>
              <strong>Bài tập 2 · Hoàn thành câu (5 phút):</strong><br>
              Điền từ vựng hôm nay vào câu cho sẵn, sau đó dịch sang tiếng Anh.
            </div>
          </div>
          <div style="border:1px dashed var(--teal);border-radius:var(--r-md);padding:12px;margin-bottom:10px">
            <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:8px">📝 ĐỀ BÀI HÔM NAY:</div>
            <div style="font-size:12px;color:var(--text);line-height:1.8">
              Viết email gửi cho đồng nghiệp thông báo về <strong>${d.title.toLowerCase()}</strong>.<br>
              • Mở đầu: chào hỏi, nêu lý do viết<br>
              • Thân bài: thông tin chính về ${d.theme.toLowerCase()}, dùng từ <em>${d.vocab[0]||'meeting'}</em> và <em>${d.vocab[1]||'schedule'}</em><br>
              • Kết thúc: lời kêu gọi hành động (CTA) + ký tên
            </div>
          </div>
          <div style="background:var(--bg2);border-radius:var(--r-md);padding:10px 12px;font-size:12px;margin-bottom:10px;border-left:3px solid var(--teal)">
            <strong>📌 Cấu trúc email chuẩn TOEIC:</strong><br>
            <span style="font-family:var(--mono);font-size:11px">Subject: Re: [Chủ đề rõ ràng]<br>Dear [Name],<br>I am writing to inform you that...<br>Please do not hesitate to contact me.<br>Best regards, [Tên]</span>
          </div>
          <button class="btn ${dp.writingDone?'btn-success':'btn-ghost'} btn-sm" onclick="roadmapPage.markSection('writing')">
            ${dp.writingDone?'✅ Đã luyện viết':'○ Đánh dấu hoàn thành'}
          </button>
        </div>

        <!-- SPEAKING -->
        <div class="card">
          <div class="card-title" style="color:var(--pink)">🗣️ Luyện nói <span style="background:#fce7f3;color:#be185d;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600">Shadow + Record</span></div>
          <div style="background:var(--pink-l);border-radius:var(--r-lg);padding:14px;margin-bottom:12px">
            <div style="font-size:13px;font-weight:600;color:#be185d;margin-bottom:8px">🎯 Luyện nói chủ đề: ${d.title}</div>
            <div style="font-size:12px;color:var(--text);line-height:1.9">
              <strong>Bước 1 · Shadowing (5 phút):</strong> Bấm nút nghe câu mẫu dưới đây → nhắc lại ngay, bắt chước ngữ điệu và phát âm<br>
              <strong>Bước 2 · Tự nói (5 phút):</strong> Nói về <em>${d.theme.toLowerCase()}</em> trong 1-2 phút — dùng ít nhất 3 từ mới hôm nay<br>
              <strong>Bước 3 · Role-play:</strong> Giả sử bạn đang trong cuộc hội thoại tại nơi làm việc về chủ đề này
            </div>
          </div>
          <div style="font-size:12px;margin-bottom:10px">
            <div style="font-weight:600;margin-bottom:6px;color:var(--text)">🎤 Câu mẫu để shadowing:</div>
            ${d.vocab.slice(0,3).map((w,i) => {
              const sentences = [
                `"I need to check the ${w} before the meeting starts."`,
                `"Could you please handle the ${w} for me today?"`,
                `"The ${w} has been approved by the manager."`
              ];
              return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:8px;margin-bottom:6px;display:flex;align-items:center;gap:8px">
                <button onclick="roadmapPage.speak(${JSON.stringify(sentences[i]||sentences[0])})" style="background:var(--pink-l);border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:14px;flex-shrink:0">▶</button>
                <span style="font-size:12px;font-style:italic;color:var(--text)">${sentences[i]||sentences[0]}</span>
              </div>`;
            }).join('')}
          </div>
          <div style="background:var(--bg2);border-radius:var(--r-md);padding:10px 12px;font-size:12px;margin-bottom:10px;border-left:3px solid var(--pink)">
            <strong>💡 Từ bắt buộc dùng:</strong> ${d.vocab.slice(0,3).map(w=>`<span style="background:var(--pink-l);padding:2px 7px;border-radius:99px;font-family:var(--mono);font-size:11px">${w}</span>`).join(' ')}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="roadmapPage.startSpeakingPractice('${d.title}', '${d.vocab.slice(0,3).join(',')}')">🎤 Bắt đầu luyện nói</button>
            <button class="btn ${dp.speakingDone?'btn-success':'btn-ghost'} btn-sm" onclick="roadmapPage.markSection('speaking')">
              ${dp.speakingDone?'✅ Đã luyện nói':'○ Đánh dấu hoàn thành'}
            </button>
          </div>
        </div>
      </div>

      <!-- SIDEBAR -->
      <div style="display:flex;flex-direction:column;gap:12px">
        <!-- Timer -->
        <div class="card" style="text-align:center">
          <div class="card-title" style="justify-content:center">⏱️ Thời gian học</div>
          <div style="font-family:var(--serif);font-style:italic;font-size:36px;font-weight:700;color:var(--blue)" id="studyTimer">${this._formatTime(this._elapsed)}</div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:10px;font-family:var(--mono)">Mục tiêu: 30 phút</div>
          <div class="prog-track"><div class="prog-fill" id="timerBar" style="width:${Math.min(this._elapsed/1800*100,100)}%;background:var(--accent-g)"></div></div>
          <div style="display:flex;gap:6px;justify-content:center;margin-top:10px">
            <button class="btn btn-ghost btn-sm" id="timerBtn" onclick="roadmapPage.toggleTimer()">▶ Bắt đầu</button>
            <button class="btn btn-ghost btn-sm" onclick="roadmapPage.resetTimer()">↺</button>
          </div>
        </div>

        <!-- Checklist -->
        <div class="card">
          <div class="card-title">✅ Checklist ngày ${d.day}</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:10px;font-family:var(--mono)">${dp.progressPct}% hoàn thành</div>
          <div class="prog-track" style="margin-bottom:12px"><div class="prog-fill" style="width:${dp.progressPct}%;background:var(--green)"></div></div>
          ${[['grammar','📐 Ngữ pháp'],['vocab','📖 Từ vựng'],['listening','🎧 Luyện nghe'],['reading','📄 Đọc hiểu'],['writing','✍️ Luyện viết'],['speaking','🗣️ Luyện nói']].map(([sec,label])=>`
          <label style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);cursor:pointer;font-size:13px">
            <input type="checkbox" ${dp[sec+'Done']?'checked':''} onchange="roadmapPage.markSection('${sec}')">
            <span style="text-decoration:${dp[sec+'Done']?'line-through':''};color:${dp[sec+'Done']?'var(--muted)':'var(--text)'}">${label}</span>
          </label>`).join('')}
          <button class="btn btn-primary" style="width:100%;margin-top:12px;justify-content:center" ${done?'disabled':''} onclick="roadmapPage.completDay()">
            ${done?'✅ Đã hoàn thành!':'🎯 Hoàn thành ngày '+d.day}
          </button>
        </div>

        <!-- Quick recap -->
        <div class="card">
          <div class="card-title">⚡ Quick recap</div>
          ${d.vocab.map(w=>{ const det=VOCAB_DETAIL[w]||{vi:'?'}; return `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px"><span style="font-family:var(--serif);font-style:italic;color:var(--blue)">${w}</span><span style="color:var(--muted)">${det.vi}</span></div>`; }).join('')}
        </div>

        <!-- Day info -->
        <div class="card" style="text-align:center;background:var(--blue-l);border-color:rgba(59,130,246,.2)">
          <div style="font-size:22px;font-weight:700;font-family:var(--serif);color:var(--blue-d)">Ngày ${d.day}/30</div>
          <div style="font-size:12px;color:var(--muted);margin:4px 0">${d.theme}</div>
          <div style="font-size:11px;color:var(--orange);font-style:italic">"Just do it first!" 💪</div>
        </div>
      </div>
    </div>`;

    this._startTimer();
  }

  // ── TIMER ───────────────────────────────────────
  _timerInterval = null;
  _timerRunning  = false;

  _startTimer() {
    // Don't auto-start, let user click
  }
  toggleTimer() {
    this._timerRunning = !this._timerRunning;
    document.getElementById('timerBtn').textContent = this._timerRunning ? '⏸ Tạm dừng' : '▶ Tiếp tục';
    if (this._timerRunning) {
      this._timerInterval = setInterval(()=>{
        this._elapsed++;
        const el = document.getElementById('studyTimer');
        const bar= document.getElementById('timerBar');
        if(el) el.textContent = this._formatTime(this._elapsed);
        if(bar) bar.style.width = Math.min(this._elapsed/1800*100,100)+'%';
        if(this._elapsed===1800) Toast.ok('🎉 Đã học đủ 30 phút hôm nay!');
      },1000);
    } else { clearInterval(this._timerInterval); }
  }
  resetTimer() { clearInterval(this._timerInterval); this._timerRunning=false; this._elapsed=0; const el=document.getElementById('studyTimer'); if(el)el.textContent='00:00'; const bar=document.getElementById('timerBar');if(bar)bar.style.width='0%'; const btn=document.getElementById('timerBtn');if(btn)btn.textContent='▶ Bắt đầu'; }
  _formatTime(s) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }

  // ── SECTIONS ────────────────────────────────────
  async markSection(section) {
    const d    = TOEIC_DAYS.find(x=>x.day===this._activeDay);
    const user = this.store.get('currentUser');
    let dp     = this._progress[d.day];
    if (!dp) dp = new DayProgress({ user_id: user.id, day_number: d.day });
    dp.markSection(section);
    this._progress[d.day] = dp;
    await this.db.upsert('learning_progress', { ...dp.toJSON(), user_id: user.id }, 'user_id,day_number');
    this.renderDayGrid();
    this.renderLesson();
  }

  async completDay() {
    const d    = TOEIC_DAYS.find(x=>x.day===this._activeDay);
    const user = this.store.get('currentUser');
    let dp     = this._progress[d.day] || new DayProgress({ user_id: user.id, day_number: d.day });
    dp.completed=true; dp.completedAt=new Date().toISOString(); dp.timeSpent=Math.round(this._elapsed/60);
    this._progress[d.day]=dp;
    await this.db.upsert('learning_progress',{...dp.toJSON(),user_id:user.id},'user_id,day_number');
    // XP + leaderboard
    await this.db.update('profiles',user.id,{xp:(user.xp||0)+50,streak:(user.streak||0)+1});
    await this.db.upsert('leaderboard_cache',{user_id:user.id,study_days:Object.values(this._progress).filter(p=>p.completed).length+1,updated_at:new Date().toISOString()},'user_id');
    Toast.ok(`🎉 Hoàn thành Ngày ${d.day}! +50 XP`);
    this.renderDayGrid(); this.renderLesson();
    // Auto advance
    if (this._activeDay < 30) setTimeout(()=>this.selectDay(this._activeDay+1),1000);
  }

  async saveToVocab(word, vi, phone) {
    const user = this.store.get('currentUser');
    try {
      await this.db.insert('vocabulary',{ user_id:user.id, word, meaning_vi:vi, phonetic:phone, word_type:'n', category:'TOEIC', srs_level:0, next_review:new Date().toISOString(), review_count:0 });
      await this.db.update('profiles',user.id,{xp:(user.xp||0)+5});
      Toast.ok(`Đã lưu "${word}" · +5 XP`);
    } catch { Toast.info(`"${word}" đã có trong từ vựng`); }
  }

  showReviewWords(days) {
    const words = [];
    days.forEach(d => { const day=TOEIC_DAYS.find(x=>x.day===d); if(day) day.vocab.forEach(w=>words.push({word:w,...(VOCAB_DETAIL[w]||{vi:'?',phone:''})})); });
    const modal = document.createElement('div');
    modal.className='modal-overlay';
    modal.innerHTML=`<div class="modal" style="max-width:540px">
      <div class="modal-title">🔁 Ôn lại từ ngày ${days.join(', ')}</div>
      ${words.map(v=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div><span style="font-family:var(--serif);font-style:italic;font-size:18px;color:var(--blue)">${v.word}</span><button onclick="roadmapPage.speak('${v.word}')" style="background:none;border:none;cursor:pointer">🔊</button><div style="font-size:11px;color:var(--muted);font-family:var(--mono)">${v.phone}</div></div>
        <div style="text-align:right"><div style="font-weight:500;font-size:13px">${v.vi}</div></div>
      </div>`).join('')}
      <div class="modal-footer"><button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Đóng</button></div>
    </div>`;
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
    document.body.appendChild(modal);
  }

  startSpeakingPractice(topic, vocabStr) {
    const vocab = vocabStr.split(',');
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal" style="max-width:500px">
      <div class="modal-title">🎤 Luyện nói — ${topic}</div>
      <div style="background:var(--pink-l);border-radius:var(--r-md);padding:12px;margin-bottom:14px;font-size:13px">
        <strong>Chủ đề:</strong> Nói về <em>${topic}</em> trong 1-2 phút<br>
        <strong>Từ bắt buộc dùng:</strong> ${vocab.join(', ')}
      </div>
      <div style="font-size:13px;font-weight:600;margin-bottom:8px">Gợi ý cấu trúc bài nói:</div>
      <div style="font-size:12px;color:var(--text);line-height:1.9;margin-bottom:14px">
        1. <strong>Mở đầu:</strong> "Today, I'd like to talk about ${topic.toLowerCase()}..."<br>
        2. <strong>Ý chính:</strong> Giải thích ${vocab[0]||'topic'} là gì, tầm quan trọng<br>
        3. <strong>Ví dụ:</strong> "For example, in my workplace, we often use ${vocab[1]||vocab[0]}..."<br>
        4. <strong>Kết luận:</strong> "In conclusion, ${vocab[2]||vocab[0]} plays a vital role in..."
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
        ${vocab.map(w => `<button onclick="roadmapPage.speak('${w}')" style="background:var(--pink-l);border:1px solid var(--pink);border-radius:99px;padding:4px 10px;cursor:pointer;font-family:var(--mono);font-size:12px">▶ ${w}</button>`).join('')}
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Đóng</button>
        <button class="btn btn-primary" onclick="roadmapPage.markSection('speaking');this.closest('.modal-overlay').remove()">✅ Đánh dấu hoàn thành</button>
      </div>
    </div>`;
    modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  speak(text) { if(!window.speechSynthesis)return; const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=0.85;window.speechSynthesis.cancel();window.speechSynthesis.speak(u); }
}
