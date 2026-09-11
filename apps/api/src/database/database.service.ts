import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';

/**
 * Lớp mỏng bọc quanh node-postgres.
 *
 * Vì sao dùng Pool chứ không phải Client:
 *   Mỗi kết nối tới Postgres tốn khoảng 20-50ms để mở, và Postgres chỉ chịu
 *   được vài trăm kết nối cùng lúc. Pool giữ sẵn một nhúm kết nối và cho các
 *   request mượn qua mượn lại. Mở kết nối mới cho từng request là cách chắc
 *   chắn nhất để giết database khi có tải.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  onModuleInit() {
    // Thiếu biến này thì `pg` không báo lỗi mà lặng lẽ đi tìm database ở
    // localhost:5432 — rồi mỗi request đều chết với ECONNREFUSED ::1:5432,
    // rất khó hiểu. Chặn ngay từ lúc khởi động cho rõ ràng.
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'Thiếu biến môi trường DATABASE_URL. ' +
          'Trên máy: kiểm tra apps/api/.env. Trên Render: tab Environment.',
      );
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // tối đa 10 kết nối cùng lúc
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }

  /**
   * Chạy một câu SQL. LUÔN truyền giá trị qua `params`, đừng bao giờ nối chuỗi.
   *
   *   ĐÚNG:  query('SELECT * FROM app_user WHERE email = $1', [email])
   *   SAI:   query(`SELECT * FROM app_user WHERE email = '${email}'`)
   *
   * Cách sai mở đường cho SQL injection: ai đó nhập email là
   * `x' OR '1'='1` là lấy được toàn bộ bảng. Với $1, Postgres nhận giá trị
   * tách rời khỏi câu lệnh nên nội dung không bao giờ bị hiểu thành SQL.
   */
  async query<T extends QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const result = await this.pool.query<T>(sql, params);
    return result.rows;
  }

  /** Dùng khi biết chắc chỉ có 0 hoặc 1 dòng. */
  async queryOne<T extends QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  /**
   * Chạy nhiều lệnh trong một transaction.
   *
   * Hoặc tất cả thành công, hoặc không có gì xảy ra. Bắt buộc dùng ở những chỗ
   * phải thay đổi nhiều bảng cùng lúc - ví dụ khi helper nhận một yêu cầu:
   * vừa tạo dòng match, vừa trừ số lượng còn lại của offer, vừa đổi trạng thái
   * request. Nếu làm ba lệnh rời mà lệnh thứ hai hỏng thì dữ liệu hỏng theo.
   */
  async transaction<T>(fn: (client: PoolClientLike) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn({
        query: async (sql, params = []) => (await client.query(sql, params)).rows,
      });
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release(); // trả kết nối về pool, quên dòng này là pool cạn dần
    }
  }
}

export type PoolClientLike = {
  query: (sql: string, params?: unknown[]) => Promise<any[]>;
};
