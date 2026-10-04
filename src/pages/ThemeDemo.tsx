import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import ClinicThemeRenderer from "@/components/ClinicThemeRenderer";
import { saasRepository } from "@/saas/repository";
import type { PublicClinicSite, ThemeDefinition } from "@/saas/types";

function buildDemoSite(theme: ThemeDefinition): PublicClinicSite {
  const now = new Date().toISOString();
  return {
    clinic: {
      id: "demo-clinic",
      name: "Luna Smile Dental",
      slug: "luna-smile-dental",
      status: "active",
      phone: "+970 2 555 0101",
      whatsapp: "+970 59 555 0101",
      email: "hello@lunasmile.example",
      address: "Main Street",
      city: "Ramallah",
      country: "Palestine",
      currency: "USD",
      timezone: "Asia/Hebron",
      locale: "en",
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
    settings: {
      clinic_id: "demo-clinic",
      theme_key: theme.key,
      published: true,
      custom_domain: null,
      domain_verified: false,
      platform_subdomain: null,
      site_title: "Luna Smile Dental",
      tagline: "Comfortable care. Confident smiles.",
      logo_url: null,
      favicon_url: null,
      hero_image_url: null,
      tokens: theme.default_tokens,
      sections: [
        { key: "hero", enabled: true },
        { key: "services", enabled: true },
        { key: "doctors", enabled: true },
        { key: "journey", enabled: true },
        { key: "booking", enabled: true },
        { key: "contact", enabled: true },
      ],
      content: {
        hero: {
          eyebrow: "LUNA SMILE DENTAL",
          title: "A calmer, smarter dental experience.",
          subtitle: "Modern dentistry, online booking, and a secure patient experience in one clinic.",
          primaryCta: "Book Appointment",
          secondaryCta: "Explore Treatments",
        },
        services: {
          eyebrow: "Treatments",
          title: "Care for every stage of your smile.",
          subtitle: "A sample catalog showing how your real clinic services will appear.",
        },
        doctors: {
          eyebrow: "Clinical Team",
          title: "Meet your dental team.",
          subtitle: "Your real dentists, specialties and profiles appear here.",
        },
        booking: {
          title: "Ready to request an appointment?",
          subtitle: "Patients can choose a treatment and available time online.",
          button: "Book Appointment",
        },
      },
      assets: {},
      navigation: [],
      updated_at: now,
    },
    theme,
    doctors: [
      { id: "demo-doctor-1", display_name: "Dr. Maya Haddad", specialty: "Cosmetic Dentistry", bio_en: "Focused on natural smile design and patient comfort." },
      { id: "demo-doctor-2", display_name: "Dr. Omar Saleh", specialty: "Restorative Dentistry", bio_en: "Restorative care with a digital-first approach." },
    ],
    treatments: [
      { id: "demo-treatment-1", code: "CONSULT", name_en: "Dental Consultation", name_ar: "استشارة أسنان", description_en: "Comprehensive exam and treatment discussion.", duration_minutes: 30, default_price: 35 },
      { id: "demo-treatment-2", code: "WHITEN", name_en: "Teeth Whitening", name_ar: "تبييض الأسنان", description_en: "Professional in-clinic whitening.", duration_minutes: 60, default_price: 180 },
      { id: "demo-treatment-3", code: "IMPLANT", name_en: "Dental Implant", name_ar: "زراعة أسنان", description_en: "Implant consultation and treatment planning.", duration_minutes: 90, default_price: 900 },
    ],
  };
}

export default function ThemeDemo() {
  const { themeKey = "modern" } = useParams();
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void saasRepository.listThemes()
      .then((rows) => {
        if (active) setThemes(rows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const theme = useMemo(
    () => themes.find((row) => row.key === themeKey) || themes.find((row) => row.key === "modern") || null,
    [themes, themeKey],
  );

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-300">Loading clinic demo...</div>;
  }
  if (!theme) {
    return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-600">Theme demo unavailable.</div>;
  }

  const site = buildDemoSite(theme);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="sticky top-0 z-[80] border-b border-white/10 bg-slate-950/95 px-4 py-3 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link to="/#themes" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
              <ArrowLeft size={16} /> Back
            </Link>
            <div className="hidden h-5 w-px bg-white/15 sm:block" />
            <div>
              <div className="flex items-center gap-2 text-sm font-bold"><Sparkles size={14} /> {theme.name} demo</div>
              <div className="text-xs text-slate-400">This is the same renderer used for real clinic websites.</div>
            </div>
          </div>
          <Link
            to={`/start?theme=${encodeURIComponent(theme.key)}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold hover:bg-violet-400"
          >
            Use {theme.name} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
      <ClinicThemeRenderer site={site} preview />
    </div>
  );
}
