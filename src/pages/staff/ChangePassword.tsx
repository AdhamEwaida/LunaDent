import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, LockKeyhole } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

export default function StaffChangePassword() {
  const { user, role, mustChangePassword, changePassword, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return <Navigate to="/staff/login" replace />;
  if (!mustChangePassword) return <Navigate to="/admin" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await changePassword(password);
      const destination = (location.state as { from?: string } | null)?.from || "/admin";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4" style={{ background: "var(--background)" }}>
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border p-7 shadow-sm"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="w-12 h-12 rounded-2xl grid place-items-center text-white mb-4"
          style={{ background: "var(--primary)" }}><KeyRound size={22} /></div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>
          Change Temporary Password
        </h1>
        <p className="text-sm mt-1 mb-6" style={{ color: "var(--muted-foreground)" }}>
          Your clinic account requires a private password before you can access the workspace.
        </p>
        <div className="mb-5 rounded-xl px-3 py-2 text-xs" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
          Signed in as <strong>{user.email}</strong>{role ? ` · ${role}` : ""}
        </div>
        {error && <div className="mb-4 rounded-xl px-3 py-2 text-sm bg-red-50 text-red-700">{error}</div>}
        <label className="text-xs font-semibold block mb-1">New password</label>
        <div className="relative mb-4">
          <LockKeyhole size={15} className="absolute left-3 top-3.5 opacity-50" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} required
            className="w-full pl-9 pr-3 py-3 rounded-xl border bg-transparent" autoComplete="new-password" />
        </div>
        <label className="text-xs font-semibold block mb-1">Confirm new password</label>
        <div className="relative mb-5">
          <LockKeyhole size={15} className="absolute left-3 top-3.5 opacity-50" />
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" minLength={8} required
            className="w-full pl-9 pr-3 py-3 rounded-xl border bg-transparent" autoComplete="new-password" />
        </div>
        <button disabled={loading} className="w-full py-3 rounded-xl font-semibold text-sm"
          style={{ background: "var(--primary)", color: "white" }}>
          {loading ? "Updating..." : "Set Private Password"}
        </button>
        <button type="button" onClick={() => void signOut().then(() => navigate("/staff/login", { replace: true }))}
          className="w-full mt-3 py-2 text-xs underline" style={{ color: "var(--muted-foreground)" }}>
          Sign out
        </button>
      </form>
    </div>
  );
}
