import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import db from '../db';
import { tickets, board_columns, projects, projectMembers } from '../db/schema';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class TicketsService {
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

    return updated;
  }
}
