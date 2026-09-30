import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, ShieldCheck, Stethoscope } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

export default function StaffLogin() {
  const { user, role, isSuperAdmin, mustChangePassword, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user && isSuperAdmin) {
    if (mustChangePassword) return <Navigate to="/staff/change-password" replace />;
    return <Navigate to="/super-admin" replace />;
  }

  if (user && role && role !== "patient") {
    if (mustChangePassword) return <Navigate to="/staff/change-password" replace />;
    return <Navigate to="/admin" replace />;
  }

  if (user && role === "patient") {
    return (
      <div className="min-h-screen grid place-items-center px-4" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-md rounded-3xl border p-7 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="w-12 h-12 rounded-2xl grid place-items-center text-white mb-4" style={{ background: "var(--primary)" }}>
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>
            You are signed in as a patient
          </h1>
          <p className="text-sm mt-2 mb-6" style={{ color: "var(--muted-foreground)" }}>
            This page is for clinic staff accounts only.
          </p>
          <Link to="/patient-portal" className="block w-full text-center py-3 rounded-xl text-sm font-semibold"
            style={{ background: "var(--primary)", color: "white" }}>
            Open Patient Portal
          </Link>
          <button type="button" onClick={() => void signOut()} className="w-full mt-3 py-2 text-sm underline"
            style={{ color: "var(--muted-foreground)" }}>
            Sign out and use a staff account
          </button>
        </div>
      </div>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signIn(email.trim(), password);
      const destination = (location.state as { from?: string } | null)?.from || "/admin";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md">
        <div className="mb-5 text-center">
          <div className="w-14 h-14 rounded-2xl grid place-items-center text-white mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            <Stethoscope size={24} />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>
            Staff Sign In
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
            For LunaDent employees only. Staff accounts are created by the clinic administrator.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-3xl border p-7 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {error && <div className="mb-4 rounded-xl px-3 py-2 text-sm bg-red-50 text-red-700">{error}</div>}

          <label className="text-xs font-semibold block mb-1">Work email</label>
          <div className="relative mb-4">
            <Mail size={15} className="absolute left-3 top-3.5 opacity-50" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
              placeholder="name@clinic.com"
              className="w-full pl-9 pr-3 py-3 rounded-xl border bg-transparent"
            />
          </div>

          <label className="text-xs font-semibold block mb-1">Password</label>
          <div className="relative mb-5">
            <LockKeyhole size={15} className="absolute left-3 top-3.5 opacity-50" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
              className="w-full pl-9 pr-3 py-3 rounded-xl border bg-transparent"
            />
          </div>

          <button disabled={loading} className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: "var(--primary)", color: "white" }}>
            {loading ? "Signing in..." : "Sign In to Staff Workspace"}
          </button>

          <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>Are you a patient?</p>
            <Link to="/patient-portal/login" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Go to Patient Sign In
            </Link>
          </div>
        </form>

        <Link to="/" className="block text-center text-xs mt-4" style={{ color: "var(--muted-foreground)" }}>
          Back to LunaDent website
        </Link>
      </div>
    </div>
  );
}
