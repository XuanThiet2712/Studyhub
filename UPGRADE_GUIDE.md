# 🚀 StudyHub v4 — Hướng dẫn nâng cấp

## ✅ Các tính năng mới đã thêm

### 1. 📖 Hệ thống từ vựng nâng cấp (`VocabularyPage.js`)
- **🎧 Chế độ Nghe**: Nghe phát âm, chọn từ đúng (auto-play khi vào)
- **🎤 Chế độ Nói**: Đọc từ, AI nhận dạng giọng nói + chấm điểm phát âm (Chrome/Edge)
- **🔍 Tra từ điển**: Kết nối Free Dictionary API — tra mọi từ tiếng Anh
- **⚡ Tự điền thông tin**: Khi thêm từ mới, nhấn "Tra" để tự điền phiên âm/định nghĩa/ví dụ
- **📖 Ngân hàng từ TOEIC**: 25+ từ TOEIC built-in, nhấn thêm nhanh
- **🔊 Phát âm TTS**: Mọi từ đều có nút nghe phát âm (SpeechSynthesis API)
- **📅 SRS hiển thị**: Hiện ngày ôn tiếp và số lần đã ôn

### 2. 👥 Hệ thống bạn bè (`FriendsPage.js`)
- **Gửi/chấp nhận lời mời kết bạn**
- **🔔 Thông báo real-time**: Nhận thông báo kết bạn ngay lập tức
- **⚔️ Thách đấu**: Gửi lời thách đấu đến bạn bè đang online
- **🟢 Hiển thị online/offline**
- **Popup thách đấu**: Khi nhận thách đấu có popup xác nhận

### 3. 🔔 Hệ thống thông báo (`NotificationSystem.js`)
- **Chuông thông báo** góc phải màn hình
- Thông báo kết bạn, thách đấu, xem lại từ
- Lưu lịch sử thông báo local
- Badge số thông báo chưa đọc

### 4. 🤖 AI Tutor (`AITutorPage.js`)
- **Chat với Claude AI** được tích hợp API Anthropic
- **Phân tích tiến độ học** dựa trên dữ liệu thực tế (từ vựng, Pomodoro, XP...)
- **Quick actions**: Gợi ý từ, chiến lược học, giải thích SRS
- **Context-aware**: AI biết bạn học bao nhiêu từ, đúng bao nhiêu, cần ôn gì

## 📦 Cài đặt

### Bước 1: Cập nhật Database
Chạy SQL trong `database.sql` (phần STUDYHUB v4 ADDITIONS) trong Supabase SQL Editor

### Bước 2: Bật Realtime
Trong Supabase Dashboard → Database → Replication → bật realtime cho:
- `friendships`, `challenges`, `game_rooms`, `game_players`

### Bước 3: Cấu hình API Key
Không cần thêm gì — API key Anthropic được xử lý tự động qua Claude.ai

### Bước 4: Deploy
Upload toàn bộ thư mục lên hosting (Netlify, Vercel, hoặc bất kỳ static hosting nào)

## 🗂️ Cấu trúc file mới
```
src/
  pages/
    VocabularyPage.js   ← Nâng cấp (nghe/nói/từ điển/ngân hàng từ)
    FriendsPage.js      ← MỚI (bạn bè + thách đấu)
    AITutorPage.js      ← MỚI (AI theo dõi tiến độ)
  components/
    NotificationSystem.js ← MỚI (thông báo real-time)
```

## ❓ Lưu ý
- Chế độ Nói cần Chrome/Edge (Web Speech API)
- Tra từ điển cần internet (gọi api.dictionaryapi.dev)
- AI Tutor dùng API Anthropic (cần deploy trên claude.ai hoặc thêm API key)
- Thông báo thách đấu dùng Supabase Broadcast (realtime channels)
