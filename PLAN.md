# WeAidUkraine 2.0 — kế hoạch 21 ngày · 4h/ngày

Tick `[x]` khi xong. Vượt quá 1 tiếng so với dự kiến thì **cắt bớt việc, đừng
thức khuya bù**.

## Dự án là gì

Website nơi người cần giúp và người giúp gặp nhau. Đăng ký làm **Seeker** hoặc
**Helper**, đăng bài lên (chỗ ở, đồ ăn, thuốc, xe cộ...), xem trên **bản đồ
thật**, lấy thông tin liên hệ gọi cho nhau.

Cộng thêm **toàn bộ các trang của bản gốc** — nhưng chạy bằng database thay vì
chữ viết cứng trong HTML.

## Đã chốt

| | |
|---|---|
| Database | Supabase (PostgreSQL), **không PostGIS** |
| Truy vấn | `pg` thuần + SQL viết tay, **không ORM** |
| Backend | NestJS |
| Frontend | Next.js 15 + TypeScript + Tailwind |
| Bản đồ | MapLibre + OpenStreetMap (không cần API key) |
| Bảng | 6: `app_user` `listing` `organization` `doctor` `appointment` `donation` |

**Không làm:** thuật toán ghép cặp, PostGIS, ETL, nhắn tin trong web,
đa ngôn ngữ tự viết (dùng widget Google Translate của bản gốc).

---

## Tuần 1 — Backend nền

### Ngày 1 — Database
- [x] `001_schema.sql` — 6 bảng, 7 enum
- [x] `002_indexes.sql`
- [x] `seed.ts` — 6 tổ chức, 6 bác sĩ, 6 tài khoản, 20 bài đăng
- [ ] `npm run db:reset` → `npm run db:migrate` → `npm run db:seed`
- [ ] Mở Table Editor của Supabase, thấy dữ liệu trong `listing` và `doctor`

### Ngày 2 — Chạy được + deploy sớm (4h)
- [ ] `npm run api:dev` → `http://localhost:4000/api/v1/health` trả `status: ok`
- [ ] `npm run web:dev` → trang chủ hiện đèn xanh
- [ ] Đọc hiểu `main.ts`, `app.module.ts`, `database.service.ts`
- [ ] Đẩy code lên GitHub
- [ ] **Deploy web lên Vercel, API lên Railway**

**Xong khi:** mở link trên mạng bằng điện thoại, vẫn thấy đèn xanh.

### Ngày 3–5 — Đăng ký & đăng nhập (12h) ← phần khó nhất
- [ ] Hiểu JWT là gì, vì sao không lưu mật khẩu dạng thật
- [ ] `POST /auth/register` — băm bằng argon2, bắt lỗi email trùng (mã 23505)
- [ ] `POST /auth/login` — trả về token
- [ ] `JwtAuthGuard` — request thiếu token trả 401
- [ ] `GET /auth/me`
- [ ] DTO + `class-validator` cho mọi input

**Xong khi:** đăng ký → đăng nhập → gọi `/auth/me` bằng token, chạy hết bằng curl.

### Ngày 6 — API xem bài đăng (4h)
- [ ] `GET /listings` — lọc theo `kind`, `category`, `city`; phân trang, **luôn có LIMIT**
- [ ] `GET /listings/:id`
- [ ] Tự khai kiểu TypeScript khớp đúng tên cột

**Xong khi:** curl trả về 20 bài seed, lọc `?kind=OFFER&category=SHELTER` ra đúng.

### Ngày 7 — Đệm

---

## Tuần 2 — API còn lại + bắt đầu web

### Ngày 8 — API đăng / sửa / xoá bài (4h)
- [ ] `POST /listings` — phải đăng nhập
- [ ] `PATCH /listings/:id`, `DELETE /listings/:id` — **chỉ chủ bài**, người khác 403
- [ ] `GET /listings/mine`

**Xong khi:** tài khoản A không sửa được bài của tài khoản B.

