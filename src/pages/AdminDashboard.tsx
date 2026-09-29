import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Calendar, FileText, CreditCard, Star, Settings,
  Menu, X, Bell, ChevronDown, TrendingUp, AlertCircle, CheckCircle2,
  Plus, Search, Filter, Eye, Edit, Trash2, Phone, Mail, MoreVertical,
  MessageSquare, Stethoscope, BookOpen, Image, BarChart3, LogOut, UserPlus,
  Clock, ArrowUp, ArrowDown, Smile, Briefcase, ClipboardList, Package
} from "lucide-react";
import { FadeIn, StaggerGroup, StaggerItem, HoverCard } from "@/components/Motion";
import { DOCTORS, TREATMENTS, IMAGES } from "@/lib/data";
import { ClinicAppointments, ClinicBookingRequests, ClinicDashboard, ClinicDoctors, ClinicInventory, ClinicPatients, ClinicPatientWorkspace, ClinicServices, ClinicTreatmentPlans, ClinicUsers } from "@/pages/ClinicOperations";
import { useAuth } from "@/auth/AuthContext";

const ADMIN_NAV = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin", section: "main" },
  { icon: Users, label: "Patients", path: "/admin/patients", section: "main" },
  { icon: Calendar, label: "Appointments", path: "/admin/appointments", section: "main" },
  { icon: Smile, label: "Booking Requests", path: "/admin/leads", section: "main" },
  { icon: ClipboardList, label: "Treatment Plans", path: "/admin/treatment-plans", section: "clinic" },
  { icon: Stethoscope, label: "Doctors", path: "/admin/doctors", section: "clinic" },
  { icon: Briefcase, label: "Treatments", path: "/admin/services", section: "clinic" },
  { icon: Package, label: "Inventory", path: "/admin/inventory", section: "clinic" },
  { icon: FileText, label: "Accounting", path: "/accounting", section: "finance" },
  { icon: Settings, label: "Users & Access", path: "/admin/users", section: "system" },
];

const SECTIONS = { main: "Operations", clinic: "Clinical", marketing: "Marketing", finance: "Finance", system: "System" };

function AdminSidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, demoMode, role } = useAuth();
  const visiblePaths: Record<string, string[]> = {
    dentist: ["/admin", "/admin/patients", "/admin/appointments", "/admin/treatment-plans", "/admin/inventory"],
    receptionist: ["/admin", "/admin/patients", "/admin/appointments", "/admin/leads", "/admin/doctors", "/admin/services", "/accounting"],
    accountant: ["/admin", "/admin/patients", "/accounting"],
  };
  const canSee = (path: string) => role === "admin" || !role || (visiblePaths[role]?.includes(path) ?? false);
  const grouped = Object.entries(SECTIONS).map(([key, label]) => ({
    label, items: ADMIN_NAV.filter(n => n.section === key && canSee(n.path))
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 lg:hidden bg-black/50" />
        )}
      </AnimatePresence>
      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-60 flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--primary)" }}>
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-white/15 text-white">L</div>
            <span className="text-sm font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>LunaDent CRM</span>
          </Link>
          <button onClick={() => setOpen(false)} className="text-white/60 lg:hidden"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {grouped.map(g => (
            <div key={g.label} className="mb-4">
              <div className="text-xs font-semibold tracking-widest uppercase px-2 mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {g.label}
              </div>
              {g.items.map(item => {
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all mb-0.5"
                    style={{
                      background: active ? "rgba(255,255,255,0.15)" : "transparent",
                      color: active ? "white" : "rgba(255,255,255,0.62)",
                    }}>
                    <item.icon size={15} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-3 border-t space-y-1" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            <Smile size={14} />Back to Website
          </Link>
          {!demoMode && <button onClick={async () => { await signOut(); navigate("/staff/login", { replace: true }); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            <LogOut size={14} />Sign Out
          </button>}
        </div>
      </aside>
    </>
  );
}

function AdminHeader({ title, setOpen }: { title: string; setOpen: (v: boolean) => void }) {
  return (
    <header className="h-14 border-b flex items-center px-4 gap-3"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <button onClick={() => setOpen(true)} className="lg:hidden p-1.5 rounded-lg" style={{ color: "var(--primary)" }}>
        <Menu size={18} />
      </button>
      <h1 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>{title}</h1>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <button className="relative p-1.5 rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <Bell size={15} style={{ color: "var(--foreground)" }} />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />
        </button>
        <div className="hidden md:flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "var(--accent)" }}>AD</div>
          <span className="text-xs">Admin</span>
        </div>
      </div>
    </header>
  );
}

// ===== ADMIN DASHBOARD =====
function AdminDashboard() {
  const kpis = [
    { icon: "👥", label: "Total Patients", value: "1,284", change: "+12%", up: true },
    { icon: "📅", label: "Today's Appts", value: "18", change: "+3", up: true },
    { icon: "💰", label: "Monthly Revenue", value: "$48,320", change: "+8.4%", up: true },
    { icon: "🎯", label: "Active Leads", value: "67", change: "-4", up: false },
    { icon: "⭐", label: "Avg Rating", value: "4.9", change: "+0.1", up: true },
    { icon: "📦", label: "Pending Tasks", value: "23", change: "+5", up: false },
  ];

  const recentPatients = [
    { name: "Sofia Anderson", treatment: "Veneer Follow-Up", time: "10:30 AM", status: "Checked In", img: "" },
    { name: "Priya Nair", treatment: "Implant Consultation", time: "11:00 AM", status: "Waiting", img: "" },
    { name: "Marcus T.", treatment: "Clear Aligner #4", time: "12:00 PM", status: "Confirmed", img: "" },
    { name: "Emma Walsh", treatment: "Whitening Session", time: "1:30 PM", status: "Upcoming", img: "" },
    { name: "David Kim", treatment: "Pediatric Checkup", time: "2:00 PM", status: "Upcoming", img: "" },
  ];

  const STATUS_COLORS: Record<string, string> = {
    "Checked In": "#16a34a",
    "Waiting": "#D7B98E",
    "Confirmed": "var(--primary)",
    "Upcoming": "var(--muted-foreground)",
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
              Wednesday, April 16, 2026
            </h2>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>18 appointments scheduled today</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/patients" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border"
              style={{ borderColor: "var(--border)", color: "var(--primary)" }}>
              <UserPlus size={13} />New Patient
            </Link>
            <Link to="/booking" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <Plus size={13} />New Appt
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* KPIs */}
      <StaggerGroup className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <StaggerItem key={i}>
            <div className="p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-xl">{k.icon}</span>
                <span className={`text-xs font-semibold flex items-center gap-0.5`}
                  style={{ color: k.up ? "#16a34a" : "#ef4444" }}>
                  {k.up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{k.change}
                </span>
              </div>
              <div className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>{k.value}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{k.label}</div>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today Schedule */}
        <div className="lg:col-span-2 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Today's Schedule</span>
            <Link to="/admin/appointments" className="text-xs" style={{ color: "var(--accent)" }}>View All →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {recentPatients.map((p, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: `hsl(${i * 40 + 280}, 40%, 55%)` }}>
                  {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{p.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.treatment} · {p.time}</div>
                </div>
                <span className="text-xs font-medium" style={{ color: STATUS_COLORS[p.status] || "var(--muted-foreground)" }}>
                  {p.status}
                </span>
                <button className="p-1.5 rounded-lg" style={{ color: "var(--muted-foreground)" }}>
                  <MoreVertical size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <h4 className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Revenue This Month</h4>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>$48,320</div>
            <div className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>+8.4% vs last month</div>
            <div className="space-y-2">
              {[
                { label: "Cosmetic", pct: 62, val: "$29,958" },
                { label: "Implants", pct: 24, val: "$11,597" },
                { label: "General", pct: 14, val: "$6,765" },
              ].map(r => (
                <div key={r.label}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                    <span>{r.label}</span><span>{r.val}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "var(--muted)" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${r.pct}%`, background: "var(--primary)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <h4 className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Pending Follow-Ups</h4>
            {["Sofia A. — Veneer review due","Marcus T. — Implant 3-mo check","Emma W. — Whitening touch-up"].map((f, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--accent)" }} />
                <span className="text-xs" style={{ color: "var(--foreground)" }}>{f}</span>
              </div>
            ))}
            <Link to="/admin/patients" className="mt-3 block text-xs font-medium" style={{ color: "var(--accent)" }}>
              View all tasks →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== PATIENTS LIST =====
function AdminPatients() {
  const [search, setSearch] = useState("");
  const patients = [
    { id: "P-10284", name: "Sofia Anderson", email: "sofia@email.com", phone: "+1 310-555-0192", lastVisit: "Mar 15", treatment: "Veneers", balance: "$320", status: "Active" },
    { id: "P-10275", name: "Priya Nair", email: "priya@email.com", phone: "+1 424-555-0183", lastVisit: "Apr 2", treatment: "Implants", balance: "$0", status: "Active" },
    { id: "P-10268", name: "Marcus Thompson", email: "m.t@email.com", phone: "+1 213-555-0147", lastVisit: "Feb 20", treatment: "Clear Aligners", balance: "$850", status: "Active" },
    { id: "P-10261", name: "Emma Walsh", email: "emma@email.com", phone: "+1 310-555-0211", lastVisit: "Jan 30", treatment: "Whitening", balance: "$0", status: "Inactive" },
    { id: "P-10254", name: "David Kim", email: "david@email.com", phone: "+1 323-555-0159", lastVisit: "Mar 28", treatment: "General", balance: "$120", status: "Active" },
  ];
  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-5">
      <FadeIn>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>Patients</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search patients..."
                className="pl-8 pr-3 py-2 rounded-xl text-sm border outline-none w-48"
                style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }} />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <UserPlus size={14} />New Patient
            </button>
          </div>
        </div>
      </FadeIn>
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--muted)" }}>
                {["Patient","Contact","Last Visit","Treatment","Balance","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={i} className="border-b transition-colors hover:bg-muted/20" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: "var(--accent)" }}>
                        {p.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-medium text-xs" style={{ color: "var(--foreground)" }}>{p.name}</div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs" style={{ color: "var(--foreground)" }}>{p.email}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{p.lastVisit}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>{p.treatment}</td>
                  <td className="px-4 py-3 text-xs font-semibold" style={{ color: p.balance !== "$0" ? "#B96A8D" : "#16a34a" }}>{p.balance}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: p.status === "Active" ? "rgba(34,197,94,0.1)" : "rgba(100,100,100,0.1)",
                        color: p.status === "Active" ? "#16a34a" : "var(--muted-foreground)",
                      }}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Link to="/admin/patient-profile" className="p-1.5 rounded-lg" style={{ background: "var(--secondary)", color: "var(--primary)" }}><Eye size={12} /></Link>
                      <button className="p-1.5 rounded-lg" style={{ background: "var(--secondary)", color: "var(--primary)" }}><Edit size={12} /></button>
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

// ===== PATIENT PROFILE =====
function AdminPatientProfile() {
  const [tab, setTab] = useState("overview");
  const tabs = ["overview", "appointments", "clinical", "documents", "before-after", "invoices", "payments", "rewards", "followups", "timeline"];

  return (
    <div className="space-y-5">
      {/* Patient Header */}
      <FadeIn>
        <div className="rounded-2xl p-5 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>SA</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>Sofia Anderson</h2>
                <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>Active</span>
                <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--secondary)", color: "var(--primary)" }}>⭐ Gold</span>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <span className="flex items-center gap-1"><Mail size={11} />sofia@email.com</span>
                <span className="flex items-center gap-1"><Phone size={11} />+1 310-555-0192</span>
                <span className="flex items-center gap-1"><Clock size={11} />Patient since Jan 2026</span>
                <span className="flex items-center gap-1"><CreditCard size={11} />$320 outstanding</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="p-2 rounded-xl border text-xs" style={{ borderColor: "var(--border)", color: "var(--primary)" }}>
                <MessageSquare size={14} />
              </button>
              <button className="px-3 py-2 rounded-xl text-sm font-medium"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                <Plus size={13} className="inline mr-1" />New Appt
              </button>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--muted)" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all"
            style={{
              background: tab === t ? "var(--card)" : "transparent",
              color: tab === t ? "var(--primary)" : "var(--muted-foreground)",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
            {t.replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {tab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Patient Info</h3>
                {[["Full Name","Sofia Anderson"],["Date of Birth","March 12, 1991 (35)"],["Gender","Female"],["Insurance","BlueCross #BCB-9812"],["Doctor","Dr. Sophie Laurent"],["Member Since","Jan 14, 2026"]].map(([l,v]) => (
                  <div key={l} className="flex justify-between py-2 border-b text-sm" style={{ borderColor: "var(--border)" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>{l}</span>
                    <span className="font-medium" style={{ color: "var(--foreground)" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Current Treatments</h3>
                  {["Porcelain Veneers (Upper 6) — Active","Clear Aligner Maintenance — Follow-up"].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5">
                      <CheckCircle2 size={13} style={{ color: "var(--accent)" }} />
                      <span className="text-sm" style={{ color: "var(--foreground)" }}>{t}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Billing Summary</h3>
                  {[["Total Billed","$3,920"],["Total Paid","$3,600"],["Outstanding","$320"],["Reward Points","2,450 pts"]].map(([l,v]) => (
                    <div key={l} className="flex justify-between text-sm py-1.5">
                      <span style={{ color: "var(--muted-foreground)" }}>{l}</span>
                      <span className="font-semibold" style={{ color: "var(--primary)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab === "clinical" && (
            <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Clinical Notes</h3>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  <Plus size={12} />Add Note
                </button>
              </div>
              {[
                { date: "Mar 15, 2026", doctor: "Dr. Sophie Laurent", note: "Patient presenting for veneer follow-up. Margins look excellent, no sensitivity reported. Patient very satisfied with results. Next review in 3 months.", type: "Follow-Up" },
                { date: "Jan 14, 2026", doctor: "Dr. Sophie Laurent", note: "Initial smile design consultation. Patient interested in upper veneer treatment — 6 units. Digital simulation completed and approved. Treatment plan signed.", type: "Consultation" },
              ].map((n, i) => (
                <div key={i} className="p-4 rounded-xl border mb-3" style={{ background: "var(--muted)", borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--secondary)", color: "var(--primary)" }}>{n.type}</span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{n.date}</span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--accent)" }}>{n.doctor}</span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--foreground)" }}>{n.note}</p>
                </div>
              ))}
            </div>
          )}
          {tab === "timeline" && (
            <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Patient Timeline</h3>
              <div className="relative pl-8">
                <div className="absolute left-3.5 top-0 bottom-0 w-0.5" style={{ background: "var(--border)" }} />
                {[
                  { date: "Mar 15, 2026", event: "Veneer Follow-Up Completed", type: "appointment" },
                  { date: "Mar 1, 2026", event: "Invoice #INV-2612 Paid — $2,400", type: "payment" },
                  { date: "Feb 28, 2026", event: "Clear Aligner Check #3", type: "appointment" },
                  { date: "Feb 10, 2026", event: "Referred: Priya Nair (+250 points)", type: "reward" },
                  { date: "Jan 14, 2026", event: "Initial Consultation — Smile Design", type: "appointment" },
                ].map((e, i) => (
                  <div key={i} className="relative mb-5 pl-2">
                    <div className="absolute -left-5 top-0.5 w-2.5 h-2.5 rounded-full border-2"
                      style={{
                        background: "var(--card)",
                        borderColor: e.type === "appointment" ? "var(--primary)" : e.type === "payment" ? "#16a34a" : "#D7B98E"
                      }} />
                    <div className="text-xs mb-0.5 font-medium" style={{ color: "var(--foreground)" }}>{e.event}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{e.date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {["appointments","invoices","payments","documents","before-after","rewards","followups"].includes(tab) && (
            <div className="rounded-2xl border p-8 text-center" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm capitalize font-medium" style={{ color: "var(--primary)" }}>{tab.replace("-", " ")} Tab</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                Patient-specific {tab.replace("-", " ")} records displayed here
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ===== LEADS PIPELINE =====
function AdminLeads() {
  const cols = [
    { title: "New Inquiry", color: "var(--primary)", leads: [
      { name: "Anna Okafor", source: "Instagram", treatment: "Hollywood Smile", date: "Today" },
      { name: "Reza M.", source: "Website", treatment: "Implants", date: "Yesterday" },
    ]},
    { title: "Consultation Scheduled", color: "var(--accent)", leads: [
      { name: "Leila H.", source: "WhatsApp", treatment: "Veneers", date: "Apr 18" },
      { name: "Tom Fisher", source: "Referral", treatment: "Whitening", date: "Apr 19" },
    ]},
    { title: "Treatment Proposed", color: "#D7B98E", leads: [
      { name: "Carmen L.", source: "Google", treatment: "Full Mouth", date: "Apr 12" },
    ]},
    { title: "Converted", color: "#16a34a", leads: [
      { name: "Sofia A.", source: "Instagram", treatment: "Veneers", date: "Jan 14" },
      { name: "Priya N.", source: "Google", treatment: "Implants", date: "Mar 2" },
      { name: "Marcus T.", source: "Referral", treatment: "Aligners", date: "Feb 1" },
    ]},
  ];
  return (
    <div className="space-y-5">
      <FadeIn>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>Leads Pipeline</h1>
      </FadeIn>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cols.map((col, i) => (
          <FadeIn key={i} delay={i * 0.08}>
            <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ background: col.color, color: "white" }}>
                <span className="font-semibold text-sm">{col.title}</span>
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">{col.leads.length}</span>
              </div>
              <div className="p-3 space-y-2">
                {col.leads.map((l, j) => (
                  <div key={j} className="p-3 rounded-xl border" style={{ background: "var(--muted)", borderColor: "var(--border)" }}>
                    <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{l.name}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{l.treatment}</div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "var(--secondary)", color: "var(--primary)" }}>{l.source}</span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{l.date}</span>
                    </div>
                  </div>
                ))}
                <button className="w-full py-2 rounded-xl text-xs border border-dashed transition-colors hover:opacity-70"
                  style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                  + Add Lead
                </button>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}

// ===== DOCTORS =====
function AdminDoctors() {
  return (
    <div className="space-y-5">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>Doctors</h1>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Plus size={13} />Add Doctor
          </button>
        </div>
      </FadeIn>
      <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCTORS.map((d, i) => (
          <StaggerItem key={d.id}>
            <div className="rounded-2xl border p-5 flex gap-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <img src={d.img} alt={d.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{d.name}</div>
                    <div className="text-xs" style={{ color: "var(--accent)" }}>{d.title}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "#D7B98E" }}>
                    ⭐ {d.rating}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {d.specialties.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--secondary)", color: "var(--primary)" }}>{s}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <button className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "var(--secondary)", color: "var(--primary)" }}>View Profile</button>
                  <button className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>Edit</button>
                </div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  );
}

// ===== ADMIN WRAPPER =====
const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/patients": "Patients",
  "/admin/appointments": "Appointments",
  "/admin/treatment-plans": "Treatment Plans",
  "/admin/inventory": "Inventory",
  "/admin/leads": "Leads Pipeline",
  "/admin/patient-profile": "Patient Profile",
  "/admin/doctors": "Doctors",
  "/admin/services": "Services",
  "/admin/surveys": "Surveys",
  "/admin/rewards": "Rewards",
  "/admin/media": "Media Center",
  "/admin/blog": "Blog",
  "/admin/settings": "Settings",
};

export default function AdminDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = location.pathname.startsWith("/admin/patients/") ? "Patient Record" : (PAGE_TITLES[location.pathname] || "Admin");

  const renderContent = () => {
    const p = location.pathname;
    if (p === "/admin") return <ClinicDashboard />;
    if (p === "/admin/patients") return <ClinicPatients />;
    if (p.startsWith("/admin/patients/")) return <ClinicPatientWorkspace />;
    if (p === "/admin/appointments") return <ClinicAppointments />;
    if (p === "/admin/treatment-plans") return <ClinicTreatmentPlans />;
    if (p === "/admin/inventory") return <ClinicInventory />;
    if (p === "/admin/leads") return <ClinicBookingRequests />;
    if (p === "/admin/doctors") return <ClinicDoctors />;
    if (p === "/admin/services") return <ClinicServices />;
    if (p === "/admin/users") return <ClinicUsers />;
    return <ClinicDashboard />;
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-60">
        <AdminHeader title={title} setOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 md:p-5">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
