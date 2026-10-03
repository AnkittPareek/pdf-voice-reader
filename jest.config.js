/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^expo-modules-core$': '<rootDir>/tests/mocks/expo-modules-core.ts',
    '^expo-sqlite$': '<rootDir>/tests/mocks/expo-sqlite.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        strict: true,
        jsx: 'react-jsx',
        target: 'ES2020',
        types: ['jest'],
      },
    }],
  },
};
