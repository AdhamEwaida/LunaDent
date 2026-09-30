import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, LockKeyhole, Mail, UserPlus } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

export default function StaffLogin() {
  const { user, role, mustChangePassword, signIn, signUp, claimInitialAdmin, demoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [bootstrapCode, setBootstrapCode] = useState("");
  const [setupMode, setSetupMode] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (user && role && role !== "patient") {
    if (mustChangePassword) return <Navigate to="/staff/change-password" replace />;
    return <Navigate to="/admin" replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      if (setupMode && !demoMode) {
        if (!bootstrapCode.trim()) throw new Error("Bootstrap code is required for the first administrator.");
        if (!user) {
          const result = await signUp(email, password, fullName);
          if (result.needsEmailConfirmation) {
            setMessage("Account created. Confirm your email, then return here, sign in, and use the same bootstrap code to claim the first administrator account.");
            return;
          }
        }
        await claimInitialAdmin(bootstrapCode.trim());
      } else {
        await signIn(email, password);
      }
      const destination = (location.state as { from?: string } | null)?.from || "/admin";
      navigate(destination, { replace: true });
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to continue."); }
    finally { setLoading(false); }
  };

  const claimForSignedInPatient = async () => {
    setLoading(true); setError("");
    try { await claimInitialAdmin(bootstrapCode.trim()); navigate("/admin", { replace: true }); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to claim administrator access."); }
    finally { setLoading(false); }
  };

  return <div className="min-h-screen grid place-items-center px-4" style={{ background: "var(--background)" }}>
    <form onSubmit={submit} className="w-full max-w-md rounded-3xl border p-7 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="w-12 h-12 rounded-2xl grid place-items-center text-white mb-4" style={{ background: "var(--primary)" }}><LockKeyhole size={22} /></div>
      <h1 className="text-2xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>{setupMode ? "LunaDent First Admin Setup" : "LunaDent Staff Login"}</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: "var(--muted-foreground)" }}>{setupMode ? "Create the one-time first administrator securely." : "Secure access for clinic staff."}</p>
      {error && <div className="mb-4 rounded-xl px-3 py-2 text-sm bg-red-50 text-red-700">{error}</div>}
      {message && <div className="mb-4 rounded-xl px-3 py-2 text-sm bg-emerald-50 text-emerald-800">{message}</div>}
      {setupMode && !user && <><label className="text-xs font-semibold block mb-1">Full name</label><div className="relative mb-4"><UserPlus size={15} className="absolute left-3 top-3.5 opacity-50" /><input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl border bg-transparent" /></div></>}
      {!user && <><label className="text-xs font-semibold block mb-1">Email</label><div className="relative mb-4"><Mail size={15} className="absolute left-3 top-3.5 opacity-50" /><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full pl-9 pr-3 py-3 rounded-xl border bg-transparent" /></div><label className="text-xs font-semibold block mb-1">Password</label><div className="relative mb-5"><LockKeyhole size={15} className="absolute left-3 top-3.5 opacity-50" /><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} required className="w-full pl-9 pr-3 py-3 rounded-xl border bg-transparent" /></div></>}
      {setupMode && <><label className="text-xs font-semibold block mb-1">One-time bootstrap code</label><div className="relative mb-5"><KeyRound size={15} className="absolute left-3 top-3.5 opacity-50" /><input value={bootstrapCode} onChange={(e) => setBootstrapCode(e.target.value)} required className="w-full pl-9 pr-3 py-3 rounded-xl border bg-transparent font-mono" /></div></>}
      {user && role === "patient" && setupMode ? <button type="button" onClick={claimForSignedInPatient} disabled={loading || !bootstrapCode.trim()} className="w-full py-3 rounded-xl font-semibold text-sm" style={{ background: "var(--primary)", color: "white" }}>{loading ? "Claiming..." : "Claim First Admin"}</button> : <button disabled={loading} className="w-full py-3 rounded-xl font-semibold text-sm" style={{ background: "var(--primary)", color: "white" }}>{loading ? "Working..." : setupMode ? "Create First Admin" : "Sign In"}</button>}
      <button type="button" onClick={() => { setSetupMode(!setupMode); setError(""); setMessage(""); }} className="w-full mt-3 py-2 text-xs underline" style={{ color: "var(--muted-foreground)" }}>{setupMode ? "Back to normal staff login" : "First deployment? Set up the first administrator"}</button>
    </form>
  </div>;
}
