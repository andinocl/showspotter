# Deploying to your VPS

The app is one Docker image. It reads all deployment-specific values from `.env`, so moving hosts means copying `.env`, pointing `DATABASE_URL` at a database, and running `docker compose up -d`.

## One-time database setup (existing MariaDB container)
```sh
docker exec -it <mariadb-container> mariadb -u root -p
```
```sql
CREATE DATABASE showspotter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'showspotter'@'%' IDENTIFIED BY '<strong password>';
GRANT ALL ON showspotter.* TO 'showspotter'@'%';
```
Find the network name with `docker inspect <mariadb-container> --format '{{json .NetworkSettings.Networks}}'`. The container name is the host in `DATABASE_URL`.

## Run
```sh
git clone https://github.com/andinocl/showspotter && cd showspotter
cp .env.example .env && nano .env      # fill in domain, DB URL, secrets, network name
docker compose build
docker compose run --rm migrate        # apply DB migrations
docker compose up -d
curl http://127.0.0.1:3000/api/health  # {"ok":true,"db":"up"}
```

## Reverse proxy / HTTPS
Passkeys require HTTPS. The app listens on `127.0.0.1:${APP_PORT}`; point your existing proxy (Caddy, nginx, Traefik) for your domain at it, with `X-Forwarded-*` headers.

## Updating
```sh
git pull && docker compose build && docker compose run --rm migrate && docker compose up -d
```

## Scaling / moving later
- App is stateless (sessions will be signed cookies or DB rows), so run multiple replicas behind the proxy.
- MariaDB is the only stateful piece; swap `DATABASE_URL` for a managed MySQL/MariaDB when you outgrow the container.
- Scheduled jobs run as a separate worker process (milestone 4) so only one instance does the nightly fetch.
