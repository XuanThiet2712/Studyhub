import { Toast } from '../components/index.js';
import { aiService } from '../services/AIService.js';

// ── COURSE DATA — Add more days here ─────────────────────────────────────────
const COURSE = [
  {
    day:1, title:'Bảng chữ cái & IPA', theme:'Phonics', icon:'🔤', color:'#4f6ef7',
    goal:'Thuộc 26 chữ cái + 44 âm IPA cơ bản của tiếng Anh',
    lessons: [
      {
        id:'l1_vowels', title:'Nguyên âm (Vowels)', icon:'🔵', duration:'5 phút',
        content: `Tiếng Anh có 5 nguyên âm: **A, E, I, O, U**
Nguyên âm là những chữ tạo ra âm thanh chính trong từ.

Phân biệt 2 loại:
• **Nguyên âm dài**: âm kéo dài (ā, ē, ī, ō, ū)
• **Nguyên âm ngắn**: âm ngắn (ă, ĕ, ĭ, ŏ, ŭ)`,
        items: [
          {letter:'A',name:'a',ipa:'[eɪ]',sound:'apple → /æ/ hoặc /eɪ/'},
          {letter:'E',name:'e',ipa:'[iː]',sound:'egg → /e/ hoặc /iː/'},
          {letter:'I',name:'i',ipa:'[aɪ]',sound:'it → /ɪ/ hoặc /aɪ/'},
          {letter:'O',name:'o',ipa:'[oʊ]',sound:'on → /ɒ/ hoặc /oʊ/'},
          {letter:'U',name:'u',ipa:'[juː]',sound:'up → /ʌ/ hoặc /juː/'},
        ],
        tip:'💡 Mẹo: **A-E-I-O-U** — học thuộc thứ tự này trước!'
      },
      {
        id:'l1_consonants', title:'Phụ âm (Consonants)', icon:'🔴', duration:'8 phút',
        content: `21 phụ âm còn lại: **B,C,D,F,G,H,J,K,L,M,N,P,Q,R,S,T,V,W,X,Y,Z**
Phụ âm tạo ra âm bắt đầu hoặc kết thúc của từ.`,
        items: [
          {letter:'B',name:'bee',ipa:'[biː]',sound:'Book, Ball, Baby'},
          {letter:'C',name:'cee',ipa:'[siː]',sound:'Cat, Car, Come'},
          {letter:'D',name:'dee',ipa:'[diː]',sound:'Dog, Day, Door'},
          {letter:'F',name:'ef',ipa:'[ef]',sound:'Fish, Fly, Food'},
          {letter:'G',name:'gee',ipa:'[dʒiː]',sound:'Go, Girl, Game'},
          {letter:'H',name:'aitch',ipa:'[heɪtʃ]',sound:'Hat, Home, Hello'},
          {letter:'J',name:'jay',ipa:'[dʒeɪ]',sound:'Juice, Jump, Job'},
          {letter:'K',name:'kay',ipa:'[keɪ]',sound:'King, Key, Know'},
          {letter:'L',name:'el',ipa:'[el]',sound:'Lion, Love, Light'},
          {letter:'M',name:'em',ipa:'[em]',sound:'Moon, Man, Money'},
          {letter:'N',name:'en',ipa:'[en]',sound:'Night, Name, Now'},
          {letter:'P',name:'pee',ipa:'[piː]',sound:'Pen, Park, Phone'},
          {letter:'Q',name:'cue',ipa:'[kjuː]',sound:'Queen, Quick (luôn đi kèm U)'},
          {letter:'R',name:'ar',ipa:'[ɑːr]',sound:'Rain, Run, Road'},
          {letter:'S',name:'ess',ipa:'[es]',sound:'Sun, Sea, School'},
          {letter:'T',name:'tee',ipa:'[tiː]',sound:'Tree, Time, Talk'},
          {letter:'V',name:'vee',ipa:'[viː]',sound:'Video, Voice, Very'},
          {letter:'W',name:'double-u',ipa:'[ˈdʌbljuː]',sound:'Water, Work, World'},
          {letter:'X',name:'ex',ipa:'[eks]',sound:'X-ray /ˈeks.reɪ/'},
          {letter:'Y',name:'wy',ipa:'[waɪ]',sound:'Yellow, Year, Yes'},
          {letter:'Z',name:'zed',ipa:'[zed]',sound:'Zero, Zoo, Zone'},
        ],
        tip:'💡 Mẹo: Hát "ABC Song" mỗi ngày — não sẽ nhớ thứ tự rất nhanh!'
      },
      {
        id:'l1_ipa_vowels', title:'IPA — Nguyên âm', icon:'🟣', duration:'10 phút',
        content: `IPA = International Phonetic Alphabet (Phiên âm quốc tế)
Học IPA giúp bạn đọc ĐÚNG bất kỳ từ nào, kể cả từ chưa nghe bao giờ!

Tiếng Anh có **20 nguyên âm IPA** (12 đơn + 8 đôi):`,
        ipaVowels: [
          {sym:'iː',vi:'i dài',ex:'sheep',word:'sheep /ʃiːp/'},
          {sym:'ɪ',vi:'i ngắn',ex:'ship',word:'ship /ʃɪp/'},
          {sym:'uː',vi:'u dài',ex:'food',word:'food /fuːd/'},
          {sym:'ʊ',vi:'u ngắn',ex:'good',word:'good /ɡʊd/'},
          {sym:'e',vi:'e',ex:'bed',word:'bed /bed/'},
          {sym:'ə',vi:'ơ trung',ex:'teacher',word:'teacher /ˈtiːtʃər/'},
          {sym:'ɜː',vi:'ơ dài',ex:'bird',word:'bird /bɜːd/'},
          {sym:'ɔː',vi:'o dài',ex:'door',word:'door /dɔːr/'},
          {sym:'æ',vi:'a rộng',ex:'cat',word:'cat /kæt/'},
          {sym:'ʌ',vi:'â',ex:'cup',word:'cup /kʌp/'},
          {sym:'ɑː',vi:'a dài',ex:'car',word:'car /kɑːr/'},
          {sym:'ɒ',vi:'o ngắn',ex:'hot',word:'hot /hɒt/'},
          {sym:'eɪ',vi:'ây',ex:'wait',word:'wait /weɪt/'},
          {sym:'aɪ',vi:'ai',ex:'my',word:'my /maɪ/'},
          {sym:'ɔɪ',vi:'oi',ex:'boy',word:'boy /bɔɪ/'},
          {sym:'əʊ',vi:'ôu',ex:'show',word:'show /ʃəʊ/'},
          {sym:'aʊ',vi:'ao',ex:'cow',word:'cow /kaʊ/'},
          {sym:'ɪə',vi:'ia',ex:'here',word:'here /hɪər/'},
          {sym:'eə',vi:'ea',ex:'hair',word:'hair /heər/'},
          {sym:'ʊə',vi:'ua',ex:'tour',word:'tour /tʊər/'},
        ],
        tip:'💡 Không cần học thuộc lòng ngay — thực hành qua nghe nhiều lần!'
      },
      {
        id:'l1_ipa_consonants', title:'IPA — Phụ âm', icon:'🟠', duration:'8 phút',
        content:'Tiếng Anh có **24 phụ âm IPA**. Nhiều phụ âm giống chữ cái thường:',
        ipaConsonants: [
          {sym:'p',ex:'pen',sym2:'b',ex2:'book'},{sym:'t',ex:'tea',sym2:'d',ex2:'dog'},
          {sym:'k',ex:'car',sym2:'ɡ',ex2:'go'},{sym:'tʃ',ex:'cheese',sym2:'dʒ',ex2:'june'},
          {sym:'f',ex:'fly',sym2:'v',ex2:'van'},{sym:'θ',ex:'think',sym2:'ð',ex2:'this'},
          {sym:'s',ex:'see',sym2:'z',ex2:'zoo'},{sym:'ʃ',ex:'she',sym2:'ʒ',ex2:'vision'},
          {sym:'m',ex:'man',sym2:'n',ex2:'now'},{sym:'ŋ',ex:'sing',sym2:'h',ex2:'hat'},
          {sym:'l',ex:'love',sym2:'r',ex2:'red'},{sym:'w',ex:'wet',sym2:'j',ex2:'yes'},
        ],
        tip:'💡 Chú ý đặc biệt: θ (Think), ð (This), ŋ (siNG) — 3 âm không có trong tiếng Việt!'
      },
    ],
    review: {
      title:'🎯 Ôn luyện Ngày 1',
      exercises: [
        {type:'alpha_order',title:'Sắp xếp thứ tự ABC',desc:'Kéo thả chữ cái theo đúng thứ tự bảng chữ cái'},
        {type:'vowel_pick',title:'Nhận diện nguyên âm',desc:'Chọn nguyên âm trong các từ cho sẵn'},
        {type:'ipa_match',title:'Ghép IPA & nghĩa',desc:'Ghép ký hiệu IPA với cách đọc tiếng Việt'},
        {type:'listen_letter',title:'Nghe và chọn chữ',desc:'Nghe tên chữ cái và nhấn vào chữ đúng'},
        {type:'speak_check',title:'Đọc to kiểm tra',desc:'Đọc từng chữ cái và AI kiểm tra phát âm'},
      ]
    }
  },
  // Ngày 2, 3... sẽ được thêm sau
];

