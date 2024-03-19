/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
  testMatch: [
    '**/__tests__/**/*.?(m)js?(x)',
    '**/?(*.)(spec|test).?(m)js?(x)'
  ],
  transform: {
    '^.+\\.mjs$': 'babel-jest'
  },
  moduleFileExtensions: [
    'mjs',
    'js'
  ]
}

export default config
