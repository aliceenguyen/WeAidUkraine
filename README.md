# AidBridge

Nền tảng điều phối cứu trợ hai chiều cho khủng hoảng Ukraine — người **cần** đăng
yêu cầu, người **giúp** đăng nguồn lực, hệ thống tự ghép cặp theo khoảng cách,
độ khẩn cấp và loại nhu cầu. Phục vụ cả người trong nước lẫn người Ukraine mới
sang Canada.

Viết lại hoàn toàn từ bản WeAidUkraine gốc (site tĩnh) thành một sản phẩm
full-stack có database, thuật toán ghép cặp, và realtime.

## Stack

| Phần | Công nghệ |
|---|---|
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind v4 · MapLibre GL |
| Backend | NestJS 11 · TypeScript |
| Database | PostgreSQL 16 + **PostGIS** |
| ORM | Prisma 6 |
| Realtime | Socket.IO |
| Cache | Redis |
| Ảnh | Firebase Storage |
| Chạy local | Docker Compose |

## Chạy thử

Cần: Node 20+, Docker Desktop.

```bash
cp .env.example .env
npm install
npm run db:up
```

Rồi ở `apps/api`:

```bash
npx prisma migrate dev --name init
npx prisma db execute --file prisma/sql/001_postgis.sql --schema prisma/schema.prisma
```

Bước thứ hai là bắt buộc — nó thêm cột `location` (PostGIS) và index GIST mà
Prisma không tự tạo được. Chạy lại sau **mỗi lần** migrate.

Sau đó mở hai terminal:

```bash
npm run api:dev
```

```bash
npm run web:dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1/health

Trang chủ hiện đèn xanh nếu API và PostGIS đều lên.

## Cấu trúc

```
v2/
├── docker-compose.yml        # Postgres+PostGIS, Redis
├── apps/
│   ├── api/                  # NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── sql/001_postgis.sql
│   │   └── src/
│   │       ├── health/
│   │       ├── facilities/   # mẫu truy vấn không gian
│   │       └── prisma/
│   └── web/                  # Next.js
```

## Ghi chú thiết kế

**Toạ độ.** Prisma không hỗ trợ kiểu `geography` của PostGIS, nên mỗi bảng có
toạ độ giữ hai cột `latitude` / `longitude` do Prisma quản lý, cộng thêm một cột
`location` sinh tự động từ hai cột đó (thêm bằng SQL) và một index GIST. Prisma
ghi/đọc như bình thường; truy vấn không gian dùng `$queryRaw`.

**Vì sao `ST_DWithin` chứ không phải `ST_Distance < r`.** `ST_DWithin` lọc trước
bằng index GIST rồi mới tính khoảng cách chính xác trên số ít bản ghi còn lại.
Viết `WHERE ST_Distance(...) < r` buộc Postgres tính cho từng dòng trong bảng →
mất index. Xem `apps/api/src/facilities/facilities.service.ts`.

**Riêng tư.** Yêu cầu cứu trợ công khai chỉ hiện toạ độ làm tròn (~600m,
`public_lat` / `public_lng`). Toạ độ và địa chỉ chính xác chỉ lộ sau khi hai bên
đã xác nhận ghép cặp.

**Không hardcode một vùng.** Mọi thực thể có toạ độ đều gắn với `Region`, nên
thêm Toronto bên cạnh Kyiv chỉ là thêm một dòng dữ liệu.

## Dữ liệu

- **Cơ sở vật chất** (bệnh viện, nơi trú ẩn, hiệu thuốc): lấy thật từ
  **Overpass API / OpenStreetMap** — không cần API key. Bảng `facility` khoá theo
  `(source, source_id)` nên ETL chạy lại nhiều lần không nhân đôi dữ liệu.
  Dữ liệu OSM theo giấy phép ODbL, nhớ ghi nguồn trên bản đồ.
- **Yêu cầu và nguồn lực**: seed giả bằng script, khoảng 300 bản ghi rải quanh
  Kyiv và Toronto để bản đồ có dữ liệu và thuật toán ghép cặp có việc để làm.

## Lộ trình

| Tuần | Việc |
|---|---|
| 1 | ✅ Khung dự án, Docker, Prisma schema, health check |
| 2 | Đăng nhập + phân quyền, CRUD yêu cầu cứu trợ |
| 3 | ETL từ OpenStreetMap, bản đồ MapLibre load theo viewport |
| 4 | Bộ máy ghép cặp (PostGIS + chấm điểm + hiện lý do) |
| 5 | SOS realtime qua WebSocket |
| 6 | i18n (en/uk), accessibility, test, deploy |
