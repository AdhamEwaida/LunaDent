import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Building2, Check, ChevronLeft, ChevronRight, ImagePlus, Palette, Sparkles, Upload } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { saasRepository } from "@/saas/repository";
import type { ClinicSiteSettings, SiteTokens, ThemeDefinition } from "@/saas/types";

const steps = ["Clinic", "Theme", "Branding", "Finish"];

export default function ClinicOnboarding() {
  const { activeClinic, activeClinicId, activeClinicRole, refreshTenantContext } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);
  const [settings, setSettings] = useState<ClinicSiteSettings | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "",
    country: "",
    timezone: "Asia/Hebron",
    currency: "USD",
  });
  const [selectedTheme, setSelectedTheme] = useState("modern");
  const [primary, setPrimary] = useState("#2457C5");
  const [accent, setAccent] = useState("#26A69A");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activeClinicId || !activeClinic) return;
    setForm({
      name: activeClinic.name || "",
      phone: activeClinic.phone || "",
      whatsapp: activeClinic.whatsapp || "",
      email: activeClinic.email || "",
      address: activeClinic.address || "",
      city: activeClinic.city || "",
      country: activeClinic.country || "",
      timezone: activeClinic.timezone || "Asia/Hebron",
      currency: activeClinic.currency || "USD",
    });

    void Promise.all([
      saasRepository.listThemes(),
      saasRepository.getSiteSettings(activeClinicId),
    ]).then(([themeRows, site]) => {
      setThemes(themeRows);
      setSettings(site);
      setSelectedTheme(site.theme_key || "modern");
      setPrimary(site.tokens?.colors?.primary || "#2457C5");
      setAccent(site.tokens?.colors?.accent || "#26A69A");
      setLogoUrl(site.logo_url || null);
      setHeroUrl(site.hero_image_url || null);
    }).catch(err => setError(err instanceof Error ? err.message : "Unable to load onboarding."));
  }, [activeClinicId, activeClinic]);

  const selected = useMemo(() => themes.find(theme => theme.key === selectedTheme) ?? null, [themes, selectedTheme]);

  if (!activeClinicId || !activeClinic) {
    return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">No clinic selected.</div>;
  }
  if (activeClinicRole !== "clinic_owner") {
    return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">Clinic Owner access required.</div>;
  }
  if (activeClinic.onboarding_completed) {
    return <Navigate to="/admin" replace />;
  }

  const chooseTheme = (theme: ThemeDefinition) => {
    setSelectedTheme(theme.key);
    setPrimary(theme.default_tokens?.colors?.primary || primary);
    setAccent(theme.default_tokens?.colors?.accent || accent);
  };

  const uploadAsset = async (event: ChangeEvent<HTMLInputElement>, kind: "logo" | "hero") => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const url = await saasRepository.uploadClinicAsset(activeClinicId, file, kind);
      if (kind === "logo") setLogoUrl(url);
      else setHeroUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const finish = async () => {
    if (!settings || !selected) return;
    setSaving(true);
    setError("");
    try {
      const tokens: SiteTokens = {
        ...selected.default_tokens,
        colors: {
          ...(selected.default_tokens?.colors || {}),
          primary,
          accent,
        },
      };

      await Promise.all([
        saasRepository.updateClinic(activeClinicId, {
          ...form,
          onboarding_completed: true,
        }),
        saasRepository.updateSiteSettings(activeClinicId, {
          ...settings,
          theme_key: selectedTheme,
          site_title: form.name,
          logo_url: logoUrl,
          hero_image_url: heroUrl,
          tokens,
          published: false,
        }),
      ]);

      await refreshTenantContext();
      navigate("/admin/site-builder", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to finish onboarding.");
    } finally {
      setSaving(false);
    }
  };

  const next = () => setStep(current => Math.min(current + 1, steps.length - 1));
  const back = () => setStep(current => Math.max(current - 1, 0));

  return (
    <div className="min-h-screen bg-slate-950 text-white px-5 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl mx-auto grid place-items-center bg-gradient-to-br from-violet-500 to-cyan-400"><Sparkles size={20}/></div>
          <div className="text-xs uppercase tracking-[.2em] text-violet-300 font-semibold mt-4">LunaDent Clinic Setup</div>
          <h1 className="text-3xl md:text-4xl font-black mt-2">Set up {activeClinic.name}</h1>
          <p className="text-sm text-slate-400 mt-2">Choose how the clinic looks before opening the workspace.</p>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {steps.map((label,index)=><div key={label} className="text-center">
            <div className={`h-1 rounded-full ${index<=step?"bg-violet-400":"bg-white/10"}`} />
            <div className={`text-[11px] mt-2 ${index===step?"text-white":"text-slate-500"}`}>{label}</div>
          </div>)}
        </div>

        <div className="rounded-[28px] bg-white text-slate-950 border border-white/10 p-6 md:p-8">
          {error && <div className="mb-5 rounded-xl bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}

          {step===0 && <section>
            <div className="flex items-center gap-2"><Building2 size={19}/><h2 className="text-xl font-bold">Clinic details</h2></div>
            <p className="text-sm text-slate-500 mt-2">These details are used across the dashboard and public website.</p>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <label className="text-xs font-semibold">Clinic name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1.5 w-full px-3 py-3 rounded-xl border" /></label>
              <label className="text-xs font-semibold">Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="mt-1.5 w-full px-3 py-3 rounded-xl border" /></label>
              <label className="text-xs font-semibold">WhatsApp<input value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} className="mt-1.5 w-full px-3 py-3 rounded-xl border" /></label>
              <label className="text-xs font-semibold">Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="mt-1.5 w-full px-3 py-3 rounded-xl border" /></label>
              <label className="text-xs font-semibold md:col-span-2">Address<input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="mt-1.5 w-full px-3 py-3 rounded-xl border" /></label>
              <label className="text-xs font-semibold">City<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="mt-1.5 w-full px-3 py-3 rounded-xl border" /></label>
              <label className="text-xs font-semibold">Country<input value={form.country} onChange={e=>setForm({...form,country:e.target.value})} className="mt-1.5 w-full px-3 py-3 rounded-xl border" /></label>
              <label className="text-xs font-semibold">Timezone<input value={form.timezone} onChange={e=>setForm({...form,timezone:e.target.value})} className="mt-1.5 w-full px-3 py-3 rounded-xl border" /></label>
              <label className="text-xs font-semibold">Currency<input value={form.currency} onChange={e=>setForm({...form,currency:e.target.value.toUpperCase()})} className="mt-1.5 w-full px-3 py-3 rounded-xl border" /></label>
            </div>
          </section>}

          {step===1 && <section>
            <div className="flex items-center gap-2"><Palette size={19}/><h2 className="text-xl font-bold">Choose a website theme</h2></div>
            <p className="text-sm text-slate-500 mt-2">The owner can change the theme again later from Website Builder.</p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              {themes.map(theme=><button type="button" key={theme.key} onClick={()=>chooseTheme(theme)} className={`text-left rounded-2xl border p-4 transition ${selectedTheme===theme.key?"ring-2 ring-violet-500 border-violet-400":"hover:border-slate-300"}`}>
                <div className="h-32 rounded-xl mb-4" style={{background:`linear-gradient(135deg,${theme.default_tokens?.colors?.primary || "#475569"}22,${theme.default_tokens?.colors?.accent || "#94a3b8"}88)`}} />
                <div className="flex items-center justify-between"><div className="font-bold">{theme.name}</div>{selectedTheme===theme.key && <Check size={17} className="text-violet-600"/>}</div>
                <div className="text-xs text-slate-500 mt-2">{theme.description}</div>
              </button>)}
            </div>
          </section>}

          {step===2 && <section>
            <div className="flex items-center gap-2"><ImagePlus size={19}/><h2 className="text-xl font-bold">Branding</h2></div>
            <p className="text-sm text-slate-500 mt-2">Start with your brand colors and clinic imagery. Everything remains editable later.</p>
            <div className="grid md:grid-cols-2 gap-5 mt-6">
              <div className="space-y-4">
                <label className="text-xs font-semibold block">Primary color<div className="flex gap-2 mt-1.5"><input type="color" value={primary} onChange={e=>setPrimary(e.target.value)} className="w-12 h-11 border rounded-xl p-1"/><input value={primary} onChange={e=>setPrimary(e.target.value)} className="flex-1 px-3 py-3 rounded-xl border font-mono text-sm"/></div></label>
                <label className="text-xs font-semibold block">Accent color<div className="flex gap-2 mt-1.5"><input type="color" value={accent} onChange={e=>setAccent(e.target.value)} className="w-12 h-11 border rounded-xl p-1"/><input value={accent} onChange={e=>setAccent(e.target.value)} className="flex-1 px-3 py-3 rounded-xl border font-mono text-sm"/></div></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="min-h-40 rounded-2xl border border-dashed grid place-items-center text-center cursor-pointer p-4">
                  {logoUrl ? <img src={logoUrl} alt="" className="max-h-24 max-w-full object-contain"/> : <div><Upload size={22} className="mx-auto text-slate-400"/><div className="text-sm font-semibold mt-2">Upload logo</div></div>}
                  <input type="file" accept="image/*" className="hidden" onChange={e=>void uploadAsset(e,"logo")}/>
                </label>
                <label className="min-h-40 rounded-2xl border border-dashed grid place-items-center text-center cursor-pointer p-4 overflow-hidden">
                  {heroUrl ? <img src={heroUrl} alt="" className="w-full h-28 object-cover rounded-xl"/> : <div><ImagePlus size={22} className="mx-auto text-slate-400"/><div className="text-sm font-semibold mt-2">Hero image</div></div>}
                  <input type="file" accept="image/*" className="hidden" onChange={e=>void uploadAsset(e,"hero")}/>
                </label>
              </div>
            </div>
          </section>}

          {step===3 && <section className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center mx-auto"><Check size={28}/></div>
            <h2 className="text-3xl font-black mt-5">Clinic setup is ready</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Your clinic will open in draft mode. From Website Builder you can fine-tune every color, size, font, image, section and text, then publish when ready.</p>
            <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-slate-50 border p-4 text-left">
              <div className="w-10 h-10 rounded-xl" style={{background:primary}} />
              <div><div className="font-bold">{selected?.name || selectedTheme}</div><div className="text-xs text-slate-500">{form.name}</div></div>
            </div>
          </section>}

          <div className="mt-8 pt-5 border-t flex items-center justify-between">
            <button type="button" onClick={back} disabled={step===0 || saving} className="px-4 py-2.5 rounded-xl border font-semibold text-sm disabled:opacity-30 inline-flex items-center gap-2"><ChevronLeft size={15}/>Back</button>
            {step<3
              ? <button type="button" onClick={next} disabled={saving || (step===0 && !form.name.trim()) || (step===1 && !selected)} className="px-5 py-2.5 rounded-xl bg-slate-950 text-white font-semibold text-sm inline-flex items-center gap-2">Continue<ChevronRight size={15}/></button>
              : <button type="button" onClick={()=>void finish()} disabled={saving} className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm">{saving?"Finishing...":"Open Website Builder"}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
