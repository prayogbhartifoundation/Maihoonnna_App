import { User as PrismaUser } from '@prisma/client';

export type User = PrismaUser;

export type SafeUser = Omit<User, 'updatedAt'> & {
  updatedAt: string;
  createdAt: string;
};