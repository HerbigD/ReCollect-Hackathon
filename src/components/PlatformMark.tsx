import type { Platform } from "@/types";

export function PlatformMark({ platform, compact = false }: { platform: Platform; compact?: boolean }) {
  const label = platform === "twitter" ? "X" : platform === "reddit" ? "Reddit" : "YouTube";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 font-semibold ${compact ? "text-xs" : "text-[11px] uppercase tracking-[0.12em]"}`}
      title={label}
    >
      <span className={`grid place-items-center rounded-full ${platform === "twitter" ? "bg-slate-950 text-white" : platform === "reddit" ? "bg-orange-500 text-white" : "bg-red-600 text-white"} ${compact ? "size-6 text-[10px]" : "size-5 text-[9px]"}`}>
        {platform === "twitter" ? "X" : platform === "reddit" ? "r/" : "▶"}
      </span>
      {!compact && <span>{label}</span>}
    </span>
  );
}
