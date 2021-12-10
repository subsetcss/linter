module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testRegex: '(/tests/.*|(\\.|/)(test|spec))\\.(ts|js)x?$',
  modulePathIgnorePatterns: ['tests/fixtures/'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx}', '!src/**/*.d.ts'],
};
