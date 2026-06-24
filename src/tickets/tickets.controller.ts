import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const storage = diskStorage({
  destination: './uploads/tickets',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + extname(file.originalname));
  },
});

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

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.ticketsService.delete(+id, req.user.userId);
  }

  @Post(':ticketId/attachments')
  @UseInterceptors(FileInterceptor('file', { storage }))
  uploadAttachment(
    @Param('ticketId') ticketId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('File is required');

    return this.ticketsService.uploadAttachment(
      +ticketId,
      file,
      req.user.userId,
    );
  }

  @Get(':ticketId/attachments')
  getAttachments(@Param('ticketId') ticketId: string, @Req() req: any) {
    return this.ticketsService.getAttachments(+ticketId, req.user.userId);
  }

  @Get('attachments/:id/preview')
  async preview(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    const attachment = await this.ticketsService.getAttachmentForPreview(
      +id,
      req.user.userId,
    );

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${attachment.fileName}"`,
    );

    return res.sendFile(attachment.filePath, { root: '.' });
  }
}
