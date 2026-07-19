import type { CollectionPreview } from "@/components/uiTypes";
import { PlatformMark } from "@/components/PlatformMark";

export function CollectionCard({ item, index }: { item: CollectionPreview; index: number }) {
  const tone = item.platform === "twitter"
    ? "from-sky-50 to-slate-100"
    : "from-orange-50 to-amber-100";
  const isBareTwitterLink = item.platform === "twitter"
    && /^(?:https?:\/\/)?t\.co\/\S+$/i.test(item.title.trim());

  return (
    <article className="group overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/70">
      {item.thumbnail ? (
        <div className={`relative aspect-[16/9] overflow-hidden bg-gradient-to-br ${tone}`}>
          {/* Remote bookmark thumbnails intentionally use their original URLs. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbnail}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading={index < 8 ? "eager" : "lazy"}
            onError={(event) => { event.currentTarget.style.display = "none"; }}
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/35 to-transparent" />
        </div>
      ) : (
        <div className={`grid h-20 place-items-center bg-gradient-to-br ${tone}`}>
          <span className="text-3xl font-black text-slate-900/10">{String(index + 1).padStart(2, "0")}</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between gap-3 text-slate-500">
          <PlatformMark platform={item.platform} />
          <span className="text-[10px] font-medium tabular-nums text-slate-400">SAVE {String(index + 1).padStart(2, "0")}</span>
        </div>
        {isBareTwitterLink ? (
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">Saved X post</p>
            <h3 className="mt-2 truncate text-[15px] font-bold leading-5 tracking-[-0.01em] text-slate-900">{item.author ?? "X post"}</h3>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
            >
              View post ↗
            </a>
          </div>
        ) : (
          <>
            <h3 className="mt-3 line-clamp-3 text-[15px] font-bold leading-5 tracking-[-0.01em] text-slate-900">{item.title}</h3>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="min-w-0 truncate text-xs text-slate-500">{item.author ?? "Saved post"}</p>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-xs font-bold text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-emerald-700"
              >
                Source ↗
              </a>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
