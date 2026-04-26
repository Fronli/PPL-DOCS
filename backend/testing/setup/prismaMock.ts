import { mockDeep, mockReset } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import { jest, beforeEach } from '@jest/globals';

const prismaMock = mockDeep<PrismaClient>();

jest.unstable_mockModule('../../src/db/primsa.js', () => ({
  default: prismaMock,
  __esModule: true,
}));

export { prismaMock };

beforeEach(() => {
  mockReset(prismaMock);
});
