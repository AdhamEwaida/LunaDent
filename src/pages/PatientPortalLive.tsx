import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, CreditCard, FileText, Home, LogOut, ReceiptText, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { clinicRepository } from "@/clinic/repository";
import { saasRepository } from "@/saas/repository";
import type { Appointment, Invoice, Patient, PatientDocument, Payment, TreatmentPlan } from "@/clinic/types";
import type { PublicClinicSite } from "@/saas/types";

const cardStyle = { background: "var(--card)", borderColor: "var(--border)" };
const muted = { color: "var(--muted-foreground)" };

function money(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(value || 0));
  } catch {
    return `${currency} ${Number(value || 0).toLocaleString()}`;
  }
}

function PatientLogin({ site }: { site: PublicClinicSite }) {
  const { user, signIn, signOut, isSuperAdmin, activeClinicRole } = useAuth();
  const { clinicSlug = "" } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate(`/c/${clinicSlug}/patient`, { replace: true });
  }, [user, clinicSlug, navigate]);

  if (user) {
    return (
      <div className="min-h-screen grid place-items-center px-4 bg-slate-50">
        <div className="w-full max-w-md rounded-3xl border bg-white p-7 text-center">
          <ShieldCheck size={34} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Already signed in</h1>
          <p className="text-sm mt-2 mb-6 text-slate-600">Continue to your patient record for {site.clinic.name}.</p>
          <Link to={`/c/${clinicSlug}/patient`} className="block w-full py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: site.settings.tokens?.colors?.primary || "#2457C5" }}>
            Open Patient Portal
          </Link>
          {(isSuperAdmin || activeClinicRole) && (
            <Link to={isSuperAdmin ? "/super-admin" : "/admin"} className="block mt-3 py-2 text-sm font-semibold text-slate-600">
              Open {isSuperAdmin ? "Super Admin" : "Clinic Workspace"}
            </Link>
          )}
          <button type="button" onClick={() => void signOut()} className="w-full mt-2 py-2 text-sm underline text-slate-500">
            Sign out and use another account
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10" style={{ background: site.settings.tokens?.colors?.background || "#f8fafc" }}>
      <div className="w-full max-w-md">
        <div className="mb-5 text-center">
          <div className="w-14 h-14 rounded-2xl grid place-items-center text-white mx-auto mb-4"
            style={{ background: site.settings.tokens?.colors?.primary || "#2457C5" }}>
            <UserRound size={24} />
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{color:site.settings.tokens?.colors?.primary || "#2457C5"}}>{site.clinic.name}</div>
          <h1 className="text-3xl font-bold mt-2">Patient Sign In</h1>
          <p className="text-sm mt-2 text-slate-600">Access appointments, treatment plans, invoices, payments and documents for this clinic.</p>
        </div>

        <form onSubmit={submit} className="rounded-3xl border bg-white p-7 shadow-sm">
          {error && <div className="mb-4 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
          <label className="text-xs font-semibold">Email
            <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 mb-4 w-full px-3 py-3 rounded-xl border bg-transparent text-sm" />
          </label>
          <label className="text-xs font-semibold">Password
            <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 mb-5 w-full px-3 py-3 rounded-xl border bg-transparent text-sm" />
          </label>
          <button disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: site.settings.tokens?.colors?.primary || "#2457C5" }}>
            {loading ? "Signing in..." : "Sign In to Patient Portal"}
          </button>
          <div className="mt-5 pt-5 border-t text-center">
            <p className="text-xs mb-2 text-slate-500">New patient?</p>
            <Link to={`/c/${clinicSlug}/patient/signup`} className="text-sm font-semibold"
              style={{ color: site.settings.tokens?.colors?.primary || "#2457C5" }}>
              Create Patient Account
            </Link>
          </div>
        </form>
        <Link to={`/c/${clinicSlug}`} className="block text-center text-xs mt-4 text-slate-500">Back to clinic website</Link>
      </div>
    </div>
  );
}

