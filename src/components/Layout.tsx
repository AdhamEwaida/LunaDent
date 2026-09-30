import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Phone, Star, Sparkles } from "lucide-react";
import { NAV_LINKS, BRAND } from "@/lib/data";
import { useAuth } from "@/auth/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const location = useLocation();
  const { role } = useAuth();

  const portalLinks = role === "admin"
    ? [
        { label: "Patient Sign In", path: "/patient-portal/login", icon: "👤" },
        { label: "Admin Dashboard", path: "/admin", icon: "⚙️" },
      ]
    : role && role !== "patient"
      ? [
          { label: "Patient Sign In", path: "/patient-portal/login", icon: "👤" },
          { label: "Staff Workspace", path: "/admin", icon: "🩺" },
        ]
      : role === "patient"
        ? [
            { label: "Patient Portal", path: "/patient-portal", icon: "👤" },
            { label: "Staff Sign In", path: "/staff/login", icon: "🩺" },
          ]
        : [
            { label: "Patient Sign In", path: "/patient-portal/login", icon: "👤" },
            { label: "Staff Sign In", path: "/staff/login", icon: "🩺" },
          ];

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
      {/* Production status banner */}
      <div className="hidden md:flex items-center justify-between px-6 py-2 text-xs"
        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
        <span className="opacity-90">LunaDent Dental Clinic</span>
        <span className="opacity-75">Online booking · Secure patient portal</span>
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
                <span className="text-xs ml-1 opacity-60" style={{ color: "var(--muted-foreground)" }}>Dental Clinic</span>
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
                      {portalLinks.map(p => (
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
                  {portalLinks.map(p => (
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
      {BRAND.whatsapp && (
        <a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer"
          className="fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl text-2xl transition-all hover:scale-110 active:scale-95"
          style={{ background: "#25D366", color: "white" }}>
          💬
        </a>
      )}

      {/* Sticky Mobile Book CTA */}
      <div className="lg:hidden fixed bottom-5 left-4 right-4 z-40">
        <Link to="/booking"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-sm font-semibold shadow-2xl"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}>
          <Sparkles size={15} />
          Book Your Consultation Today
        </Link>
      </div>

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
              <span className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>LunaDent Dental Clinic</span>
            </div>
            <p className="text-sm leading-relaxed opacity-70 mb-6 max-w-xs">
              Modern dental care supported by digital treatment planning, online booking, and secure patient access.
            </p>
            <div className="space-y-1.5 text-sm opacity-75">
              {BRAND.address && <div>📍 {BRAND.address}</div>}
              {BRAND.phone && <div>📞 {BRAND.phone}</div>}
              {BRAND.email && <div>✉️ {BRAND.email}</div>}
              {BRAND.hours && <div>🕐 {BRAND.hours}</div>}
              {!BRAND.address && !BRAND.phone && !BRAND.email && !BRAND.hours && (
                <div>Clinic contact details are managed by the clinic administrator.</div>
              )}
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
            <h4 className="font-semibold mb-4 text-sm tracking-widest uppercase opacity-60">Clinic</h4>
            {[["Our Doctors","/doctors"],["Technology","/technology"],["Media Center","/media"],["Accreditations","/#accreditations"],["Careers","/#careers"],["Contact","/contact"]].map(([l,p]) => (
              <Link key={p} to={p} className="block text-sm py-1 opacity-70 hover:opacity-100 transition-opacity">{l}</Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs opacity-50">
          <span>© 2026 LunaDent Dental Clinic. All rights reserved.</span>
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
