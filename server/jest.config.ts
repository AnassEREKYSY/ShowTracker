import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': ['@swc/jest', {}],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  roots: ['<rootDir>/src', '<rootDir>/test'],
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,js}',
  ],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    // If you use tsconfig "paths", mirror them here, e.g.:
    // '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
