import { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, FileText, CreditCard, Star, Folder, MessageSquare,
  Settings, LogOut, Menu, X, Bell, ChevronRight, TrendingUp, Clock, CheckCircle2,
  Plus, Download, Upload, Eye, Filter, Search, ArrowRight, User, Shield
} from "lucide-react";
import { FadeIn, StaggerGroup, StaggerItem, HoverCard } from "@/components/Motion";

const PORTAL_NAV = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/patient-portal" },
  { icon: Calendar, label: "Appointments", path: "/patient-portal/appointments" },
  { icon: FileText, label: "Invoices", path: "/patient-portal/invoices" },
  { icon: CreditCard, label: "Payments", path: "/patient-portal/payments" },
  { icon: Star, label: "Reward Points", path: "/patient-portal/rewards" },
  { icon: Folder, label: "Documents", path: "/patient-portal/documents" },
  { icon: MessageSquare, label: "Messages", path: "/patient-portal/messages" },
  { icon: Settings, label: "Settings", path: "/patient-portal/settings" },
];

function PortalSidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const location = useLocation();
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 lg:hidden" style={{ background: "rgba(0,0,0,0.5)" }} />
        )}
      </AnimatePresence>

      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--primary)" }}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "rgba(255,255,255,0.15)" }}>L</div>
            <span className="font-bold text-sm text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>LunaDent Studio</span>
          </Link>
          <button onClick={() => setOpen(false)} className="text-white/60 lg:hidden"><X size={18} /></button>
        </div>

        {/* Patient Info */}
        <div className="px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: "var(--accent)", color: "white" }}>SA</div>
            <div>
              <div className="text-sm font-semibold text-white">Sofia Anderson</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Patient ID: #P-10284</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {PORTAL_NAV.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: active ? "rgba(255,255,255,0.15)" : "transparent",
                  color: active ? "white" : "rgba(255,255,255,0.65)",
                }}>
                <item.icon size={16} />
                {item.label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <Link to="/"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ color: "rgba(255,255,255,0.6)" }}>
            <LogOut size={15} />Back to Website
          </Link>
        </div>
      </aside>
    </>
  );
}

function PortalHeader({ setOpen }: { setOpen: (v: boolean) => void }) {
  return (
    <header className="h-16 border-b flex items-center px-4 md:px-6 gap-4"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg" style={{ color: "var(--primary)" }}>
        <Menu size={20} />
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <Link to="/booking"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          <Plus size={13} />New Appointment
        </Link>
        <button className="relative p-2 rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <Bell size={16} style={{ color: "var(--foreground)" }} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ background: "var(--accent)" }}>SA</div>
      </div>
    </header>
  );
}