export default function PatientPortalLive() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { clinicSlug = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [site, setSite] = useState<PublicClinicSite | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clinicSlug) {
      setLoading(false);
      return;
    }

    let active = true;
    void saasRepository.getClinicSiteBySlug(clinicSlug)
      .then((siteRow) => {
        if (!active) return;
        setSite(siteRow);
        if (!siteRow || !user) return;

        return clinicRepository.getPatientByAuthUserId(user.id, siteRow.clinic.id)
          .then(async (patientRow) => {
            if (!active) return;
            setPatient(patientRow);
            if (!patientRow) return;

            const [appointmentRows, planRows, invoiceRows, paymentRows, documentRows] = await Promise.all([
              clinicRepository.listAppointments(patientRow.id, siteRow.clinic.id),
              clinicRepository.listTreatmentPlans(patientRow.id, siteRow.clinic.id),
              clinicRepository.listInvoices(patientRow.id, siteRow.clinic.id),
              clinicRepository.listPayments(patientRow.id, siteRow.clinic.id),
              clinicRepository.listPatientDocuments(patientRow.id, siteRow.clinic.id),
            ]);
            if (!active) return;
            setAppointments(appointmentRows);
            setPlans(planRows);
            setInvoices(invoiceRows);
            setPayments(paymentRows);
            setDocuments(documentRows);
          });
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : "Unable to load your portal."))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [clinicSlug, user]);

  if (!clinicSlug) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
        <div className="max-w-md text-center"><UserRound size={36} className="mx-auto text-slate-400"/><h1 className="text-2xl font-bold mt-4">Choose your clinic</h1><p className="text-sm text-slate-600 mt-2">Patient portals are opened from each clinic's website.</p><Link to="/" className="inline-block mt-5 px-5 py-3 rounded-xl bg-slate-950 text-white font-semibold">Back to LunaDent</Link></div>
      </div>
    );
  }

  if (authLoading || loading) return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">Loading patient portal...</div>;
  if (!site) return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">Clinic portal unavailable.</div>;

  const base = `/c/${clinicSlug}/patient`;
  if (location.pathname === `${base}/login` || !user) return <PatientLogin site={site} />;

  if (!patient) {
    return (
      <div className="min-h-screen grid place-items-center px-4" style={{background:site.settings.tokens?.colors?.background || "#f8fafc"}}>
        <div className="max-w-lg text-center rounded-3xl border bg-white p-7">
          <UserRound size={34} className="mx-auto mb-3" />
          <h1 className="text-xl font-bold">Finish your patient profile</h1>
          <p className="text-sm mt-2 text-slate-600">Your account is signed in, but it does not have a patient record at {site.clinic.name} yet.</p>
          <Link to={`/c/${clinicSlug}/patient/complete-profile`} className="inline-block mt-5 px-5 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background:site.settings.tokens?.colors?.primary || "#2457C5" }}>
            Complete Patient Profile
          </Link>
        </div>
      </div>
    );
  }

  const nav = [
    [Home, "Overview", base],
    [CalendarDays, "Appointments", `${base}/appointments`],
    [ReceiptText, "Invoices", `${base}/invoices`],
    [CreditCard, "Payments", `${base}/payments`],
    [FileText, "Documents", `${base}/documents`],
  ] as const;

  const balance = invoices.reduce((sum, invoice) => sum + Number(invoice.balance_due || 0), 0);
  const nextAppointment = appointments
    .filter((appointment) => new Date(appointment.start_at).getTime() >= Date.now() && !["cancelled","no_show"].includes(appointment.status))
    .sort((a,b) => +new Date(a.start_at) - +new Date(b.start_at))[0];

  const content = () => {
    if (location.pathname.endsWith("/appointments")) {
      return <section><h2 className="text-xl font-bold mb-4">Appointments</h2><div className="space-y-3">{appointments.length ? appointments.map((appointment) => <div key={appointment.id} className="rounded-2xl border p-4 flex items-center gap-4" style={cardStyle}><div className="w-11 h-11 rounded-xl grid place-items-center" style={{ background: "var(--secondary)", color: "var(--primary)" }}><CalendarDays size={18} /></div><div className="flex-1"><div className="font-semibold text-sm">{appointment.treatment?.name_en || "Dental appointment"}</div><div className="text-xs" style={muted}>{new Date(appointment.start_at).toLocaleString()} · {appointment.doctor?.display_name || "Doctor to be assigned"}</div></div><span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100">{appointment.status.replaceAll("_"," ")}</span></div>) : <div className="rounded-2xl border p-8 text-center text-sm text-slate-500 bg-white">No appointments found.</div>}</div></section>;
    }

    if (location.pathname.endsWith("/invoices")) {
      return <section><h2 className="text-xl font-bold mb-4">Invoices</h2><div className="rounded-2xl border overflow-hidden bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="text-left border-b text-slate-500"><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Paid</th><th className="px-4 py-3">Balance</th></tr></thead><tbody>{invoices.map(invoice=><tr key={invoice.id} className="border-b last:border-0"><td className="px-4 py-3 font-semibold">{invoice.invoice_no}</td><td className="px-4 py-3">{invoice.status.replaceAll("_"," ")}</td><td className="px-4 py-3">{money(invoice.total,site.clinic.currency)}</td><td className="px-4 py-3">{money(invoice.paid_total,site.clinic.currency)}</td><td className="px-4 py-3 font-bold">{money(invoice.balance_due,site.clinic.currency)}</td></tr>)}</tbody></table></div>{invoices.length===0 && <div className="p-8 text-center text-sm text-slate-500">No invoices found.</div>}</div></section>;
    }

    if (location.pathname.endsWith("/payments")) {
      return <section><h2 className="text-xl font-bold mb-4">Payments</h2><div className="space-y-3">{payments.length ? payments.map(payment=><div key={payment.id} className="rounded-2xl border bg-white p-4 flex justify-between gap-3"><div><div className="font-semibold">{money(payment.amount,site.clinic.currency)}</div><div className="text-xs text-slate-500">{payment.method.replaceAll("_"," ")} · {new Date(payment.paid_at).toLocaleString()}</div></div><div className="text-xs text-slate-500">{payment.reference || "No reference"}</div></div>) : <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">No payments found.</div>}</div></section>;
    }

    if (location.pathname.endsWith("/documents")) {
      return <section><h2 className="text-xl font-bold mb-4">Documents</h2><div className="grid md:grid-cols-2 gap-3">{documents.map(document=><button key={document.id} onClick={async()=>{const url=await clinicRepository.createPatientDocumentUrl(document.storage_path);if(url)window.open(url,"_blank","noopener,noreferrer");}} className="rounded-2xl border bg-white p-4 text-left"><FileText size={20} className="mb-2"/><div className="font-semibold text-sm">{document.title}</div><div className="text-xs text-slate-500">{document.document_type} · {new Date(document.created_at).toLocaleDateString()}</div></button>)}</div>{documents.length===0 && <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">No visible documents found.</div>}</section>;
    }

    return (
      <section className="space-y-5">
        <div><div className="text-xs uppercase tracking-wider font-semibold" style={{color:site.settings.tokens?.colors?.primary || "#2457C5"}}>{site.clinic.name}</div><h2 className="text-3xl font-bold mt-1">Welcome, {patient.first_name}</h2><p className="text-sm text-slate-500">Patient number {patient.patient_no}</p></div>
        {error && <div className="rounded-xl px-3 py-2 bg-red-50 text-red-700 text-sm">{error}</div>}
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-white p-4"><div className="text-xs text-slate-500">Next appointment</div><div className="font-bold mt-1">{nextAppointment ? new Date(nextAppointment.start_at).toLocaleDateString() : "None scheduled"}</div></div>
          <div className="rounded-2xl border bg-white p-4"><div className="text-xs text-slate-500">Outstanding balance</div><div className="font-bold mt-1">{money(balance,site.clinic.currency)}</div></div>
          <div className="rounded-2xl border bg-white p-4"><div className="text-xs text-slate-500">Treatment plans</div><div className="font-bold mt-1">{plans.length}</div></div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border bg-white p-4"><div className="flex items-center gap-2 mb-3"><Stethoscope size={17}/><h3 className="font-semibold">Treatment Plans</h3></div><div className="space-y-2">{plans.slice(0,4).map(plan=><div key={plan.id} className="p-3 rounded-xl bg-slate-50"><div className="font-semibold text-sm">{plan.title}</div><div className="text-xs mt-1 text-slate-500">{plan.status.replaceAll("_"," ")} · {money(plan.estimated_total,site.clinic.currency)}</div></div>)}{plans.length===0 && <div className="text-sm text-slate-500">No visible treatment plans.</div>}</div></div>
          <div className="rounded-2xl border bg-white p-4"><div className="flex items-center gap-2 mb-3"><CalendarDays size={17}/><h3 className="font-semibold">Upcoming Care</h3></div>{nextAppointment?<div><div className="font-semibold text-sm">{nextAppointment.treatment?.name_en || "Dental appointment"}</div><div className="text-xs mt-1 text-slate-500">{new Date(nextAppointment.start_at).toLocaleString()} · {nextAppointment.doctor?.display_name || "Doctor to be assigned"}</div></div>:<div className="text-sm text-slate-500">No upcoming appointment.</div>}</div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-16 border-b bg-white">
        <div className="max-w-6xl mx-auto h-full px-5 flex items-center justify-between">
          <Link to={`/c/${clinicSlug}`} className="font-bold">{site.clinic.name}</Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-slate-500">{user?.email}</span>
            <button onClick={()=>void signOut().then(()=>navigate(`/c/${clinicSlug}/patient/login`))} className="p-2 rounded-lg border" aria-label="Sign out"><LogOut size={15}/></button>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-5 py-7 grid md:grid-cols-[210px_1fr] gap-6">
        <aside className="rounded-2xl border bg-white p-2 h-fit">
          {nav.map(([Icon,label,path])=><Link key={path} to={path} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm mb-1 ${location.pathname===path?"font-semibold":""}`} style={location.pathname===path?{background:site.settings.tokens?.colors?.secondary || "#EAF1FF",color:site.settings.tokens?.colors?.primary || "#2457C5"}:{color:"#64748b"}}><Icon size={15}/>{label}</Link>)}
        </aside>
        <main>{content()}</main>
      </div>
    </div>
  );
}
