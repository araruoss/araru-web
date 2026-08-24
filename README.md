# Araru Web

Official web client for Araru. React/Vite/PWA provides catalog, categories, history, administration and PDF/EPUB/MOBI/CBZ/CBR readers exclusively through the Araru Server API.

## Requirements and development

Node.js 22.5+ and an Araru Server reachable by HTTP.

```bash
cp .env.example .env
npm ci
npm run dev
```

`VITE_API_URL` accepts `/api` behind a same-origin proxy or a complete Server origin such as `http://localhost:3001`. The client never connects to PostgreSQL, Redis, filesystem, Drive, or server secrets.

## Quality and distribution

- `npm test`, `npm run lint`, `npm run build`
- `npm run preview`
- `E2E_BASE_URL=http://localhost:8080 npm run test:e2e` against a running full stack
- `npm run check:performance`

The static build is generated in `dist/`. The container uses Nginx and is published as `ghcr.io/araruoss/araru-web`. See [Araru Documentation](https://github.com/araruoss/araru-docs), [CONTRIBUTING.md](CONTRIBUTING.md), [CHANGELOG.md](CHANGELOG.md), and [SECURITY.md](SECURITY.md).
