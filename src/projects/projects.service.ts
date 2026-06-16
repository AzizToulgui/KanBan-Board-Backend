import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import db from 'src/db';
import { projects, projectMembers } from 'src/db/schema';

@Injectable()
export class ProjectsService {
  async create(ownerId: number, dto: { name: string; description?: string }) {
    const [project] = await db
      .insert(projects)
      .values({
        ...dto,
        ownerId,
      })
      .returning();
    await db.insert(projectMembers).values({
      projectId: project.id,
      userId: ownerId,
    });
    return project;
  }

  async findAll(userId: number) {
    return await db.select().from(projects).where(eq(projects.ownerId, userId));
  }

  async findOne(id: number, userId: number) {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    if (!project) throw new NotFoundException('Project not found');

    const isMember = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, id),
          eq(projectMembers.userId, userId),
        ),
      );

    if (project.ownerId !== userId && !isMember.length) {
      throw new ForbiddenException();
    }

    return project;
  }

  async invite(projectId: number, userId: number, requesterId: number) {
    await this.findOne(projectId, requesterId);
    await db
      .insert(projectMembers)
      .values({ projectId, userId })
      .onConflictDoNothing();
    return { message: 'User invited successfully' };
  }
}
