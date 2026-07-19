export interface SyncToastMessage {
  kind: "success" | "error";
  message: string;
}

export function SyncToast({
  toast,
  onDismiss,
}: {
  toast?: SyncToastMessage;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`fixed right-4 top-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold shadow-2xl backdrop-blur sm:right-8 sm:top-6 ${
        toast.kind === "success"
          ? "border-emerald-200 bg-emerald-950/95 text-emerald-50 shadow-emerald-950/20"
          : "border-rose-200 bg-rose-950/95 text-rose-50 shadow-rose-950/20"
      }`}
    >
      <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${toast.kind === "success" ? "bg-emerald-400 text-emerald-950" : "bg-rose-400 text-rose-950"}`}>
        {toast.kind === "success" ? "✓" : "!"}
      </span>
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-1 text-lg leading-none opacity-60 transition hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
