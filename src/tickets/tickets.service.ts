import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import db from '../db';
import {
  tickets,
  board_columns,
  projects,
  projectMembers,
  users,
} from '../db/schema';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { MailService } from 'src/mail/mail.service';
import { ticketAttachments } from '../db/schema';
import * as fs from 'fs';

@Injectable()
export class TicketsService {
  constructor(private mailService: MailService) {}

  private async checkProjectAccess(projectId: number, userId: number) {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    if (!project) throw new NotFoundException('Project not found');

    const isMember = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId),
        ),
      );

    if (project.ownerId !== userId && !isMember.length) {
      throw new ForbiddenException('Access denied');
    }
  }

  async create(columnId: number, userId: number, dto: CreateTicketDto) {
    const [column] = await db
      .select()
      .from(board_columns)
      .where(eq(board_columns.id, columnId));
    if (!column) throw new NotFoundException('Column not found');

    await this.checkProjectAccess(column.projectId, userId);

    const [ticket] = await db
      .insert(tickets)
      .values({
        columnId,
        title: dto.title,
        description: dto.description,
        assigneeId: dto.assigneeId,
        position: dto.position ?? 0,
        priority: dto.priority ?? 'low',
      })
      .returning();

    return ticket;
  }

  async findByColumn(columnId: number, userId: number) {
    const [column] = await db
      .select()
      .from(board_columns)
      .where(eq(board_columns.id, columnId));
    if (!column) throw new NotFoundException();

    await this.checkProjectAccess(column.projectId, userId);

    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.columnId, columnId))
      .orderBy(tickets.position);
  }

  async update(id: number, userId: number, dto: UpdateTicketDto) {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    if (!ticket) throw new NotFoundException('Ticket not found');

    const [column] = await db
      .select()
      .from(board_columns)
      .where(eq(board_columns.id, ticket.columnId));
    await this.checkProjectAccess(column.projectId, userId);

    const [updated] = await db
      .update(tickets)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();

    if (dto.assigneeId && dto.assigneeId !== ticket.assigneeId) {
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, column.projectId));
      const [assignee] = await db
        .select()
        .from(users)
        .where(eq(users.id, dto.assigneeId));
      const [assigner] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (assignee?.email) {
        await this.mailService.sendTicketAssignment(
          assignee.email,
          updated.title,
          project?.name || 'Unknown Project',
          assigner?.name || assigner?.email || 'Someone',
        );
      }

      return updated;
    }
  }

  async delete(id: number, userId: number) {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    if (!ticket) throw new NotFoundException('Ticket not found');

    const [column] = await db
      .select()
      .from(board_columns)
      .where(eq(board_columns.id, ticket.columnId));
    await this.checkProjectAccess(column.projectId, userId);

    await db.delete(tickets).where(eq(tickets.id, id));
  }

  async uploadAttachment(
    ticketId: number,
    file: Express.Multer.File,
    userId: number,
  ) {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId));

    if (!ticket) throw new NotFoundException('Ticket not found');

    const [column] = await db
      .select()
      .from(board_columns)
      .where(eq(board_columns.id, ticket.columnId));

    await this.checkProjectAccess(column.projectId, userId);

    const [attachment] = await db
      .insert(ticketAttachments)
      .values({
        ticketId,
        fileName: file.originalname,
        filePath: file.path,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: userId,
      })
      .returning();

    return attachment;
  }

  async getAttachments(ticketId: number, userId: number) {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId));

    if (!ticket) throw new NotFoundException('Ticket not found');

    const [column] = await db
      .select()
      .from(board_columns)
      .where(eq(board_columns.id, ticket.columnId));

    await this.checkProjectAccess(column.projectId, userId);

    return db
      .select()
      .from(ticketAttachments)
      .where(eq(ticketAttachments.ticketId, ticketId))
      .orderBy(desc(ticketAttachments.createdAt));
  }

  async getAttachmentForPreview(attachmentId: number, userId: number) {
    const [attachment] = await db
      .select()
      .from(ticketAttachments)
      .where(eq(ticketAttachments.id, attachmentId));

    if (!attachment) throw new NotFoundException('Attachment not found');

    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, attachment.ticketId));

    const [column] = await db
      .select()
      .from(board_columns)
      .where(eq(board_columns.id, ticket.columnId));

    await this.checkProjectAccess(column.projectId, userId);

    if (!fs.existsSync(attachment.filePath)) {
      throw new NotFoundException('File not found on server');
    }

    return attachment;
  }
}
