# ReCollect

**Stop saving, start using.**

ReCollect turns scattered X, Reddit, and YouTube saves into useful, grounded artifacts. The initial scaffold includes a Next.js App Router UI and a local SQLite database; collectors and GPT-5.6-powered transformations will be added next.

## Run locally

1. Copy `.env.example` to `.env` and set `OPENAI_API_KEY` when AI features are added.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev` and open [http://localhost:3000](http://localhost:3000).

Visit [http://localhost:3000/api/health](http://localhost:3000/api/health) to verify the server and SQLite connection. The database defaults to `data/recollect.db`; set `DATABASE_PATH` to another filename when needed.
