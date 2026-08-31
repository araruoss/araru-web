# Changelog

## [0.3.1](https://github.com/araruoss/araru-web/compare/v0.3.0...v0.3.1) (2026-08-31)


### Bug Fixes

* **web:** restore UI/UX design system pipeline, responsive navigation, and reader resilience ([#25](https://github.com/araruoss/araru-web/issues/25)) ([159ec0e](https://github.com/araruoss/araru-web/commit/159ec0efb8a5b860d922cd90545a32c3c5f73232)), closes [#24](https://github.com/araruoss/araru-web/issues/24)

## [0.3.0](https://github.com/araruoss/araru-web/compare/v0.2.1...v0.3.0) (2026-08-31)


### Features

* **library:** add source administration UI ([07b61c9](https://github.com/araruoss/araru-web/commit/07b61c992b48870d31d00f70a79399fe269c7b69))


### Bug Fixes

* **build:** configure Tailwind PostCSS plugin ([bef3ec2](https://github.com/araruoss/araru-web/commit/bef3ec201015bea9379689d995693b0955ee0bbe))

## [0.2.1](https://github.com/araruoss/araru-web/compare/v0.2.0...v0.2.1) (2026-08-30)


### Bug Fixes

* **reader:** sanitize epub and mobi content ([#18](https://github.com/araruoss/araru-web/issues/18)) ([f81b2a0](https://github.com/araruoss/araru-web/commit/f81b2a063dfe620adf1baeba7f04c904a64f8845))

## [0.2.0](https://github.com/araruoss/araru-web/compare/v0.1.0...v0.2.0) (2026-08-30)


### Features

* **admin:** consolidate administrative experience ([9675dc7](https://github.com/araruoss/araru-web/commit/9675dc7d173ecfbb960f0c0d99e91f5065409d1d))

## Changelog

Araru Web follows [Semantic Versioning](https://semver.org/). Release entries are generated from Conventional Commits while preserving the historical notes below.

## Unreleased

### Separação do Araru Web

- cliente React/Vite/PWA transformado em projeto independente;
- integração com o Server exclusivamente por `VITE_API_URL`;
- testes, budget de performance, container Nginx, CI e releases próprios;
- E2E full-stack desacoplado do checkout do Server.

Esta entrada não altera automaticamente a versão do software.
