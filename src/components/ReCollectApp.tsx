"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CollectionCard } from "@/components/CollectionCard";
import { OutputPanel } from "@/components/OutputPanel";
import type { CollectionPreview, SyncResponse, TransformResponse } from "@/components/uiTypes";

const suggestions = ["AI agents", "gin & cocktails", "tennis"];

export function ReCollectApp({ items }: { items: CollectionPreview[] }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ kind: "success" | "error"; message: string }>();
  const [error, setError] = useState<string>();
  const [output, setOutput] = useState<TransformResponse>();
  const outputRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const xCount = items.filter((item) => item.platform === "twitter").length;
  const redditCount = items.filter((item) => item.platform === "reddit").length;

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  function showSyncToast(toast: { kind: "success" | "error"; message: string }) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setSyncToast(toast);
    toastTimerRef.current = setTimeout(() => setSyncToast(undefined), 5_000);
  }

  async function syncSaves() {
    if (syncing) return;
    setSyncing(true);

    try {
      const response = await fetch("/api/collect", { method: "POST" });
      const payload = await response.json().catch(() => ({})) as Partial<SyncResponse> & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Sync request failed.");
      if (![payload.added, payload.removed, payload.total].every((value) => typeof value === "number")) {
        throw new Error("Sync returned an unexpected response.");
      }

      router.refresh();
      showSyncToast({
        kind: "success",
        message: `+${payload.added} new · ${payload.removed} removed`,
      });
    } catch {
      showSyncToast({
        kind: "error",
        message: "Sync couldn’t finish. Your existing saves are safe — please try again.",
      });
    } finally {
      setSyncing(false);
    }
  }

  async function generate(event?: FormEvent) {
    event?.preventDefault();
    const cleanTopic = topic.trim();
    if (!cleanTopic || loading) return;
    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: cleanTopic, k: 12, outputLanguage: "English" }),
      });
      const payload = await response.json() as TransformResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not build this Study Path.");
      setOutput(payload);
      window.setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f4ee] text-slate-950">
      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-slate-900/10 pb-5">
          <a className="flex items-center gap-2 text-xl font-black tracking-[-0.04em]" href="/">
            <span className="grid size-8 place-items-center rounded-xl bg-slate-950 text-sm text-emerald-300">R</span>
            ReCollect
          </a>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">X · {xCount}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Reddit · {redditCount}</span>
            </div>
            <span className="mr-1 tabular-nums sm:hidden">{items.length} saves</span>
            <button
              type="button"
              onClick={syncSaves}
              disabled={syncing}
              aria-label={syncing ? "Syncing saved items" : "Sync saved items"}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 font-black text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-700 disabled:cursor-wait disabled:border-slate-200 disabled:text-slate-400"
            >
              <span className={syncing ? "motion-safe:animate-spin" : ""}>↻</span>
              {syncing ? "Syncing…" : "Sync"}
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-5xl pb-14 pt-16 text-center sm:pb-20 sm:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
            <span className="size-2 rounded-full bg-rose-400" />
            {items.length} things saved. Zero plans made.
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.065em] sm:text-7xl lg:text-[5.8rem]">
            Your saves deserve a <span className="text-emerald-700">second life.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Tell ReCollect what you want to learn. It melts the scattered posts you already saved into one grounded, source-linked Study Path.
          </p>

          <form onSubmit={generate} className="mx-auto mt-9 max-w-3xl rounded-[1.6rem] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/50 sm:flex sm:rounded-full">
            <label className="sr-only" htmlFor="topic">What do you want to learn?</label>
            <input
              id="topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="What do you want to learn? Try “AI agents”"
              className="h-14 w-full rounded-full bg-transparent px-5 text-base font-medium outline-none placeholder:text-slate-400 sm:h-16 sm:text-lg"
            />
            <button
              type="submit"
              disabled={!topic.trim() || loading}
              className="mt-2 h-14 w-full shrink-0 rounded-full bg-slate-950 px-7 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:mt-0 sm:h-16 sm:w-auto sm:text-base"
            >
              {loading ? "Melting saves…" : "Build my Study Path →"}
            </button>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-slate-500">
            <span className="py-1.5">Try:</span>
            {suggestions.map((suggestion) => (
              <button key={suggestion} onClick={() => setTopic(suggestion)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-emerald-400 hover:text-emerald-700">
                {suggestion}
              </button>
            ))}
          </div>
          {error && <p role="alert" className="mx-auto mt-5 max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
        </section>

        {loading && (
          <section className="mx-auto mb-16 max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-full bg-emerald-100 text-xl motion-safe:animate-pulse">✦</span>
              <div>
                <p className="font-black">Finding the closest saves…</p>
                <p className="mt-1 text-sm text-slate-500">Retrieving by meaning, then shaping a grounded path in English.</p>
              </div>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 rounded-full bg-emerald-400 motion-safe:animate-pulse" /></div>
          </section>
        )}

        {output && (
          <div ref={outputRef} className="scroll-mt-5 pb-20">
            <OutputPanel data={output} totalSaves={items.length} />
          </div>
        )}

        <section className="pb-24">
          <div className="mb-8 flex flex-col gap-5 border-t border-slate-900/10 pt-9 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-500">Before ReCollect</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">The bookmark graveyard.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Too many tabs, half-remembered ideas, and no useful shape. All {items.length} saves are here — messy, mixed, and waiting.</p>
            </div>
            <div className="flex gap-2 text-xs font-bold text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">X · {xCount}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Reddit · {redditCount}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item, index) => <CollectionCard key={item.id} item={item} index={index} />)}
          </div>
        </section>
      </div>

      {syncToast && (
        <div
          role={syncToast.kind === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`fixed right-4 top-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold shadow-2xl backdrop-blur sm:right-8 sm:top-6 ${
            syncToast.kind === "success"
              ? "border-emerald-200 bg-emerald-950/95 text-emerald-50 shadow-emerald-950/20"
              : "border-rose-200 bg-rose-950/95 text-rose-50 shadow-rose-950/20"
          }`}
        >
          <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${syncToast.kind === "success" ? "bg-emerald-400 text-emerald-950" : "bg-rose-400 text-rose-950"}`}>
            {syncToast.kind === "success" ? "✓" : "!"}
          </span>
          <span>{syncToast.message}</span>
          <button
            type="button"
            onClick={() => setSyncToast(undefined)}
            aria-label="Dismiss notification"
            className="ml-1 text-lg leading-none opacity-60 transition hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}
