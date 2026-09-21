# Litak Docker development environment

This Compose project runs the complete local stack:

- Litak HTTP server on <http://localhost:9663>
- Litak WebSocket server on `ws://localhost:9664`
- MongoDB 5 (required by Litak's 2021 ReactiveMongo driver)
- Redis
- A one-shot frontend asset build

The directory layout must remain:

```text
litak/
├── litak/
│   └── docker/
└── litak-ws/
```

## Start

From the Litak repository:

```bash
cd docker
docker compose up --build
```

The first build downloads frontend and Scala dependencies and can take several minutes. Later starts reuse named cache volumes. Open <http://localhost:9663> after the logs report that Play is listening on port 9663.

Run in the background with:

```bash
docker compose up --build --detach
docker compose logs --follow litak litak-ws
```

## Stop

```bash
docker compose down
```

MongoDB and Redis data remain in named volumes. To deliberately remove that local data as well:

```bash
docker compose down --volumes
```

## Rebuild frontend assets

```bash
docker compose run --rm assets
docker compose restart litak
```

The source directories are bind-mounted, so Scala and frontend edits remain on the host. Generated frontend files are written into `public/` and are ignored by Git.

## Production deployment

The production images contain optimized assets and immutable application distributions. GitHub Actions builds them, and the production server only pulls them from GHCR. Caddy obtains and renews TLS certificates automatically once domain names are configured.

1. Point DNS records for the site and WebSocket hostnames at the server.
2. Copy the example environment file and replace every placeholder:

   ```bash
   cp .env.production.example .env.production
   chmod 600 .env.production
   ```

3. Generate secrets as described in that file.
4. Allow inbound TCP ports 80 and 443 and UDP port 443 in the server firewall.
5. Pull and start the production stack:

   ```bash
   docker compose --env-file .env.production -f compose.production.yml pull
   docker compose --env-file .env.production -f compose.production.yml up --detach
   docker compose --env-file .env.production -f compose.production.yml logs --follow caddy litak litak-ws
   ```

Only Caddy publishes host ports. MongoDB, Redis, Litak, and `litak-ws` remain on a private Docker network.

To deploy a new revision:

```bash
git pull
docker compose --env-file .env.production -f compose.production.yml pull
docker compose --env-file .env.production -f compose.production.yml up --detach
```

Back up the `mongo_production_data`, `redis_production_data`, and `caddy_data` volumes. Do not run `docker compose down --volumes` in production unless permanent data deletion is intended.

### Small-server memory profile

The production configuration is tuned for a small community with roughly a dozen concurrent games:

| Service | Container limit | Internal memory ceiling |
| --- | ---: | ---: |
| Litak | 1536 MB | 1 GB JVM heap |
| `litak-ws` | 512 MB | 384 MB JVM heap |
| MongoDB | 768 MB | 256 MB WiredTiger cache |
| Redis | 256 MB | 128 MB dataset |
| Caddy | 128 MB | — |

The limits total 3.2 GB, leaving operating-system and Docker headroom on a 4 GB server. Application caches populate according to real usage, so their source-code capacities do not reserve all that memory up front.

Image compilation still requires considerably more memory than runtime. Build production images in CI or on an 8 GB+ machine, publish them to a registry, and let the small production server only pull and run those images.

### Temporary deployment using only an IP address

Until DNS is available, expose the website over plain HTTP on port 80 and WebSockets on port 9664:

```bash
export LITAK_PUBLIC_IP=YOUR_SERVER_IP
export LITAK_ADMIN_EMAIL=YOUR_EMAIL
./create-production-env.sh
unset LITAK_PUBLIC_IP LITAK_ADMIN_EMAIL
```

The helper writes the IP only to the Git-ignored `.env.production` file and generates fresh secrets. No real server address or secret is stored in the repository. Then run:

```bash
docker compose --env-file .env.production -f compose.production.yml pull
docker compose --env-file .env.production -f compose.production.yml up --detach
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs --follow caddy litak litak-ws
```

Allow inbound TCP ports 80 and 9664 in both the cloud firewall and the server firewall. Keep 443 available for the later domain/TLS migration. The temporary addresses will be:

- Website: `http://SERVER_IP`
- WebSocket endpoint: `ws://SERVER_IP:9664`

Do not enter passwords or private keys into Git. `.env.production` is ignored by the repository.

### GitHub Container Registry

The `Production container images` workflow publishes AMD64 images for the current server on pushes to `master`:

- `ghcr.io/ulisestorrella/litak:latest`
- `ghcr.io/ulisestorrella/litak-ws:latest`

It also publishes immutable `sha-...` tags. Run the workflow manually after changing `litak-ws`, because that source lives in a separate repository.

The packages should remain private. GitHub Container Registry creates packages from personal repositories as private by default; verify each package's visibility under the GitHub profile's **Packages → Package settings** page.

Authenticate once on the server using a classic personal access token with `read:packages`. If the repositories themselves are private, also grant `repo`:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
unset GHCR_TOKEN
```

Alternatively, make both packages public in their GitHub package settings so the server can pull without credentials.

After authentication and environment setup, future deployments can use:

```bash
chmod +x deploy-server.sh
./deploy-server.sh
```
