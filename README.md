# Araru Web

Official web client for Araru. React/Vite/PWA provides catalog, categories, history, administration and PDF/EPUB/MOBI/CBZ/CBR readers exclusively through the Araru Server API.

## Requirements and development

Node.js 22.5+ and an Araru Server reachable by HTTP.

```bash
cp .env.example .env
npm ci
npm run dev
```

`VITE_API_URL` is the API v1 prefix. Use `/api/v1` behind a same-origin proxy or a complete Server origin such as `http://localhost:3001`; the client normalizes an origin to `/api/v1`. The client never connects to PostgreSQL, Redis, filesystem, Drive, R2, or server secrets.

## Configuration and storage

The web client only needs these public runtime parameters:

| Variable | Example | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `/api/v1` | Public Araru Server API v1 base URL |
| `VITE_DEV_PROXY_TARGET` | `http://localhost:3001` | Vite development proxy target |
| `VITE_ALLOWED_HOSTS` | empty | Optional comma-separated development hosts |

Storage is configured on Araru Server, never in this repository. Google Drive and Cloudflare R2 credentials, buckets, OAuth tokens, encryption keys and provider failover stay server-side. The web calls only v1 resources such as `/works/:id/content`, `/works/:id/pages`, `/admin/storage/providers` and `/admin/storage/r2/upload-url`. Configure the server provider, then use `/admin/storage` to test its health.

Work details and search are server-backed. Details use the canonical work identity, available formats, tags, series and persisted reading/favorite state; the reader can request the versioned `/works/:id/manifest` before opening content. Search results come from the server full-text index and are not assembled from a static client catalog.

### Configuração (pt-BR)

O frontend precisa apenas de `VITE_API_URL`, `VITE_DEV_PROXY_TARGET` e, opcionalmente, `VITE_ALLOWED_HOSTS`. Use `/api/v1` no proxy de mesma origem. Drive, R2, credenciais, tokens OAuth, chaves e políticas de fallback são configurados exclusivamente no Araru Server. O navegador acessa somente os contratos públicos da API v1; nunca recebe segredo de storage.

## Quality and distribution

- `npm test`, `npm run lint`, `npm run build`
- `npm run preview`
- `E2E_BASE_URL=http://localhost:8080 npm run test:e2e` against a running full stack
- `npm run check:performance`

The static build is generated in `dist/`. The container uses Nginx and is published as `ghcr.io/araruoss/araru-web`. See [Araru Documentation](https://github.com/araruoss/araru-docs), [CONTRIBUTING.md](CONTRIBUTING.md), [CHANGELOG.md](CHANGELOG.md), and [SECURITY.md](SECURITY.md).

## UI architecture

The product UI is built in layers: Base UI behavior, shadcn-compatible primitives, Araru semantic primitives, domain components and feature pages. Tokens and migration ownership are documented in [docs/visual-migration.md](docs/visual-migration.md). Use `components/ui` and `components/content` for new work; do not add page-local visual primitives or import Base UI directly from features.
