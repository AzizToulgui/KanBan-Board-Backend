import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Post('column/:columnId')
  create(
    @Param('columnId') columnId: string,
    @Body() dto: CreateTicketDto,
    @Req() req: any,
  ) {
    return this.ticketsService.create(+columnId, req.user.userId, dto);
  }

  @Get('column/:columnId')
  findByColumn(@Param('columnId') columnId: string, @Req() req: any) {
    return this.ticketsService.findByColumn(+columnId, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Req() req: any,
  ) {
    return this.ticketsService.update(+id, req.user.userId, dto);
  }
}
