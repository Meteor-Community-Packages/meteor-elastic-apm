module.exports = {
  transform: {
    '^.+\\.(js|jsx)?$': 'babel-jest'
  },
  roots: ['<rootDir>'],
  modulePathIgnorePatterns: ['<rootDir>/__tests__/mocks']
};
