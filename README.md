<div align="center">

<img src=".github/logo.png" alt="OpenInstinct" width="420">

**A private personal agent powered by your local Qwen model.**

</div>

## This fork

This branch is configured for Ghulam's local AI computer. It does not deploy the
application or model inference to Vercel.

| Part                   | Where it runs                                             |
| ---------------------- | --------------------------------------------------------- |
| Main agent model       | Local ODS `llama-server`                                  |
| Browser decision model | The same local Qwen model                                 |
| PostgreSQL             | Local Docker Compose                                      |
| Profile memory         | Local filesystem data directory with private permissions  |
| Browser images         | Local filesystem data directory                           |
| Web UI                 | This computer; optionally exposed over Tailscale          |
| Browser execution      | Kernel cloud browser (current remaining external service) |

The important distinction is that Qwen decides what to do in the browser, but
Kernel currently hosts the browser session itself. Browser page content and
actions therefore pass through Kernel. Replacing Kernel with a local Chromium
runner is a separate project if fully local browser execution is required.

OpenTelemetry export is disabled. The ordinary development, build, test, and
start commands also disable Next.js and Turbo anonymous telemetry.

## Requirements

- ODS running an OpenAI-compatible endpoint at `http://127.0.0.1:11434/v1`
- Qwen loaded in ODS
- Node.js 24
- pnpm 11.24.0 through Corepack
- Docker with Compose
- A Kernel API key while the existing browser runtime is retained

## Configure

```bash
cp .env.example .env.local
```

Set `KERNEL_API_KEY` in `.env.local`. These defaults already target the model
currently loaded in ODS:

```dotenv
LOCAL_MODEL_BASE_URL=http://127.0.0.1:11434/v1
LOCAL_MODEL_ID=/models/Qwen3.6-35B-A3B-UD-IQ4_NL.gguf
LOCAL_MODEL_CONTEXT_TOKENS=65536
LOCAL_DATA_DIR=./data/local-openinstinct
OPENINSTINCT_PORT=3100
BETTER_AUTH_URL=http://127.0.0.1:3100
```

If ODS loads another model later, update `LOCAL_MODEL_ID` to the exact value
returned by:

```bash
curl http://127.0.0.1:11434/v1/models
```

## Install and run

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` starts local PostgreSQL, applies migrations, and launches the app.
Stopping it also stops the database container while retaining its Docker volume.

Open `http://127.0.0.1:3100`. OpenInstinct deliberately uses port 3100 so it
does not collide with another app on port 3000. To use it from your phone, expose only
that local web app through Tailscale, as with Pi Phone. Do not open the port to
the public internet.

## Local data

Persistent private files live under `data/local-openinstinct/` by default:

- generated installation secrets;
- profile memory documents;
- browser image artifacts.

This directory is ignored by Git. Back it up privately. Losing the generated
encryption key can make existing vault data unreadable.

Ongoing workstreams and application state remain in PostgreSQL. Its Docker
volume is separate from `LOCAL_DATA_DIR`.

## Verification

```bash
pnpm check
pnpm build
```

The repository requires Node.js 24. If the host still uses Node.js 22, run the
checks in a Node 24 container or upgrade the host runtime before launching the
app.

> [!WARNING]
> OpenInstinct can operate browsers and store credentials. Review consequential
> actions before approval and keep the app private to your Tailscale network.
