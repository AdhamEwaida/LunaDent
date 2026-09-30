import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, CreditCard, FileText, Home, LogOut, ReceiptText, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { clinicRepository } from "@/clinic/repository";
import type { Appointment, Invoice, Patient, PatientDocument, Payment, TreatmentPlan } from "@/clinic/types";

const cardStyle = { background: "var(--card)", borderColor: "var(--border)" };
const muted = { color: "var(--muted-foreground)" };

function PatientLogin() {
  const { user, role, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && role === "patient") navigate("/patient-portal", { replace: true });
  }, [user, role, navigate]);

  if (user && role && role !== "patient") {
    return (
      <div className="min-h-screen grid place-items-center px-4" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-md rounded-3xl border p-7 text-center" style={cardStyle}>
          <ShieldCheck size={34} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>
            You are signed in as clinic staff
          </h1>
          <p className="text-sm mt-2 mb-6" style={muted}>
            The Patient Portal is for patient accounts only.
          </p>
          <Link to="/admin" className="block w-full py-3 rounded-xl text-sm font-semibold"
            style={{ background: "var(--primary)", color: "white" }}>
            Open Staff Workspace
          </Link>
          <button type="button" onClick={() => void signOut()} className="w-full mt-3 py-2 text-sm underline" style={muted}>
            Sign out and use a patient account
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
    <div className="min-h-screen grid place-items-center px-4 py-10" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md">
        <div className="mb-5 text-center">
          <div className="w-14 h-14 rounded-2xl grid place-items-center text-white mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            <UserRound size={24} />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>
            Patient Sign In
          </h1>
          <p className="text-sm mt-2" style={muted}>
            Access your appointments, treatment plans, invoices, payments and documents.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-3xl border p-7 shadow-sm" style={cardStyle}>
          {error && <div className="mb-4 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

          <label className="text-xs font-semibold">Email
            <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 mb-4 w-full px-3 py-3 rounded-xl border bg-transparent text-sm" />
          </label>

          <label className="text-xs font-semibold">Password
            <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 mb-5 w-full px-3 py-3 rounded-xl border bg-transparent text-sm" />
          </label>

          <button disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold"
            style={{ background: "var(--primary)", color: "white" }}>
            {loading ? "Signing in..." : "Sign In to Patient Portal"}
          </button>

          <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs leading-relaxed" style={muted}>
              There is no public patient sign-up. Portal access is activated by the clinic and linked to your patient record.
            </p>
            <Link to="/booking" className="inline-block mt-3 text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Need access? Request an appointment
            </Link>
          </div>
        </form>

        <div className="flex justify-center gap-4 mt-4 text-xs">
          <Link to="/staff/login" style={{ color: "var(--muted-foreground)" }}>Staff Sign In</Link>
          <Link to="/" style={{ color: "var(--muted-foreground)" }}>Back to Website</Link>
        </div>
      </div>
    </div>
  );
}

const nav = [
  [Home, "Overview", "/patient-portal"],
  [CalendarDays, "Appointments", "/patient-portal/appointments"],
  [ReceiptText, "Invoices", "/patient-portal/invoices"],
  [CreditCard, "Payments", "/patient-portal/payments"],
  [FileText, "Documents", "/patient-portal/documents"],
] as const;

export default function PatientPortalLive() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || role !== "patient") return;
    let active = true;
    (async () => {
      try {
        setLoading(true); setError("");
        const patientRow = await clinicRepository.getPatientByAuthUserId(user.id);
        if (!active) return;
        setPatient(patientRow);
        if (!patientRow) return;
        const [appointmentRows, planRows, invoiceRows, paymentRows, documentRows] = await Promise.all([
          clinicRepository.listAppointments(patientRow.id),
          clinicRepository.listTreatmentPlans(patientRow.id),
          clinicRepository.listInvoices(patientRow.id),
          clinicRepository.listPayments(patientRow.id),
          clinicRepository.listPatientDocuments(patientRow.id),
        ]);
        if (!active) return;
        setAppointments(appointmentRows); setPlans(planRows); setInvoices(invoiceRows); setPayments(paymentRows); setDocuments(documentRows);
      } catch (err) { if (active) setError(err instanceof Error ? err.message : "Unable to load your portal."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [user, role]);

  if (location.pathname === "/patient-portal/login" || (!authLoading && !user)) return <PatientLogin />;

  const balance = useMemo(() => invoices.reduce((sum, invoice) => sum + Number(invoice.balance_due), 0), [invoices]);
  const nextAppointment = useMemo(() => appointments.filter((appointment) => new Date(appointment.start_at).getTime() >= Date.now() && !["cancelled","no_show"].includes(appointment.status)).sort((a,b) => +new Date(a.start_at) - +new Date(b.start_at))[0], [appointments]);

  if (authLoading || loading) return <div className="min-h-screen grid place-items-center" style={{ background: "var(--background)", color: "var(--muted-foreground)" }}>Loading patient portal...</div>;
  if (role !== "patient") return <div className="min-h-screen grid place-items-center px-4" style={{ background: "var(--background)" }}><div className="max-w-md text-center"><ShieldCheck size={34} className="mx-auto mb-3" /><h1 className="text-xl font-bold">Patient account required</h1><p className="text-sm mt-2" style={muted}>This portal is restricted to patient accounts.</p><Link to="/admin" className="inline-block mt-5 px-4 py-2 rounded-xl text-sm" style={{ background: "var(--primary)", color: "white" }}>Open staff workspace</Link></div></div>;
  if (!patient) return <div className="min-h-screen grid place-items-center px-4" style={{ background: "var(--background)" }}><div className="max-w-lg text-center"><UserRound size={34} className="mx-auto mb-3" /><h1 className="text-xl font-bold">Patient record not linked</h1><p className="text-sm mt-2" style={muted}>Your Auth account exists, but it is not linked to a patient record yet. Reception needs to set the patient record's auth_user_id.</p></div></div>;

  const content = () => {
    if (location.pathname === "/patient-portal/appointments") return <section><h2 className="text-xl font-bold mb-4">Appointments</h2><div className="space-y-3">{appointments.length ? appointments.map((appointment) => <div key={appointment.id} className="rounded-2xl border p-4 flex items-center gap-4" style={cardStyle}><div className="w-11 h-11 rounded-xl grid place-items-center" style={{ background: "var(--secondary)", color: "var(--primary)" }}><CalendarDays size={18} /></div><div className="flex-1"><div className="font-semibold text-sm">{appointment.treatment?.name_en || "Dental appointment"}</div><div className="text-xs" style={muted}>{new Date(appointment.start_at).toLocaleString()} · {appointment.doctor?.display_name || "Doctor to be assigned"}</div></div><span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "var(--secondary)", color: "var(--primary)" }}>{appointment.status.replaceAll("_", " ")}</span></div>) : <div className="rounded-2xl border p-8 text-center text-sm" style={{ ...cardStyle, ...muted }}>No appointments found.</div>}</div></section>;
    if (location.pathname === "/patient-portal/invoices") return <section><h2 className="text-xl font-bold mb-4">Invoices</h2><div className="rounded-2xl border overflow-hidden" style={cardStyle}><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="text-left border-b" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Paid</th><th className="px-4 py-3">Balance</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}><td className="px-4 py-3 font-semibold">{invoice.invoice_no}</td><td className="px-4 py-3">{invoice.status.replaceAll("_", " ")}</td><td className="px-4 py-3">${Number(invoice.total).toLocaleString()}</td><td className="px-4 py-3">${Number(invoice.paid_total).toLocaleString()}</td><td className="px-4 py-3 font-bold">${Number(invoice.balance_due).toLocaleString()}</td></tr>)}</tbody></table></div>{invoices.length === 0 && <div className="p-8 text-center text-sm" style={muted}>No invoices found.</div>}</div></section>;
    if (location.pathname === "/patient-portal/payments") return <section><h2 className="text-xl font-bold mb-4">Payments</h2><div className="space-y-3">{payments.length ? payments.map((payment) => <div key={payment.id} className="rounded-2xl border p-4 flex justify-between gap-3" style={cardStyle}><div><div className="font-semibold">${Number(payment.amount).toLocaleString()}</div><div className="text-xs" style={muted}>{payment.method.replaceAll("_", " ")} · {new Date(payment.paid_at).toLocaleString()}</div></div><div className="text-xs" style={muted}>{payment.reference || "No reference"}</div></div>) : <div className="rounded-2xl border p-8 text-center text-sm" style={{ ...cardStyle, ...muted }}>No payments found.</div>}</div></section>;
    if (location.pathname === "/patient-portal/documents") return <section><h2 className="text-xl font-bold mb-4">Documents</h2><div className="grid md:grid-cols-2 gap-3">{documents.map((document) => <button key={document.id} onClick={async () => { const url = await clinicRepository.createPatientDocumentUrl(document.storage_path); if (url) window.open(url, "_blank", "noopener,noreferrer"); }} className="rounded-2xl border p-4 text-left" style={cardStyle}><FileText size={20} className="mb-2" /><div className="font-semibold text-sm">{document.title}</div><div className="text-xs" style={muted}>{document.document_type} · {new Date(document.created_at).toLocaleDateString()}</div></button>)}</div>{documents.length === 0 && <div className="rounded-2xl border p-8 text-center text-sm" style={{ ...cardStyle, ...muted }}>No patient-visible documents found.</div>}</section>;

    return <section className="space-y-5"><div><h2 className="text-2xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>Welcome, {patient.first_name}</h2><p className="text-sm" style={muted}>Patient number {patient.patient_no}</p></div>{error && <div className="rounded-xl px-3 py-2 bg-red-50 text-red-700 text-sm">{error}</div>}<div className="grid sm:grid-cols-3 gap-3"><div className="rounded-2xl border p-4" style={cardStyle}><div className="text-xs" style={muted}>Next appointment</div><div className="font-bold mt-1">{nextAppointment ? new Date(nextAppointment.start_at).toLocaleDateString() : "None scheduled"}</div></div><div className="rounded-2xl border p-4" style={cardStyle}><div className="text-xs" style={muted}>Outstanding balance</div><div className="font-bold mt-1">${balance.toLocaleString()}</div></div><div className="rounded-2xl border p-4" style={cardStyle}><div className="text-xs" style={muted}>Treatment plans</div><div className="font-bold mt-1">{plans.length}</div></div></div><div className="grid lg:grid-cols-2 gap-4"><div className="rounded-2xl border p-4" style={cardStyle}><div className="flex items-center gap-2 mb-3"><Stethoscope size={17} /><h3 className="font-semibold">Treatment Plans</h3></div><div className="space-y-2">{plans.slice(0,4).map((plan) => <div key={plan.id} className="p-3 rounded-xl" style={{ background: "var(--muted)" }}><div className="font-semibold text-sm">{plan.title}</div><div className="text-xs mt-1" style={muted}>{plan.status.replaceAll("_", " ")} · ${Number(plan.estimated_total).toLocaleString()}</div></div>)}{plans.length === 0 && <div className="text-sm" style={muted}>No visible treatment plans.</div>}</div></div><div className="rounded-2xl border p-4" style={cardStyle}><div className="flex items-center gap-2 mb-3"><CalendarDays size={17} /><h3 className="font-semibold">Upcoming Care</h3></div>{nextAppointment ? <div><div className="font-semibold text-sm">{nextAppointment.treatment?.name_en || "Dental appointment"}</div><div className="text-xs mt-1" style={muted}>{new Date(nextAppointment.start_at).toLocaleString()}</div></div> : <div className="text-sm" style={muted}>No upcoming appointment.</div>}</div></div></section>;
  };

  return <div className="min-h-screen flex" style={{ background: "var(--background)" }}><aside className="hidden md:flex w-60 flex-col p-4 text-white" style={{ background: "var(--primary)" }}><Link to="/" className="text-lg font-bold mb-7" style={{ fontFamily: "'Cormorant Garamond', serif" }}>LunaDent Portal</Link><div className="space-y-1 flex-1">{nav.map(([Icon,label,path]) => { const active = location.pathname === path; return <Link key={path} to={path} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ background: active ? "rgba(255,255,255,.15)" : "transparent", color: active ? "white" : "rgba(255,255,255,.7)" }}><Icon size={15} />{label}</Link>; })}</div><button onClick={async () => { await signOut(); navigate("/patient-portal/login", { replace: true }); }} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-white/70"><LogOut size={15} />Sign Out</button></aside><main className="flex-1"><header className="md:hidden border-b px-4 py-3 flex gap-2 overflow-x-auto" style={{ background: "var(--card)", borderColor: "var(--border)" }}>{nav.map(([Icon,label,path]) => <Link key={path} to={path} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs min-w-max" style={{ background: location.pathname === path ? "var(--primary)" : "var(--muted)", color: location.pathname === path ? "white" : "var(--foreground)" }}><Icon size={13} />{label}</Link>)}</header><div className="max-w-5xl mx-auto p-4 md:p-7">{content()}</div></main></div>;
}
