# RandomChat

A real-time anonymous video chat platform — get matched with a stranger instantly for live peer-to-peer video conversations. Built with **WebRTC**, **Socket.IO**, **React 19**, and **Redis**.

> Think Omegle — engineered from scratch with modern tooling.

---

## ⚡ Highlights

- **100% P2P video** — zero bytes of media routed through the server
- **<2s match-to-video** — queue → match → SDP exchange → ICE → connected
- **720p @ 30fps** with echo cancellation, noise suppression & auto-gain
- **Horizontally scalable** — Redis-backed queue, Socket.IO Redis Adapter, 1→N instances with 0 code changes
- **6-op atomic Redis transactions** — eliminated double-match race conditions
- **Firebase Auth** — Google OAuth with JWT-verified socket connections

---

## 🏗️ Architecture

```
┌─────────────┐       WebSocket        ┌─────────────────┐       Redis Pub/Sub       ┌─────────────────┐
│  React SPA  │◄──────────────────────►│  Node.js Server │◄──────────────────────────►│  Redis (Upstash) │
│  (Vite)     │   Socket.IO + Auth     │  (Express)      │   Queue + Pairs + Adapter │                  │
└──────┬──────┘                        └────────┬────────┘                           └──────────────────┘
       │                                        │
       │  WebRTC (P2P)                          │  Signaling only
       │  Video + Audio                         │  SDP + ICE relay
       ▼                                        │
┌─────────────┐                                 │
│  Peer User  │◄────────────────────────────────┘
└─────────────┘
```

**Signaling flow:** Server relays SDP offers/answers and ICE candidates between matched peers — never touches media data.

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Zustand, TailwindCSS |
| Real-time | Socket.IO (WebSocket-first, polling fallback) |
| Video | WebRTC (STUN + TURN via Xirsys) |
| Auth | Firebase Authentication (Google OAuth 2.0) |
| Backend | Node.js, Express |
| Queue | Redis Sorted Sets + Hash Maps (Upstash) |
| Scaling | Socket.IO Redis Adapter (Pub/Sub) |
| Deployment | Docker → Render (server), Vercel (client) |

---

## 📂 Project Structure

```
RandomChat/
├── client/                  # React SPA (Vite)
│   └── src/
│       ├── components/      # VideoPanel, ControlBar, StatusOverlay
│       ├── hooks/           # useAuth, useSocket, useWebRTC, useMediaStream
│       ├── lib/             # firebase.js, socket.js, webrtc.js
│       ├── pages/           # LandingPage, HomePage, ChatPage
│       └── store/           # Zustand chatStore (6-state machine)
│
├── server/                  # Node.js signaling server
│   └── src/
│       ├── config/          # firebase.js, redis.js
│       ├── handlers/        # authHandler, matchHandler, signalingHandler
│       ├── queue/           # MatchQueue (in-memory), RedisMatchQueue
│       └── utils/           # rateLimiter, logger
│
├── Dockerfile               # Server container
├── render.yaml              # Render deployment config
└── firebase.json            # Firebase Hosting config
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- Firebase project with Google Auth enabled
- Redis instance (optional — falls back to in-memory queue)

### 1. Clone

```bash
git clone https://github.com/your-username/RandomChat.git
cd RandomChat
```

### 2. Server setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Redis (optional — set USE_REDIS=false to use in-memory queue)
USE_REDIS=true
REDIS_URL=rediss://your-redis-url

# Logging
LOG_LEVEL=info
```

```bash
npm run dev
```

### 3. Client setup

```bash
cd client
npm install
```

Create `client/.env.local`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxx

VITE_SOCKET_URL=http://localhost:4000

# TURN server (optional — improves connectivity behind strict NATs)
VITE_TURN_URL=turn:your-turn-server:3478?transport=udp
VITE_TURN_USERNAME=your-username
VITE_TURN_CREDENTIAL=your-credential
```

```bash
npm run dev
```

Open **http://localhost:5173** → Sign in with Google → Start Video Chat.

---

## 🔑 Key Features

| Feature | Detail |
|---------|--------|
| Instant matching | FIFO queue with Redis Sorted Sets — oldest user matched first |
| Skip & re-queue | Destroy PeerConnection → notify partner → re-enter queue in one click |
| Camera flip | `replaceTrack()` switches front↔rear in <100ms, no reconnection |
| Mic/cam toggle | Track-level `enabled` toggle, no stream re-acquisition |
| Rate limiting | Sliding-window limiter: 3 req/5s per socket, auto-cleanup on disconnect |
| Stale pruning | 30s interval removes zombie entries older than 120s |
| ICE buffering | Candidates queued until `setRemoteDescription` completes — prevents race failures |
| Health checks | `/health` endpoint — 30s intervals, 5s timeout |
| Graceful shutdown | SIGTERM/SIGINT → drain queue → close sockets → exit |

---

## 📄 License

MIT
