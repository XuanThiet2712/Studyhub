import { AvatarPicker } from '../components/index.js';
import { User }         from '../models/index.js';
import { Toast }        from '../components/index.js';

export class ProfilePage {
  constructor(db, store, bus, auth) { this.db=db; this.store=store; this.bus=bus; this.auth=auth; this._picker=null; }
  render() {
    const u=new User(this.store.get('currentUser'));
    document.querySelector('.main').innerHTML=`<div class="page">
      <div class="page-header"><h1 class="page-title">👤 Hồ sơ cá nhân</h1></div>
      <div class="grid-2" style="max-width:760px;gap:20px">
        <div class="card" style="text-align:center">
          <div style="margin-bottom:16px"><img src="${u.avatarUrl}" style="width:80px;height:80px;border-radius:50%;border:3px solid var(--blue);box-shadow:0 4px 14px rgba(59,130,246,.25)"></div>
          <div style="font-size:20px;font-weight:700;margin-bottom:4px">${u.displayName}</div>
          <div style="font-size:13px;color:var(--muted);font-family:var(--mono);margin-bottom:12px">@${u.username}</div>
          <div style="display:flex;justify-content:center;gap:16px;margin-bottom:16px">
            <div><div style="font-family:'Lora',serif;font-size:22px;font-weight:700;color:var(--blue)">${u.xp}</div><div style="font-size:11px;color:var(--muted)">XP</div></div>
            <div><div style="font-family:'Lora',serif;font-size:22px;font-weight:700;color:var(--purple)">${u.level}</div><div style="font-size:11px;color:var(--muted)">Cấp</div></div>
            <div><div style="font-family:'Lora',serif;font-size:22px;font-weight:700;color:var(--orange)">${u.streak}</div><div style="font-size:11px;color:var(--muted)">Streak</div></div>
          </div>
          <div class="prog-track"><div class="prog-fill" style="width:${Math.min((u.xp%(u.level*100))/(u.level),100)}%;background:var(--accent-g)"></div></div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px;font-family:var(--mono)">${u.xpToNext} XP đến Cấp ${u.level+1}</div>
        </div>
        <div class="card">
          <div class="card-title">✏️ Chỉnh sửa hồ sơ</div>
          <div class="form-group"><label class="form-label">Chọn Avatar</label><div id="profileAvaPicker"></div></div>
          <div class="form-group"><label class="form-label">Tên hiển thị</label><input class="form-input" id="pName" value="${u.displayName}"></div>
          <div class="form-group"><label class="form-label">Giới thiệu bản thân</label><textarea class="form-textarea" id="pBio" rows="2">${u.bio||''}</textarea></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Giới tính</label><select class="form-select" id="pGender"><option value="male" ${u.gender==='male'?'selected':''}>Nam</option><option value="female" ${u.gender==='female'?'selected':''}>Nữ</option><option value="other" ${u.gender==='other'?'selected':''}>Khác</option></select></div>
            <div class="form-group"><label class="form-label">Ngày sinh</label><input class="form-input" type="date" id="pBirth" value="${u.birthDate||''}"></div>
          </div>
          <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="profilePage.save()">💾 Lưu thay đổi</button>
        </div>
      </div></div>`;
    window.profilePage=this;
    this._picker=new AvatarPicker('profileAvaPicker',u.avatarId);
    this._picker.render();
  }
  async save(){const u=this.store.get('currentUser');const changes={display_name:document.getElementById('pName').value.trim(),bio:document.getElementById('pBio').value.trim(),gender:document.getElementById('pGender').value,birth_date:document.getElementById('pBirth').value||null,avatar_id:this._picker.getValue()};try{await this.auth.updateProfile(u.id,changes);Toast.ok('Đã cập nhật hồ sơ!');this.render();}catch(e){Toast.err('Lỗi: '+e.message);}}
}
