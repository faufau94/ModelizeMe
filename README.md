<div align="center">
  <img src="public/logo.svg" alt="ModelizeMe" width="120" />
  <h1>ModelizeMe</h1>
  <p><strong>The open-source Merise data modeling IDE, from concept to code.</strong></p>

  [![Nuxt](https://img.shields.io/badge/Nuxt-3-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com)
  [![Vue](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js&logoColor=white)](https://vuejs.org)
  [![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
  [![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/your-org/modelizeme/pulls)
</div>

---

**ModelizeMe** is a collaborative, visual data modeling IDE built around the **[Merise](https://en.wikipedia.org/wiki/Merise) methodology**. Design your data from the ground up: starting with the **Conceptual Data Model (MCD)**, deriving the **Logical Data Model (MLD)**, down to the **Physical Data Model (MPD)**, then generate production-ready code (migrations, ORM models, project scaffolding) for your framework, ORM, and database of choice.

> Design your data. Collaborate in real time. Generate your stack.

The project is actively developed. More methodologies (UML class diagrams, Entity-Relationship diagrams) and features are on the roadmap.

---

## Table of contents

- [⭐️ Features](#️-features)
- [�:� Roadmap](#-roadmap)
- [🛠 Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Development](#development)
  - [🐳 Docker](#-docker)
- [⚙️ Environment Variables](#️-environment-variables)
- [🤝 Contributing](#-contributing)
- [💝 Special Thanks](#-special-thanks)

---

## ⭐️ Features

- 🗂 **Full Merise pipeline**: Design entities and relations visually as MCD (Conceptual), auto-derive MLD (Logical) and MPD (Physical). Each level is always in sync.

- 🤝 **Real-time collaboration**: Multiple users edit the same model simultaneously with Yjs CRDT sync over WebSocket, with live presence indicators

- ⚡ **Code generation**: Generate migrations, ORM models and full project scaffolding for your exact stack:
  - **Frameworks**: Laravel, Symfony, Django, Next.js, Nuxt
  - **ORMs**: Prisma, TypeORM, SQLAlchemy, Doctrine, Eloquent
  - **Databases**: MySQL, PostgreSQL, SQLite

- 🔄 **Auto-layout**: One-click graph reorganization powered by ELK.js, with collision avoidance

- ↩️ **Undo / Redo**: Full collaborative undo history via Yjs UndoManager

- 📤 **Export & Import**: Export your diagrams as JSON, SQL, or XML; import existing schemas

- 🖼 **Gallery**: Browse and fork community model templates to jumpstart your project

- 🔐 **Auth & workspaces**: Sign in with Google, GitHub or GitLab. Organize work in Organizations → Teams → Models

- 🌙 **Dark mode**: First-class support, no flash

---

## �:� Roadmap

ModelizeMe is under active development. Here's what's planned:

### Modeling

- [ ] **UML Class Diagrams**: Full UML class diagram support with inheritance, interfaces, associations
- [ ] **Entity-Relationship Diagrams (ERD)**: Chen and Crow's Foot notations
- [ ] **UML Use Case / Sequence Diagrams**: Extend beyond data modeling
- [ ] **MCD → MLD auto-derivation improvements**: Better handling of ternary associations and inheritance

### Code Generation

- [ ] **More ORMs**: Hibernate (Java), ActiveRecord (Rails), GORM (Go)
- [ ] **More frameworks**: Spring Boot, Rails, FastAPI, NestJS
- [ ] **More databases**: MongoDB, MariaDB, Microsoft SQL Server
- [ ] **API generation**: Generate REST/GraphQL endpoint scaffolding from the model

### Collaboration & UX

- [ ] **Comments & annotations** on entities and attributes
- [ ] **Version history**: Browse and restore previous model states
- [ ] **Shareable public links** for read-only model viewing
- [ ] **Multiplayer cursors**: See teammates' cursors in real time
- [ ] **Mobile-friendly canvas**

### Platform

- [ ] **CLI tool**: Import/export models from the command line
- [ ] **VS Code extension**: View and navigate your models from the editor
- [ ] **Self-hosted one-click deploy** (Railway, Render, Coolify)

> Have an idea? [Open an issue](https://github.com/your-org/modelizeme/issues) and let's discuss it.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 3 + Vue 3 (Composition API) |
| UI | shadcn-nuxt, Tailwind CSS, Lucide icons |
| Graph canvas | Vue Flow (`@vue-flow/core`) |
| Auto-layout | ELK.js |
| Real-time | Yjs (CRDT) + y-websocket |
| State | Pinia |
| Data fetching | TanStack Query + `$fetch` |
| ORM / DB | Prisma + MySQL |
| Auth | Better-Auth (OAuth Google / GitHub / GitLab) |
| Validation | Zod + vee-validate |
| Infra | Docker Compose |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js v20+](https://nodejs.org/)
- [pnpm v9+](https://pnpm.io/)
- [Docker & Docker Compose](https://docs.docker.com/compose/) (recommended)

### Development

```bash
# Clone the repository
git clone https://github.com/your-org/modelizeme.git
cd modelizeme

# Install dependencies
npm install
# or
pnpm install
# or
yarn
# or
bun install

# Set up environment variables (see below)
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

### 🐳 Docker

The recommended way to run ModelizeMe locally is with Docker Compose.  
It spins up the main app **and** the Yjs WebSocket collaboration server as separate containers.

```bash
# Start all services in development mode
docker compose --profile dev up -d --build

# Stop all services
docker compose --profile dev down
```

| Service | Port |
|---|---|
| App | `3000` |
| Yjs WebSocket server | `1234` |
| MySQL | `3306` |

---

## ⚙️ Environment Variables

Create a `.env` file at the root. Required variables:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/modelizeme"

# Better-Auth
BETTER_AUTH_SECRET="your-secret"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=

# WebSocket server
NUXT_PUBLIC_WS_URL="ws://localhost:1234"

# Mailer (for invitations)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

---

##  Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
# Build for production
npm run build
# or pnpm build / yarn build / bun run build
```

## 💝 Special Thanks

ModelizeMe is built on the shoulders of giants:

- **[Claude](https://www.anthropic.com/claude) by [Anthropic](https://www.anthropic.com/)**: The AI pair programmer that helped design, build and iterate on ModelizeMe. A genuinely useful coding companion.

- **[Vue Flow](https://vueflow.dev/)**: The powerful Vue 3 graph/flowchart library that powers the entire modeling canvas. Without it, ModelizeMe wouldn't exist in its current form. Please consider [starring their repo](https://github.com/bcakmakoglu/vue-flow).

- **[Better Auth](https://www.better-auth.com/)**: A refreshingly simple and secure authentication library for TypeScript. Handles all our OAuth flows, sessions and user management without the usual headaches.

- **[ELK.js](https://github.com/kieler/elkjs)**: The Eclipse Layout Kernel ported to JavaScript, powering the automatic graph layout engine.

- **[Yjs](https://yjs.dev/)**: The CRDT framework that makes real-time collaboration possible without a central conflict-resolution server.

---

<div align="center">
  Made with ❤️ using <a href="https://nuxt.com">Nuxt 3</a> &amp; <a href="https://vueflow.dev">Vue Flow</a>
</div>
