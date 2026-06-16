import { Controller, Get } from '@nestjs/common';
import db from './db';
import { sql } from 'drizzle-orm';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('db-test')
  async testDb() {
    try {
      const result = await db.execute(sql`SELECT current_database()`);
      return { success: true, database: result };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }
}
