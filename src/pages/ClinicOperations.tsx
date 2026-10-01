import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity, AlertTriangle, CalendarDays, CheckCircle2, ChevronRight, ClipboardList,
  Eye, FileText, HeartPulse, Package, Plus, Search, Stethoscope, Trash2, Upload, UserRound, X
} from "lucide-react";
import { clinicRepository } from "@/clinic/repository";
import { useAuth } from "@/auth/AuthContext";
import type {
  Appointment, ClinicalNote, DentalChartEntry, InventoryItem, Patient, ToothCondition,
  TreatmentPlan, TreatmentPlanItem, Invoice, Doctor, TreatmentCatalogItem, BookingRequest, PatientDocument
} from "@/clinic/types";

const cardStyle = { background: "var(--card)", borderColor: "var(--border)" };
const muted = { color: "var(--muted-foreground)" };

function formatMoney(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value) || 0);
  } catch {
    return currency + " " + Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}

function StatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "primary" }) {
  const tones = {
    neutral: { background: "var(--muted)", color: "var(--muted-foreground)" },
    success: { background: "#ecfdf3", color: "#15803d" },
    warning: { background: "#fff7ed", color: "#c2410c" },
    danger: { background: "#fef2f2", color: "#b91c1c" },
    primary: { background: "var(--secondary)", color: "var(--primary)" },
  } as const;
  return <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold" style={tones[tone]}>{children}</span>;
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof UserRound; title: string; description: string }) {
  return (
    <div className="py-14 text-center rounded-2xl border" style={cardStyle}>
      <Icon size={28} className="mx-auto mb-3 opacity-35" />
      <div className="font-semibold">{title}</div>
      <div className="text-sm mt-1" style={muted}>{description}</div>
    </div>
  );
}

