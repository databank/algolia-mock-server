
module.exports = {
  preset: 'ts-jest',
  testEnvironment: "node",
  "roots": [
    "<rootDir>/src",
	"<rootDir>/tests"
  ],
  "testMatch": [
    "**/*.tsx",
    "**/*.test.ts",
  ],
  "transform": {

      "^.+\\.(ts|tsx)?$": ["ts-jest"], // ["ts-jest", { tsconfig: "tsconfig.test.json" }],
      "^.+\\.(js|jsx)$": "babel-jest",
  },
  clearMocks: true,
  testPathIgnorePatterns: [ "/node_modules/"],
  testTimeout: 20000,

  collectCoverage: true,
  coverageDirectory: "coverage",
  bail: true,
  verbose: true,


};