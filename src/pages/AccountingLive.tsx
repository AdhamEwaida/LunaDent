import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, CreditCard, Download, FilePlus2, LayoutDashboard, Plus, ReceiptText } from "lucide-react";
import { clinicRepository } from "@/clinic/repository";
import type { Invoice, Patient, Payment } from "@/clinic/types";
import { useAuth } from "@/auth/AuthContext";

const cardStyle = { background: "var(--card)", borderColor: "var(--border)" };
const muted = { color: "var(--muted-foreground)" };

const nav = [
  [LayoutDashboard, "Overview", "/accounting"],
  [ReceiptText, "Invoices", "/accounting/invoices"],
  [FilePlus2, "Create Invoice", "/accounting/create-invoice"],
  [CreditCard, "Payments", "/accounting/payments"],
  [BarChart3, "Reports", "/accounting/reports"],
] as const;

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value) || 0);
  } catch {
    return `${currency} ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" }) {
  const style = tone === "success"
    ? { background: "#ecfdf3", color: "#15803d" }
    : tone === "warning"
      ? { background: "#fff7ed", color: "#c2410c" }
      : { background: "var(--muted)", color: "var(--muted-foreground)" };
  return <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize" style={style}>{children}</span>;
}

function InvoiceTable({ invoices, currency }: { invoices: Invoice[]; currency: string }) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={cardStyle}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">Due</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3 font-semibold">{invoice.invoice_no}</td>
                <td className="px-4 py-3">{invoice.patient ? `${invoice.patient.first_name} ${invoice.patient.last_name}` : invoice.patient_id}</td>
                <td className="px-4 py-3">
                  <Badge tone={invoice.status === "paid" ? "success" : invoice.status === "partially_paid" ? "warning" : "neutral"}>
                    {invoice.status.replaceAll("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3">{money(Number(invoice.total), currency)}</td>
                <td className="px-4 py-3">{money(Number(invoice.paid_total), currency)}</td>
                <td className="px-4 py-3 font-bold">{money(Number(invoice.balance_due), currency)}</td>
                <td className="px-4 py-3 text-xs" style={muted}>{invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : "Draft"}</td>
                <td className="px-4 py-3 text-xs" style={muted}>{invoice.due_at ? new Date(invoice.due_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {invoices.length === 0 && <div className="p-10 text-center text-sm" style={muted}>No invoices found.</div>}
    </div>
  );
}

export default function AccountingLive() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeClinic } = useAuth();
  const currency = activeClinic?.currency || "USD";
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [invoiceRows, paymentRows, patientRows] = await Promise.all([
        clinicRepository.listInvoices(),
        clinicRepository.listPayments(),
        clinicRepository.listPatients(),
      ]);
      setInvoices(invoiceRows);
      setPayments(paymentRows);
      setPatients(patientRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load accounting data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const totals = useMemo(() => ({
    billed: invoices.reduce((sum, item) => sum + Number(item.total), 0),
    paid: invoices.reduce((sum, item) => sum + Number(item.paid_total), 0),
    outstanding: invoices.reduce((sum, item) => sum + Number(item.balance_due), 0),
  }), [invoices]);

  const content = () => {
    if (location.pathname === "/accounting/create-invoice") {
      return <CreateInvoiceForm patients={patients} currency={currency} onCreated={async () => { await load(); navigate("/accounting/invoices"); }} />;
    }
    if (location.pathname === "/accounting/payments") {
      return <PaymentsPanel invoices={invoices} payments={payments} currency={currency} onRecorded={load} />;
    }
    if (location.pathname === "/accounting/invoices") {
      return (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Invoices</h2>
              <p className="text-xs" style={muted}>Live invoices and current balances for this clinic.</p>
            </div>
            <Link to="/accounting/create-invoice" className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--primary)", color: "white" }}>
              <Plus size={13} className="inline mr-1" />New Invoice
            </Link>
          </div>
          <InvoiceTable invoices={invoices} currency={currency} />
        </div>
      );
    }
    if (location.pathname === "/accounting/reports") {
      return <ReportsPanel invoices={invoices} payments={payments} currency={currency} clinicName={activeClinic?.name || "clinic"} />;
    }

    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>Accounting Overview</h2>
          <p className="text-sm" style={muted}>Live financial position across patient invoices and payments.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            ["Billed", totals.billed],
            ["Collected", totals.paid],
            ["Outstanding", totals.outstanding],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border p-4" style={cardStyle}>
              <div className="text-xs" style={muted}>{label}</div>
              <div className="text-2xl font-bold mt-1">{money(Number(value), currency)}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Invoices</h3>
            <Link to="/accounting/invoices" className="text-xs" style={{ color: "var(--accent)" }}>View all</Link>
          </div>
          <InvoiceTable invoices={invoices.slice(0, 8)} currency={currency} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      <aside className="hidden lg:flex w-60 flex-col p-4 text-white fixed inset-y-0 left-0" style={{ background: "var(--primary)" }}>
        <Link to="/admin" className="text-lg font-bold mb-7" style={{ fontFamily: "'Cormorant Garamond', serif" }}>LunaDent Finance</Link>
        <div className="space-y-1 flex-1">
          {nav.map(([Icon, label, path]) => (
            <Link key={path} to={path} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ background: location.pathname === path ? "rgba(255,255,255,.15)" : "transparent", color: location.pathname === path ? "white" : "rgba(255,255,255,.7)" }}>
              <Icon size={15} />{label}
            </Link>
          ))}
        </div>
        <Link to="/admin" className="text-sm text-white/60 px-3 py-2">Back to Admin</Link>
      </aside>

      <main className="flex-1 lg:ml-60">
        <header className="lg:hidden border-b px-4 py-3 flex gap-2 overflow-x-auto" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {nav.map(([Icon, label, path]) => (
            <Link key={path} to={path} className="flex items-center gap-1.5 px-3 py-2 rounded-xl min-w-max text-xs" style={{ background: location.pathname === path ? "var(--primary)" : "var(--muted)", color: location.pathname === path ? "white" : "var(--foreground)" }}>
              <Icon size={13} />{label}
            </Link>
          ))}
        </header>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {error && <div role="alert" className="mb-4 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
          {loading ? <div className="py-20 text-center text-sm" style={muted}>Loading accounting...</div> : content()}
        </div>
      </main>
    </div>
  );
}

function CreateInvoiceForm({ patients, currency, onCreated }: { patients: Patient[]; currency: string; onCreated: () => Promise<void> }) {
  const [patientId, setPatientId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await clinicRepository.createInvoice({
        patient_id: patientId,
        description,
        amount: Number(amount),
        due_at: dueAt ? new Date(dueAt + "T12:00:00").toISOString() : null,
      });
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create invoice.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold mb-1">Create Invoice</h2>
      <p className="text-xs mb-5" style={muted}>Creates an issued invoice and its first line item atomically.</p>
      <form onSubmit={submit} className="rounded-2xl border p-5 space-y-4" style={cardStyle}>
        {error && <div role="alert" className="px-3 py-2 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
        <label className="text-xs font-semibold block">
          Patient
          <select required value={patientId} onChange={(event) => setPatientId(event.target.value)} className="mt-1.5 w-full px-3 py-3 rounded-xl border bg-transparent text-sm">
            <option value="">Select patient</option>
            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.patient_no} - {patient.first_name} {patient.last_name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold block">
          Description
          <input required maxLength={240} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1.5 w-full px-3 py-3 rounded-xl border bg-transparent text-sm" placeholder="Root canal treatment - tooth 26" />
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-xs font-semibold">
            Amount ({currency})
            <input required min="0.01" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1.5 w-full px-3 py-3 rounded-xl border bg-transparent text-sm" />
          </label>
          <label className="text-xs font-semibold">
            Due Date
            <input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-1.5 w-full px-3 py-3 rounded-xl border bg-transparent text-sm" />
          </label>
        </div>
        <div className="flex justify-end">
          <button disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "var(--primary)", color: "white" }}>
            {saving ? "Creating..." : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PaymentsPanel({ invoices, payments, currency, onRecorded }: { invoices: Invoice[]; payments: Payment[]; currency: string; onRecorded: () => Promise<void> }) {
  const openInvoices = invoices.filter((invoice) => Number(invoice.balance_due) > 0 && invoice.status !== "void");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Payment["method"]>("card");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selected = openInvoices.find((invoice) => invoice.id === invoiceId);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await clinicRepository.recordPayment({ invoice_id: invoiceId, amount: Number(amount), method, reference });
      setInvoiceId("");
      setAmount("");
      setReference("");
      await onRecorded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to record payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Payments</h2>
        <p className="text-xs" style={muted}>Record payments against open invoices with atomic balance updates.</p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border p-4 grid md:grid-cols-5 gap-3" style={cardStyle}>
        {error && <div role="alert" className="md:col-span-5 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
        <label className="text-xs font-semibold md:col-span-2">
          Invoice
          <select required value={invoiceId} onChange={(event) => {
            setInvoiceId(event.target.value);
            const invoice = openInvoices.find((row) => row.id === event.target.value);
            if (invoice) setAmount(String(invoice.balance_due));
          }} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm">
            <option value="">Select open invoice</option>
            {openInvoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.invoice_no} - {invoice.patient?.first_name} {invoice.patient?.last_name} - {money(Number(invoice.balance_due), currency)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Amount
          <input required type="number" min="0.01" max={selected ? Number(selected.balance_due) : undefined} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" />
        </label>
        <label className="text-xs font-semibold">
          Method
          <select value={method} onChange={(event) => setMethod(event.target.value as Payment["method"])} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="text-xs font-semibold">
          Reference
          <input maxLength={120} value={reference} onChange={(event) => setReference(event.target.value)} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" />
        </label>
        <div className="md:col-span-5 text-right">
          <button disabled={saving || !invoiceId} className="px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "var(--primary)", color: "white" }}>
            {saving ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </form>

      <div>
        <h3 className="font-semibold mb-3">Recent Payments</h3>
        <div className="space-y-2">
          {payments.slice(0, 25).map((payment) => (
            <div key={payment.id} className="rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={cardStyle}>
              <div>
                <div className="font-semibold">{money(Number(payment.amount), currency)}</div>
                <div className="text-xs" style={muted}>{payment.method.replaceAll("_", " ")} · {new Date(payment.paid_at).toLocaleString()}</div>
              </div>
              <div className="text-xs" style={muted}>{payment.reference || "No reference"}</div>
            </div>
          ))}
          {payments.length === 0 && <div className="text-sm" style={muted}>No payments recorded.</div>}
        </div>
      </div>
    </div>
  );
}

function ReportsPanel({ invoices, payments, currency, clinicName }: { invoices: Invoice[]; payments: Payment[]; currency: string; clinicName: string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const within = (value: string | null | undefined) => {
    if (!value) return !from && !to;
    const day = new Date(value).toISOString().slice(0, 10);
    return (!from || day >= from) && (!to || day <= to);
  };

  const filteredInvoices = invoices.filter((invoice) => within(invoice.issued_at));
  const filteredPayments = payments.filter((payment) => within(payment.paid_at));

  const total = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
  const paid = filteredPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const outstanding = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.balance_due), 0);
  const paidInvoices = filteredInvoices.filter((invoice) => invoice.status === "paid").length;

  const byMethod = filteredPayments.reduce<Record<string, number>>((acc, payment) => {
    acc[payment.method] = (acc[payment.method] || 0) + Number(payment.amount);
    return acc;
  }, {});

  const exportCsv = () => {
    const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows: string[][] = [
      ["LunaDent Financial Report"],
      ["Clinic", clinicName],
      ["Currency", currency],
      ["From", from || "All time"],
      ["To", to || "All time"],
      [],
      ["Invoices"],
      ["Invoice", "Patient", "Status", "Total", "Paid", "Balance", "Issued", "Due"],
      ...filteredInvoices.map((invoice) => [
        invoice.invoice_no,
        invoice.patient ? `${invoice.patient.first_name} ${invoice.patient.last_name}` : invoice.patient_id,
        invoice.status,
        String(invoice.total),
        String(invoice.paid_total),
        String(invoice.balance_due),
        invoice.issued_at || "",
        invoice.due_at || "",
      ]),
      [],
      ["Payments"],
      ["Payment ID", "Invoice ID", "Amount", "Method", "Reference", "Paid At"],
      ...filteredPayments.map((payment) => [
        payment.id,
        payment.invoice_id || "",
        String(payment.amount),
        payment.method,
        payment.reference || "",
        payment.paid_at,
      ]),
    ];
    const csv = rows.map((row) => row.map(quote).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeName = clinicName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "clinic";
    anchor.href = url;
    anchor.download = `${safeName}-financial-report-${from || "all"}-${to || "all"}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Financial Reports</h2>
          <p className="text-xs" style={muted}>Filter billing and collections by date, then export the underlying transactions.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold">
            From
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 block rounded-xl border bg-transparent px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold">
            To
            <input type="date" min={from || undefined} value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 block rounded-xl border bg-transparent px-3 py-2 text-sm" />
          </label>
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold">
            <Download size={14} />Export CSV
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Invoice Value", total],
          ["Payments", paid],
          ["Outstanding", outstanding],
          ["Paid Invoices", paidInvoices],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border p-4" style={cardStyle}>
            <div className="text-xs" style={muted}>{label}</div>
            <div className="text-xl font-bold mt-1">{label === "Paid Invoices" ? Number(value) : money(Number(value), currency)}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4" style={cardStyle}>
          <h3 className="font-semibold">Collections by method</h3>
          <div className="mt-4 space-y-3">
            {(["cash", "card", "bank_transfer", "other"] as const).map((method) => (
              <div key={method} className="flex items-center justify-between gap-3 text-sm">
                <span className="capitalize" style={muted}>{method.replaceAll("_", " ")}</span>
                <b>{money(byMethod[method] || 0, currency)}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border p-4" style={cardStyle}>
          <h3 className="font-semibold">Report scope</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs" style={muted}>Invoices</div><b>{filteredInvoices.length}</b></div>
            <div><div className="text-xs" style={muted}>Payments</div><b>{filteredPayments.length}</b></div>
            <div><div className="text-xs" style={muted}>From</div><b>{from || "All time"}</b></div>
            <div><div className="text-xs" style={muted}>To</div><b>{to || "All time"}</b></div>
          </div>
        </div>
      </div>

      <InvoiceTable invoices={filteredInvoices} currency={currency} />
    </div>
  );
}
