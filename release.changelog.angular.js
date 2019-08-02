'use strict'

const allowKeys = ['ci', 'refactor', 'doc'];

module.exports = (() => {
  return Promise.resolve(require('conventional-changelog-angular'))
    .then((config) => {
      const bkTransform = config.writerOpts.transform;
      config.writerOpts.transform = (commit, context) => {
        const isCustomCommit = allowKeys.some(k => k === commit.type) === true;
        isCustomCommit && commit.notes.push({ title: '' });
        const ret = bkTransform(commit, context);
        isCustomCommit && commit.notes.pop();
        return ret;
      };
      return config;
    });
})();
