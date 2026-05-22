<div align="center">
  <h1>TRIAGEGUARD — Clinical Triage Copilot</h1>
  <p>An AI-powered clinical triage app that captures patient intake, analyzes symptoms and vitals, and produces structured urgency recommendations grounded in clinical protocols.</p>
</div>

## Overview

TRIAGEGUARD is a lightweight React + Vite frontend with an Express backend that sends structured prompts to an LLM (via OpenRouter) to generate evidence-grounded triage recommendations. The app is intended for prototyping clinical decision support workflows with strict grounding and safety checks.

Key features:
- Capture intake (symptoms, history, vitals)
- Generate structured triage output (label, red flags, rationale, citations)
- Safety verification and protocol grounding

## Quickstart (Local)

Prerequisites: `Node.js` (>=16), `npm`

1. Install dependencies

```bash
npm install
```

2. Create environment file

Copy `.env.example` to `.env.local` and set:

- `OPENROUTER_API_KEY="sk-or-v1-..."`
- Optional: `OPENROUTER_MODEL` — override default model (default: `gpt-oss-120b`)

3. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Development Notes

- The backend server entrypoint is `server.ts` and serves the frontend via Vite middleware in dev.
- LLM integration is implemented in `server.ts` and uses `OPENROUTER_API_KEY` to call OpenRouter.
- Protocol definitions are in `src/data/protocols.ts`.

## Testing the Triage Endpoint

You can call the triage API directly for quick tests:

```bash
curl -s -X POST http://localhost:3000/api/triage \
  -H 'Content-Type: application/json' \
  -d '{"patientData":{"complaint":"Chest pain","history":"HTN","onset":"30 minutes","vitals":{"bp_sys":"140","bp_dia":"90","hr":"100","temp":"37.0","o2":"96"}}}'
```

## Contributing

This repo is a prototype. If you plan to extend it:

- Remove any real API keys from environment files before committing.
- Add automated tests and CI before production use.
- Consider adding an audit log and stricter input validation for clinical deployments.

## License

MIT

---

If you'd like, I can also create a `CONTRIBUTING.md`, add a GitHub Actions CI workflow, or open a PR with documentation changes.
