import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import db from 'src/db';
import { projects, projectMembers } from 'src/db/schema';
import { users } from 'src/db/schema';

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

  async invite(projectId: number, email: string, requesterId: number) {
    await this.findOne(projectId, requesterId);

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await db
      .insert(projectMembers)
      .values({
        projectId,
        userId: user.id,
      })
      .onConflictDoNothing();

    return {
      message: 'User invited successfully',
      ok: true,
      user,
    };
  }

  async ProjectMembers(projectId: number, userId: number) {
    await this.findOne(projectId, userId);
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId));
  }
}