// ===== DASHBOARD =====
function PortalDashboard() {
  const appointments = [
    { date: "Apr 22, 2026", time: "10:30 AM", doctor: "Dr. Sophie Laurent", treatment: "Veneer Follow-Up", status: "Upcoming" },
    { date: "Mar 15, 2026", time: "2:00 PM", doctor: "Dr. James Adebayo", treatment: "Implant Check", status: "Completed" },
    { date: "Feb 28, 2026", time: "11:00 AM", doctor: "Dr. Mia Chen", treatment: "Aligner Fitting #3", status: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
              Good morning, Sofia ✨
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Here's your dental care overview</p>
          </div>
          <Link to="/booking"
            className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Calendar size={14} />Book Appointment
          </Link>
        </div>
      </FadeIn>

      {/* Summary Cards */}
      <StaggerGroup className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: "📅", label: "Next Appt", value: "Apr 22", sub: "10:30 AM", color: "var(--primary)" },
          { icon: "✅", label: "Last Visit", value: "Mar 15", sub: "Completed", color: "var(--accent)" },
          { icon: "💳", label: "Balance", value: "$320", sub: "Outstanding", color: "#B96A8D" },
          { icon: "⭐", label: "Rewards", value: "2,450", sub: "Points", color: "#D7B98E" },
          { icon: "📦", label: "Installment", value: "$85/mo", sub: "3 remaining", color: "var(--primary)" },
          { icon: "📁", label: "Documents", value: "8", sub: "Files", color: "var(--accent)" },
        ].map((c, i) => (
          <StaggerItem key={i}>
            <div className="p-4 rounded-2xl border text-center"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="font-bold text-lg" style={{ color: c.color, fontFamily: "'Cormorant Garamond', serif" }}>{c.value}</div>
              <div className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{c.label}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{c.sub}</div>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>

      {/* Treatment Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <Calendar size={15} style={{ color: "var(--primary)" }} />Upcoming Appointments
          </h3>
          <div className="space-y-3">
            {appointments.map((a, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "var(--muted)" }}>
                <div className="text-center w-12 flex-shrink-0">
                  <div className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                    {a.date.split(",")[0].split(" ")[0]}
                  </div>
                  <div className="text-xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>
                    {a.date.split(" ")[1].replace(",", "")}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{a.treatment}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{a.doctor} · {a.time}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${a.status === "Upcoming" ? "" : "opacity-60"}`}
                  style={{
                    background: a.status === "Upcoming" ? "var(--primary)" : "var(--muted)",
                    color: a.status === "Upcoming" ? "white" : "var(--muted-foreground)",
                  }}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Rewards Card */}
          <div className="rounded-2xl p-5 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
              style={{ background: "white", transform: "translate(30%, -30%)" }} />
            <div className="text-xs opacity-70 mb-1">Reward Points</div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>2,450</div>
            <div className="text-xs opacity-70">≈ $24.50 in treatment credits</div>
            <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-xs opacity-80">
              <span>Gold Member</span>
              <span>⭐ Active</span>
            </div>
          </div>

          {/* Invoice Card */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <h4 className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Latest Invoice</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--muted-foreground)" }}>#INV-2612</span>
                <span className="text-green-600 font-medium text-xs">Paid ✓</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--foreground)" }}>Veneer (Upper 4)</span>
                <span className="font-semibold" style={{ color: "var(--primary)" }}>$2,400</span>
              </div>
            </div>
            <Link to="/patient-portal/invoices"
              className="mt-3 flex items-center justify-center gap-1 text-xs py-2 rounded-lg"
              style={{ background: "var(--secondary)", color: "var(--primary)" }}>
              View All Invoices <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== APPOINTMENTS =====
function PortalAppointments() {
  const all = [
    { id: "APT-001", date: "Apr 22, 2026", time: "10:30 AM", doctor: "Dr. Sophie Laurent", treatment: "Veneer Follow-Up", status: "Upcoming", notes: "Bring insurance card" },
    { id: "APT-002", date: "Mar 15, 2026", time: "2:00 PM", doctor: "Dr. James Adebayo", treatment: "Implant Check", status: "Completed", notes: "" },
    { id: "APT-003", date: "Feb 28, 2026", time: "11:00 AM", doctor: "Dr. Mia Chen", treatment: "Aligner Fitting #3", status: "Completed", notes: "" },
    { id: "APT-004", date: "Jan 14, 2026", time: "9:00 AM", doctor: "Dr. Sophie Laurent", treatment: "Smile Design Consultation", status: "Completed", notes: "" },
  ];
  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>Appointments</h1>
          <Link to="/booking"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Plus size={14} />Book New
          </Link>
        </div>
      </FadeIn>
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                {["ID","Date & Time","Doctor","Treatment","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {all.map((a, i) => (
                <tr key={i} className="border-b transition-colors hover:bg-muted/30" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{a.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-xs" style={{ color: "var(--foreground)" }}>{a.date}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{a.time}</div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>{a.doctor}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>{a.treatment}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: a.status === "Upcoming" ? "rgba(59,30,84,0.1)" : "rgba(34,197,94,0.1)",
                        color: a.status === "Upcoming" ? "var(--primary)" : "#16a34a",
                      }}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                      View
                    </button>
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

// ===== INVOICES =====
function PortalInvoices() {
  const invoices = [
    { id: "INV-2612", date: "Mar 15, 2026", treatment: "Porcelain Veneer — Upper 4", amount: 2400, paid: 2400, status: "Paid" },
    { id: "INV-2589", date: "Feb 28, 2026", treatment: "Clear Aligner Kit #3", amount: 850, paid: 850, status: "Paid" },
    { id: "INV-2541", date: "Jan 14, 2026", treatment: "Smile Design Consultation", amount: 350, paid: 350, status: "Paid" },
    { id: "INV-2630", date: "Apr 22, 2026", treatment: "Veneer Follow-Up", amount: 320, paid: 0, status: "Pending" },
  ];
  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>Invoices</h1>
      </FadeIn>
      <StaggerGroup className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Billed", value: "$3,920", icon: "📊" },
          { label: "Total Paid", value: "$3,600", icon: "✅" },
          { label: "Outstanding", value: "$320", icon: "⏳" },
        ].map((s, i) => (
          <StaggerItem key={i}>
            <div className="p-5 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>{s.value}</div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{s.label}</div>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--muted)" }}>
                {["Invoice","Date","Treatment","Amount","Paid","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: "var(--primary)" }}>{inv.id}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{inv.date}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>{inv.treatment}</td>
                  <td className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--foreground)" }}>${inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: inv.paid === inv.amount ? "#16a34a" : "var(--muted-foreground)" }}>
                    ${inv.paid.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: inv.status === "Paid" ? "rgba(34,197,94,0.1)" : "rgba(215,185,142,0.2)",
                        color: inv.status === "Paid" ? "#16a34a" : "#92400e",
                      }}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg" style={{ background: "var(--secondary)", color: "var(--primary)" }}><Eye size={13} /></button>
                      <button className="p-1.5 rounded-lg" style={{ background: "var(--secondary)", color: "var(--primary)" }}><Download size={13} /></button>
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

// ===== PAYMENTS =====
function PortalPayments() {
  const plans = [
    { id: "PP-001", treatment: "Porcelain Veneers (Upper 6)", total: 3600, paid: 2400, remaining: 1200, monthly: 400, nextDue: "May 1, 2026", installments: 3, paidCount: 2 },
    { id: "PP-002", treatment: "Clear Aligners Full Treatment", total: 3500, paid: 3500, remaining: 0, monthly: 291.67, nextDue: "—", installments: 12, paidCount: 12 },
  ];
  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>Payments & Plans</h1>
      </FadeIn>
      <StaggerGroup className="space-y-4">
        {plans.map((p, i) => (
          <StaggerItem key={i}>
            <div className="rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-semibold" style={{ color: "var(--foreground)" }}>{p.treatment}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Plan ID: {p.id}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold`}
                  style={{
                    background: p.remaining === 0 ? "rgba(34,197,94,0.1)" : "rgba(59,30,84,0.1)",
                    color: p.remaining === 0 ? "#16a34a" : "var(--primary)",
                  }}>
                  {p.remaining === 0 ? "Completed" : "Active"}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  { label: "Total", val: `$${p.total.toLocaleString()}` },
                  { label: "Paid", val: `$${p.paid.toLocaleString()}` },
                  { label: "Remaining", val: `$${p.remaining.toLocaleString()}` },
                  { label: "Next Due", val: p.nextDue },
                ].map((s, j) => (
                  <div key={j} className="text-center p-3 rounded-xl" style={{ background: "var(--muted)" }}>
                    <div className="font-bold text-sm" style={{ color: "var(--primary)" }}>{s.val}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--muted-foreground)" }}>Progress</span>
                  <span style={{ color: "var(--primary)" }}>{p.paidCount}/{p.installments} installments</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "var(--muted)" }}>
                  <div className="h-2 rounded-full transition-all"
                    style={{ width: `${(p.paidCount / p.installments) * 100}%`, background: "var(--primary)" }} />
                </div>
              </div>
              {p.remaining > 0 && (
                <button className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  Make Payment — ${p.monthly.toFixed(2)}
                </button>
              )}
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  );
}

// ===== REWARDS =====
function PortalRewards() {
  const history = [
    { date: "Mar 15, 2026", desc: "Completed Veneer Treatment", points: "+500", type: "earned" },
    { date: "Feb 28, 2026", desc: "Referral Bonus — Maria L.", points: "+250", type: "earned" },
    { date: "Jan 20, 2026", desc: "Redeemed — Whitening Kit", points: "-300", type: "redeemed" },
    { date: "Jan 14, 2026", desc: "First Consultation Bonus", points: "+100", type: "earned" },
  ];
  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>Reward Points</h1>
      </FadeIn>
      <FadeIn>
        <div className="rounded-3xl p-8 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: "white", transform: "translate(30%, -30%)" }} />
          <div className="text-sm opacity-70 mb-2">Total Reward Points</div>
          <div className="text-6xl font-bold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>2,450</div>
          <div className="text-sm opacity-70 mb-6">≈ $24.50 in treatment credits · Gold Member</div>
          <div className="flex flex-wrap gap-4">
            <div className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: "rgba(255,255,255,0.15)" }}>
              ⭐ Gold Tier — 550 pts to Platinum
            </div>
            <button className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "#D7B98E", color: "#2E2A2F" }}>
              Redeem Points
            </button>
          </div>
        </div>
      </FadeIn>

      <div className="rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b font-semibold text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
          Points History
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {history.map((h, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ background: h.type === "earned" ? "rgba(34,197,94,0.1)" : "rgba(215,185,142,0.2)" }}>
                {h.type === "earned" ? "+" : "-"}
              </div>
              <div className="flex-1">
                <div className="text-sm" style={{ color: "var(--foreground)" }}>{h.desc}</div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{h.date}</div>
              </div>
              <div className={`font-bold text-sm`} style={{ color: h.type === "earned" ? "#16a34a" : "#b96a8d" }}>
                {h.points}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== DOCUMENTS =====
function PortalDocuments() {
  const docs = [
    { name: "X-Ray — Full Mouth Jan 2026", type: "Radiology", date: "Jan 14, 2026", size: "2.4 MB", visible: true },
    { name: "Treatment Plan — Veneers", type: "Treatment Plan", date: "Jan 14, 2026", size: "0.8 MB", visible: true },
    { name: "Consent Form — Implant", type: "Consent", date: "Nov 3, 2025", size: "0.3 MB", visible: true },
    { name: "Invoice Printout #INV-2612", type: "Invoice", date: "Mar 15, 2026", size: "0.2 MB", visible: true },
    { name: "Clinical Notes — Dr. Laurent", type: "Clinical", date: "Mar 15, 2026", size: "0.1 MB", visible: false },
  ];
  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>Documents</h1>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Upload size={14} />Upload
          </button>
        </div>
      </FadeIn>
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        {docs.filter(d => d.visible).map((d, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: "var(--secondary)" }}>
              📄
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{d.name}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{d.type} · {d.date} · {d.size}</div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg" style={{ background: "var(--secondary)", color: "var(--primary)" }}><Eye size={14} /></button>
              <button className="p-2 rounded-lg" style={{ background: "var(--secondary)", color: "var(--primary)" }}><Download size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== PORTAL WRAPPER =====
export default function PatientPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const renderContent = () => {
    const path = location.pathname;
    if (path === "/patient-portal") return <PortalDashboard />;
    if (path === "/patient-portal/appointments") return <PortalAppointments />;
    if (path === "/patient-portal/invoices") return <PortalInvoices />;
    if (path === "/patient-portal/payments") return <PortalPayments />;
    if (path === "/patient-portal/rewards") return <PortalRewards />;
    if (path === "/patient-portal/documents") return <PortalDocuments />;
    if (path === "/patient-portal/login") return <PortalLogin />;
    return <PortalDashboard />;
  };

  if (location.pathname === "/patient-portal/login") return <PortalLogin />;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <PortalSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <PortalHeader setOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function PortalLogin() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)" }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl p-8 shadow-2xl"
        style={{ background: "var(--card)" }}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl"
            style={{ background: "var(--primary)", color: "white" }}>👤</div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
            Patient Portal
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Sign in to your LunaDent account</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1 block font-medium" style={{ color: "var(--muted-foreground)" }}>Email</label>
            <input type="email" placeholder="sofia@email.com" defaultValue="sofia@email.com"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }} />
          </div>
          <div>
            <label className="text-xs mb-1 block font-medium" style={{ color: "var(--muted-foreground)" }}>Password</label>
            <input type="password" placeholder="••••••••" defaultValue="••••••••"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }} />
          </div>
          <button onClick={() => navigate("/patient-portal")}
            className="w-full py-3.5 rounded-xl font-semibold text-sm"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            Sign In to Portal
          </button>
          <div className="text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
            Don't have an account?{" "}
            <Link to="/contact" className="font-medium" style={{ color: "var(--accent)" }}>Contact us</Link>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2 p-3 rounded-xl text-xs" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
          <Shield size={13} />Your data is encrypted and HIPAA compliant
        </div>
      </motion.div>
    </div>
  );
}
