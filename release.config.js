module.exports = {
  "plugins": [
    [
      "@semantic-release/commit-analyzer",
      {
        "preset": "angular",
        "releaseRules": [
          {
            "type": "docs",
            "release": "patch"
          },
          {
            "type": "refactor",
            "release": "patch"
          },
          {
            "type": "style",
            "release": "patch"
          },
          {
            "type": "chore",
            "release": "patch"
          }
        ]
      }
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        "config": './release.changelog.angular.js',
        "writerOpts": {
          "commitsSort": [
            "type",
            "subject",
            "scope"
          ]
        }
      }
    ],
    "@semantic-release/changelog",
    [
      "@semantic-release/npm",
      {
        "npmPublish": false
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": [
          "CHANGELOG.md",
          "package.json"
        ],
        "message": "chore(release): release <%= nextRelease.version %> - <%= new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }) %>\n\n<%= nextRelease.notes %>"
      }
    ],
    "@semantic-release/github"
  ]
};