export function ClinicPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", email: "", date_of_birth: "" });

  const load = async (search = query) => {
    setLoading(true);
    setError("");
    try { setPatients(await clinicRepository.listPatients(search)); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to load patients."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(""); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await clinicRepository.createPatient(form);
      setForm({ first_name: "", last_name: "", phone: "", email: "", date_of_birth: "" });
      setShowCreate(false);
      await load("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create patient.");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>Patients</h2>
          <p className="text-xs" style={muted}>Clinical records, dental chart, treatment plans and financial history in one workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={clinicRepository.mode === "supabase" ? "success" : "warning"}>{clinicRepository.mode === "supabase" ? "Live Database" : "Preview Data"}</StatusBadge>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--primary)", color: "white" }}><Plus size={14} />New Patient</button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void load(query); }} className="rounded-2xl border p-4 flex gap-2" style={cardStyle}>
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-3 opacity-50" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-transparent text-sm" placeholder="Search by name, patient number, phone or email" /></div>
        <button className="px-4 rounded-xl text-sm font-semibold border" style={{ borderColor: "var(--border)", color: "var(--primary)" }}>Search</button>
      </form>

      {error && <div className="rounded-xl p-3 text-sm bg-red-50 text-red-700">{error}</div>}
      {loading ? <div className="py-12 text-center text-sm" style={muted}>Loading patients...</div> : patients.length === 0 ? (
        <EmptyState icon={UserRound} title="No patients found" description="Create the first patient record or change the search filters." />
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={cardStyle}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead><tr className="text-left border-b" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Patient No.</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead>
              <tbody>{patients.map((patient) => (
                <tr key={patient.id} className="border-b last:border-b-0 hover:bg-black/[0.015]" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3"><div className="font-semibold">{patient.first_name} {patient.last_name}</div><div className="text-xs" style={muted}>{patient.date_of_birth || "DOB not recorded"}</div></td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--primary)" }}>{patient.patient_no}</td>
                  <td className="px-4 py-3"><div>{patient.phone || "—"}</div><div className="text-xs" style={muted}>{patient.email || "—"}</div></td>
                  <td className="px-4 py-3 text-xs" style={muted}>{new Date(patient.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><StatusBadge tone={patient.status === "active" ? "success" : "neutral"}>{patient.status}</StatusBadge></td>
                  <td className="px-4 py-3 text-right"><Link to={`/admin/patients/${patient.id}`} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--accent)" }}>Open Record <ChevronRight size={13} /></Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onMouseDown={() => setShowCreate(false)}>
          <form onSubmit={submit} onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-2xl rounded-3xl border p-6 shadow-2xl" style={cardStyle}>
            <div className="flex items-center justify-between mb-5"><div><h3 className="font-bold text-lg">Create Patient Record</h3><p className="text-xs" style={muted}>Core demographic and safety information.</p></div><button type="button" onClick={() => setShowCreate(false)}><X size={18} /></button></div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[["First Name","first_name","text"],["Last Name","last_name","text"],["Phone","phone","tel"],["Email","email","email"],["Date of Birth","date_of_birth","date"]].map(([label,key,type]) => <label key={key} className="text-xs font-semibold">{label}<input required={key === "first_name" || key === "last_name"} type={type} value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent font-normal text-sm" /></label>)}
            </div>
            <div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border text-sm">Cancel</button><button disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--primary)", color: "white" }}>{saving ? "Saving..." : "Create Patient"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

const conditionLabels: Record<ToothCondition, string> = {
  healthy: "Healthy", caries: "Caries", filling: "Filling", crown: "Crown", implant: "Implant", missing: "Missing", extraction: "Extraction", root_canal: "Root Canal", bridge: "Bridge", veneer: "Veneer", fracture: "Fracture"
};

const conditionStyles: Record<ToothCondition, { bg: string; fg: string }> = {
  healthy: { bg: "#ecfdf3", fg: "#15803d" }, caries: { bg: "#fef2f2", fg: "#b91c1c" }, filling: { bg: "#eff6ff", fg: "#1d4ed8" }, crown: { bg: "#f5f3ff", fg: "#6d28d9" }, implant: { bg: "#ecfeff", fg: "#0e7490" }, missing: { bg: "#f3f4f6", fg: "#6b7280" }, extraction: { bg: "#fff7ed", fg: "#c2410c" }, root_canal: { bg: "#fdf4ff", fg: "#a21caf" }, bridge: { bg: "#f0fdfa", fg: "#0f766e" }, veneer: { bg: "#fff1f2", fg: "#be123c" }, fracture: { bg: "#fffbeb", fg: "#a16207" }
};

function DentalChart({ patientId }: { patientId: string }) {
  const [entries, setEntries] = useState<DentalChartEntry[]>([]);
  const [tooth, setTooth] = useState<number | null>(null);
  const [condition, setCondition] = useState<ToothCondition>("caries");
  const [status, setStatus] = useState<DentalChartEntry["status"]>("planned");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => setEntries(await clinicRepository.listDentalChart(patientId));
  useEffect(() => { void load(); }, [patientId]);

  const latest = useMemo(() => {
    const map = new Map<number, DentalChartEntry>();
    for (const entry of entries) if (!map.has(entry.tooth_no)) map.set(entry.tooth_no, entry);
    return map;
  }, [entries]);

  const upper = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
  const lower = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
  const save = async () => {
    if (!tooth) return;
    setSaving(true);
    await clinicRepository.saveDentalChartEntry({ patient_id: patientId, tooth_no: tooth, condition, status, surfaces: [], notes: notes || null });
    setNotes("");
    setTooth(null);
    await load();
    setSaving(false);
  };

  const row = (teeth: number[]) => <div className="grid grid-cols-8 md:grid-cols-16 gap-1.5">{teeth.map((number) => {
    const entry = latest.get(number);
    const style = entry ? conditionStyles[entry.condition] : { bg: "var(--background)", fg: "var(--foreground)" };
    return <button key={number} onClick={() => setTooth(number)} className="aspect-square min-h-10 rounded-xl border text-xs font-bold transition-transform hover:-translate-y-0.5" style={{ background: style.bg, color: style.fg, borderColor: tooth === number ? "var(--primary)" : "var(--border)", boxShadow: tooth === number ? "0 0 0 2px var(--primary)" : undefined }}>{number}</button>;
  })}</div>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4" style={cardStyle}>
        <div className="flex items-center justify-between mb-4"><div><h3 className="font-semibold">Adult Odontogram</h3><p className="text-xs" style={muted}>FDI tooth numbering. Click any tooth to add a clinical state.</p></div><StatusBadge tone="primary">{entries.length} records</StatusBadge></div>
        <div className="space-y-2">{row(upper)}<div className="border-t" style={{ borderColor: "var(--border)" }} />{row(lower)}</div>
      </div>
      {tooth && <div className="rounded-2xl border p-4" style={cardStyle}><div className="font-semibold mb-3">Record tooth {tooth}</div><div className="grid md:grid-cols-3 gap-3"><label className="text-xs font-semibold">Condition<select value={condition} onChange={(e) => setCondition(e.target.value as ToothCondition)} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm">{Object.entries(conditionLabels).map(([key,label]) => <option value={key} key={key}>{label}</option>)}</select></label><label className="text-xs font-semibold">Record status<select value={status} onChange={(e) => setStatus(e.target.value as DentalChartEntry["status"])} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm"><option value="existing">Existing</option><option value="planned">Planned</option><option value="completed">Completed</option></select></label><label className="text-xs font-semibold">Notes<input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" placeholder="Clinical note" /></label></div><div className="mt-3 flex justify-end gap-2"><button onClick={() => setTooth(null)} className="px-3 py-2 rounded-xl border text-sm">Cancel</button><button onClick={() => void save()} disabled={saving} className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--primary)", color: "white" }}>{saving ? "Saving..." : "Save Record"}</button></div></div>}
      <div className="rounded-2xl border overflow-hidden" style={cardStyle}><div className="px-4 py-3 border-b font-semibold text-sm" style={{ borderColor: "var(--border)" }}>Clinical tooth history</div>{entries.length === 0 ? <div className="p-6 text-sm" style={muted}>No chart entries yet.</div> : entries.map((entry) => <div key={entry.id} className="px-4 py-3 border-b last:border-0 flex items-center gap-3" style={{ borderColor: "var(--border)" }}><div className="w-10 h-10 rounded-xl grid place-items-center font-bold" style={{ background: conditionStyles[entry.condition].bg, color: conditionStyles[entry.condition].fg }}>{entry.tooth_no}</div><div className="flex-1"><div className="text-sm font-semibold">{conditionLabels[entry.condition]} <span className="font-normal text-xs" style={muted}>· {entry.status}</span></div><div className="text-xs" style={muted}>{entry.notes || "No note"}</div></div><div className="text-xs" style={muted}>{new Date(entry.recorded_at).toLocaleDateString()}</div></div>)}</div>
    </div>
  );
}

function TreatmentPlansTab({ patientId }: { patientId: string }) {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const load = async () => setPlans(await clinicRepository.listTreatmentPlans(patientId));
  useEffect(() => { void load(); }, [patientId]);
  const create = async (event: FormEvent) => { event.preventDefault(); await clinicRepository.createTreatmentPlan({ patient_id: patientId, title, estimated_total: Number(total) || 0, status: "draft" }); setTitle(""); setTotal(""); setShow(false); await load(); };
  return <div className="space-y-4"><div className="flex justify-end"><button onClick={() => setShow((v) => !v)} className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--primary)", color: "white" }}><Plus size={13} className="inline mr-1" />New Plan</button></div>{show && <form onSubmit={create} className="rounded-2xl border p-4 grid md:grid-cols-[1fr_180px_auto] gap-3" style={cardStyle}><input required value={title} onChange={(e) => setTitle(e.target.value)} className="px-3 py-2.5 rounded-xl border bg-transparent" placeholder="Treatment plan title" /><input value={total} onChange={(e) => setTotal(e.target.value)} type="number" min="0" className="px-3 py-2.5 rounded-xl border bg-transparent" placeholder="Estimated total" /><button className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--accent)", color: "white" }}>Create</button></form>}{plans.length === 0 ? <EmptyState icon={ClipboardList} title="No treatment plans" description="Create a plan to track proposed and completed dental care." /> : <div className="grid md:grid-cols-2 gap-3">{plans.map((plan) => <div key={plan.id} className="rounded-2xl border p-4" style={cardStyle}><div className="flex justify-between gap-3"><div><div className="font-semibold">{plan.title}</div><div className="text-xs mt-1" style={muted}>{plan.notes || "No notes"}</div></div><StatusBadge tone={plan.status === "completed" ? "success" : plan.status === "approved" || plan.status === "in_progress" ? "primary" : "warning"}>{plan.status.replaceAll("_", " ")}</StatusBadge></div><div className="mt-4 pt-3 border-t flex justify-between text-sm" style={{ borderColor: "var(--border)" }}><span style={muted}>Estimated total</span><span className="font-bold">${Number(plan.estimated_total).toLocaleString()}</span></div></div>)}</div>}</div>;
}

