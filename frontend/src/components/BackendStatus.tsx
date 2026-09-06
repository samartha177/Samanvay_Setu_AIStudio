import { usePlatform } from "../contexts/PlatformContext";

export function BackendStatus() {
  const { data, loading, isGatewayOnline, isDemoMode, retry } = usePlatform();

  if (loading) return <span className="text-xs text-slate-500">Connecting to gateway…</span>;

  if (isGatewayOnline) {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Gateway online · {data?.environment}
      </span>
    );
  }

  // Demo / Local simulation mode when live gateway is offline
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200"
        title="Live FastAPI gateway is unreachable in this preview container."
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Gateway offline
      </span>
      {isDemoMode && (
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200"
          title="Local deterministic demo adapter active for SAMANVAYSETU."
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Demo Mode (Local Simulation)
        </span>
      )}
      <button
        type="button"
        onClick={() => void retry()}
        className="text-xs text-slate-400 hover:text-navy underline transition"
        title="Retry connection to live FastAPI gateway"
      >
        Retry
      </button>
    </div>
  );
}
