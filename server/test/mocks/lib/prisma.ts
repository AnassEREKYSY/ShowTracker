import { jest } from '@jest/globals';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  favorite: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
};

export const prisma = mockPrisma as unknown as typeof import('../../../src/lib/prisma').prisma;
