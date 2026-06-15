import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  async create(createUserDto: {
    email: string;
    password: string;
    name?: string;
  }) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const [user] = await db
      .insert(users)
      .values({
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
      })
      .returning();
    return user;
  }
  async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async findById(id: number) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
}
