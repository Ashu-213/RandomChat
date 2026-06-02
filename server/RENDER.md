Deploying `server/` to Render

1) Connect your GitHub repo to Render and create a new Web Service.

- Set the "Environment" to Docker and point Render to the repository root; the service uses `dockerfilePath: server/Dockerfile` (already in repo).
- Branch: `main` (or your deployment branch).

2) Required environment variables (add as Render Dashboard secrets):

- `PORT` — `4000` (container port)
- `CLIENT_ORIGIN` — URL of your deployed client (Vercel), e.g. `https://your-app.vercel.app`
- `USE_REDIS` — `true` to enable Redis adapter
- `REDIS_URL` — Upstash connection string (e.g. `rediss://:PASSWORD@HOST:PORT`)

Firebase Admin (server needs service account values):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (ensure newline characters are preserved; Render secrets support multiline values)

Optional:
- `SERVER_ID` — set if you want a stable instance identifier for logs
- TURN server credentials if you add a TURN server

3) Health check: Render will use `/health` to verify readiness.

4) Logs & scaling:
- Use Render logs for stdout/stderr from `utils/logger.js`.
- Enable auto deploy; scale instances horizontally. With `USE_REDIS=true` and `REDIS_URL` set, Socket.IO adapter will coordinate across instances.

5) Post-deploy:
- Set `VITE_SERVER_URL` (or similar) in Vercel to point to your Render service URL.
