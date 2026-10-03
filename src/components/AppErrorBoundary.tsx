import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error("Unhandled application error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-5 text-slate-950">
        <div className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <AlertTriangle size={26} />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            LunaDent could not finish loading this screen. Your saved clinic data was not changed.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              <RotateCcw size={15} /> Reload
            </button>
            <a href="/" className="rounded-xl border px-5 py-3 text-sm font-semibold">Back to LunaDent</a>
          </div>
        </div>
      </div>
    );
  }
}

export function RouteFallback() {
  return (
    <div className="min-h-[55vh] grid place-items-center bg-slate-50 px-5 text-slate-500">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
        <p className="mt-4 text-sm font-medium">Loading LunaDent…</p>
      </div>
    </div>
  );
}
