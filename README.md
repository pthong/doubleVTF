# Vanilla Node Dashboard

This project is a small Express-based dashboard that serves static UI from the `public/` folder and exposes a simple finance API. The finance API writes JSON files into `data/finance` (example filenames: `20250922-20251021.json`, `20251024-20251124.json`, etc.). These JSON files represent time-windowed finance snapshots and are persisted on the host when the container mounts the `data` directory.

**Quick Start (Development)**

- **Install dependencies:** `npm install`
- **Start in development mode:** `npm run dev`
- **Open in browser:** `http://localhost:3045`

Run from the project root (zsh / bash):

```zsh
npm install
npm run dev
```

The development server listens on port `3045` by default. If your environment or `server.js` has been modified to read `process.env.PORT`, you can override that when starting the server.

**Docker (build & run)**

Build the image from the project root:

```zsh
docker build -t vanilla-node-dashboard:latest .
```

Run the container and mount the `data` directory so finance JSON is persisted to the host:

```zsh
# Map host 3045 -> container 3045
docker run --rm -p 3045:3045 -v "$PWD/data":/usr/src/app/data --name vanilla-node-dashboard vanilla-node-dashboard:latest

# Or map host 8080 -> container 3045 if 3045 is in use
docker run --rm -p 8080:3045 -v "$PWD/data":/usr/src/app/data --name vanilla-node-dashboard vanilla-node-dashboard:latest
```

Visit `http://localhost:3045` (or `http://localhost:8080` if you mapped 8080) to view the dashboard.

**Using Docker Compose**

Compose makes it convenient to build and run with the `data` volume mounted. From the project root:

```zsh
# Build and start in detached mode (rebuild images)
docker compose up --build -d

# Stop and remove containers
docker compose down
```

By default this repository's compose setup maps host `8080` to the container port `3045` and mounts `./data` so the finance JSON is available on the host.

**Finance data**

- Finance JSON files are written into `data/finance` by the API; these files contain the data used by the UI `public/finance.html`.
- The filenames are date-range based (one file per reporting window). Keep backups of `data/finance` if you need to preserve historic snapshots.

**Notes & next steps**

- If you want the server to honor a `PORT` environment variable, I can update `server.js` to use `process.env.PORT || 3045`.
- Ensure Docker Desktop is running on macOS before using the Docker or Compose commands above.

If you'd like, I can also add an example `curl` command to exercise the finance API or add a short section describing the JSON schema the API writes.
