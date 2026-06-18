import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import db from '../db';
import { board_columns, projects, projectMembers } from '../db/schema';

@Injectable()
export class BoardColumnsService {
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
    return project;
  }

  async create(
    projectId: number,
    userId: number,
    dto: { title: string; position?: number },
  ) {
    await this.checkProjectAccess(projectId, userId);

    const [column] = await db
      .insert(board_columns)
      .values({
        projectId,
        title: dto.title,
        position: dto.position ?? 0,
      })
      .returning();

    return column;
  }

  async findByProject(projectId: number, userId: number) {
    await this.checkProjectAccess(projectId, userId);

    return await db
      .select()
      .from(board_columns)
      .where(eq(board_columns.projectId, projectId))
      .orderBy(board_columns.position);
  }

  async update(
    id: number,
    userId: number,
    dto: { title?: string; position?: number },
  ) {
    const [column] = await db
      .select()
      .from(board_columns)
      .where(eq(board_columns.id, id));
    if (!column) throw new NotFoundException('Column not found');

    await this.checkProjectAccess(column.projectId, userId);

    const [updated] = await db
      .update(board_columns)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(board_columns.id, id))
      .returning();

    return updated;
  }

  async delete(id: number, userId: number) {
    const [column] = await db
      .select()
      .from(board_columns)
      .where(eq(board_columns.id, id));
    if (!column) throw new NotFoundException('Column not found');
    await this.checkProjectAccess(column.projectId, userId);

    await db.delete(board_columns).where(eq(board_columns.id, id));
    return { message: 'Column deleted successfully' };
  }
}
