module.exports = {  
  testEnvironment: 'node',  
  coveragePathIgnorePatterns: ['/node_modules/'],  
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],  
  testMatch: ['**/__tests__/**/*.js', '**/test/**/*.js'],  
  collectCoverageFrom: [  
    'src/**/*.js',  
    '!src/server.js'  
  ]  
};