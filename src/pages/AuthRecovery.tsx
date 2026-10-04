import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCustomDomainHostname, getPlatformHomeUrl } from "@/saas/publicRouting";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/staff/login";
  return value;
}

export default function AuthRecovery() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = useMemo(() => safeNext(params.get("next")), [params]);
  const [mode, setMode] = useState<"request" | "update">(
    params.get("mode") === "update" ? "update" : "request",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session && params.get("mode") === "update") {
        setMode("update");
        setHasRecoverySession(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || (session && params.get("mode") === "update")) {
        setMode("update");
        setHasRecoverySession(true);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [params]);

  const requestReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setError("Password recovery is unavailable.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const recoveryOrigin = getCustomDomainHostname() ? getPlatformHomeUrl() : window.location.origin;
      const redirectTo = `${recoveryOrigin}/auth/reset-password?mode=update&next=${encodeURIComponent(next)}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
      if (resetError) throw resetError;
      setMessage("If an account exists for that email, a password-reset link has been sent. Check your inbox and spam folder.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request a password reset.");
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Password updated successfully.");
      window.setTimeout(() => navigate(next, { replace: true }), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update your password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4 py-10 text-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-5 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white">
            <KeyRound size={23} />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Secure account recovery</p>
          <h1 className="mt-2 text-3xl font-bold">{mode === "update" ? "Choose a new password" : "Reset your password"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {mode === "update"
              ? "Set a new password for the account linked to this recovery session."
              : "Enter your account email. For privacy, LunaDent does not reveal whether an email is registered."}
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-7 shadow-sm">
          {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {message && (
            <div className="mb-4 flex gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> {message}
            </div>
          )}

          {mode === "request" ? (
            <form onSubmit={requestReset}>
              <label className="text-xs font-semibold">Account email</label>
              <div className="relative mt-1.5">
                <Mail size={15} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border py-3 pl-9 pr-3"
                  placeholder="name@example.com"
                />
              </div>
              <button disabled={saving} className="mt-5 w-full rounded-xl bg-slate-950 py-3 font-semibold text-white disabled:opacity-50">
                {saving ? "Sending…" : "Send reset link"}
              </button>
            </form>
          ) : !hasRecoverySession ? (
            <div className="text-center">
              <ShieldCheck size={32} className="mx-auto text-slate-400" />
              <h2 className="mt-4 font-bold">Recovery link required</h2>
              <p className="mt-2 text-sm text-slate-500">Open the newest password-reset link from your email. Recovery links expire and older links may no longer work.</p>
              <button type="button" onClick={() => setMode("request")} className="mt-5 rounded-xl border px-4 py-2.5 text-sm font-semibold">
                Request a new link
              </button>
            </div>
          ) : (
            <form onSubmit={updatePassword}>
              <label className="text-xs font-semibold">New password
                <input
                  required
                  minLength={8}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1.5 mb-4 w-full rounded-xl border px-3 py-3"
                />
              </label>
              <label className="text-xs font-semibold">Confirm new password
                <input
                  required
                  minLength={8}
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border px-3 py-3"
                />
              </label>
              <button disabled={saving} className="mt-5 w-full rounded-xl bg-slate-950 py-3 font-semibold text-white disabled:opacity-50">
                {saving ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-4 flex justify-center gap-4 text-xs text-slate-500">
          <Link to="/staff/login">Staff sign in</Link>
          <Link to="/">LunaDent home</Link>
        </div>
      </div>
    </div>
  );
}
