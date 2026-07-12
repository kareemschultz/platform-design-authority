# Meridian PostgreSQL Prototype Notes

This Compose PostgreSQL service is local controlled-prototype infrastructure only. It uses `postgres:18.4` with image index digest `sha256:22c89fe0d0f507606260237fd55e51f6137f58b2d5bcf6152242b96d9fe8f9a4`, verified with `docker buildx imagetools inspect postgres:18.4` on 2026-07-12.

Required local environment variables:

- `POSTGRES_PASSWORD`
- `BETTER_AUTH_SECRET`

The database is not published to the host. Use `docker compose exec postgres ...` for local administrative commands.

Backup example:

```bash
docker compose exec -T postgres pg_dump -U postgres -d meridian --format=custom > meridian.dump
```

Restore example for a fresh local volume:

```bash
docker compose exec -T postgres pg_restore -U postgres -d meridian --clean --if-exists < meridian.dump
```

Migrations remain owned by the platform migration workflow. Do not add optional extensions here; ADR-0024 currently permits only the PostgreSQL 18 baseline with `pg_stat_statements` preloaded.
