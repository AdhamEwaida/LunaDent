import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileText, CreditCard, TrendingUp, LogOut, Menu, X,
  Bell, Plus, Download, Eye, Printer, Search, ArrowUp, ArrowDown, Settings,
  DollarSign, BarChart3, PieChart, Calendar, User, CheckCircle2, AlertCircle
} from "lucide-react";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/Motion";

const ACCOUNTING_NAV = [
  { icon: LayoutDashboard, label: "Overview", path: "/accounting" },
  { icon: FileText, label: "Invoices", path: "/accounting/invoices" },
  { icon: Plus, label: "Create Invoice", path: "/accounting/create-invoice" },
  { icon: CreditCard, label: "Payments", path: "/accounting/payments" },
  { icon: TrendingUp, label: "Payment Plans", path: "/accounting/payment-plans" },
  { icon: User, label: "Patient Statement", path: "/accounting/statement" },
  { icon: BarChart3, label: "Reports", path: "/accounting/reports" },
  { icon: Settings, label: "Settings", path: "/accounting/settings" },
];

function AccountingSidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const location = useLocation();
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)} className="fixed inset-0 z-30 lg:hidden bg-black/50" />
        )}
      </AnimatePresence>
      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-56 flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--primary)" }}>
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold text-white">L</div>
            <span className="text-sm font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Accounting</span>
          </Link>
          <button onClick={() => setOpen(false)} className="text-white/60 lg:hidden"><X size={15} /></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {ACCOUNTING_NAV.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: active ? "rgba(255,255,255,0.15)" : "transparent",
                  color: active ? "white" : "rgba(255,255,255,0.6)",
                }}>
                <item.icon size={15} />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <Link to="/admin" className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl" style={{ color: "rgba(255,255,255,0.5)" }}>
            <LogOut size={14} />Back to CRM
          </Link>
        </div>
      </aside>
    </>
  );
}

