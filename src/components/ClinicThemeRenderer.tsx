import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, MapPin, Phone, ShieldCheck, Sparkles, Stethoscope, UserRound } from "lucide-react";
import type { PublicClinicSite } from "@/saas/types";
import { mergeTokens, tokensToStyle } from "@/saas/theme";

type Props = { site: PublicClinicSite; preview?: boolean };

const fallbackHero = {
  eyebrow: "WELCOME",
  title: "Thoughtful dental care, built around you.",
  subtitle: "Book online and manage your dental journey securely.",
  primaryCta: "Book Consultation",
  secondaryCta: "Explore Treatments",
};

export default function ClinicThemeRenderer({ site, preview = false }: Props) {
  const { clinic, settings, theme, doctors, treatments } = site;
  const tokens = mergeTokens(theme?.default_tokens || {}, settings.tokens || {});
  const style = tokensToStyle(tokens);
  const hero = { ...fallbackHero, ...(settings.content?.hero || {}) };
  const servicesCopy = {
    eyebrow: "Treatments",
    title: "Care designed around the patient.",
    subtitle: "Explore the clinic's active treatment catalog.",
    ...(settings.content?.services || {}),
  };
  const doctorsCopy = {
    eyebrow: "Clinical Team",
    title: "Meet the dental team.",
    subtitle: "Get to know the clinicians behind your care.",
    ...(settings.content?.doctors || {}),
  };
  const journeyCopy = {
    title: "A simple patient journey.",
    steps: [
      { step: "01", title: "Book online", text: "Send your preferred date and treatment." },
      { step: "02", title: "Visit the clinic", text: "Receive care from your dental team." },
      { step: "03", title: "Stay connected", text: "Use the secure patient portal for follow-up." },
    ],
    ...(settings.content?.journey || {}),
  };
  const bookingCopy = {
    title: "Ready to request an appointment?",
    subtitle: "Choose a treatment, preferred date and time online.",
    button: "Book Consultation",
    ...(settings.content?.booking || {}),
  };
  const contactCopy = {
    description: settings.tagline || "Modern dental care with a connected patient experience.",
    ...(settings.content?.contact || {}),
  };
  const bookingHref = preview ? "#" : `/c/${clinic.slug}/booking`;
  const patientHref = preview ? "#" : `/c/${clinic.slug}/patient/login`;
  const themeKey = settings.theme_key || "modern";
  const shellClass = themeKey === "luxury" ? "site-theme-luxury" : themeKey === "clinical" ? "site-theme-clinical" : "site-theme-modern";
  const orderedSections = (settings.sections?.length ? settings.sections : [
    {key:"hero",enabled:true},{key:"services",enabled:true},{key:"doctors",enabled:true},
    {key:"journey",enabled:true},{key:"booking",enabled:true},{key:"contact",enabled:true},
  ]).filter(section=>section.enabled);

  const stopPreview = preview ? (event: React.MouseEvent) => event.preventDefault() : undefined;

  const renderSection = (key: string) => {
    if (key === "hero") return (
      <section className="relative" style={{minHeight:"var(--site-hero-height)", background: themeKey==="luxury" ? "linear-gradient(135deg,var(--site-primary),color-mix(in srgb,var(--site-primary) 68%,#b14ca8))" : "linear-gradient(135deg,var(--site-bg),var(--site-secondary))"}}>
        <div className={`site-container grid gap-10 items-center py-16 ${themeKey==="clinical"?"lg:grid-cols-[1fr_.85fr]":"lg:grid-cols-2"}`} style={{minHeight:"var(--site-hero-height)"}}>
          <div className={themeKey==="luxury" ? "text-white" : ""}>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[.16em] uppercase"><Sparkles size={14}/>{hero.eyebrow || clinic.name}</div>
            <h1 className="mt-5 leading-[.98] font-bold" style={{fontSize:"calc(clamp(2.8rem,6vw,5.8rem) * var(--site-heading-scale))"}}>{hero.title}</h1>
            <p className="mt-6 max-w-2xl leading-relaxed" style={{fontSize:"calc(1.05rem * var(--site-body-scale))", color:themeKey==="luxury"?"rgba(255,255,255,.78)":"var(--site-muted)"}}>{hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link onClick={stopPreview} to={bookingHref} className="site-button px-6 py-3.5 font-semibold inline-flex items-center gap-2" style={{background:"var(--site-accent)",color:"#fff"}}>{hero.primaryCta}<ArrowRight size={16}/></Link>
              <a href={preview?"#":"#services"} onClick={stopPreview} className="site-button px-6 py-3.5 font-semibold border" style={{borderColor:themeKey==="luxury"?"rgba(255,255,255,.3)":"color-mix(in srgb,var(--site-text) 18%,transparent)"}}>{hero.secondaryCta}</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-xs" style={{color:themeKey==="luxury"?"rgba(255,255,255,.65)":"var(--site-muted)"}}>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14}/>Secure patient access</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={14}/>Online booking</span>
            </div>
          </div>
          <div className="site-card relative overflow-hidden min-h-[360px]" style={{background:"var(--site-surface)"}}>
            {settings.hero_image_url ? <img src={settings.hero_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" /> :
              <div className="absolute inset-0 grid place-items-center" style={{background:"linear-gradient(135deg,var(--site-secondary),color-mix(in srgb,var(--site-accent) 26%,var(--site-surface)))"}}>
                <div className="text-center"><Stethoscope size={54} className="mx-auto opacity-30"/><div className="font-bold mt-4">{clinic.name}</div><div className="text-sm mt-1" style={{color:"var(--site-muted)"}}>Upload a hero image in Website Builder</div></div>
              </div>}
          </div>
        </div>
      </section>
    );

    if (key === "services") return (
      <section id="services" className="site-section" style={{background:"var(--site-surface)"}}>
        <div className="site-container">
          <div className="max-w-2xl"><div className="text-xs uppercase tracking-[.16em] font-bold" style={{color:"var(--site-primary)"}}>{servicesCopy.eyebrow}</div><h2 className="text-4xl font-bold mt-3" style={{fontSize:"calc(2.5rem * var(--site-heading-scale))"}}>{servicesCopy.title}</h2><p className="mt-3 text-sm" style={{color:"var(--site-muted)"}}>{servicesCopy.subtitle}</p></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {treatments.length===0 ? <div className="text-sm" style={{color:"var(--site-muted)"}}>Treatments will appear here when the clinic adds them.</div> :
              treatments.slice(0,9).map(item=><div key={item.id} className="site-card p-6 border" style={{background:"var(--site-bg)",borderColor:"color-mix(in srgb,var(--site-text) 10%,transparent)"}}>
                <div className="w-10 h-10 rounded-xl grid place-items-center" style={{background:"var(--site-secondary)",color:"var(--site-primary)"}}><CheckCircle2 size={18}/></div>
                <h3 className="text-xl font-bold mt-5">{item.name_en}</h3>{item.description_en && <p className="text-sm mt-2 leading-relaxed" style={{color:"var(--site-muted)"}}>{item.description_en}</p>}
                <div className="text-xs mt-4 flex items-center gap-1.5" style={{color:"var(--site-muted)"}}><Clock3 size={13}/>{item.duration_minutes} min</div>
              </div>)}
          </div>
        </div>
      </section>
    );

    if (key === "doctors") return (
      <section id="doctors" className="site-section" >
        <div className="site-container">
          <div className="text-xs uppercase tracking-[.16em] font-bold" style={{color:"var(--site-primary)"}}>{doctorsCopy.eyebrow}</div><h2 className="text-4xl font-bold mt-3">{doctorsCopy.title}</h2><p className="mt-3 text-sm max-w-2xl" style={{color:"var(--site-muted)"}}>{doctorsCopy.subtitle}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {doctors.length===0 ? <div className="text-sm" style={{color:"var(--site-muted)"}}>Doctor profiles will appear once published by the clinic.</div> :
              doctors.map(doctor=><div key={doctor.id} className="site-card p-6" style={{background:"var(--site-surface)"}}>
                <div className="w-16 h-16 rounded-2xl grid place-items-center text-2xl font-bold text-white" style={{background:"var(--site-primary)"}}>{doctor.display_name.slice(0,1)}</div>
                <h3 className="font-bold text-xl mt-5">{doctor.display_name}</h3><div className="text-sm mt-1" style={{color:"var(--site-primary)"}}>{doctor.specialty || "Dentist"}</div>
                {doctor.bio_en && <p className="text-sm mt-3 leading-relaxed" style={{color:"var(--site-muted)"}}>{doctor.bio_en}</p>}
              </div>)}
          </div>
        </div>
      </section>
    );

    if (key === "journey") return (
      <section className="site-section" style={{background:"var(--site-secondary)"}}>
        <div className="site-container">
          <h2 className="text-3xl font-bold mb-8">{journeyCopy.title}</h2>
          <div className="grid lg:grid-cols-3 gap-4">
            {(journeyCopy.steps || []).map((item: any)=><div key={item.step} className="site-card p-6" style={{background:"var(--site-bg)"}}><div className="text-sm font-bold" style={{color:"var(--site-accent)"}}>{item.step}</div><h3 className="font-bold text-xl mt-4">{item.title}</h3><p className="text-sm mt-2" style={{color:"var(--site-muted)"}}>{item.text}</p></div>)}
          </div>
        </div>
      </section>
    );

    if (key === "booking") return (
      <section className="site-section" >
        <div className="site-container site-card p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6" style={{background:"var(--site-primary)",color:"#fff"}}>
          <div><h2 className="text-3xl font-bold">{bookingCopy.title}</h2><p className="mt-2 opacity-75">{bookingCopy.subtitle}</p></div>
          <Link onClick={stopPreview} to={bookingHref} className="site-button px-6 py-3.5 font-semibold whitespace-nowrap" style={{background:"var(--site-accent)",color:"#fff"}}>{bookingCopy.button}</Link>
        </div>
      </section>
    );

    if (key === "contact") return (
      <section id="contact" className="site-section" style={{background:"var(--site-surface)"}}>
        <div className="site-container grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2"><h2 className="text-3xl font-bold">{clinic.name}</h2><p className="mt-3 max-w-xl text-sm" style={{color:"var(--site-muted)"}}>{contactCopy.description}</p></div>
          <div className="space-y-3 text-sm">
            {clinic.phone && <div className="flex items-center gap-2"><Phone size={15}/>{clinic.phone}</div>}
            {clinic.address && <div className="flex items-start gap-2"><MapPin size={15}/>{clinic.address}</div>}
            {!clinic.phone && !clinic.address && <div style={{color:"var(--site-muted)"}}>Clinic contact details can be configured in the dashboard.</div>}
          </div>
        </div>
      </section>
    );

    return null;
  };

  return (
    <div className={`${shellClass} min-h-screen overflow-hidden`} style={{...style, background:"var(--site-bg)", color:"var(--site-text)", fontFamily:"var(--site-body-font)"}}>
      <style>{`
        .site-root h1,.site-root h2,.site-root h3{font-family:var(--site-heading-font)}
        .site-root .site-container{width:min(calc(100% - 32px),var(--site-max-width));margin-inline:auto}
        .site-root .site-section{padding-block:var(--site-section-space)}
        .site-root .site-card{border-radius:var(--site-card-radius)}
        .site-root .site-button{border-radius:var(--site-button-radius)}
        .site-theme-luxury h1,.site-theme-luxury h2{letter-spacing:-.025em}
        .site-theme-clinical .site-card{border:1px solid color-mix(in srgb,var(--site-primary) 12%,transparent)}
      `}</style>

      <div className="site-root flex flex-col">
        <header className="border-b sticky top-0 z-30 backdrop-blur-xl" style={{height:"var(--site-nav-height)", background:"color-mix(in srgb,var(--site-bg) 92%,transparent)", borderColor:"color-mix(in srgb,var(--site-text) 10%,transparent)"}}>
          <div className="site-container h-full flex items-center justify-between gap-5">
            <Link onClick={stopPreview} to={preview?"#":`/c/${clinic.slug}`} className="flex items-center gap-3 min-w-0">
              {settings.logo_url ? <img src={settings.logo_url} alt={clinic.name} className="h-10 max-w-36 object-contain" /> : <span className="w-10 h-10 grid place-items-center font-bold text-white site-button" style={{background:"var(--site-primary)"}}>{clinic.name.slice(0,1).toUpperCase()}</span>}
              <span className="font-bold truncate">{settings.site_title || clinic.name}</span>
            </Link>
            <nav className="hidden md:flex items-center gap-5 text-sm" style={{color:"var(--site-muted)"}}>
              {orderedSections.some(s=>s.key==="services") && <a href={preview?"#":"#services"} onClick={stopPreview}>Treatments</a>}
              {orderedSections.some(s=>s.key==="doctors") && <a href={preview?"#":"#doctors"} onClick={stopPreview}>Doctors</a>}
              {orderedSections.some(s=>s.key==="contact") && <a href={preview?"#":"#contact"} onClick={stopPreview}>Contact</a>}
              <Link onClick={stopPreview} to={patientHref} className="inline-flex items-center gap-1.5"><UserRound size={14}/>Patient Portal</Link>
            </nav>
            <Link onClick={stopPreview} to={bookingHref} className="site-button px-4 py-2.5 font-semibold text-sm text-white" style={{background:"var(--site-primary)"}}>Book</Link>
          </div>
        </header>

        {orderedSections.map(section=><Fragment key={section.key}>{renderSection(section.key)}</Fragment>)}

        <footer className="py-8 border-t text-sm" style={{borderColor:"color-mix(in srgb,var(--site-text) 10%,transparent)",color:"var(--site-muted)"}}>
          <div className="site-container flex flex-col md:flex-row gap-3 justify-between"><span>© 2026 {clinic.name}</span><span>Powered by LunaDent</span></div>
        </footer>
      </div>
    </div>
  );
}
