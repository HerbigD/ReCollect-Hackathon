import { SyncToast, type SyncToastMessage } from "@/components/SyncToast";

export function EmptyCollectionWelcome({
  syncing,
  onSync,
  toast,
  onDismissToast,
}: {
  syncing: boolean;
  onSync: () => void;
  toast?: SyncToastMessage;
  onDismissToast: () => void;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f4ee] text-slate-950">
      <div className="pointer-events-none absolute -left-48 top-1/3 size-[32rem] rounded-full bg-emerald-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 -top-48 size-[34rem] rounded-full bg-rose-200/30 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 py-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-slate-900/10 pb-5">
          <a className="flex items-center gap-2 text-xl font-black tracking-[-0.04em]" href="/">
            <span className="grid size-8 place-items-center rounded-xl bg-slate-950 text-sm text-emerald-300">R</span>
            ReCollect
          </a>
          <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm">
            Stop saving, start using.
          </span>
        </header>

        <section className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-500" />
              Your saves, finally useful
            </div>
            <h1 className="mt-6 text-5xl font-black leading-[0.94] tracking-[-0.065em] sm:text-6xl lg:text-[4.45rem]">
              Turn the saves you never revisit into something you’ll <span className="text-emerald-700">actually use.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Connect X and Reddit once. ReCollect gathers the ideas you saved, then melts them into grounded, source-linked results.
            </p>

            <div className="mt-7">
              <button
                type="button"
                onClick={onSync}
                disabled={syncing}
                className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-slate-950 px-7 text-sm font-black text-white shadow-2xl shadow-slate-400/40 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-wait disabled:translate-y-0 disabled:bg-slate-700 sm:w-auto sm:text-base"
              >
                <span className={syncing ? "motion-safe:animate-spin" : ""}>{syncing ? "↻" : "→"}</span>
                {syncing ? "Pulling your saves…" : "Connect & pull my saves"}
              </button>
              <p className="mt-4 max-w-xl text-xs leading-5 text-slate-500">
                Requires OpenCLI + the browser extension, with X and Reddit already signed in.
              </p>
            </div>

            {syncing && (
              <div role="status" className="mt-7 max-w-xl rounded-2xl border border-emerald-200 bg-white/80 p-4 shadow-lg shadow-emerald-100/60 backdrop-blur">
                <div className="flex items-center justify-between gap-4 text-sm font-bold text-slate-700">
                  <span>Pulling your saves…</span>
                  <span className="text-xs font-semibold text-slate-400">X + Reddit</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-2/3 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">Keeping your existing browser session open. Content completion can take a few minutes.</p>
              </div>
            )}
          </div>

          <div className="relative mx-auto w-full max-w-xl" aria-hidden="true">
            <div className="absolute inset-8 rounded-[3rem] bg-emerald-300/25 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2.2rem] border border-white/80 bg-slate-950 p-5 text-white shadow-[0_35px_90px_rgba(15,23,42,0.24)] sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">Before → after</p>
                  <p className="mt-2 text-lg font-black">Scattered saves, shaped.</p>
                </div>
                <span className="grid size-10 place-items-center rounded-2xl bg-emerald-400 font-black text-slate-950">✦</span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-300"><span className="grid size-6 place-items-center rounded-full bg-white text-[10px] text-slate-950">X</span> Bookmarks</div>
                  <div className="mt-5 space-y-2"><span className="block h-2 w-full rounded-full bg-white/15" /><span className="block h-2 w-4/5 rounded-full bg-white/10" /><span className="block h-2 w-2/3 rounded-full bg-white/10" /></div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-300"><span className="grid size-6 place-items-center rounded-full bg-orange-500 text-[10px] text-white">r/</span> Reddit saved</div>
                  <div className="mt-5 space-y-2"><span className="block h-2 w-5/6 rounded-full bg-white/15" /><span className="block h-2 w-full rounded-full bg-white/10" /><span className="block h-2 w-3/5 rounded-full bg-white/10" /></div>
                </div>
              </div>

              <div className="my-5 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                <span className="h-px flex-1 bg-white/10" /> ReCollect melts them <span className="h-px flex-1 bg-white/10" />
              </div>

              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">Your finished result</p>
                  <span className="rounded-full bg-emerald-300 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-950">Ready to use</span>
                </div>
                <div className="mt-5 space-y-3">
                  {["Find the strongest connections", "Shape them into useful groups", "Revisit what matters"].map((label, index) => (
                    <div key={label} className="flex items-center gap-3 rounded-xl bg-slate-950/35 p-3 text-xs font-bold text-slate-200">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-emerald-300/30 text-[10px] text-emerald-300">{index + 1}</span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <SyncToast toast={toast} onDismiss={onDismissToast} />
    </main>
  );
}
