import { User } from "../types/prisma.types";
import { prisma } from "../config/db";
import { BaseMongoRepository } from "../base/BaseMongoRepository";

export class UserRepository extends BaseMongoRepository<User> {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(prisma.user as any);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async emailExists(email: string): Promise<boolean> {
    return this.exists({ email });
  }
}