export class CustomRoadmapPage {
  constructor(db,store,bus){
    this.db=db;this.store=store;this.bus=bus;
    this._day=1;this._lesson=null;this._progress={};
    this._synth=window.speechSynthesis;
  }

  render(){
    const u=this.store.get('currentUser');
    this._progress=JSON.parse(localStorage.getItem(`cr2_${u.id}`)||'{}');
    const done=Object.values(this._progress).filter(Boolean).length;
    const total=COURSE.length;

    document.querySelector('.main').innerHTML=`
    <div class="page" style="max-width:1000px">
      <div class="page-header-row page-header">
        <div>
          <h1 class="page-title">📗 Tiếng Anh Cơ Bản</h1>
          <p class="page-sub">Từ zero đến giao tiếp · ${total} ngày · Từng bước rõ ràng</p>
        </div>
        <div style="text-align:center;min-width:80px">
          <div style="font-size:22px;font-weight:900;color:var(--blue)">${done}/${total}</div>
          <div style="font-size:11px;color:var(--muted)">Ngày hoàn thành</div>
          <div style="height:6px;background:var(--bg3);border-radius:99px;margin-top:5px;overflow:hidden"><div style="width:${Math.round(done/Math.max(total,1)*100)}%;height:100%;background:var(--accent-g);border-radius:99px"></div></div>
        </div>
      </div>

      <!-- Day selector -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px">
        ${COURSE.map(d=>{
          const dn=this._progress[d.day];
          const ac=d.day===this._day;
          return `<button onclick="crPage._day=${d.day};crPage._lesson=null;crPage._renderMain()" style="padding:8px 14px;border-radius:var(--r-lg);font-size:12px;font-weight:600;cursor:pointer;border:2px solid ${ac?d.color:dn?'var(--green)':'var(--border)'};background:${ac?d.color:dn?'var(--green-l)':'var(--white)'};color:${ac?'white':dn?'#065f46':'var(--text2)'};box-shadow:var(--shadow-xs);transition:all .2s">
            <span style="font-size:14px;display:block">${dn?'✅':d.icon}</span>Ngày ${d.day}
          </button>`;
        }).join('')}
        <div style="display:flex;align-items:center;padding:8px 14px;border-radius:var(--r-lg);border:2px dashed var(--border);font-size:11px;color:var(--muted);text-align:center">
          🔒<br>Sắp ra mắt
        </div>
      </div>

      <div id="crMain"></div>
    </div>`;
    window.crPage=this;
    this._renderMain();
  }

