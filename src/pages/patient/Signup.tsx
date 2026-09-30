import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CheckCircle2, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { clinicRepository } from "@/clinic/repository";

const cardStyle = { background: "var(--card)", borderColor: "var(--border)" };
const muted = { color: "var(--muted-foreground)" };

export function PatientSignup() {
  const { user, role, signUpPatient } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (user && role === "patient") return <Navigate to="/patient-portal/complete-profile" replace />;
  if (user && role && role !== "patient") return <Navigate to="/admin" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUpPatient({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      });

      if (result.needsEmailConfirmation) {
        setMessage("Account created. Check your email and confirm your address, then return to LunaDent to finish your patient profile.");
      } else {
        navigate("/patient-portal/complete-profile", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your patient account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-lg">
        <div className="mb-5 text-center">
          <div className="w-14 h-14 rounded-2xl grid place-items-center text-white mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            <UserRound size={24} />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>
            Create Patient Account
          </h1>
          <p className="text-sm mt-2" style={muted}>
            Create your secure LunaDent profile to access appointments, treatment plans, invoices, payments, and documents.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-3xl border p-7 shadow-sm" style={cardStyle}>
          {error && <div className="mb-4 rounded-xl px-3 py-2 text-sm bg-red-50 text-red-700">{error}</div>}
          {message && <div className="mb-4 rounded-xl px-3 py-3 text-sm bg-emerald-50 text-emerald-800 flex gap-2">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />{message}
          </div>}

          {!message && <>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-xs font-semibold">First name
                <input required value={form.firstName} onChange={(e)=>setForm({...form,firstName:e.target.value})}
                  autoComplete="given-name" className="mt-1.5 mb-4 w-full px-3 py-3 rounded-xl border bg-transparent text-sm" />
              </label>
              <label className="text-xs font-semibold">Last name
                <input required value={form.lastName} onChange={(e)=>setForm({...form,lastName:e.target.value})}
                  autoComplete="family-name" className="mt-1.5 mb-4 w-full px-3 py-3 rounded-xl border bg-transparent text-sm" />
              </label>
            </div>

            <label className="text-xs font-semibold block">Email</label>
            <div className="relative mb-4 mt-1.5">
              <Mail size={15} className="absolute left-3 top-3.5 opacity-50" />
              <input required type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}
                autoComplete="email" className="w-full pl-9 pr-3 py-3 rounded-xl border bg-transparent text-sm" />
            </div>

            <label className="text-xs font-semibold block">Phone</label>
            <div className="relative mb-4 mt-1.5">
              <Phone size={15} className="absolute left-3 top-3.5 opacity-50" />
              <input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}
                autoComplete="tel" className="w-full pl-9 pr-3 py-3 rounded-xl border bg-transparent text-sm" />
            </div>

            <label className="text-xs font-semibold block">Password</label>
            <div className="relative mb-4 mt-1.5">
              <LockKeyhole size={15} className="absolute left-3 top-3.5 opacity-50" />
              <input required minLength={8} type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}
                autoComplete="new-password" className="w-full pl-9 pr-3 py-3 rounded-xl border bg-transparent text-sm" />
            </div>

            <label className="text-xs font-semibold block">Confirm password</label>
            <div className="relative mb-5 mt-1.5">
              <LockKeyhole size={15} className="absolute left-3 top-3.5 opacity-50" />
              <input required minLength={8} type="password" value={form.confirmPassword} onChange={(e)=>setForm({...form,confirmPassword:e.target.value})}
                autoComplete="new-password" className="w-full pl-9 pr-3 py-3 rounded-xl border bg-transparent text-sm" />
            </div>

            <button disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ background: "var(--primary)", color: "white" }}>
              {loading ? "Creating account..." : "Create Patient Account"}
            </button>
          </>}

          <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs mb-2" style={muted}>Already have a patient account?</p>
            <Link to="/patient-portal/login" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Sign In to Patient Portal
            </Link>
          </div>
        </form>

        <div className="flex justify-center gap-4 mt-4 text-xs">
          <Link to="/staff/login" style={muted}>Staff Sign In</Link>
          <Link to="/" style={muted}>Back to Website</Link>
        </div>
      </div>
    </div>
  );
}

