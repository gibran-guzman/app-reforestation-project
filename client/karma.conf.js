module.exports = function (config) {
  config.set({
    plugins: ['karma-coverage', 'karma-jasmine', 'karma-chrome-launcher'],
    frameworks: ['jasmine'],
    reporters: ['progress', 'coverage'],
    preprocessors: {
      'src/**/!(*.spec).js': ['coverage'],
    },
    coverageReporter: {
      dir: 'coverage',
      reporters: [
        { type: 'text-summary' },
        { type: 'lcovonly', subdir: '.', file: 'lcov.info' },
        { type: 'html' },
      ],
      includeAllSources: true,
      check: {
        global: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu'],
      },
    },
    singleRun: true,
  });
};