  _renderMain(){
    if(this._lesson) return this._renderLesson();
    const d=COURSE.find(x=>x.day===this._day); if(!d) return;
    const el=document.getElementById('crMain'); if(!el) return;
    const dp=this._progress[d.day];

    // Lesson progress
    const lessDone=(this._progress[`${d.day}_lessons`]||[]);

    el.innerHTML=`<div class="anim-fade">
      <!-- Day hero -->
      <div style="background:linear-gradient(135deg,${d.color},${d.color}cc);border-radius:var(--r-2xl);padding:24px 28px;margin-bottom:20px;color:white;display:flex;align-items:center;gap:18px;flex-wrap:wrap">
        <div style="font-size:56px;line-height:1">${d.icon}</div>
        <div style="flex:1;min-width:200px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;opacity:.7;margin-bottom:5px">Ngày ${d.day} · ${d.theme}</div>
          <div style="font-size:20px;font-weight:900;margin-bottom:7px">${d.title}</div>
          <div style="font-size:13px;opacity:.85;line-height:1.6">${d.goal}</div>
        </div>
        <div style="background:rgba(255,255,255,.15);border-radius:var(--r-xl);padding:14px 20px;text-align:center;min-width:90px">
          <div style="font-size:26px">${dp?'✅':'📖'}</div>
          <div style="font-size:11px;opacity:.8;margin-top:4px">${dp?'Xong!':'Đang học'}</div>
        </div>
      </div>

      <!-- Lessons list -->
      <div style="margin-bottom:20px">
        <div style="font-size:14px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px">
          📚 Các bài học <span style="font-size:11px;color:var(--muted);font-weight:400">${lessDone.length}/${d.lessons.length} đã học</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${d.lessons.map((l,li)=>{
            const done2=lessDone.includes(l.id);
            return `<div onclick="crPage._lesson='${l.id}';crPage._renderLesson()" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--white);border:1.5px solid ${done2?'var(--green)':'var(--border)'};border-radius:var(--r-xl);cursor:pointer;transition:all .2s;box-shadow:var(--shadow-xs)" onmouseover="this.style.borderColor='${d.color}';this.style.transform='translateX(4px)'" onmouseout="this.style.borderColor='${done2?'var(--green)':'var(--border)'}';this.style.transform=''">
              <div style="width:40px;height:40px;border-radius:50%;background:${done2?'var(--green-l)':'var(--blue-l)'};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${done2?'✅':l.icon}</div>
              <div style="flex:1">
                <div style="font-size:14px;font-weight:700">${l.title}</div>
                <div style="font-size:11px;color:var(--muted);margin-top:2px">⏱ ${l.duration} · ${done2?'Đã hoàn thành':'Chưa học'}</div>
              </div>
              <div style="font-size:18px;color:var(--muted2)">${done2?'✓':'›'}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Review section -->
      <div class="card" style="background:linear-gradient(135deg,#fef3c7,#fffbeb);border-color:rgba(245,158,11,.2)">
        <div class="card-title" style="color:#92400e">🎯 Ôn luyện & Kiểm tra</div>
        <div style="font-size:13px;color:#78350f;margin-bottom:14px">Làm bài tập sau khi học xong tất cả bài. Điểm qua để củng cố kiến thức!</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px">
          ${d.review.exercises.map(ex=>`<div onclick="crPage._startExercise('${ex.type}')" style="background:white;border:1px solid rgba(245,158,11,.3);border-radius:var(--r-lg);padding:12px;cursor:pointer;transition:all .18s" onmouseover="this.style.borderColor='var(--yellow)';this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.borderColor='rgba(245,158,11,.3)';this.style.transform='';this.style.boxShadow=''">
            <div style="font-size:14px;font-weight:700;margin-bottom:4px">${ex.title}</div>
            <div style="font-size:11px;color:var(--muted)">${ex.desc}</div>
          </div>`).join('')}
        </div>
        <div id="exArea" style="margin-top:16px"></div>
      </div>

