import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Phone, Star, Sparkles } from "lucide-react";
import { NAV_LINKS, BRAND } from "@/lib/data";

const PORTAL_LINKS = [
  { label: "Patient Portal", path: "/patient-portal", icon: "👤" },
  { label: "Admin Dashboard", path: "/admin", icon: "⚙️" },
  { label: "Accounting", path: "/accounting", icon: "💼" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const isDashboard = location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/patient-portal") ||
    location.pathname.startsWith("/accounting");

  if (isDashboard) return <>{children}</>;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Top Banner */}
      <div className="hidden md:flex items-center justify-between px-6 py-2 text-xs"
        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
        <span className="flex items-center gap-2 opacity-90">
          <Star size={10} fill="currentColor" />
          <span>4.9 Rating · 12,400+ Smiles Transformed · Beverly Hills, CA</span>
        </span>
        <a href={`tel:${BRAND.phone}`} className="flex items-center gap-1.5 font-medium hover:opacity-80 transition-opacity">
          <Phone size={11} />
          {BRAND.phone}
        </a>
      </div>

      {/* Main Nav */}
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,248,242,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          boxShadow: scrolled ? "0 1px 0 0 rgba(59,30,84,0.08)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
                L
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
                  LunaDent
                </span>
                <span className="text-xs ml-1 opacity-60" style={{ color: "var(--muted-foreground)" }}>Studio</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(l => (
                <Link
                  key={l.path}
                  to={l.path}
                  className="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:opacity-80"
                  style={{
                    color: location.pathname === l.path ? "var(--primary)" : "var(--foreground)",
                    background: location.pathname === l.path ? "var(--secondary)" : "transparent",
                  }}
                >
                  {l.label}
                </Link>
              ))}

              {/* Portal Dropdown */}
              <div className="relative ml-1" onMouseEnter={() => setPortalOpen(true)} onMouseLeave={() => setPortalOpen(false)}>
                <button className="px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1 transition-all"
                  style={{ color: "var(--foreground)" }}>
                  Portals <ChevronDown size={14} />
                </button>
                <AnimatePresence>
                  {portalOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      className="absolute top-full right-0 w-48 rounded-xl p-2 shadow-xl border"
                      style={{ background: "var(--card)", borderColor: "var(--border)" }}
                    >
                      {PORTAL_LINKS.map(p => (
                        <Link key={p.path} to={p.path}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:opacity-80 transition-all"
                          style={{ color: "var(--foreground)" }}>
                          <span>{p.icon}</span>{p.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link to="/booking"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 shadow-md"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                <Sparkles size={14} />
                Book Consultation
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg" style={{ color: "var(--primary)" }}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="px-4 py-4 space-y-1">
                {NAV_LINKS.map(l => (
                  <Link key={l.path} to={l.path}
                    className="block px-3 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{ color: "var(--foreground)" }}>
                    {l.label}
                  </Link>
                ))}
                <div className="pt-2 border-t mt-2" style={{ borderColor: "var(--border)" }}>
                  {PORTAL_LINKS.map(p => (
                    <Link key={p.path} to={p.path}
                      className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm transition-all"
                      style={{ color: "var(--muted-foreground)" }}>
                      <span>{p.icon}</span>{p.label}
                    </Link>
                  ))}
                </div>
                <Link to="/booking"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold mt-2"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  <Sparkles size={14} />Book Consultation
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>{children}</main>

      {/* Footer */}
      <Footer />

      {/* Floating WhatsApp */}
      <a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl text-2xl transition-all hover:scale-110 active:scale-95"
        style={{ background: "#25D366", color: "white" }}>
        💬
      </a>

      {/* Sticky Mobile Book CTA */}
      <div className="lg:hidden fixed bottom-5 left-4 right-4 z-40">
        <Link to="/booking"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-sm font-semibold shadow-2xl"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}>
          <Sparkles size={15} />
          Book Your Consultation Today
        </Link>
      </div>

      {/* AI Chat Widget */}
      <AIChat />
    </div>
  );
}

function Footer() {
  return (
    <footer style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.15)" }}>L</div>
              <span className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>LunaDent Studio</span>
            </div>
            <p className="text-sm leading-relaxed opacity-70 mb-6 max-w-xs">
              A premium dental studio designed around your comfort, confidence, and the most beautiful version of your smile.
            </p>
            <div className="space-y-1.5 text-sm opacity-75">
              <div>📍 88 Crescent Ave, Suite 400, Beverly Hills, CA</div>
              <div>📞 +1 (800) 586-2636</div>
              <div>✉️ hello@lunadent.studio</div>
              <div>🕐 Mon–Fri: 9AM–7PM · Sat: 9AM–4PM</div>
            </div>
          </div>

          {/* Treatments */}
          <div>
            <h4 className="font-semibold mb-4 text-sm tracking-widest uppercase opacity-60">Treatments</h4>
            {["Hollywood Smile","Dental Implants","Porcelain Veneers","Clear Aligners","Teeth Whitening","Gum Treatment"].map(t => (
              <Link key={t} to="/treatments" className="block text-sm py-1 opacity-70 hover:opacity-100 transition-opacity">{t}</Link>
            ))}
          </div>

          {/* Patient Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-sm tracking-widest uppercase opacity-60">Patient</h4>
            {[["Patient Portal","/patient-portal"],["Book Appointment","/booking"],["Cost Calculator","/calculator"],["Smile Simulator","/smile-simulation"],["Blog & Tips","/blog"],["Before & After","/before-after"]].map(([l,p]) => (
              <Link key={p} to={p} className="block text-sm py-1 opacity-70 hover:opacity-100 transition-opacity">{l}</Link>
            ))}
          </div>

          {/* Studio */}
          <div>
            <h4 className="font-semibold mb-4 text-sm tracking-widest uppercase opacity-60">Studio</h4>
            {[["Our Doctors","/doctors"],["Technology","/technology"],["Media Center","/media"],["Accreditations","/#accreditations"],["Careers","/#careers"],["Contact","/contact"]].map(([l,p]) => (
              <Link key={p} to={p} className="block text-sm py-1 opacity-70 hover:opacity-100 transition-opacity">{l}</Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs opacity-50">
          <span>© 2026 LunaDent Studio. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:opacity-80">Privacy Policy</Link>
            <Link to="/terms" className="hover:opacity-80">Terms of Service</Link>
            <Link to="/cookies" className="hover:opacity-80">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function AIChat() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hello! I'm Luna, your AI dental assistant. 👋 How can I help you today?" },
  ]);

  const send = () => {
    if (!msg.trim()) return;
    const userMsg = msg.trim();
    setMessages(prev => [...prev, { from: "user", text: userMsg }]);
    setMsg("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        from: "bot",
        text: "Thank you for reaching out! I recommend booking a free consultation with one of our specialists. Would you like me to help you schedule one? 😊",
      }]);
    }, 1200);
  };

  return (
    <div className="fixed bottom-24 left-5 z-40 flex flex-col items-start gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className="w-80 rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="px-4 py-3 flex items-center gap-3"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">🤖</div>
              <div>
                <div className="text-sm font-semibold text-white">Luna AI Assistant</div>
                <div className="text-xs text-white/70">Always here to help</div>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-white/70 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-3 h-52 overflow-y-auto space-y-2">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%] px-3 py-2 rounded-xl text-sm"
                    style={{
                      background: m.from === "user" ? "var(--primary)" : "var(--muted)",
                      color: m.from === "user" ? "var(--primary-foreground)" : "var(--foreground)",
                    }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 text-xs text-center opacity-50 border-t" style={{ borderColor: "var(--border)" }}>
              AI guidance does not replace professional dental diagnosis.
            </div>
            <div className="p-3 flex gap-2 border-t" style={{ borderColor: "var(--border)" }}>
              <input value={msg} onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Ask Luna anything..."
                className="flex-1 px-3 py-2 rounded-xl text-sm border outline-none"
                style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }} />
              <button onClick={send}
                className="px-3 py-2 rounded-xl text-sm font-medium"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-xl transition-all hover:scale-110"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
