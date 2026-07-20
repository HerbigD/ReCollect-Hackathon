# ReCollect

**Stop saving, start using.** ReCollect turns the posts you bookmark but never revisit — across X and Reddit — into one grounded, source-linked result you'll actually use.

Built for **OpenAI Build Week** (category: *Apps for Your Life*) with **Codex** and **GPT-5.6**.

---

## The problem

Everyone bookmarks constantly and revisits almost none of it. Existing tools help you *search* your saves. ReCollect does something different: you give it a topic, and it **melts your scattered saves into a finished artifact** — a study path, a curated collection, a comparison, whatever fits the content — with every item linked back to the original post.

## What it does

1. **Connect & pull** your own bookmarks from X (`bookmarks`) and Reddit (`saved`) via OpenCLI, running in your logged-in browser — no API keys, no scraping of anyone else's data.
2. **Understand** them: normalize into a unified schema, complete missing content (Reddit post bodies + top comments), and embed each item.
3. **Transform** them: type any topic → ReCollect retrieves the relevant saves and GPT-5.6 rebuilds them into a structured, grounded result.

## How GPT-5.6 is used

GPT-5.6 is the runtime brain, via the Responses API with structured outputs:

- **Content-adaptive formatting** — GPT-5.6 first decides what the retrieved saves *should* become (e.g. "Study Path", "Curated Collection", "Comparison") instead of forcing one output type. Learning content becomes a study path; hobby/lifestyle saves become a curated collection to revisit.
- **Grounded synthesis** — it groups the saves by sub-topic and writes, for each, a one-line "why", a priority, and a source link.
- **No hallucinated sources** — the structured schema + a runtime check constrain every `sourceUrl` to the actual retrieved items, so GPT-5.6 cannot cite anything that isn't a real save.
- Embeddings use `text-embedding-3-small`; retrieval is free-text topic → cosine similarity in JS.

## How Codex accelerated the build

Codex built essentially the entire project and was the primary development tool throughout:

- Scaffolded the Next.js + TypeScript + Tailwind app and the SQLite layer.
- Wrote the OpenCLI **collectors** (X + Reddit), the **content-completion** step (including an automatic fallback to `opencli reddit read` when Reddit's public `.json` returns 403), and the **normalization** pipeline.
- Built the **embeddings + retrieval** and the **content-adaptive transformer**.
- Built the full UI: the bookmark-graveyard view, topic input, adaptive output panel with source links and export, the Sync button, and the first-run onboarding.
- Implemented **sync with add/delete reconciliation** (soft-delete) and **diagnosed/fixed** a primary-key upsert bug during syncing.

## Tech stack

- **Frontend/Backend:** Next.js (App Router) + TypeScript + Tailwind CSS, Next.js API routes
- **DB:** SQLite (`better-sqlite3`), local single-user
- **Data source:** OpenCLI (logged-in browser bridge) for X + Reddit
- **AI:** OpenAI SDK — `gpt-5.6` (Responses API, structured output) + `text-embedding-3-small`

---

## Setup

**Prerequisites**
- Node.js ≥ 20
- [OpenCLI](https://github.com/jackwener/OpenCLI): `npm install -g @jackwener/opencli`, plus the OpenCLI Browser Bridge Chrome extension, signed in to X and Reddit in that browser
- An OpenAI API key with access to `gpt-5.6` and embeddings

**Configure** — create `.env.local` in the project root:
```
OPENAI_API_KEY=your_key_here
OPENAI_CHAT_MODEL=gpt-5.6
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

**Install & run**
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Using it

1. On first run (empty database) the app shows a **Connect & pull my saves** button — click it to pull your X + Reddit bookmarks via OpenCLI.
2. Once your saves load into the "bookmark graveyard", type any topic (e.g. `AI agents`) and click **Build it**.
3. Use **Sync** any time to pull new saves and drop ones you've un-saved.

## Sample data (for evaluation without your own accounts)

A sample dataset is included at `data/seed/sample_items.json` so graders can run ReCollect without setting up OpenCLI or their own logged-in accounts:
```bash
npm run seed     # loads the sample saves into the local database
npm run dev
```
Then try topics like `AI agents` or `journaling` to see the adaptive output.

> ⚠️ Author note: confirm `data/seed/sample_items.json` and the `npm run seed` script are committed to the repo. The hackathon requires the README to describe sample data and how to run it — if the seed/script isn't in the repo yet, add a small committed sample dataset (a few dozen items with real titles, URLs, and content) and a `seed` script before submitting.

## Codex Session ID

Core functionality (the collectors, pipeline, and adaptive transformer) was built in Codex. Session ID: `<paste your /status session ID here>`

## License

MIT
