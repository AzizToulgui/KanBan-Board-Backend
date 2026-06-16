import { Module } from '@nestjs/common';
import { BoardColumnsService } from './board_columns.service';
import { BoardColumnsController } from './board_columns.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BoardColumnsController],
  providers: [BoardColumnsService],
})
export class BoardColumnsModule {}