      <!-- Complete button -->
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
        <button onclick="crPage._markDone(${d.day})" class="btn ${dp?'btn-success':'btn-primary'}" style="flex:1;justify-content:center;min-width:200px">
          ${dp?`✅ Đã xong Ngày ${d.day}`:`🎯 Đánh dấu hoàn thành Ngày ${d.day}`}
        </button>
        ${aiService.hasKey()?`<button onclick="crPage._askAI('${d.title}')" class="btn btn-ghost">🤖 Hỏi AI về bài này</button>`:''}
      </div>
    </div>`;
  }

  _renderLesson(){
    const d=COURSE.find(x=>x.day===this._day); if(!d) return;
    const l=d.lessons.find(x=>x.id===this._lesson); if(!l) return;
    const el=document.getElementById('crMain'); if(!el) return;
    const lessDone=this._progress[`${d.day}_lessons`]||[];
    const isDone=lessDone.includes(l.id);

    let contentHtml='';
    // Render content text with bold
    if(l.content){
      const formatted=l.content.replace(/\*\*(.*?)\*\*/g,'<strong style="color:var(--text)">$1</strong>').replace(/•/g,'&bull;');
      contentHtml+=`<div style="font-size:13px;line-height:1.9;color:var(--text2);white-space:pre-line;margin-bottom:14px">${formatted}</div>`;
    }
    // Alphabet items
    if(l.items){
      contentHtml+=`<div style="overflow-x:auto;margin-bottom:14px"><table style="width:100%;border-collapse:separate;border-spacing:0 4px;font-size:13px">
        <thead><tr>${['Chữ','Tên','IPA','Ví dụ','🔊'].map(h=>`<th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">${h}</th>`).join('')}</tr></thead>
        <tbody>${l.items.map((w,i)=>`<tr style="background:${i%2?'var(--bg2)':'var(--white)'}">
          <td style="padding:9px 10px;font-size:22px;font-weight:900;color:${d.color};border-radius:${i===0?'var(--r-md) 0 0 var(--r-md)':'0'}">${w.letter}</td>
          <td style="padding:9px 10px;font-weight:600">${w.name}</td>
          <td style="padding:9px 10px;font-family:var(--mono);color:var(--purple);font-size:14px">${w.ipa}</td>
          <td style="padding:9px 10px;color:var(--muted);font-size:12px">${w.sound}</td>
          <td style="padding:9px 10px;border-radius:${i===0?'0 var(--r-md) var(--r-md) 0':'0'}"><button onclick="crPage._speak('${w.name}')" style="background:${d.color}15;border:1px solid ${d.color}30;border-radius:99px;padding:3px 10px;font-size:12px;cursor:pointer;color:${d.color}">🔊</button></td>
        </tr>`).join('')}</tbody>
      </table></div>`;
    }
    // IPA Vowels grid
    if(l.ipaVowels){
      contentHtml+=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-bottom:14px">
        ${l.ipaVowels.map(v=>`<div style="background:var(--blue-l);border:1px solid rgba(79,110,247,.15);border-radius:var(--r-lg);padding:11px;text-align:center">
          <div style="font-size:22px;font-weight:900;color:var(--blue-d);font-family:var(--mono)">${v.sym}</div>
          <div style="font-size:10px;background:var(--blue);color:white;border-radius:99px;padding:1px 7px;margin:4px auto;width:fit-content">${v.vi}</div>
          <div style="font-size:11px;color:var(--muted)">${v.ex}</div>
          <button onclick="crPage._speak('${v.ex}')" style="background:none;border:none;cursor:pointer;font-size:14px;margin-top:4px;opacity:.7">🔊</button>
        </div>`).join('')}
      </div>`;
    }
    // IPA Consonants table
    if(l.ipaConsonants){
      contentHtml+=`<div style="overflow-x:auto;margin-bottom:14px"><table style="width:100%;border-collapse:separate;border-spacing:0 4px;font-size:13px">
        <thead><tr><th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase">IPA</th><th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:var(--muted)">Ví dụ</th><th></th><th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:var(--muted)">IPA</th><th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:var(--muted)">Ví dụ</th></tr></thead>
        <tbody>${l.ipaConsonants.map((c,i)=>`<tr style="background:${i%2?'var(--bg2)':'white'}">
          <td style="padding:8px 10px;font-family:var(--mono);font-size:18px;font-weight:800;color:var(--red)">${c.sym}</td>
          <td style="padding:8px 10px;color:var(--muted)">${c.ex}<button onclick="crPage._speak('${c.ex}')" style="background:none;border:none;cursor:pointer;font-size:12px;margin-left:5px;opacity:.7">🔊</button></td>
          <td style="padding:8px 10px;color:var(--border2)">·</td>
          <td style="padding:8px 10px;font-family:var(--mono);font-size:18px;font-weight:800;color:var(--red)">${c.sym2}</td>
          <td style="padding:8px 10px;color:var(--muted)">${c.ex2}<button onclick="crPage._speak('${c.ex2}')" style="background:none;border:none;cursor:pointer;font-size:12px;margin-left:5px;opacity:.7">🔊</button></td>
        </tr>`).join('')}</tbody>
      </table></div>`;
    }
    // Tip box
    if(l.tip){
      const formatted=l.tip.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
      contentHtml+=`<div style="background:var(--yellow-l);border:1px solid rgba(245,158,11,.3);border-radius:var(--r-lg);padding:12px 14px;font-size:13px;color:#92400e">${formatted}</div>`;
    }

    el.innerHTML=`<div class="anim-slide">
      <!-- Breadcrumb -->
      <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);margin-bottom:16px">
        <button onclick="crPage._lesson=null;crPage._renderMain()" style="background:none;border:none;cursor:pointer;color:var(--blue);font-size:12px;font-weight:600">← Ngày ${d.day}</button>
        <span>/</span>
        <span>${l.title}</span>
      </div>

      <!-- Lesson header -->
      <div style="background:${d.color}10;border:1.5px solid ${d.color}25;border-radius:var(--r-xl);padding:18px 20px;margin-bottom:18px;display:flex;align-items:center;gap:14px">
        <div style="width:50px;height:50px;border-radius:14px;background:${d.color};display:flex;align-items:center;justify-content:center;font-size:24px;color:white;flex-shrink:0">${l.icon}</div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:800;color:var(--text)">${l.title}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px">⏱ ${l.duration} · Ngày ${d.day}: ${d.title}</div>
        </div>
        ${isDone?`<span class="badge badge-green">✅ Đã học</span>`:''}
      </div>

      <!-- Content -->
      <div class="card" style="margin-bottom:16px">${contentHtml}</div>

      <!-- Navigation -->
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <button onclick="crPage._lesson=null;crPage._renderMain()" class="btn btn-ghost">← Quay lại</button>
        <div style="flex:1"></div>
        ${!isDone?`<button onclick="crPage._markLesson('${d.day}','${l.id}')" class="btn btn-primary">✅ Đánh dấu đã học</button>`:'<span style="color:var(--green);font-weight:600;font-size:13px">✅ Đã hoàn thành bài này!</span>'}
        ${this._getNextLesson(d,l)?`<button onclick="crPage._goNext('${d.day}','${l.id}')" class="btn btn-primary">Bài tiếp theo →</button>`:''}
      </div>
    </div>`;
  }

  _getNextLesson(d,l){
    const idx=d.lessons.findIndex(x=>x.id===l.id);
    return d.lessons[idx+1]||null;
  }
  _goNext(day,currentId){
    const d=COURSE.find(x=>x.day===parseInt(day));
    const l=this._getNextLesson(d,d.lessons.find(x=>x.id===currentId));
    if(l){this._lesson=l.id;this._renderLesson();}
  }

  _markLesson(day,lessonId){
    const u=this.store.get('currentUser');
    const key=`${day}_lessons`;
    const arr=this._progress[key]||[];
    if(!arr.includes(lessonId)){arr.push(lessonId);this._progress[key]=arr;}
    localStorage.setItem(`cr2_${u.id}`,JSON.stringify(this._progress));
    Toast.ok('✅ Đã đánh dấu bài học!');
    const d=COURSE.find(x=>x.day===parseInt(day));
    const next=this._getNextLesson(d,d.lessons.find(x=>x.id===lessonId));
    if(next) this._goNext(day,lessonId);
    else { this._lesson=null; this._renderMain(); }
  }

  _markDone(day){
    const u=this.store.get('currentUser');
    this._progress[day]=true;
    localStorage.setItem(`cr2_${u.id}`,JSON.stringify(this._progress));
    Toast.ok(`🎉 Hoàn thành Ngày ${day}! +30 XP`);
    this.db.update('profiles',u.id,{xp:(u.xp||0)+30}).then(r=>{this.store.set('currentUser',{...u,xp:(u.xp||0)+30});}).catch(()=>{});
    this._renderMain();
  }

  // ── EXERCISES ─────────────────────────────────────────────────────────────
  _startExercise(type){
    const el=document.getElementById('exArea'); if(!el) return;
    el.innerHTML='';
    const d=COURSE.find(x=>x.day===this._day);
    if(type==='alpha_order') this._exAlphaOrder(el,d);
    else if(type==='vowel_pick') this._exVowelPick(el,d);
    else if(type==='ipa_match') this._exIPAMatch(el,d);
    else if(type==='listen_letter') this._exListenLetter(el,d);
    else if(type==='speak_check') this._exSpeakCheck(el,d);
  }

  _exAlphaOrder(el,d){
    const ALL='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const sample=ALL.sort(()=>Math.random()-.5).slice(0,8).sort(()=>Math.random()-.5);
    const correct=[...sample].sort();
    el.innerHTML=`<div style="background:white;border-radius:var(--r-xl);padding:18px;border:1.5px solid var(--border)">
      <div style="font-size:14px;font-weight:700;margin-bottom:12px">🔤 Sắp xếp theo thứ tự ABC</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px" id="sortArea">
        ${sample.map(l=>`<div draggable="true" ondragstart="event.dataTransfer.setData('t',this.textContent)" onclick="crPage._sortClick(this,'${correct.join('')}')" style="width:42px;height:42px;border-radius:10px;background:var(--blue-l);border:2px solid var(--blue);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;cursor:pointer;color:var(--blue-d);transition:transform .1s;user-select:none" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform=''">${l}</div>`).join('')}
      </div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Nhấn vào các chữ để sắp xếp:</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;min-height:44px;border:2px dashed var(--border);border-radius:var(--r-md);padding:8px" id="sortTarget"></div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button onclick="crPage._checkOrder('${correct.join('')}')" class="btn btn-primary btn-sm">✅ Kiểm tra</button>
        <button onclick="crPage._exAlphaOrder(document.getElementById('exArea'),COURSE[0])" class="btn btn-ghost btn-sm">🔄 Bài mới</button>
      </div>
      <div id="sortResult" style="margin-top:8px;font-size:13px;font-weight:600"></div>
    </div>`;
    this._sortSelected=[];
  }

  _sortClick(el,correct){
    const t=el.textContent;
    if(!this._sortSelected) this._sortSelected=[];
    if(el.style.opacity==='0.3'){return;}
    this._sortSelected.push(t);
    el.style.opacity='0.3';
    const target=document.getElementById('sortTarget');
    if(target){const d=document.createElement('div');d.style.cssText='width:42px;height:42px;border-radius:10px;background:var(--purple-l);border:2px solid var(--purple);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:var(--purple-d)';d.textContent=t;target.appendChild(d);}
  }

  _checkOrder(correct){
    const selected=(this._sortSelected||[]).join('');
    const r=document.getElementById('sortResult');
    if(!r) return;
    if(selected===correct){r.style.color='var(--green)';r.textContent='🎉 Chính xác! Thứ tự ABC đúng!';}
    else{r.style.color='var(--red)';r.textContent=`❌ Sai! Thứ tự đúng: ${correct.split('').join(' ')}`;}
  }

  _exVowelPick(el,d){
    const words=['APPLE','BOOK','EGG','ICE','OCEAN','UMBRELLA','TREE','PHONE','UNIFORM','CHAIR'];
    const vowels=new Set(['A','E','I','O','U']);
    const pick=words[Math.floor(Math.random()*words.length)];
    el.innerHTML=`<div style="background:white;border-radius:var(--r-xl);padding:18px;border:1.5px solid var(--border)">
      <div style="font-size:14px;font-weight:700;margin-bottom:8px">🔵 Nhấn vào nguyên âm trong từ</div>
      <div style="font-size:28px;font-weight:800;margin-bottom:14px;display:flex;gap:6px;flex-wrap:wrap">
        ${pick.split('').map((l,i)=>`<button id="vp${i}" onclick="crPage._checkVowel('${l}','${pick}',${i})" style="width:42px;height:42px;border-radius:10px;border:2px solid var(--border);background:var(--bg2);font-size:18px;font-weight:800;cursor:pointer;transition:all .15s">${l}</button>`).join('')}
      </div>
      <div id="vpResult" style="font-size:13px;font-weight:600"></div>
      <button onclick="crPage._exVowelPick(document.getElementById('exArea'),null)" class="btn btn-ghost btn-sm" style="margin-top:10px">🔄 Từ khác</button>
    </div>`;
    this._vowelPick={word:pick,clicked:new Set()};
  }

  _checkVowel(letter,word,idx){
    const vowels=new Set(['A','E','I','O','U']);
    const btn=document.getElementById(`vp${idx}`);
    if(!btn||this._vowelPick?.clicked?.has(idx)) return;
    this._vowelPick.clicked.add(idx);
    const isV=vowels.has(letter);
    btn.style.background=isV?'var(--green-l)':'var(--red-l)';
    btn.style.borderColor=isV?'var(--green)':'var(--red)';
    btn.style.color=isV?'var(--green)':'var(--red)';
    const r=document.getElementById('vpResult');
    if(r)r.innerHTML=isV?`<span style="color:var(--green)">✅ "${letter}" là nguyên âm!</span>`:`<span style="color:var(--red)">❌ "${letter}" là phụ âm!</span>`;
  }

  _exIPAMatch(el,d){
    const lesson=d.lessons.find(l=>l.ipaVowels);
    if(!lesson){el.innerHTML='<div style="color:var(--muted);padding:10px">Học bài IPA trước nhé!</div>';return;}
    const pool=[...lesson.ipaVowels].sort(()=>Math.random()-.5).slice(0,4);
    const pick=pool[Math.floor(Math.random()*pool.length)];
    const choices=[pick,...pool.filter(p=>p.sym!==pick.sym)].sort(()=>Math.random()-.5).slice(0,4);
    el.innerHTML=`<div style="background:white;border-radius:var(--r-xl);padding:18px;border:1.5px solid var(--border)">
      <div style="font-size:14px;font-weight:700;margin-bottom:8px">🟣 Ký hiệu IPA này đọc là gì?</div>
      <div style="font-size:48px;font-weight:900;color:var(--purple);text-align:center;padding:16px;background:var(--purple-l);border-radius:var(--r-lg);margin-bottom:14px;font-family:var(--mono)">${pick.sym}</div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:10px;text-align:center">Ví dụ: ${pick.word}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${choices.map(c=>`<button onclick="crPage._checkIPA('${c.vi}','${pick.vi}',this)" style="padding:11px;border:2px solid var(--border);border-radius:var(--r-lg);background:white;cursor:pointer;font-size:13px;font-weight:600;transition:all .15s" onmouseover="this.style.borderColor='var(--purple)'" onmouseout="if(!this.disabled)this.style.borderColor='var(--border)'">${c.vi}</button>`).join('')}
      </div>
      <div id="ipaResult" style="margin-top:10px;font-size:13px;font-weight:600"></div>
    </div>`;
  }

  _checkIPA(chosen,correct,btn){
    document.querySelectorAll('#exArea button').forEach(b=>{b.disabled=true;});
    btn.style.background=chosen===correct?'var(--green-l)':'var(--red-l)';
    btn.style.borderColor=chosen===correct?'var(--green)':'var(--red)';
    const r=document.getElementById('ipaResult');
    if(r)r.innerHTML=chosen===correct?`<span style="color:var(--green)">✅ Đúng rồi!</span>`:`<span style="color:var(--red)">❌ Đáp án: ${correct}</span>`;
    setTimeout(()=>this._exIPAMatch(document.getElementById('exArea'),COURSE[0]),1800);
  }

  _exListenLetter(el,d){
    const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const lesson=d.lessons.find(l=>l.items);
    const items=lesson?.items||letters.map(l=>({letter:l,name:l}));
    const pick=items[Math.floor(Math.random()*items.length)];
    const wrongs=items.filter(x=>x.letter!==pick.letter).sort(()=>Math.random()-.5).slice(0,3);
    const choices=[pick,...wrongs].sort(()=>Math.random()-.5);
    setTimeout(()=>this._speak(pick.name||pick.letter),300);
    el.innerHTML=`<div style="background:white;border-radius:var(--r-xl);padding:18px;border:1.5px solid var(--border)">
      <div style="font-size:14px;font-weight:700;margin-bottom:8px">🎧 Nghe và chọn chữ cái đúng</div>
      <div style="text-align:center;margin-bottom:14px">
        <button onclick="crPage._speak('${pick.name||pick.letter}')" style="width:64px;height:64px;border-radius:50%;background:var(--blue);border:none;cursor:pointer;font-size:28px;color:white;box-shadow:0 4px 14px rgba(79,110,247,.4)">🔊</button>
        <div style="font-size:11px;color:var(--muted);margin-top:8px">Nhấn loa để nghe lại</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${choices.map(c=>`<button onclick="crPage._checkLetter('${c.letter}','${pick.letter}',this)" style="padding:14px;border:2px solid var(--border);border-radius:var(--r-lg);background:white;cursor:pointer;font-size:22px;font-weight:900;color:var(--blue-d);transition:all .15s" onmouseover="this.style.borderColor='var(--blue)'" onmouseout="if(!this.disabled)this.style.borderColor='var(--border)'">${c.letter}</button>`).join('')}
      </div>
    </div>`;
  }

  _checkLetter(chosen,correct,btn){
    document.querySelectorAll('#exArea button:not(.btn)').forEach(b=>{b.disabled=true;if(b.textContent.trim()===correct){b.style.background='var(--green-l)';b.style.borderColor='var(--green)';}else if(b===btn&&chosen!==correct){b.style.background='var(--red-l)';b.style.borderColor='var(--red)';}});
    if(chosen===correct)Toast.ok('🎉 Chính xác!'); else Toast.err(`Sai! Đúng là: ${correct}`);
    setTimeout(()=>this._exListenLetter(document.getElementById('exArea'),COURSE[0]),1600);
  }

  _exSpeakCheck(el,d){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){el.innerHTML=`<div style="background:var(--orange-l);border-radius:var(--r-lg);padding:14px;font-size:13px;color:#c2410c">⚠️ Cần Chrome hoặc Edge để dùng bài tập này</div>`;return;}
    const groups=['A B C D E','F G H I J','K L M N O','P Q R S T','U V W X Y Z'];
    const pick=groups[Math.floor(Math.random()*groups.length)];
    el.innerHTML=`<div style="background:white;border-radius:var(--r-xl);padding:18px;border:1.5px solid var(--border)">
      <div style="font-size:14px;font-weight:700;margin-bottom:8px">🎤 Đọc to nhóm chữ cái này</div>
      <div style="font-size:28px;font-weight:900;color:var(--blue);text-align:center;letter-spacing:6px;padding:16px;background:var(--blue-l);border-radius:var(--r-lg);margin-bottom:14px">${pick}</div>
      <div style="text-align:center">
        <button id="spkBtn" onclick="crPage._doSpeak('${pick}')" style="width:64px;height:64px;border-radius:50%;background:var(--red);border:none;cursor:pointer;font-size:28px;color:white;box-shadow:0 4px 14px rgba(244,63,94,.4)">🎤</button>
        <div id="spkResult" style="margin-top:12px;font-size:13px;color:var(--muted)">Nhấn nút đỏ và đọc to</div>
      </div>
      <button onclick="crPage._exSpeakCheck(document.getElementById('exArea'),null)" class="btn btn-ghost btn-sm" style="margin-top:12px">🔄 Nhóm khác</button>
    </div>`;
  }

  _doSpeak(target){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const btn=document.getElementById('spkBtn'),res=document.getElementById('spkResult');
    if(this._spkRecog){this._spkRecog.stop();return;}
    const r=new SR();r.lang='en-US';r.continuous=false;
    r.onstart=()=>{btn.textContent='⏹';btn.style.background='var(--green)';res.textContent='🎙 Đang nghe...';};
    r.onresult=(e)=>{
      const spoken=e.results[0][0].transcript.toUpperCase().replace(/\s+/g,' ').trim();
      const conf=Math.round(e.results[0][0].confidence*100);
      const targetLetters=target.split(' ');
      const spokenLetters=spoken.split(' ');
      const correct=targetLetters.every(l=>spokenLetters.includes(l));
      res.innerHTML=`Bạn đọc: <strong>${spoken}</strong><br><span style="color:${correct?'var(--green)':'var(--orange)'}">${correct?`✅ Tuyệt vời! (${conf}%)`:'⚠️ Chưa đủ, thử lại nhé!'}</span>`;
      this._spkRecog=null;
    };
    r.onerror=()=>{res.textContent='❌ Không nghe được';this._spkRecog=null;};
    r.onend=()=>{btn.textContent='🎤';btn.style.background='var(--red)';};
    r.start();this._spkRecog=r;
  }

  async _askAI(topic){
    Toast.info('Đang hỏi AI...');
    try{
      const r=await aiService.ask(`Giải thích "${topic}" trong tiếng Anh cho người mới học. Tiếng Việt, ví dụ rõ ràng, tối đa 150 từ.`,300);
      const el=document.getElementById('exArea');
      if(el)el.innerHTML=`<div style="background:var(--purple-l);border:1px solid rgba(139,92,246,.2);border-radius:var(--r-xl);padding:16px;margin-top:12px"><div style="font-size:11px;font-weight:700;color:var(--purple);margin-bottom:8px">🤖 AI giải thích:</div><div style="font-size:13px;line-height:1.8">${r}</div></div>`;
    }catch(e){Toast.err(e.message==='NO_KEY'?'Cấu hình API key AI trước!':e.message);}
  }

  _speak(text){
    if(!this._synth||!text)return;this._synth.cancel();
    const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=0.8;
    const v=this._synth.getVoices().find(v=>v.lang.startsWith('en')&&v.name.includes('Google'))||this._synth.getVoices().find(v=>v.lang.startsWith('en'));
    if(v)u.voice=v;this._synth.speak(u);
  }
}