// ===== ACCOUNTING OVERVIEW =====
function AccountingOverview() {
  const kpis = [
    { icon: <DollarSign size={18} />, label: "Total Revenue (Apr)", value: "$48,320", change: "+8.4%", up: true, color: "var(--primary)" },
    { icon: <CheckCircle2 size={18} />, label: "Collected", value: "$41,200", change: "+12.1%", up: true, color: "#16a34a" },
    { icon: <AlertCircle size={18} />, label: "Outstanding", value: "$7,120", change: "+2.3%", up: false, color: "#B96A8D" },
    { icon: <TrendingUp size={18} />, label: "Active Plans", value: "34", change: "+6", up: true, color: "var(--accent)" },
  ];
  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>Accounting Overview</h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>April 2026 · Updated today</p>
          </div>
          <div className="flex gap-2">
            <Link to="/accounting/create-invoice"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <Plus size={13} />New Invoice
            </Link>
          </div>
        </div>
      </FadeIn>

      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <StaggerItem key={i}>
            <div className="p-5 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${k.color}18`, color: k.color }}>{k.icon}</div>
                <span className="text-xs font-semibold flex items-center gap-0.5"
                  style={{ color: k.up ? "#16a34a" : "#ef4444" }}>
                  {k.up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{k.change}
                </span>
              </div>
              <div className="text-2xl font-bold mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: k.color }}>{k.value}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{k.label}</div>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Recent Invoices</span>
            <Link to="/accounting/invoices" className="text-xs" style={{ color: "var(--accent)" }}>View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--muted)" }}>
                  {["Invoice","Patient","Treatment","Amount","Status"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { id: "INV-2630", patient: "Sofia A.", treatment: "Veneer Follow-Up", amount: "$320", status: "Pending" },
                  { id: "INV-2629", patient: "Priya N.", treatment: "Implant Session 2", amount: "$1,800", status: "Paid" },
                  { id: "INV-2628", patient: "Marcus T.", treatment: "Aligner #4", amount: "$290", status: "Paid" },
                  { id: "INV-2627", patient: "Emma W.", treatment: "Whitening Pro", amount: "$450", status: "Overdue" },
                ].map((inv, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: "var(--primary)" }}>{inv.id}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>{inv.patient}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{inv.treatment}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--foreground)" }}>{inv.amount}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs"
                        style={{
                          background: inv.status === "Paid" ? "rgba(34,197,94,0.1)" : inv.status === "Overdue" ? "rgba(239,68,68,0.1)" : "rgba(215,185,142,0.2)",
                          color: inv.status === "Paid" ? "#16a34a" : inv.status === "Overdue" ? "#ef4444" : "#92400e",
                        }}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Collection Breakdown */}
        <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Revenue Breakdown</h3>
          {[
            { label: "Cash / Card", val: "$22,400", pct: 46 },
            { label: "Payment Plans", val: "$18,800", pct: 39 },
            { label: "Insurance", val: "$7,120", pct: 15 },
          ].map((r, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span style={{ color: "var(--foreground)" }}>{r.label}</span>
                <span className="font-semibold" style={{ color: "var(--primary)" }}>{r.val}</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "var(--muted)" }}>
                <div className="h-2 rounded-full transition-all" style={{
                  width: `${r.pct}%`,
                  background: i === 0 ? "var(--primary)" : i === 1 ? "var(--accent)" : "#D7B98E"
                }} />
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{r.pct}%</div>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>Outstanding by Age</div>
            {[["0–30 days","$3,200"],["31–60 days","$2,480"],["60+ days","$1,440"]].map(([l,v]) => (
              <div key={l} className="flex justify-between text-xs py-1">
                <span style={{ color: "var(--muted-foreground)" }}>{l}</span>
                <span style={{ color: "var(--foreground)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== INVOICES LIST =====
function AccountingInvoices() {
  const invoices = Array.from({ length: 12 }, (_, i) => ({
    id: `INV-${2630 - i}`,
    date: `Apr ${16 - i > 0 ? 16 - i : 1}, 2026`,
    patient: ["Sofia A.","Priya N.","Marcus T.","Emma W.","David K.","Anna O."][i % 6],
    treatment: ["Veneers","Implants","Aligners","Whitening","General","Hollywood"][i % 6],
    amount: [320, 1800, 290, 450, 180, 4200][i % 6],
    status: ["Pending","Paid","Paid","Overdue","Paid","Paid"][i % 6],
  }));

  return (
    <div className="space-y-5">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>Invoices</h1>
          <Link to="/accounting/create-invoice"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Plus size={13} />Create Invoice
          </Link>
        </div>
      </FadeIn>
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
            <input placeholder="Search invoices..." className="w-full pl-8 pr-3 py-2 rounded-xl text-sm border outline-none"
              style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--muted)" }}>
                {["Invoice #","Date","Patient","Treatment","Amount","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={i} className="border-b hover:bg-muted/20 transition-colors" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: "var(--primary)" }}>{inv.id}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{inv.date}</td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--foreground)" }}>{inv.patient}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{inv.treatment}</td>
                  <td className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--foreground)" }}>${inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        background: inv.status === "Paid" ? "rgba(34,197,94,0.1)" : inv.status === "Overdue" ? "rgba(239,68,68,0.1)" : "rgba(215,185,142,0.2)",
                        color: inv.status === "Paid" ? "#16a34a" : inv.status === "Overdue" ? "#ef4444" : "#92400e",
                      }}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Link to="/accounting/invoice-print" className="p-1.5 rounded-lg" style={{ background: "var(--secondary)", color: "var(--primary)" }}><Eye size={12} /></Link>
                      <button className="p-1.5 rounded-lg" style={{ background: "var(--secondary)", color: "var(--primary)" }}><Printer size={12} /></button>
                      <button className="p-1.5 rounded-lg" style={{ background: "var(--secondary)", color: "var(--primary)" }}><Download size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===== CREATE INVOICE =====
function CreateInvoice() {
  const [items, setItems] = useState([
    { desc: "Porcelain Veneer — Upper Left 1", qty: 1, unit: 600, total: 600 },
    { desc: "Porcelain Veneer — Upper Left 2", qty: 1, unit: 600, total: 600 },
  ]);
  const subtotal = items.reduce((a, i) => a + i.total, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="max-w-3xl space-y-5">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>Create Invoice</h1>
          <div className="flex gap-2">
            <Link to="/accounting/invoice-print" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border"
              style={{ borderColor: "var(--border)", color: "var(--primary)" }}>
              <Eye size={13} />Preview
            </Link>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <CheckCircle2 size={13} />Save Invoice
            </button>
          </div>
        </div>
      </FadeIn>

      <FadeIn>
        <div className="rounded-2xl border p-6 space-y-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Patient</label>
              <select className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                <option>Sofia Anderson — P-10284</option>
                <option>Priya Nair — P-10275</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Appointment</label>
              <select className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                <option>Apr 22, 2026 — Veneer Follow-Up</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Invoice Date</label>
              <input type="date" defaultValue="2026-04-22" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Due Date</label>
              <input type="date" defaultValue="2026-05-22" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }} />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Treatment Items</div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs px-1" style={{ color: "var(--muted-foreground)" }}>
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-center">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl" style={{ background: "var(--muted)" }}>
                  <div className="col-span-6">
                    <input value={item.desc} readOnly className="w-full bg-transparent text-sm outline-none"
                      style={{ color: "var(--foreground)" }} />
                  </div>
                  <div className="col-span-2 text-center text-sm" style={{ color: "var(--foreground)" }}>{item.qty}</div>
                  <div className="col-span-2 text-center text-sm" style={{ color: "var(--foreground)" }}>${item.unit}</div>
                  <div className="col-span-2 text-right text-sm font-semibold" style={{ color: "var(--primary)" }}>${item.total}</div>
                </div>
              ))}
              <button onClick={() => setItems([...items, { desc: "New Treatment Item", qty: 1, unit: 0, total: 0 }])}
                className="w-full py-2.5 rounded-xl border border-dashed text-xs"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                + Add Item
              </button>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex justify-end">
              <div className="w-48 space-y-2">
                {[["Subtotal", `$${subtotal.toFixed(2)}`],["Tax (8%)", `$${tax.toFixed(2)}`]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span style={{ color: "var(--muted-foreground)" }}>{l}</span>
                    <span style={{ color: "var(--foreground)" }}>{v}</span>
                  </div>
                ))}
                <div className="flex justify-between text-base font-bold border-t pt-2" style={{ borderColor: "var(--border)" }}>
                  <span style={{ color: "var(--foreground)" }}>Total</span>
                  <span style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Notes</label>
            <textarea rows={2} placeholder="Payment instructions, thank you note..."
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
              style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

