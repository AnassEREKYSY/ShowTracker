import { jest } from '@jest/globals';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  expire: jest.fn(),
};

export const redis = mockRedis as unknown as typeof import('../../../src/lib/redis').redis;
