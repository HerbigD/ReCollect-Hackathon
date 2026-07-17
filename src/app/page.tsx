const sources = ["X bookmarks", "Reddit saved", "YouTube playlists"];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-stone-50 text-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-7 sm:px-10">
        <header className="flex items-center justify-between">
          <a className="text-xl font-black tracking-tight" href="/">ReCollect</a>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            Stop saving, start using.
          </span>
        </header>

        <section className="grid min-h-[calc(100vh-120px)] items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Your saved ideas, remade</p>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.96] tracking-[-0.055em] sm:text-7xl">
              Make your saved links useful again.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
              ReCollect turns the things you meant to revisit into a grounded study path, menu, or itinerary — always linked back to the original save.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {sources.map((source) => (
                <span key={source} className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-950">{source}</span>
              ))}
            </div>
          </div>

          <div className="relative rounded-[2rem] bg-slate-950 p-6 shadow-2xl shadow-slate-300 sm:p-8">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>STUDY PATH</span><span>Draft</span>
            </div>
            <h2 className="mt-8 text-3xl font-bold tracking-tight text-white">AI Agents: from concepts to building</h2>
            <p className="mt-3 leading-6 text-slate-300">A focused route through the saves you already collected.</p>
            <ol className="mt-8 space-y-3">
              {["Start with core mental models", "Understand practical tool use", "Build a small agent loop"].map((item, index) => (
                <li key={item} className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 text-white">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lime-300 text-sm font-bold text-slate-950">{index + 1}</span>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 rounded-2xl bg-lime-300 px-5 py-4 text-sm font-semibold text-slate-950">Coming next: collect, cluster, and transform your saves.</div>
          </div>
        </section>
      </div>
    </main>
  );
}