export function CompletePatientProfile() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    sex: "" as "" | "male" | "female" | "other",
    address: "",
  });
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || role !== "patient") {
      setChecking(false);
      return;
    }

    setForm((current) => ({
      ...current,
      first_name: String(user.user_metadata?.first_name || "").trim(),
      last_name: String(user.user_metadata?.last_name || "").trim(),
      phone: String(user.user_metadata?.phone || "").trim(),
    }));

    let active = true;
    void clinicRepository.getPatientByAuthUserId(user.id)
      .then((patient) => {
        if (!active) return;
        if (patient) navigate("/patient-portal", { replace: true });
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to check your patient profile.");
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => { active = false; };
  }, [user, role, navigate]);

  if (authLoading || checking) {
    return <div className="min-h-screen grid place-items-center" style={{ background:"var(--background)", color:"var(--muted-foreground)" }}>
      Preparing your patient profile...
    </div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center px-4" style={{ background:"var(--background)" }}>
        <div className="max-w-md text-center rounded-3xl border p-7" style={cardStyle}>
          <Mail size={34} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold" style={{ color:"var(--primary)", fontFamily:"'Cormorant Garamond', serif" }}>Confirm your email first</h1>
          <p className="text-sm mt-2 mb-6" style={muted}>After confirming your email, sign in to finish creating your patient profile.</p>
          <Link to="/patient-portal/login" className="block py-3 rounded-xl font-semibold text-sm" style={{ background:"var(--primary)", color:"white" }}>
            Go to Patient Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (role !== "patient") return <Navigate to="/admin" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await clinicRepository.createMyPatientProfile({
        ...form,
        email: user.email || "",
      });
      navigate("/patient-portal", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your patient profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10" style={{ background:"var(--background)" }}>
      <form onSubmit={submit} className="w-full max-w-lg rounded-3xl border p-7 shadow-sm" style={cardStyle}>
        <div className="w-12 h-12 rounded-2xl grid place-items-center text-white mb-4" style={{ background:"var(--primary)" }}>
          <UserRound size={22} />
        </div>
        <h1 className="text-3xl font-bold" style={{ color:"var(--primary)", fontFamily:"'Cormorant Garamond', serif" }}>
          Complete Your Patient Profile
        </h1>
        <p className="text-sm mt-2 mb-6" style={muted}>This information creates your LunaDent patient record and links it securely to {user.email}.</p>

        {error && <div className="mb-4 rounded-xl px-3 py-2 text-sm bg-red-50 text-red-700">{error}</div>}

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs font-semibold">First name
            <input required value={form.first_name} onChange={(e)=>setForm({...form,first_name:e.target.value})}
              className="mt-1.5 mb-4 w-full px-3 py-3 rounded-xl border bg-transparent text-sm" />
          </label>
          <label className="text-xs font-semibold">Last name
            <input required value={form.last_name} onChange={(e)=>setForm({...form,last_name:e.target.value})}
              className="mt-1.5 mb-4 w-full px-3 py-3 rounded-xl border bg-transparent text-sm" />
          </label>
        </div>

        <label className="text-xs font-semibold">Phone
          <input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}
            className="mt-1.5 mb-4 w-full px-3 py-3 rounded-xl border bg-transparent text-sm" />
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs font-semibold">Date of birth
            <input type="date" value={form.date_of_birth} onChange={(e)=>setForm({...form,date_of_birth:e.target.value})}
              className="mt-1.5 mb-4 w-full px-3 py-3 rounded-xl border bg-transparent text-sm" />
          </label>
          <label className="text-xs font-semibold">Sex
            <select value={form.sex} onChange={(e)=>setForm({...form,sex:e.target.value as typeof form.sex})}
              className="mt-1.5 mb-4 w-full px-3 py-3 rounded-xl border bg-transparent text-sm">
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        <label className="text-xs font-semibold">Address
          <textarea value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})}
            className="mt-1.5 mb-5 w-full px-3 py-3 rounded-xl border bg-transparent text-sm min-h-20" />
        </label>

        <button disabled={saving} className="w-full py-3 rounded-xl font-semibold text-sm"
          style={{ background:"var(--primary)", color:"white" }}>
          {saving ? "Creating profile..." : "Finish Patient Profile"}
        </button>

        <button type="button" onClick={()=>void signOut()} className="w-full mt-3 py-2 text-xs underline" style={muted}>
          Sign out
        </button>
      </form>
    </div>
  );
}
