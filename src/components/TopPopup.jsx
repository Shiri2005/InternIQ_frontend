import { useEffect } from "react";

export default function TopPopup({ message, type = "info", onClose, autoHideMs = 3500 }) {
  useEffect(() => {
    if (!message || !onClose || !autoHideMs) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onClose();
    }, autoHideMs);

    return () => clearTimeout(timer);
  }, [message, onClose, autoHideMs]);

  if (!message) {
    return null;
  }

  const tones = {
    success: "border-emerald-400/35 bg-emerald-500/15 text-emerald-50",
    error: "border-rose-400/35 bg-rose-500/15 text-rose-50",
    info: "border-cyan-400/35 bg-cyan-500/15 text-cyan-50",
  };

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[70] w-[92%] max-w-2xl -translate-x-1/2">
      <div
        className={`pointer-events-auto flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md ${tones[type] || tones.info}`}
        role="status"
        aria-live="polite"
      >
        <p className="leading-6">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-white/20 px-2 py-0.5 text-xs text-white/85 transition hover:bg-white/10"
        >
          Close
        </button>
      </div>
    </div>
  );
}
