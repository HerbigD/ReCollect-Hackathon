"use client";

import { useMemo, useState } from "react";
import { PlatformMark } from "@/components/PlatformMark";
import type { TransformResponse } from "@/components/uiTypes";

const priorityStyles = {
  high: "border-rose-300/30 bg-rose-400/15 text-rose-200",
  medium: "border-amber-300/30 bg-amber-300/15 text-amber-100",
  low: "border-sky-300/30 bg-sky-300/15 text-sky-100",
};

const priorityLabels = { high: "High", medium: "Med", low: "Low" };

function toMarkdown(data: TransformResponse) {
  const lines = [`# ${data.result.title}`, "", data.result.summary ?? "", ""];
  for (const section of data.result.sections) {
    lines.push(`## ${section.heading}`, "");
    for (const item of section.items) {
      lines.push(`- **${item.title}** · ${priorityLabels[item.priority]} priority`);
      lines.push(`  ${item.why}`);
      lines.push(`  [Open source](${item.sourceUrl})`, "");
    }
  }
  return lines.join("\n");
}

export function OutputPanel({ data, totalSaves }: { data: TransformResponse; totalSaves: number }) {
  const [copied, setCopied] = useState(false);
  const formatLabel = (data.result.format?.trim() || "COLLECTION").toUpperCase();
  const platformByUrl = useMemo(() => new Map(data.retrieved.map((item) => [item.url, item.platform])), [data.retrieved]);
  const usedSourceCount = useMemo(() => new Set(data.result.sections.flatMap((section) => section.items.map((item) => item.sourceUrl))).size, [data.result.sections]);

  async function copyMarkdown() {
    await navigator.clipboard.writeText(toMarkdown(data));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadMarkdown() {
    const blob = new Blob([toMarkdown(data)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `recollect-${data.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "collection"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[#0b1220] text-white shadow-2xl shadow-slate-300/60 sm:rounded-[2.5rem]">
      <div className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative border-b border-white/10 px-6 py-7 sm:px-10 sm:py-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
              <span className="grid size-7 place-items-center rounded-full bg-emerald-300 text-sm text-slate-950">★</span>
              {formatLabel}
            </div>
            <h2 className="mt-6 max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">{data.result.title}</h2>
            {data.result.summary && <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">{data.result.summary}</p>}
            <p className="mt-5 text-sm font-medium text-slate-400">
              Built from {usedSourceCount} of your {totalSaves} saves across X and Reddit.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={copyMarkdown} className="rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15">
              {copied ? "Copied ✓" : "Copy markdown"}
            </button>
            <button onClick={downloadMarkdown} className="rounded-full bg-emerald-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-200">
              Download ↓
            </button>
          </div>
        </div>
      </div>

      <div className="relative space-y-5 p-4 sm:p-8">
        {data.result.sections.map((section, sectionIndex) => (
          <article key={`${section.heading}-${sectionIndex}`} className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 text-sm font-black text-emerald-200">{sectionIndex + 1}</span>
              <h3 className="pt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">{section.heading}</h3>
            </div>
            <div className="mt-6 divide-y divide-white/10">
              {section.items.map((item, itemIndex) => {
                const platform = platformByUrl.get(item.sourceUrl) ?? "twitter";
                return (
                  <div key={`${item.sourceUrl}-${itemIndex}`} className="grid gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:gap-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <PlatformMark platform={platform} compact />
                        <h4 className="text-base font-bold leading-6 text-white sm:text-lg">{item.title}</h4>
                      </div>
                      <p className="mt-2 pl-0 text-sm leading-6 text-slate-300 sm:pl-8 sm:text-[15px]">{item.why}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:justify-center">
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${priorityStyles[item.priority]}`}>
                        {priorityLabels[item.priority]}
                      </span>
                      <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-400 underline decoration-slate-600 underline-offset-4 transition hover:text-emerald-300">
                        Open source ↗
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