function ClinicalNotesTab({ patientId }: { patientId: string }) {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [text, setText] = useState("");
  const load = async () => setNotes(await clinicRepository.listClinicalNotes(patientId));
  useEffect(() => { void load(); }, [patientId]);
  const add = async (event: FormEvent) => { event.preventDefault(); if (!text.trim()) return; await clinicRepository.createClinicalNote(patientId, text.trim()); setText(""); await load(); };
  return <div className="space-y-4"><form onSubmit={add} className="rounded-2xl border p-4" style={cardStyle}><label className="text-xs font-semibold">New clinical note<textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="mt-2 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm resize-none" placeholder="Diagnosis, procedure, progress, follow-up..." /></label><div className="text-right mt-2"><button className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--primary)", color: "white" }}>Add Note</button></div></form>{notes.map((note) => <div key={note.id} className="rounded-2xl border p-4" style={cardStyle}><div className="flex justify-between gap-3 mb-2"><StatusBadge tone="primary">{note.note_type}</StatusBadge><span className="text-xs" style={muted}>{new Date(note.created_at).toLocaleString()}</span></div><p className="text-sm leading-6">{note.note}</p></div>)}{notes.length === 0 && <EmptyState icon={FileText} title="No clinical notes" description="Clinical notes will appear in chronological order." />}</div>;
}

function AppointmentsTab({ patientId }: { patientId: string }) {
  const [items, setItems] = useState<Appointment[]>([]);
  useEffect(() => { clinicRepository.listAppointments(patientId).then(setItems); }, [patientId]);
  return items.length === 0 ? <EmptyState icon={CalendarDays} title="No appointments" description="This patient does not have appointments yet." /> : <div className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-2xl border p-4 flex items-center gap-4" style={cardStyle}><div className="w-12 h-12 rounded-xl grid place-items-center" style={{ background: "var(--secondary)", color: "var(--primary)" }}><CalendarDays size={20} /></div><div className="flex-1"><div className="font-semibold text-sm">{item.treatment?.name_en || "Dental appointment"}</div><div className="text-xs" style={muted}>{new Date(item.start_at).toLocaleString()} · {item.doctor?.display_name || "Unassigned"} · {item.room || "No chair assigned"}</div></div><StatusBadge tone={item.status === "completed" ? "success" : item.status === "cancelled" || item.status === "no_show" ? "danger" : "primary"}>{item.status.replaceAll("_", " ")}</StatusBadge></div>)}</div>;
}


function FinanceTab({ patientId }: { patientId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  useEffect(() => { clinicRepository.listInvoices(patientId).then(setInvoices); }, [patientId]);
  const total = invoices.reduce((sum, item) => sum + Number(item.total), 0);
  const paid = invoices.reduce((sum, item) => sum + Number(item.paid_total), 0);
  const balance = invoices.reduce((sum, item) => sum + Number(item.balance_due), 0);
  return <div className="space-y-4"><div className="grid grid-cols-3 gap-3">{[["Invoiced",total],["Paid",paid],["Balance",balance]].map(([label,value]) => <div key={String(label)} className="rounded-2xl border p-4" style={cardStyle}><div className="text-xs" style={muted}>{label}</div><div className="text-xl font-bold mt-1">${Number(value).toLocaleString()}</div></div>)}</div>{invoices.length === 0 ? <EmptyState icon={FileText} title="No invoices" description="Invoices linked to this patient will appear here." /> : <div className="rounded-2xl border overflow-hidden" style={cardStyle}><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead><tr className="text-left border-b" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Paid</th><th className="px-4 py-3">Balance</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}><td className="px-4 py-3 font-semibold">{invoice.invoice_no}</td><td className="px-4 py-3"><StatusBadge tone={invoice.status === "paid" ? "success" : invoice.status === "partially_paid" ? "warning" : "primary"}>{invoice.status.replaceAll("_", " ")}</StatusBadge></td><td className="px-4 py-3">${Number(invoice.total).toLocaleString()}</td><td className="px-4 py-3">${Number(invoice.paid_total).toLocaleString()}</td><td className="px-4 py-3 font-bold">${Number(invoice.balance_due).toLocaleString()}</td></tr>)}</tbody></table></div></div>}</div>;
}

