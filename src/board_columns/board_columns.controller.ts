import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Patch,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { BoardColumnsService } from './board_columns.service';
import { CreateBoardColumnsDto } from './dto/create-board-columns.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('board-columns')
export class BoardColumnsController {
  constructor(private readonly boardColumnsService: BoardColumnsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('project/:projectId')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBoardColumnsDto,
    @Req() req: any,
  ) {
    return this.boardColumnsService.create(+projectId, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string, @Req() req: any) {
    return this.boardColumnsService.findByProject(+projectId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateBoardColumnsDto>,
    @Req() req: any,
  ) {
    return this.boardColumnsService.update(+id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.boardColumnsService.delete(+id, req.user.userId);
  }
}