// ===== INVOICE PRINT PREVIEW =====
function InvoicePrint() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>Invoice Preview</h1>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border"
              style={{ borderColor: "var(--border)", color: "var(--primary)" }}>
              <Download size={13} />Download PDF
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <Printer size={13} />Print
            </button>
          </div>
        </div>
      </FadeIn>
      <FadeIn>
        <div className="rounded-2xl border p-8" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 8px 40px rgba(59,30,84,0.08)" }}>
          {/* Header */}
          <div className="flex justify-between items-start pb-6 mb-6 border-b" style={{ borderColor: "var(--border)" }}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>L</div>
                <span className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>LunaDent Studio</span>
              </div>
              <div className="text-xs space-y-0.5" style={{ color: "var(--muted-foreground)" }}>
                <div>88 Crescent Avenue, Suite 400</div>
                <div>Beverly Hills, CA 90210</div>
                <div>hello@lunadent.studio · +1 (800) 586-2636</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>INVOICE</div>
              <div className="text-sm font-mono font-semibold mt-1" style={{ color: "var(--accent)" }}>#INV-2630</div>
              <div className="text-xs mt-2 space-y-0.5" style={{ color: "var(--muted-foreground)" }}>
                <div>Issue: April 22, 2026</div>
                <div>Due: May 22, 2026</div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--muted-foreground)" }}>Bill To</div>
              <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Sofia Anderson</div>
              <div className="text-xs space-y-0.5 mt-1" style={{ color: "var(--muted-foreground)" }}>
                <div>Patient ID: P-10284</div>
                <div>sofia@email.com</div>
                <div>+1 310-555-0192</div>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--muted-foreground)" }}>Treatment By</div>
              <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Dr. Sophie Laurent</div>
              <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Lead Cosmetic Dentist</div>
            </div>
          </div>

          {/* Items */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr style={{ background: "var(--primary)" }}>
                {["Description","Qty","Unit Price","Amount"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-white first:rounded-l-lg last:rounded-r-lg">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Porcelain Veneer — Upper Left 1", 1, "$600", "$600"],
                ["Porcelain Veneer — Upper Left 2", 1, "$600", "$600"],
                ["Smile Design Consultation", 1, "$350", "$350"],
              ].map(([d, q, u, t], i) => (
                <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>{d}</td>
                  <td className="px-4 py-3 text-xs text-center" style={{ color: "var(--muted-foreground)" }}>{q}</td>
                  <td className="px-4 py-3 text-xs text-center" style={{ color: "var(--muted-foreground)" }}>{u}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-right" style={{ color: "var(--primary)" }}>{t}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-52 space-y-2 text-sm">
              {[["Subtotal","$1,550"],["Tax (8%)","$124"],["Discount","—$50"]].map(([l,v]) => (
                <div key={l} className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>{l}</span>
                  <span style={{ color: "var(--foreground)" }}>{v}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base border-t pt-2" style={{ borderColor: "var(--border)" }}>
                <span style={{ color: "var(--foreground)" }}>Total Due</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>$1,624.00</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="p-4 rounded-xl text-center" style={{ background: "var(--secondary)" }}>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Thank you for choosing LunaDent Studio. Payment is due within 30 days. For questions, contact hello@lunadent.studio
            </p>
            <div className="mt-2 w-16 h-0.5 mx-auto rounded-full" style={{ background: "var(--ring)" }} />
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

// ===== PAYMENT PLANS =====
function PaymentPlans() {
  const plans = [
    { id: "PP-001", patient: "Sofia Anderson", treatment: "Porcelain Veneers (6)", total: 3600, paid: 2400, remaining: 1200, monthly: 400, installments: 9, paidCount: 6, status: "Active", nextDue: "May 1" },
    { id: "PP-002", patient: "Marcus Thompson", treatment: "Clear Aligner Full", total: 3500, paid: 3500, remaining: 0, monthly: 291.67, installments: 12, paidCount: 12, status: "Completed", nextDue: "—" },
    { id: "PP-003", patient: "Priya Nair", treatment: "Dental Implant (2)", total: 5600, paid: 1400, remaining: 4200, monthly: 700, installments: 8, paidCount: 2, status: "Active", nextDue: "Apr 25" },
    { id: "PP-004", patient: "Emma Walsh", treatment: "Orthodontics", total: 3500, paid: 875, remaining: 2625, monthly: 250, installments: 14, paidCount: 3.5, status: "Behind", nextDue: "Apr 10 (Overdue)" },
  ];

  return (
    <div className="space-y-5">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>Payment Plans</h1>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Plus size={13} />New Plan
          </button>
        </div>
      </FadeIn>
      <StaggerGroup className="space-y-4">
        {plans.map((p, i) => (
          <StaggerItem key={i}>
            <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{p.treatment}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{p.patient} · {p.id}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: p.status === "Completed" ? "rgba(34,197,94,0.1)" : p.status === "Behind" ? "rgba(239,68,68,0.1)" : "rgba(59,30,84,0.1)",
                    color: p.status === "Completed" ? "#16a34a" : p.status === "Behind" ? "#ef4444" : "var(--primary)",
                  }}>
                  {p.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[["Total","$"+p.total.toLocaleString()],["Paid","$"+p.paid.toLocaleString()],["Remaining","$"+p.remaining.toLocaleString()],["Next Due",p.nextDue]].map(([l,v]) => (
                  <div key={l} className="p-3 rounded-xl text-center" style={{ background: "var(--muted)" }}>
                    <div className="font-bold text-sm" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>{v}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{l}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-2 rounded-full" style={{ background: "var(--muted)" }}>
                    <div className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (p.paid / p.total) * 100)}%`,
                        background: p.status === "Behind" ? "#ef4444" : "var(--primary)"
                      }} />
                  </div>
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  {Math.round((p.paid / p.total) * 100)}%
                </span>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  );
}

// ===== ACCOUNTING WRAPPER =====
const ACCOUNTING_TITLES: Record<string, string> = {
  "/accounting": "Accounting Overview",
  "/accounting/invoices": "Invoices",
  "/accounting/create-invoice": "Create Invoice",
  "/accounting/invoice-print": "Invoice Preview",
  "/accounting/payments": "Payments",
  "/accounting/payment-plans": "Payment Plans",
  "/accounting/statement": "Patient Statement",
  "/accounting/reports": "Reports",
  "/accounting/settings": "Settings",
};

export default function Accounting() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = ACCOUNTING_TITLES[location.pathname] || "Accounting";

  const renderContent = () => {
    const p = location.pathname;
    if (p === "/accounting") return <AccountingOverview />;
    if (p === "/accounting/invoices") return <AccountingInvoices />;
    if (p === "/accounting/create-invoice") return <CreateInvoice />;
    if (p === "/accounting/invoice-print") return <InvoicePrint />;
    if (p === "/accounting/payment-plans") return <PaymentPlans />;
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-semibold" style={{ color: "var(--primary)" }}>{title}</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Section ready for content</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <AccountingSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-56">
        <header className="h-14 border-b flex items-center px-4 gap-3"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg" style={{ color: "var(--primary)" }}>
            <Menu size={18} />
          </button>
          <h1 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>{title}</h1>
          <div className="flex-1" />
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "var(--accent)" }}>AD</div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-5">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