export function ClinicPatientWorkspace() {
  const { patientId } = useParams();
  const { role } = useAuth();
  const clinicalAccess = role === "admin" || role === "dentist";
  const [patient, setPatient] = useState<Patient | null>(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    clinicRepository.getPatient(patientId).then(setPatient).finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <div className="py-20 text-center" style={muted}>Loading patient record...</div>;
  if (!patient || !patientId) return <EmptyState icon={UserRound} title="Patient not found" description="The requested patient record does not exist or you do not have access." />;

  const tabs = [
    ["overview", "Overview", UserRound],
    ["appointments", "Appointments", CalendarDays],
    ...(clinicalAccess ? [["chart", "Dental Chart", Activity], ["clinical", "Clinical Notes", Stethoscope]] as const : []),
    ["plans", "Treatment Plans", ClipboardList],
    ["finance", "Finance", FileText],
  ] as const;

  return <div className="space-y-4"><div className="rounded-3xl border p-5" style={cardStyle}><div className="flex flex-col md:flex-row md:items-center gap-4"><div className="w-14 h-14 rounded-2xl grid place-items-center text-white text-xl font-bold" style={{ background: "var(--primary)" }}>{patient.first_name[0]}{patient.last_name[0]}</div><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>{patient.first_name} {patient.last_name}</h2><StatusBadge tone="success">{patient.patient_no}</StatusBadge>{patient.allergies && patient.allergies.toLowerCase() !== "none known" && <StatusBadge tone="danger">Allergy: {patient.allergies}</StatusBadge>}</div><div className="text-xs mt-1" style={muted}>{patient.phone || "No phone"} · {patient.email || "No email"} · DOB {patient.date_of_birth || "not recorded"}</div></div><Link to="/admin/patients" className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Back to Patients</Link></div></div>
  <div className="overflow-x-auto"><div className="inline-flex min-w-full gap-1 rounded-2xl border p-1" style={cardStyle}>{tabs.map(([key,label,Icon]) => <button key={key} onClick={() => setTab(key)} className="flex-1 min-w-max flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: tab === key ? "var(--primary)" : "transparent", color: tab === key ? "white" : "var(--muted-foreground)" }}><Icon size={13} />{label}</button>)}</div></div>
  {tab === "overview" && <div className="grid md:grid-cols-3 gap-4"><div className="md:col-span-2 rounded-2xl border p-4" style={cardStyle}><h3 className="font-semibold mb-4">{clinicalAccess ? "Medical & Dental Summary" : "Patient Summary"}</h3><div className="grid sm:grid-cols-2 gap-4 text-sm">{(clinicalAccess ? [["Allergies",patient.allergies],["Chronic conditions",patient.chronic_conditions],["Current medications",patient.current_medications],["Dental history",patient.dental_history],["Address",patient.address],["Clinical summary",patient.notes]] : [["Address",patient.address],["Phone",patient.phone],["Email",patient.email],["Date of birth",patient.date_of_birth]]).map(([label,value]) => <div key={label}><div className="text-xs font-semibold mb-1" style={muted}>{label}</div><div>{value || "Not recorded"}</div></div>)}</div></div><div className="rounded-2xl border p-4" style={cardStyle}><h3 className="font-semibold mb-3">Record Access</h3><div className="space-y-2 text-sm">{clinicalAccess ? <><div className="flex items-center gap-2"><HeartPulse size={16} /><span>Clinical access enabled</span></div><div className="flex items-center gap-2"><AlertTriangle size={16} /><span>{patient.allergies || "No allergy recorded"}</span></div></> : <div className="flex items-center gap-2"><CheckCircle2 size={16} /><span>Administrative view only</span></div>}<div className="flex items-center gap-2"><CheckCircle2 size={16} /><span>Record status: {patient.status}</span></div></div></div></div>}
  {tab === "appointments" && <AppointmentsTab patientId={patientId} />}
  {tab === "chart" && clinicalAccess && <DentalChart patientId={patientId} />}
  {tab === "plans" && <TreatmentPlansTab patientId={patientId} />}
  {tab === "clinical" && clinicalAccess && <ClinicalNotesTab patientId={patientId} />}
  {tab === "finance" && <FinanceTab patientId={patientId} />}
  </div>;
}

export function ClinicAppointments() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [treatments, setTreatments] = useState<TreatmentCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patient_id: "", doctor_id: "", treatment_id: "", start_at: "", duration: "30", room: "Chair 1", notes: "" });

  const load = async () => {
    setLoading(true);
    const [appointments, patientRows, doctorRows, treatmentRows] = await Promise.all([
      clinicRepository.listAppointments(), clinicRepository.listPatients(), clinicRepository.listDoctors(), clinicRepository.listTreatments()
    ]);
    setItems(appointments); setPatients(patientRows); setDoctors(doctorRows); setTreatments(treatmentRows); setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.patient_id || !form.start_at) return;
    setSaving(true);
    const start = new Date(form.start_at);
    const end = new Date(start.getTime() + Math.max(5, Number(form.duration) || 30) * 60000);
    await clinicRepository.createAppointment({ patient_id: form.patient_id, doctor_id: form.doctor_id || null, treatment_id: form.treatment_id || null, start_at: start.toISOString(), end_at: end.toISOString(), status: "scheduled", room: form.room || null, notes: form.notes || null });
    setForm({ patient_id: "", doctor_id: "", treatment_id: "", start_at: "", duration: "30", room: "Chair 1", notes: "" });
    setShowCreate(false); setSaving(false); await load();
  };

  if (loading) return <div className="py-20 text-center" style={muted}>Loading appointments...</div>;
  return <div className="space-y-5">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3"><div><h2 className="text-xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>Appointments</h2><p className="text-xs" style={muted}>Operational schedule with patient, clinician, treatment, room and status.</p></div><button onClick={() => setShowCreate((value) => !value)} className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--primary)", color: "white" }}><Plus size={13} className="inline mr-1" />New Appointment</button></div>
    {showCreate && <form onSubmit={create} className="rounded-2xl border p-4 grid md:grid-cols-3 gap-3" style={cardStyle}>
      <label className="text-xs font-semibold">Patient<select required value={form.patient_id} onChange={(e) => setForm({...form, patient_id:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm"><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.patient_no} - {patient.first_name} {patient.last_name}</option>)}</select></label>
      <label className="text-xs font-semibold">Doctor<select value={form.doctor_id} onChange={(e) => setForm({...form, doctor_id:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm"><option value="">Unassigned</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.display_name}</option>)}</select></label>
      <label className="text-xs font-semibold">Treatment<select value={form.treatment_id} onChange={(e) => { const selected=treatments.find((t)=>t.id===e.target.value); setForm({...form, treatment_id:e.target.value, duration:String(selected?.duration_minutes || form.duration)}); }} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm"><option value="">General appointment</option>{treatments.map((treatment) => <option key={treatment.id} value={treatment.id}>{treatment.name_en}</option>)}</select></label>
      <label className="text-xs font-semibold">Start<input required type="datetime-local" value={form.start_at} onChange={(e) => setForm({...form,start_at:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" /></label>
      <label className="text-xs font-semibold">Duration (minutes)<input type="number" min="5" value={form.duration} onChange={(e) => setForm({...form,duration:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" /></label>
      <label className="text-xs font-semibold">Chair / Room<input value={form.room} onChange={(e) => setForm({...form,room:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" /></label>
      <label className="text-xs font-semibold md:col-span-2">Notes<input value={form.notes} onChange={(e) => setForm({...form,notes:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" /></label>
      <div className="flex items-end justify-end gap-2"><button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2.5 rounded-xl border text-sm">Cancel</button><button disabled={saving} className="px-3 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--accent)", color: "white" }}>{saving ? "Saving..." : "Create"}</button></div>
    </form>}
    {items.length === 0 ? <EmptyState icon={CalendarDays} title="No appointments" description="Appointments will appear here when booked." /> : <div className="rounded-2xl border overflow-hidden" style={cardStyle}><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead><tr className="text-left border-b" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}><th className="px-4 py-3">Date & Time</th><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Doctor</th><th className="px-4 py-3">Treatment</th><th className="px-4 py-3">Chair</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}><td className="px-4 py-3"><div className="font-semibold">{new Date(item.start_at).toLocaleDateString()}</div><div className="text-xs" style={muted}>{new Date(item.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div></td><td className="px-4 py-3">{item.patient ? <Link to={`/admin/patients/${item.patient.id}`} className="font-semibold" style={{ color: "var(--primary)" }}>{item.patient.first_name} {item.patient.last_name}</Link> : item.patient_id}</td><td className="px-4 py-3">{item.doctor?.display_name || "Unassigned"}</td><td className="px-4 py-3">{item.treatment?.name_en || "General"}</td><td className="px-4 py-3">{item.room || "—"}</td><td className="px-4 py-3"><select value={item.status} onChange={async (e) => { await clinicRepository.updateAppointmentStatus(item.id, e.target.value as Appointment["status"]); await load(); }} className="px-2 py-1.5 rounded-lg border bg-transparent text-xs"><option value="scheduled">Scheduled</option><option value="confirmed">Confirmed</option><option value="checked_in">Checked In</option><option value="in_treatment">In Treatment</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No Show</option></select></td></tr>)}</tbody></table></div></div>}
  </div>;
}

export function ClinicTreatmentPlans() {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  useEffect(() => { clinicRepository.listTreatmentPlans().then(setPlans); }, []);
  return <div className="space-y-5"><div><h2 className="text-xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>Treatment Plans</h2><p className="text-xs" style={muted}>Track proposed care from draft through approval and completion.</p></div><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{plans.map((plan) => <div key={plan.id} className="rounded-2xl border p-4" style={cardStyle}><div className="flex items-start justify-between gap-3"><div><div className="font-semibold">{plan.title}</div><div className="text-xs mt-1" style={muted}>{plan.patient ? `${plan.patient.first_name} ${plan.patient.last_name} · ${plan.patient.patient_no}` : "Patient record"}</div></div><StatusBadge tone={plan.status === "completed" ? "success" : plan.status === "approved" || plan.status === "in_progress" ? "primary" : "warning"}>{plan.status.replaceAll("_", " ")}</StatusBadge></div><div className="flex justify-between mt-5 pt-3 border-t" style={{ borderColor: "var(--border)" }}><span className="text-xs" style={muted}>Estimated</span><span className="font-bold">${Number(plan.estimated_total).toLocaleString()}</span></div></div>)}</div></div>;
}

export function ClinicInventory() {
  const { role } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ sku: "", name: "", category: "", quantity: "0", unit: "pcs", minimum_stock: "0", cost_per_unit: "0", supplier: "", batch_no: "", expiry_date: "" });
  const [movement, setMovement] = useState({ transaction_type: "receive" as "receive"|"consume"|"adjust"|"waste", quantity: "1" });
  const load = async () => setItems(await clinicRepository.listInventory());
  useEffect(() => { void load(); }, []);
  const low = items.filter((item) => item.quantity <= item.minimum_stock).length;
  const canManage = role === "admin" || role === "receptionist";
  const canMove = canManage || role === "dentist";

  const create = async (e: FormEvent) => {
    e.preventDefault(); setError("");
    try {
      await clinicRepository.createInventoryItem({ sku: form.sku, name: form.name, category: form.category, quantity: Number(form.quantity), unit: form.unit, minimum_stock: Number(form.minimum_stock), cost_per_unit: Number(form.cost_per_unit), supplier: form.supplier, batch_no: form.batch_no, expiry_date: form.expiry_date });
      setForm({ sku: "", name: "", category: "", quantity: "0", unit: "pcs", minimum_stock: "0", cost_per_unit: "0", supplier: "", batch_no: "", expiry_date: "" });
      setShowCreate(false); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create inventory item."); }
  };

  const saveMovement = async (e: FormEvent) => {
    e.preventDefault(); if (!adjusting) return; setError("");
    try { await clinicRepository.recordInventoryTransaction({ inventory_item_id: adjusting.id, transaction_type: movement.transaction_type, quantity: Number(movement.quantity) }); setAdjusting(null); setMovement({ transaction_type: "receive", quantity: "1" }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to update stock."); }
  };

  return <div className="space-y-5">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3"><div><h2 className="text-xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>Inventory</h2><p className="text-xs" style={muted}>Dental materials, consumables, stock thresholds, batches and expiry dates.</p></div><div className="flex items-center gap-2"><StatusBadge tone={low ? "warning" : "success"}>{low} low stock</StatusBadge>{canManage && <button onClick={() => setShowCreate(!showCreate)} className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--primary)", color: "white" }}><Plus size={13} className="inline mr-1" />Add Item</button>}</div></div>
    {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
    {showCreate && <form onSubmit={create} className="rounded-2xl border p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3" style={cardStyle}>{[["SKU","sku","text"],["Name","name","text"],["Category","category","text"],["Starting qty","quantity","number"],["Unit","unit","text"],["Minimum stock","minimum_stock","number"],["Cost / unit","cost_per_unit","number"],["Supplier","supplier","text"],["Batch","batch_no","text"],["Expiry","expiry_date","date"]].map(([label,key,type]) => <label key={key} className="text-xs font-semibold">{label}<input required={["sku","name"].includes(key)} type={type} min={type === "number" ? "0" : undefined} value={form[key as keyof typeof form]} onChange={(e) => setForm({...form,[key]:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" /></label>)}<div className="lg:col-span-5 flex justify-end"><button className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--accent)", color: "white" }}>Save Item</button></div></form>}
    <div className="rounded-2xl border overflow-hidden" style={cardStyle}><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead><tr className="text-left border-b" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}><th className="px-4 py-3">Item</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Minimum</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Batch</th><th className="px-4 py-3">Expiry</th><th className="px-4 py-3">Status</th>{canMove && <th className="px-4 py-3"></th>}</tr></thead><tbody>{items.map((item) => { const isLow = item.quantity <= item.minimum_stock; return <tr key={item.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}><td className="px-4 py-3"><div className="font-semibold">{item.name}</div><div className="text-xs" style={muted}>{item.category || "Uncategorized"}</div></td><td className="px-4 py-3">{item.sku}</td><td className="px-4 py-3 font-bold">{item.quantity} {item.unit}</td><td className="px-4 py-3">{item.minimum_stock}</td><td className="px-4 py-3">{item.supplier || "—"}</td><td className="px-4 py-3">{item.batch_no || "—"}</td><td className="px-4 py-3">{item.expiry_date || "—"}</td><td className="px-4 py-3"><StatusBadge tone={isLow ? "warning" : "success"}>{isLow ? "Reorder" : "In stock"}</StatusBadge></td>{canMove && <td className="px-4 py-3"><button onClick={() => setAdjusting(item)} className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Stock movement</button></td>}</tr>; })}</tbody></table></div>{items.length === 0 && <div className="p-8 text-center text-sm" style={muted}>No inventory items yet.</div>}</div>
    {adjusting && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onMouseDown={() => setAdjusting(null)}><form onSubmit={saveMovement} onMouseDown={(e)=>e.stopPropagation()} className="w-full max-w-md rounded-3xl border p-5" style={cardStyle}><h3 className="font-bold">Stock Movement · {adjusting.name}</h3><p className="text-xs mt-1 mb-4" style={muted}>Current stock: {adjusting.quantity} {adjusting.unit}</p><label className="text-xs font-semibold">Type<select value={movement.transaction_type} onChange={(e)=>setMovement({...movement,transaction_type:e.target.value as typeof movement.transaction_type})} className="mt-1.5 mb-3 w-full px-3 py-2.5 rounded-xl border bg-transparent"><option value="receive">Receive</option><option value="consume">Consume</option><option value="waste">Waste</option><option value="adjust">Set exact quantity</option></select></label><label className="text-xs font-semibold">Quantity<input required type="number" min="0.01" step="0.01" value={movement.quantity} onChange={(e)=>setMovement({...movement,quantity:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent" /></label><div className="flex justify-end gap-2 mt-5"><button type="button" onClick={()=>setAdjusting(null)} className="px-3 py-2 rounded-xl border text-sm">Cancel</button><button className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background:"var(--primary)", color:"white" }}>Apply</button></div></form></div>}
  </div>;
}


export function ClinicBookingRequests() {
  const [items, setItems] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); setItems(await clinicRepository.listBookingRequests()); setLoading(false); };
  useEffect(() => { void load(); }, []);
  const setStatus = async (id: string, status: BookingRequest["status"]) => { await clinicRepository.updateBookingRequestStatus(id, status); await load(); };
  if (loading) return <div className="py-20 text-center" style={muted}>Loading booking requests...</div>;
  return <div className="space-y-5"><div><h2 className="text-xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>Booking Requests</h2><p className="text-xs" style={muted}>Public booking requests are stored before WhatsApp opens, so reception can follow up reliably.</p></div>{items.length === 0 ? <EmptyState icon={CalendarDays} title="No booking requests" description="New public booking requests will appear here." /> : <div className="rounded-2xl border overflow-hidden" style={cardStyle}><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead><tr className="text-left border-b" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Requested Treatment</th><th className="px-4 py-3">Doctor</th><th className="px-4 py-3">Preferred Time</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}><td className="px-4 py-3"><div className="font-semibold">{item.full_name}</div><div className="text-xs" style={muted}>{new Date(item.created_at).toLocaleString()}</div></td><td className="px-4 py-3"><div>{item.phone}</div><div className="text-xs" style={muted}>{item.email || "No email"}</div></td><td className="px-4 py-3">{item.requested_treatment || "General consultation"}</td><td className="px-4 py-3">{item.requested_doctor || "No preference"}</td><td className="px-4 py-3">{item.preferred_date || "Flexible"} {item.preferred_time || ""}</td><td className="px-4 py-3"><select value={item.status} onChange={(e) => void setStatus(item.id, e.target.value as BookingRequest["status"])} className="px-2 py-1.5 rounded-lg border bg-transparent text-xs"><option value="new">New</option><option value="contacted">Contacted</option><option value="converted">Converted</option><option value="closed">Closed</option></select></td></tr>)}</tbody></table></div></div>}</div>;
}

export function ClinicDashboard() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof clinicRepository.getDashboardSummary>> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { clinicRepository.getDashboardSummary().then(setSummary).catch((e) => setError(e instanceof Error ? e.message : "Unable to load dashboard.")); }, []);
  if (!summary) return <div className="py-20 text-center" style={muted}>{error || "Loading clinic dashboard..."}</div>;
  const kpis = [
    ["Patients", summary.totalPatients, UserRound],
    ["Today's appointments", summary.todayAppointments, CalendarDays],
    ["Monthly revenue", `$${summary.monthlyRevenue.toLocaleString()}`, FileText],
    ["Outstanding", `$${summary.outstandingBalance.toLocaleString()}`, AlertTriangle],
    ["Active booking requests", summary.activeLeads, ClipboardList],
    ["Low stock", summary.lowStock, Package],
  ] as const;
  return <div className="space-y-5">
    <div><h2 className="text-xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>Clinic Dashboard</h2><p className="text-xs" style={muted}>{new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · live operational data</p></div>
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">{kpis.map(([label,value,Icon]) => <div key={label} className="rounded-2xl border p-4" style={cardStyle}><Icon size={18} className="mb-3" style={{ color: "var(--accent)" }} /><div className="text-xl font-bold">{value}</div><div className="text-xs mt-1" style={muted}>{label}</div></div>)}</div>
    <div className="rounded-2xl border overflow-hidden" style={cardStyle}><div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}><h3 className="font-semibold">Today's schedule</h3></div>{summary.recentAppointments.length === 0 ? <div className="p-8 text-center text-sm" style={muted}>No appointments scheduled today.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><tbody>{summary.recentAppointments.map((item) => <tr key={item.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}><td className="px-4 py-3 font-semibold">{new Date(item.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td><td className="px-4 py-3">{item.patient ? `${item.patient.first_name} ${item.patient.last_name}` : "Patient"}</td><td className="px-4 py-3">{item.treatment?.name_en || "General appointment"}</td><td className="px-4 py-3">{item.doctor?.display_name || "Unassigned"}</td><td className="px-4 py-3"><StatusBadge tone={item.status === "completed" ? "success" : "primary"}>{item.status.replaceAll("_", " ")}</StatusBadge></td></tr>)}</tbody></table></div>}</div>
  </div>;
}

export function ClinicDoctors() {
  const { role } = useAuth();
  const [items, setItems] = useState<Doctor[]>([]);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ display_name: "", specialty: "", phone: "", email: "", license_number: "" });
  const load = async () => setItems(await clinicRepository.listDoctors());
  useEffect(() => { void load(); }, []);
  const submit = async (e: FormEvent) => { e.preventDefault(); setError(""); try { await clinicRepository.createDoctor(form); setForm({ display_name: "", specialty: "", phone: "", email: "", license_number: "" }); setShow(false); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to add doctor."); } };
  return <div className="space-y-5"><div className="flex items-end justify-between"><div><h2 className="text-xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>Doctors</h2><p className="text-xs" style={muted}>Clinical team stored in the live clinic database.</p></div>{role === "admin" && <button onClick={() => setShow(!show)} className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--primary)", color: "white" }}><Plus size={13} className="inline mr-1" />Add Doctor</button>}</div>
  {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
  {show && <form onSubmit={submit} className="rounded-2xl border p-4 grid md:grid-cols-3 gap-3" style={cardStyle}>{[["Name","display_name"],["Specialty","specialty"],["Phone","phone"],["Email","email"],["License number","license_number"]].map(([label,key]) => <label key={key} className="text-xs font-semibold">{label}<input required={key === "display_name"} value={form[key as keyof typeof form]} onChange={(e) => setForm({...form,[key]:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" /></label>)}<div className="flex items-end"><button className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--accent)", color: "white" }}>Save Doctor</button></div></form>}
  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{items.map((doctor) => <div key={doctor.id} className="rounded-2xl border p-4" style={cardStyle}><div className="w-11 h-11 rounded-xl grid place-items-center text-white font-bold mb-3" style={{ background: "var(--primary)" }}>{doctor.display_name.split(" ").map(p=>p[0]).slice(0,2).join("")}</div><div className="font-semibold">{doctor.display_name}</div><div className="text-xs mt-1" style={{ color: "var(--accent)" }}>{doctor.specialty || "General Dentistry"}</div><div className="text-xs mt-3" style={muted}>{doctor.email || "No email"}<br />{doctor.phone || "No phone"}</div></div>)}</div>{items.length === 0 && <EmptyState icon={Stethoscope} title="No doctors yet" description="Add the first clinician to the live database." />}</div>;
}

export function ClinicServices() {
  const { role } = useAuth();
  const [items, setItems] = useState<TreatmentCatalogItem[]>([]);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ code: "", name_en: "", name_ar: "", duration_minutes: "30", default_price: "0" });
  const load = async () => setItems(await clinicRepository.listTreatments());
  useEffect(() => { void load(); }, []);
  const submit = async (e: FormEvent) => { e.preventDefault(); setError(""); try { await clinicRepository.createTreatment({ code: form.code, name_en: form.name_en, name_ar: form.name_ar, duration_minutes: Number(form.duration_minutes), default_price: Number(form.default_price) }); setForm({ code: "", name_en: "", name_ar: "", duration_minutes: "30", default_price: "0" }); setShow(false); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to add treatment."); } };
  return <div className="space-y-5"><div className="flex items-end justify-between"><div><h2 className="text-xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>Treatments & Services</h2><p className="text-xs" style={muted}>Live treatment catalog used by appointments and billing.</p></div>{role === "admin" && <button onClick={() => setShow(!show)} className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--primary)", color: "white" }}><Plus size={13} className="inline mr-1" />Add Treatment</button>}</div>
  {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}{show && <form onSubmit={submit} className="rounded-2xl border p-4 grid md:grid-cols-5 gap-3" style={cardStyle}>{[["Code","code","text"],["English name","name_en","text"],["Arabic name","name_ar","text"],["Minutes","duration_minutes","number"],["Price","default_price","number"]].map(([label,key,type]) => <label key={key} className="text-xs font-semibold">{label}<input required={["code","name_en"].includes(key)} type={type} min={type === "number" ? "0" : undefined} value={form[key as keyof typeof form]} onChange={(e) => setForm({...form,[key]:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" /></label>)}<div className="md:col-span-5 flex justify-end"><button className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--accent)", color: "white" }}>Save Treatment</button></div></form>}
  <div className="rounded-2xl border overflow-hidden" style={cardStyle}><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}><th className="px-4 py-3">Code</th><th className="px-4 py-3">Treatment</th><th className="px-4 py-3">Arabic</th><th className="px-4 py-3">Duration</th><th className="px-4 py-3">Default price</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}><td className="px-4 py-3 font-semibold">{item.code}</td><td className="px-4 py-3">{item.name_en}</td><td className="px-4 py-3" dir="rtl">{item.name_ar || "—"}</td><td className="px-4 py-3">{item.duration_minutes} min</td><td className="px-4 py-3 font-bold">${Number(item.default_price).toLocaleString()}</td></tr>)}</tbody></table></div></div></div>;
}

export function ClinicUsers() {
  type ManageableStaffRole = "dentist" | "receptionist" | "accountant";
  type StaffRole = "clinic_owner" | ManageableStaffRole;
  type StaffUser = {
    id: string;
    email?: string;
    full_name?: string;
    role: StaffRole;
    active: boolean;
    last_sign_in_at?: string | null;
    email_confirmed_at?: string | null;
    must_change_password?: boolean;
  };

  const { activeClinicId, activeClinicRole } = useAuth();
  const [items, setItems] = useState<StaffUser[]>([]);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "receptionist" as ManageableStaffRole,
    specialty: "",
    license_number: "",
  });

  const load = async () => {
    if (!activeClinicId) return;
    setError("");
    try {
      setItems((await clinicRepository.listClinicUsers()) as StaffUser[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users.");
    }
  };

  useEffect(() => { void load(); }, [activeClinicId]);

  if (!activeClinicId) return <EmptyState icon={UserRound} title="No clinic selected" description="Select a clinic before managing staff." />;
  if (activeClinicRole !== "clinic_owner") return <EmptyState icon={UserRound} title="Clinic Owner access required" description="Only the Clinic Owner can create or manage staff accounts." />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await clinicRepository.createClinicUser(form);
      setForm({ full_name: "", email: "", password: "", role: "receptionist", specialty: "", license_number: "" });
      setShow(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user.");
    } finally {
      setSaving(false);
    }
  };

  const update = async (item: StaffUser, role: ManageableStaffRole, active: boolean) => {
    setError("");
    try {
      await clinicRepository.updateClinicUser({ user_id: item.id, role, active });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update user.");
    }
  };

  return <div className="space-y-5">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>Users & Access</h2>
        <p className="text-xs" style={muted}>Manage Dentist, Receptionist, and Accountant access for this clinic. The Clinic Owner is locked. New staff change their temporary password on first login.</p>
      </div>
      <button onClick={() => setShow(!show)} className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--primary)", color: "white" }}>
        <Plus size={13} className="inline mr-1" />Add Staff User
      </button>
    </div>

    {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

    {show && <form onSubmit={submit} className="rounded-2xl border p-4 grid md:grid-cols-2 xl:grid-cols-3 gap-3" style={cardStyle}>
      <label className="text-xs font-semibold">Full name<input required value={form.full_name} onChange={(e)=>setForm({...form,full_name:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent" /></label>
      <label className="text-xs font-semibold">Email<input required type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent" /></label>
      <label className="text-xs font-semibold">Temporary password<input required minLength={8} type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent" /></label>
      <label className="text-xs font-semibold">Role
        <select value={form.role} onChange={(e)=>setForm({...form,role:e.target.value as ManageableStaffRole})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent">
          <option value="dentist">Dentist</option><option value="receptionist">Receptionist</option><option value="accountant">Accountant</option>
        </select>
      </label>
      {form.role === "dentist" && <>
        <label className="text-xs font-semibold">Specialty<input value={form.specialty} onChange={(e)=>setForm({...form,specialty:e.target.value})} placeholder="e.g. General Dentistry" className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent" /></label>
        <label className="text-xs font-semibold">License number<input value={form.license_number} onChange={(e)=>setForm({...form,license_number:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent" /></label>
      </>}
      <div className="md:col-span-2 xl:col-span-3 flex justify-end"><button disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background:"var(--accent)",color:"white" }}>{saving ? "Creating..." : "Create Staff Account"}</button></div>
    </form>}

    <div className="rounded-2xl border overflow-hidden" style={cardStyle}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead><tr className="text-left border-b" style={{ borderColor:"var(--border)", color:"var(--muted-foreground)" }}><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Password</th><th className="px-4 py-3">Last sign-in</th><th className="px-4 py-3">Access</th></tr></thead>
          <tbody>
            {items.map((item)=><tr key={item.id} className="border-b last:border-0" style={{ borderColor:"var(--border)" }}>
              <td className="px-4 py-3"><div className="font-semibold">{item.full_name || item.email}</div><div className="text-xs" style={muted}>{item.email}</div></td>
              <td className="px-4 py-3">
                {item.role === "clinic_owner" ? <div><div className="text-xs font-semibold" style={{ color:"var(--primary)" }}>Clinic Owner</div><div className="text-[11px]" style={muted}>Owner access · locked</div></div> :
                  <select value={item.role} onChange={(e)=>void update(item,e.target.value as ManageableStaffRole,item.active)} className="px-2 py-1.5 rounded-lg border bg-transparent text-xs"><option value="dentist">Dentist</option><option value="receptionist">Receptionist</option><option value="accountant">Accountant</option></select>}
              </td>
              <td className="px-4 py-3"><StatusBadge tone={item.email_confirmed_at ? "success" : "warning"}>{item.email_confirmed_at ? "Confirmed" : "Pending"}</StatusBadge></td>
              <td className="px-4 py-3"><StatusBadge tone={item.must_change_password ? "warning" : "success"}>{item.must_change_password ? "Temporary" : "Private"}</StatusBadge></td>
              <td className="px-4 py-3 text-xs" style={muted}>{item.last_sign_in_at ? new Date(item.last_sign_in_at).toLocaleString() : "Never"}</td>
              <td className="px-4 py-3">
                {item.role === "clinic_owner" ? <StatusBadge tone="success">Owner · Locked</StatusBadge> :
                  <button onClick={()=>void update(item,item.role as ManageableStaffRole,!item.active)}><StatusBadge tone={item.active ? "success" : "danger"}>{item.active ? "Active" : "Disabled"}</StatusBadge></button>}
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
    {items.length === 0 && <EmptyState icon={UserRound} title="No staff users yet" description="Create the first staff account for this clinic." />}
  </div>;
}
