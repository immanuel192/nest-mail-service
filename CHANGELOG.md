## [1.1.1](https://github.com/immanuel192/nest-mail-service/compare/v1.1.0...v1.1.1) (2019-08-07)

# [1.1.0](https://github.com/immanuel192/nest-mail-service/compare/v1.0.0...v1.1.0) (2019-08-07)


### Bug Fixes

* correct docker file that no need to remove local.josn anymore ([5fc6e41](https://github.com/immanuel192/nest-mail-service/commit/5fc6e41))
* enable production mail-recover job ([bbfe116](https://github.com/immanuel192/nest-mail-service/commit/bbfe116))


### Code Refactoring

* refactor enum of email sending status ([7a5a041](https://github.com/immanuel192/nest-mail-service/commit/7a5a041))
* update queue produer and consumer ([a7ea93e](https://github.com/immanuel192/nest-mail-service/commit/a7ea93e))


### Features

* add mail MTA, and stategy ([3f24ddf](https://github.com/immanuel192/nest-mail-service/commit/3f24ddf))
* add queue consumer base and mail sending worker ([6a1a8b4](https://github.com/immanuel192/nest-mail-service/commit/6a1a8b4))

# 1.0.0 (2019-08-05)


### Bug Fixes

* fix build deployment ([0a793c1](https://github.com/immanuel192/nest-mail-service/commit/0a793c1))


### Features

* add endpoint POST /api/emails ([9fed93d](https://github.com/immanuel192/nest-mail-service/commit/9fed93d))
* add job abstract for cron job support ([6d213f0](https://github.com/immanuel192/nest-mail-service/commit/6d213f0))
* add mail.cover job ([b464deb](https://github.com/immanuel192/nest-mail-service/commit/b464deb))
* add mongo db connection ([8a07775](https://github.com/immanuel192/nest-mail-service/commit/8a07775))
* add mongodb and redis providers ([d18d9a5](https://github.com/immanuel192/nest-mail-service/commit/d18d9a5))
* add queue support ([496567c](https://github.com/immanuel192/nest-mail-service/commit/496567c))
* update POST /api/emails endpoint to enqueue when creating new email ([63620d3](https://github.com/immanuel192/nest-mail-service/commit/63620d3))
