import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async check() {
    // Truy van re nhat co the, chi de xac nhan ket noi DB con song
    const row = await this.db.queryOne<{ ok: number }>('SELECT 1 AS ok');

    return {
      status: 'ok',
      db: row?.ok === 1 ? 'up' : 'down',
      time: new Date().toISOString(),
    };
  }
}