### Ngày 9 — API các trang gốc (4h)
Toàn CRUD đơn giản, cùng một khuôn:
- [ ] `GET /organizations` — cho trang Monetary Donation
- [ ] `GET /doctors`, `GET /doctors/:id` — cho trang Telehealth
- [ ] `POST /appointments` — đặt lịch khám
- [ ] `POST /donations` — form quyên góp đồ ăn/quần áo

### Ngày 10 — Nền frontend (4h)
- [ ] `lib/api.ts` — hàm gọi API, tự gắn token
- [ ] Context lưu trạng thái đăng nhập
- [ ] Trang `/login`, `/register`
- [ ] Header + menu điều hướng

**Xong khi:** đăng nhập trên web, F5 vẫn giữ phiên.

### Ngày 11–12 — Trang bài đăng (8h)
- [ ] `/listings` — danh sách dạng thẻ, có bộ lọc
- [ ] `/listings/[id]` — chi tiết, **hiện thông tin liên hệ**
- [ ] `/listings/new` — form đăng bài

### Ngày 13 — Bài đăng của tôi (4h)
- [ ] `/my-listings` — danh sách, nút sửa / đóng / xoá

### Ngày 14 — Đệm

---

## Tuần 3 — Bản đồ + các trang gốc

### Ngày 15–16 — Bản đồ (8h)
- [ ] MapLibre + style raster OpenStreetMap
- [ ] Marker cho từng bài đăng, màu theo `kind` (cần / có)
- [ ] Bấm marker hiện popup: tiêu đề, loại, nút xem chi tiết
- [ ] Bộ lọc ngay trên bản đồ
- [ ] Form đăng bài: **chọn vị trí bằng cách bấm lên bản đồ**

**Xong khi:** mở `/map` thấy 20 chấm quanh Kyiv, bấm vào ra đúng bài.

### Ngày 17 — Telehealth (4h)
- [ ] `/telehealth` — 6 bác sĩ từ DB, hiện chuyên khoa, ngôn ngữ, tiểu sử
- [ ] Chọn khung giờ → form đặt lịch → lưu vào `appointment`
- [ ] Hiện thông báo xác nhận

### Ngày 18 — Quyên góp (4h)
- [ ] `/donate` — form đồ ăn/quần áo, lưu vào DB (thay Formspree)
- [ ] `/monetary` — 6 tổ chức đọc từ DB

### Ngày 19 — Trang chủ + phần giữ từ bản gốc (4h)
- [ ] Trang chủ với hero, giới thiệu, link tới các trang
- [ ] Nút SOS (link WhatsApp) — giữ nguyên
- [ ] Chatbot Dialogflow (iframe) — giữ nguyên
- [ ] Widget Google Translate — giữ nguyên

### Ngày 20 — Đánh bóng + đóng gói (4h)
- [ ] Empty state, loading, thông báo lỗi đọc được
- [ ] Responsive trên điện thoại
- [ ] README: ảnh chụp, so sánh với bản gốc, cách chạy
- [ ] Tài khoản demo ghi trong README
- [ ] Video demo 40 giây

### Ngày 21 — Đệm + bàn giao
- [ ] Deploy bản cuối, chạy migrate + seed trên production
- [ ] Nhờ một người lạ mở link và thử dùng
- [ ] Sửa những chỗ họ vấp

---

## Bốn quy tắc

**1. Deploy ngày 2, không phải ngày 21.** Deploy lần đầu luôn trục trặc. Gặp lúc
app còn trống thì sửa 30 phút; gặp ngày cuối thì mất cả ngày.

**2. Commit mỗi ngày,** kể cả khi dở dang.

**3. Cắt việc chứ đừng cắt giấc ngủ.**

**4. Thứ tự cắt khi trễ:** trang Donate/Monetary bỏ trước → Telehealth bỏ sau →
bản đồ hạ xuống danh sách. Ba thứ **không được đụng**: đăng nhập, đăng bài,
và link deploy chạy được.

## Kiểm tra mỗi tối (2 phút)

- Commit hôm nay có chạy được từ một `git clone` sạch không?
- Mục "Xong khi" của hôm nay có **đúng** không, hay chỉ *gần* đúng?
