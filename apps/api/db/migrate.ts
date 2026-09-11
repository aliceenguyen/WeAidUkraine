/**
 * Trình chạy migration tự viết - khoảng 50 dòng.
 *
 * Cách hoạt động: đọc mọi file .sql trong thư mục này theo thứ tự tên, chạy
 * file nào chưa từng chạy, rồi ghi tên nó vào bảng _migrations. Chạy lại lần
 * hai thì nó bỏ qua hết, không làm gì cả.
 *
 * Vì sao cần bảng _migrations: để máy bạn, máy người khác và server production
 * đều đi qua đúng cùng một dãy thay đổi, theo đúng thứ tự, đúng một lần.
 *
 * Chạy:  npm run db:migrate
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';
import 'dotenv/config';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const applied = new Set(
    (await client.query<{ name: string }>('SELECT name FROM _migrations')).rows.map(
      (r) => r.name,
    ),
  );

  const files = readdirSync(__dirname)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  bỏ qua  ${file}`);
      continue;
    }

    const sql = readFileSync(join(__dirname, file), 'utf8');
    try {
      // Mỗi file chạy trong một transaction: hỏng giữa chừng thì quay lại
      // như chưa từng chạy, không để database ở trạng thái nửa vời.
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`  ✓ chạy    ${file}`);
      count++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`\n  ✗ HỎNG ở ${file}\n`);
      throw err;
    }
  }

  console.log(`\nXong. Chạy mới ${count} file.`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
