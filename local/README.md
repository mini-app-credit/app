# Local Backend Stack

Run all three backend apps from `apps/backend/core` with one command:

```bash
npm run app:up
```

Compose layout:

- `docker-compose.yml`: shared infra
- `docker-compose.api.yml`: `api` (exposes `3000`)
- `docker-compose.worker.yml`: `worker`
- `docker-compose.mcp-client.yml`: `mcp-client` + upstream MCP servers
- `docker-compose.local.yml`: local ports/container names
- `devops`: local infra config such as `nats-server.conf`
- `prometheus`: Prometheus scrape config
- `grafana`: Grafana provisioning and dashboards

Direct compose example:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.api.yml \
  -f docker-compose.worker.yml \
  -f docker-compose.mcp-client.yml \
  -f docker-compose.local.yml \
  up -d --build
```
