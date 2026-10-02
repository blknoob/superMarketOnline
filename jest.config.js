export default {
  // Entorno de testing
  testEnvironment: 'node',
  
  // Archivos de test (incluyendo .mjs para ES modules)
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.test.mjs',
    '<rootDir>/src/**/__tests__/**/*.test.js'
  ],

  // Cobertura de código
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/configs/**/*.js',
    '!src/**/__tests__/**',
    '!src/**/*.test.js'
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Configuración de mocks
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Timeout para tests
  testTimeout: 10000,

  // Transformaciones
  transform: {},

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};