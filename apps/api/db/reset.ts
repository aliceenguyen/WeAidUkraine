/**
 * Xoá sạch mọi thứ của dự án rồi cho phép chạy lại migration từ đầu.
 *
 * CHỈ DÙNG LÚC ĐANG XÂY. Không bao giờ chạy trên production — nó xoá dữ liệu
 * thật, không hỏi lại, không hoàn tác được.
 *
 * Chạy:  npm run db:reset     rồi     npm run db:migrate
 */
import { Client } from 'pg';
import 'dotenv/config';

// Thứ tự xoá ngược với thứ tự tạo: bảng con trước, bảng cha sau.
// CASCADE lo nốt phần khoá ngoại còn sót.
const SQL = `
DROP TABLE IF EXISTS
  appointment,
  donation,
  listing,
  doctor,
  organization,
  app_user
CASCADE;

DROP TYPE IF EXISTS
  appointment_status,
  donation_status,
  donation_type,
  listing_status,
  category,
  listing_kind,
  role
CASCADE;

DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

DROP TABLE IF EXISTS _migrations;
`;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(SQL);

  console.log('All deleted. Run: npm run db:migrate again');
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
