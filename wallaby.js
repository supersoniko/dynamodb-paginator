module.exports = () => {

  return {
    files: ['lib/**/*.js'],
    tests: ['test/*.js'],
    env: {
      type: 'node',
      runner: 'node'
    },
    testFramework: 'jest'
  };
};
