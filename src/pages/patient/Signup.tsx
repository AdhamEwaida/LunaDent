import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CheckCircle2, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { clinicRepository } from "@/clinic/repository";
import { clinicPublicHref, usePublicClinicSite } from "@/saas/publicRouting";


function useClinicSignupContext() {
  const { clinicSlug, site, loading, error } = usePublicClinicSite();
  return {
    clinicSlug,
    site,
    loadingClinic: loading,
    clinicError: error,
  };
}

export function PatientSignup() {
  const { user, role, isSuperAdmin, signUpPatient } = useAuth();
  const navigate = useNavigate();
  const { clinicSlug, site, loadingClinic, clinicError } = useClinicSignupContext();
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

  if (loadingClinic) return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">Loading clinic...</div>;

  if (!clinicSlug) {
    return (
      <div className="min-h-screen grid place-items-center px-4 bg-slate-50">
        <div className="max-w-md text-center rounded-3xl bg-white border p-8">
          <UserRound size={38} className="mx-auto text-slate-400" />
          <h1 className="text-2xl font-bold mt-4">Open your clinic website first</h1>
          <p className="text-sm text-slate-600 mt-2">Patient accounts belong to a specific clinic. Open the clinic website and choose Patient Sign Up from there.</p>
          <Link to="/" className="inline-block mt-6 px-5 py-3 rounded-xl bg-slate-950 text-white font-semibold">Back to LunaDent</Link>
        </div>
      </div>
    );
  }
  if (!site) return <div className="min-h-screen grid place-items-center bg-slate-50 px-4"><div className="text-center"><h1 className="text-xl font-bold">Clinic unavailable</h1><p className="text-sm text-slate-500 mt-2">{clinicError}</p></div></div>;

  if (user && isSuperAdmin) return <Navigate to="/super-admin" replace />;
  if (user && role && role !== "patient") return <Navigate to="/admin" replace />;
  if (user && role === "patient") return <Navigate to={clinicPublicHref(site, "/patient/complete-profile")} replace />;

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
        clinicSlug,
      });

      if (result.needsEmailConfirmation) {
        setMessage(`Account created for ${site.clinic.name}. Check your email and confirm your address, then continue your patient profile.`);
      } else {
        navigate(clinicPublicHref(site, "/patient/complete-profile"), { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your patient account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10" style={{ background: site.settings.tokens?.colors?.background || "#f8fafc" }}>
      <div className="w-full max-w-lg">
        <div className="mb-5 text-center">
          <div className="w-14 h-14 rounded-2xl grid place-items-center text-white mx-auto mb-4"
            style={{ background: site.settings.tokens?.colors?.primary || "#2457C5" }}>
            <UserRound size={24} />
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{color:site.settings.tokens?.colors?.primary || "#2457C5"}}>{site.clinic.name}</div>
          <h1 className="text-3xl font-bold mt-2">Create Patient Account</h1>
          <p className="text-sm mt-2 text-slate-600">Create your secure patient profile for this clinic.</p>
        </div>

        <form onSubmit={submit} className="rounded-3xl border p-7 shadow-sm bg-white">
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

            <button disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: site.settings.tokens?.colors?.primary || "#2457C5" }}>
              {loading ? "Creating account..." : "Create Patient Account"}
            </button>
          </>}

          <div className="mt-5 pt-5 border-t text-center">
            <p className="text-xs mb-2 text-slate-500">Already have an account?</p>
            <Link to={clinicPublicHref(site, "/patient/login")} className="text-sm font-semibold" style={{ color: site.settings.tokens?.colors?.primary || "#2457C5" }}>
              Sign In to Patient Portal
            </Link>
          </div>
        </form>

        <Link to={clinicPublicHref(site)} className="block text-center text-xs mt-4 text-slate-500">Back to {site.clinic.name}</Link>
      </div>
    </div>
  );
}

export function CompletePatientProfile() {
  const { user, role, isSuperAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { clinicSlug, site, loadingClinic, clinicError } = useClinicSignupContext();
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
    if (!clinicSlug || !site || !user || role !== "patient") {
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
    void clinicRepository.getPatientByAuthUserId(user.id, site.clinic.id)
      .then((patient) => {
        if (!active) return;
        if (patient) navigate(clinicPublicHref(site, "/patient"), { replace: true });
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : "Unable to check your patient profile."))
      .finally(() => active && setChecking(false));

    return () => { active = false; };
  }, [clinicSlug, site, user, role, navigate]);

  if (loadingClinic || authLoading || checking) return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">Preparing patient profile...</div>;
  if (!clinicSlug) return <Navigate to="/" replace />;
  if (!site) return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">{clinicError || "Clinic unavailable."}</div>;

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center px-4 bg-slate-50">
        <div className="max-w-md text-center rounded-3xl border bg-white p-7">
          <Mail size={34} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Confirm your email first</h1>
          <p className="text-sm mt-2 mb-6 text-slate-600">After confirming your email, sign in to finish creating your profile for {site.clinic.name}.</p>
          <Link to={clinicPublicHref(site, "/patient/login")} className="block py-3 rounded-xl font-semibold text-sm text-white"
            style={{ background: site.settings.tokens?.colors?.primary || "#2457C5" }}>Go to Patient Sign In</Link>
        </div>
      </div>
    );
  }

  if (isSuperAdmin) return <Navigate to="/super-admin" replace />;
  if (role !== "patient") return <Navigate to="/admin" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await clinicRepository.createMyPatientProfile({
        clinic_id: site.clinic.id,
        ...form,
        email: user.email || "",
      });
      navigate(clinicPublicHref(site, "/patient"), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your patient profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10" style={{ background: site.settings.tokens?.colors?.background || "#f8fafc" }}>
      <form onSubmit={submit} className="w-full max-w-lg rounded-3xl border p-7 shadow-sm bg-white">
        <div className="w-12 h-12 rounded-2xl grid place-items-center text-white mb-4"
          style={{ background: site.settings.tokens?.colors?.primary || "#2457C5" }}><UserRound size={22} /></div>
        <div className="text-xs font-semibold uppercase tracking-wider" style={{color:site.settings.tokens?.colors?.primary || "#2457C5"}}>{site.clinic.name}</div>
        <h1 className="text-3xl font-bold mt-2">Complete Your Patient Profile</h1>
        <p className="text-sm mt-2 mb-6 text-slate-600">This creates your patient record for this clinic and links it securely to {user.email}.</p>

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
              <option value="">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </select>
          </label>
        </div>

        <label className="text-xs font-semibold">Address
          <textarea value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})}
            className="mt-1.5 mb-5 w-full px-3 py-3 rounded-xl border bg-transparent text-sm min-h-20" />
        </label>

        <button disabled={saving} className="w-full py-3 rounded-xl font-semibold text-sm text-white"
          style={{ background:site.settings.tokens?.colors?.primary || "#2457C5" }}>
          {saving ? "Creating profile..." : "Finish Patient Profile"}
        </button>
        <button type="button" onClick={()=>void signOut()} className="w-full mt-3 py-2 text-xs underline text-slate-500">Sign out</button>
      </form>
    </div>
  );
}
