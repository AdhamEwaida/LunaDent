import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarClock, Check, Eye, ImagePlus, Palette, Save, SlidersHorizontal, Type, Upload } from "lucide-react";
import ClinicThemeRenderer from "@/components/ClinicThemeRenderer";
import { useAuth } from "@/auth/AuthContext";
import { saasRepository } from "@/saas/repository";
import { supabase } from "@/lib/supabase";
import type { BookingSettings, ClinicBusinessHour, ClinicSiteSettings, PublicClinicSite, SiteTokens, ThemeDefinition } from "@/saas/types";

const colorFields: Array<[keyof NonNullable<SiteTokens["colors"]>, string]> = [
  ["primary","Primary"],
  ["secondary","Secondary"],
  ["accent","Accent"],
  ["background","Background"],
  ["surface","Surface"],
  ["text","Text"],
  ["muted","Muted text"],
];

const BOOKING_DEFAULTS: Required<BookingSettings> = {
  days: [1, 2, 3, 4, 5],
  start: "09:00",
  end: "17:00",
  slotMinutes: 30,
  leadTimeHours: 2,
  horizonDays: 90,
};

const DAY_LABELS = [
  [0, "Sun"], [1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"],
] as const;

type TypographyScaleKey = "headingScale" | "bodyScale";
type NumericLayoutKey = "maxWidth" | "sectionSpacing" | "heroMinHeight" | "navHeight" | "buttonRadius" | "cardRadius";
type EditableTextSection = "services" | "doctors" | "booking" | "contact";

const TYPOGRAPHY_SCALE_CONTROLS: Array<{
  key: TypographyScaleKey;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "headingScale", label: "Heading size", min: 0.8, max: 1.4, step: 0.05 },
  { key: "bodyScale", label: "Body size", min: 0.85, max: 1.25, step: 0.05 },
];

const LAYOUT_CONTROLS: Array<{
  key: NumericLayoutKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}> = [
  { key: "maxWidth", label: "Content width", min: 900, max: 1500, step: 20, unit: "px" },
  { key: "sectionSpacing", label: "Section spacing", min: 40, max: 160, step: 4, unit: "px" },
  { key: "heroMinHeight", label: "Hero height", min: 420, max: 900, step: 20, unit: "px" },
  { key: "navHeight", label: "Navigation height", min: 56, max: 110, step: 2, unit: "px" },
  { key: "buttonRadius", label: "Button radius", min: 0, max: 999, step: 1, unit: "px" },
  { key: "cardRadius", label: "Card radius", min: 0, max: 50, step: 1, unit: "px" },
];

const sectionNames: Record<string,string> = {
  hero:"Hero",
  services:"Treatments",
  doctors:"Doctors",
  journey:"Patient Journey",
  booking:"Booking CTA",
  contact:"Contact",
};

function deepMergeTokens(base: SiteTokens, custom: SiteTokens): SiteTokens {
  return {
    colors: { ...(base.colors || {}), ...(custom.colors || {}) },
    typography: { ...(base.typography || {}), ...(custom.typography || {}) },
    layout: { ...(base.layout || {}), ...(custom.layout || {}) },
  };
}

export default function SiteBuilder() {
  const { activeClinicId, activeClinic, activeClinicRole, entitlements, hasFeature } = useAuth();
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);
  const [settings, setSettings] = useState<ClinicSiteSettings | null>(null);
  const [doctors, setDoctors] = useState<PublicClinicSite["doctors"]>([]);
  const [treatments, setTreatments] = useState<PublicClinicSite["treatments"]>([]);
  const [businessHours, setBusinessHours] = useState<ClinicBusinessHour[]>([]);
  const [clinicDraft, setClinicDraft] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "",
    country: "",
    timezone: "UTC",
    currency: "USD",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!activeClinicId || !activeClinic || !supabase) return;
    setError("");
    try {
      const [themeRows, siteSettings, hoursRows, doctorsRes, treatmentsRes] = await Promise.all([
        saasRepository.listThemes(),
        saasRepository.getSiteSettings(activeClinicId),
        saasRepository.listBusinessHours(activeClinicId),
        supabase.from("doctors").select("id,display_name,specialty,bio_en").eq("clinic_id",activeClinicId).eq("active",true).order("display_name"),
        supabase.from("treatments").select("id,code,name_en,name_ar,description_en,duration_minutes,default_price").eq("clinic_id",activeClinicId).eq("active",true).order("name_en"),
      ]);
      setThemes(themeRows);
      setSettings(siteSettings);
      setBusinessHours(hoursRows);
      setDoctors(doctorsRes.data ?? []);
      setTreatments(treatmentsRes.data ?? []);
      setClinicDraft({
        name: activeClinic.name || "",
        phone: activeClinic.phone || "",
        whatsapp: activeClinic.whatsapp || "",
        email: activeClinic.email || "",
        address: activeClinic.address || "",
        city: activeClinic.city || "",
        country: activeClinic.country || "",
        timezone: activeClinic.timezone || "UTC",
        currency: activeClinic.currency || "USD",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load website settings.");
    }
  }, [activeClinicId, activeClinic]);

  useEffect(() => { void load(); }, [load]);

  const selectedTheme = themes.find(theme=>theme.key===settings?.theme_key) ?? null;
  const bookingSettings: Required<BookingSettings> = {
    ...BOOKING_DEFAULTS,
    ...(settings?.content.bookingSettings || {}),
  };
  const effectiveTokens = useMemo(() => deepMergeTokens(selectedTheme?.default_tokens || {}, settings?.tokens || {}), [selectedTheme, settings?.tokens]);

  const previewSite = useMemo<PublicClinicSite | null>(() => {
    if (!activeClinic || !settings) return null;
    return {
      clinic: { ...activeClinic, ...clinicDraft },
      settings: { ...settings, tokens: effectiveTokens },
      theme: selectedTheme,
      doctors,
      treatments,
    };
  }, [activeClinic, clinicDraft, settings, effectiveTokens, selectedTheme, doctors, treatments]);

  if (!activeClinicId || !activeClinic) return <div className="p-8 text-sm">Select a clinic before opening Website Builder.</div>;
  if (activeClinicRole !== "clinic_owner") return <div className="p-8 text-sm">Only the Clinic Owner can change the public website.</div>;
  if (!settings) return <div className="p-8 text-sm">{error || "Loading Website Builder..."}</div>;

  const updateTokens = (group: "colors" | "typography" | "layout", key: string, value: string | number) => {
    setSettings(current => current ? {
      ...current,
      tokens: {
        ...(current.tokens || {}),
        [group]: { ...(current.tokens[group] || {}), [key]: value },
      },
    } : current);
  };

  const chooseTheme = (theme: ThemeDefinition) => {
    setSettings(current => current ? {
      ...current,
      theme_key: theme.key,
      tokens: theme.default_tokens,
    } : current);
  };

  const updateHero = (key: string, value: string) => {
    setSettings(current => current ? {
      ...current,
      content: {
        ...(current.content || {}),
        hero: { ...(current.content?.hero || {}), [key]: value },
      },
    } : current);
  };

  const updateSectionContent = (section: EditableTextSection, key: string, value: string) => {
    setSettings((current) => {
      if (!current) return current;
      const sectionValue = current.content[section];
      const currentSection = sectionValue && typeof sectionValue === "object" && !Array.isArray(sectionValue)
        ? sectionValue as Record<string, unknown>
        : {};
      return {
        ...current,
        content: {
          ...current.content,
          [section]: { ...currentSection, [key]: value },
        },
      };
    });
  };

  const updateJourneyStep = (index: number, key: "title" | "text", value: string) => {
    setSettings(current => {
      if (!current) return current;
      const defaults = [
        { step: "01", title: "Book online", text: "Send your preferred date and treatment." },
        { step: "02", title: "Visit the clinic", text: "Receive care from your dental team." },
        { step: "03", title: "Stay connected", text: "Use the secure patient portal for follow-up." },
      ];
      const steps = [...(current.content?.journey?.steps || defaults)].map((item) => ({ ...item }));
      steps[index] = { ...steps[index], [key]: value };
      return {
        ...current,
        content: {
          ...(current.content || {}),
          journey: { ...(current.content?.journey || {}), steps },
        },
      };
    });
  };

  const updateBookingSetting = (key: keyof typeof BOOKING_DEFAULTS, value: string | number | number[]) => {
    setSettings(current => current ? {
      ...current,
      content: {
        ...(current.content || {}),
        bookingSettings: {
          ...BOOKING_DEFAULTS,
          ...(current.content?.bookingSettings || {}),
          [key]: value,
        },
      },
    } : current);
  };

  const updateBusinessHour = (weekday: number, patch: Partial<ClinicBusinessHour>) => {
    setBusinessHours((current) =>
      current.map((row) => row.weekday === weekday ? { ...row, ...patch } : row)
    );
  };

  const toggleSection = (key: string) => {
    setSettings(current => {
      if (!current) return current;
      return {
        ...current,
        sections: current.sections.map(section => section.key===key ? {...section,enabled:!section.enabled} : section),
      };
    });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setSettings(current => {
      if (!current) return current;
      const next = [...current.sections];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index],next[target]]=[next[target],next[index]];
      return {...current,sections:next};
    });
  };

  const uploadAsset = async (event: ChangeEvent<HTMLInputElement>, kind: "logo" | "hero") => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const url = await saasRepository.uploadClinicAsset(activeClinicId,file,kind);
      setSettings(current => current ? kind==="logo" ? {...current,logo_url:url} : {...current,hero_image_url:url} : current);
      setMessage(`${kind==="logo"?"Logo":"Hero image"} uploaded. Save changes to publish the new asset.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSaving(false);
      event.target.value="";
    }
  };

  const save = async () => {
    const toMinutes = (value: string) => {
      const [hour, minute] = value.slice(0,5).split(":").map(Number);
      return hour * 60 + minute;
    };
    const enabledHours = businessHours.filter((row) => row.enabled);
    if (enabledHours.length === 0) {
      setError("Enable at least one booking day.");
      return;
    }
    for (const row of enabledHours) {
      if (!row.open_time || !row.close_time || toMinutes(row.open_time) >= toMinutes(row.close_time)) {
        setError("Every enabled booking day needs a valid opening and closing time.");
        return;
      }
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      await Promise.all([
        saasRepository.updateSiteSettings(activeClinicId, settings),
        saasRepository.updateClinic(activeClinicId, clinicDraft),
        saasRepository.saveBusinessHours(activeClinicId, businessHours),
      ]);
      setMessage("Website, branding, and booking hours saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save website.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{color:"var(--accent)"}}>Clinic Website</div>
          <h1 className="text-3xl font-bold mt-1" style={{fontFamily:"'Cormorant Garamond',serif",color:"var(--primary)"}}>Website Builder</h1>
          <p className="text-sm mt-1" style={{color:"var(--muted-foreground)"}}>Change the theme, colors, fonts, sizes, spacing, images, content and visible sections without editing code.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/c/${activeClinic.slug}`} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-xl border text-sm font-semibold inline-flex items-center gap-2"><Eye size={15}/>Open Website</a>
          <button onClick={()=>setSettings({...settings,published:!settings.published})} className={`px-4 py-2.5 rounded-xl text-sm font-semibold border ${settings.published?"bg-emerald-50 text-emerald-700 border-emerald-200":"bg-amber-50 text-amber-700 border-amber-200"}`}>
            {settings.published?"Published":"Draft"}
          </button>
          <button onClick={()=>void save()} disabled={saving} className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2" style={{background:"var(--primary)"}}><Save size={15}/>{saving?"Saving...":"Save Changes"}</button>
        </div>
      </div>

      {message && <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm">{message}</div>}
      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="grid 2xl:grid-cols-[460px_1fr] gap-5 items-start">
        <div className="space-y-4 2xl:max-h-[calc(100vh-150px)] 2xl:overflow-y-auto 2xl:pr-1">
          <section className="rounded-2xl border bg-white p-5">
            <div className="flex items-center gap-2 font-bold"><Palette size={17}/>Theme</div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {themes.map((theme) => {
                const locked = theme.key !== "modern" && !hasFeature("all_themes");
                return <button
                  type="button"
                  key={theme.key}
                  disabled={locked}
                  onClick={()=>chooseTheme(theme)}
                  className={`rounded-xl border p-3 text-left transition ${settings.theme_key===theme.key?"ring-2 ring-violet-400":""} ${locked?"cursor-not-allowed bg-slate-50 opacity-60":"hover:border-violet-300"}`}
                  title={locked ? `${entitlements?.plan?.name || "Current"} plan includes the Modern theme only` : undefined}
                >
                  <div className="font-semibold text-sm">{theme.name}</div>
                  <div className="text-[10px] mt-1 text-slate-500">{locked ? "Upgrade to unlock" : theme.premium ? "Premium" : "Included"}</div>
                </button>;
              })}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <div className="flex items-center gap-2 font-bold"><Palette size={17}/>Colors</div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {colorFields.map(([key,label])=><label key={key} className="text-xs font-semibold">{label}
                <div className="mt-1.5 flex gap-2 items-center">
                  <input type="color" value={effectiveTokens.colors?.[key] || "#000000"} onChange={e=>updateTokens("colors",key,e.target.value)} className="w-10 h-10 border rounded-lg p-1" />
                  <input value={effectiveTokens.colors?.[key] || ""} onChange={e=>updateTokens("colors",key,e.target.value)} className="min-w-0 w-full px-2 py-2 rounded-lg border text-xs font-mono" />
                </div>
              </label>)}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <div className="flex items-center gap-2 font-bold"><Type size={17}/>Typography</div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <label className="text-xs font-semibold">Heading font
                <select value={effectiveTokens.typography?.headingFont || "Inter"} onChange={e=>updateTokens("typography","headingFont",e.target.value)} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-white">
                  {["Inter","Manrope","Cormorant Garamond","Georgia","System"].map(font=><option key={font}>{font}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold">Body font
                <select value={effectiveTokens.typography?.bodyFont || "Inter"} onChange={e=>updateTokens("typography","bodyFont",e.target.value)} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-white">
                  {["Inter","Manrope","Cormorant Garamond","Georgia","System"].map(font=><option key={font}>{font}</option>)}
                </select>
              </label>
            </div>
            {TYPOGRAPHY_SCALE_CONTROLS.map(({key,label,min,max,step})=><label key={key} className="block text-xs font-semibold mt-4">{label} · {Number(effectiveTokens.typography?.[key] || 1).toFixed(2)}x
              <input type="range" min={min} max={max} step={step} value={Number(effectiveTokens.typography?.[key] || 1)} onChange={e=>updateTokens("typography",key,Number(e.target.value))} className="w-full mt-2" />
            </label>)}
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <div className="flex items-center gap-2 font-bold"><SlidersHorizontal size={17}/>Sizes & spacing</div>
            {LAYOUT_CONTROLS.map(({key,label,min,max,step,unit})=><label key={key} className="block text-xs font-semibold mt-4 first:mt-3">{label} · {Number(effectiveTokens.layout?.[key] || 0)}{unit}
              <input type="range" min={min} max={max} step={step} value={Number(effectiveTokens.layout?.[key] || 0)} onChange={e=>updateTokens("layout",key,Number(e.target.value))} className="w-full mt-2" />
            </label>)}
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <div className="font-bold">Clinic identity</div>
            <div className="space-y-3 mt-4">
              <input value={clinicDraft.name} onChange={e=>setClinicDraft({...clinicDraft,name:e.target.value})} placeholder="Clinic name" className="w-full px-3 py-2.5 rounded-xl border" />
              <input value={settings.site_title || ""} onChange={e=>setSettings({...settings,site_title:e.target.value})} placeholder="Website title" className="w-full px-3 py-2.5 rounded-xl border" />
              <input value={settings.tagline || ""} onChange={e=>setSettings({...settings,tagline:e.target.value})} placeholder="Tagline" className="w-full px-3 py-2.5 rounded-xl border" />
              <div className="grid grid-cols-2 gap-2">
                <label className="px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-2"><Upload size={14}/>Upload Logo<input type="file" accept="image/*" className="hidden" onChange={e=>void uploadAsset(e,"logo")} /></label>
                <label className="px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-2"><ImagePlus size={14}/>Hero Image<input type="file" accept="image/*" className="hidden" onChange={e=>void uploadAsset(e,"hero")} /></label>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <div className="font-bold">Hero content</div>
            <div className="space-y-3 mt-4">
              <input value={settings.content?.hero?.eyebrow || ""} onChange={e=>updateHero("eyebrow",e.target.value)} placeholder="Eyebrow" className="w-full px-3 py-2.5 rounded-xl border" />
              <textarea value={settings.content?.hero?.title || ""} onChange={e=>updateHero("title",e.target.value)} placeholder="Main headline" className="w-full px-3 py-2.5 rounded-xl border min-h-20" />
              <textarea value={settings.content?.hero?.subtitle || ""} onChange={e=>updateHero("subtitle",e.target.value)} placeholder="Subtitle" className="w-full px-3 py-2.5 rounded-xl border min-h-20" />
              <div className="grid grid-cols-2 gap-2">
                <input value={settings.content?.hero?.primaryCta || ""} onChange={e=>updateHero("primaryCta",e.target.value)} placeholder="Primary button" className="w-full px-3 py-2.5 rounded-xl border" />
                <input value={settings.content?.hero?.secondaryCta || ""} onChange={e=>updateHero("secondaryCta",e.target.value)} placeholder="Secondary button" className="w-full px-3 py-2.5 rounded-xl border" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <div className="font-bold">Section copy</div>
            <div className="space-y-5 mt-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Treatments</div>
                <input value={settings.content?.services?.eyebrow || ""} onChange={e=>updateSectionContent("services","eyebrow",e.target.value)} placeholder="Treatments eyebrow" className="w-full px-3 py-2.5 rounded-xl border" />
                <input value={settings.content?.services?.title || ""} onChange={e=>updateSectionContent("services","title",e.target.value)} placeholder="Care designed around the patient." className="w-full px-3 py-2.5 rounded-xl border" />
                <textarea value={settings.content?.services?.subtitle || ""} onChange={e=>updateSectionContent("services","subtitle",e.target.value)} placeholder="Treatments section description" className="w-full px-3 py-2.5 rounded-xl border min-h-16" />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doctors</div>
                <input value={settings.content?.doctors?.eyebrow || ""} onChange={e=>updateSectionContent("doctors","eyebrow",e.target.value)} placeholder="Clinical Team" className="w-full px-3 py-2.5 rounded-xl border" />
                <input value={settings.content?.doctors?.title || ""} onChange={e=>updateSectionContent("doctors","title",e.target.value)} placeholder="Meet the dental team." className="w-full px-3 py-2.5 rounded-xl border" />
                <textarea value={settings.content?.doctors?.subtitle || ""} onChange={e=>updateSectionContent("doctors","subtitle",e.target.value)} placeholder="Doctors section description" className="w-full px-3 py-2.5 rounded-xl border min-h-16" />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Journey</div>
                <input value={settings.content?.journey?.title || ""} onChange={e=>updateSectionContent("journey","title",e.target.value)} placeholder="A simple patient journey." className="w-full px-3 py-2.5 rounded-xl border" />
                {[0,1,2].map(index=>{
                  const defaults = [
                    {title:"Book online",text:"Send your preferred date and treatment."},
                    {title:"Visit the clinic",text:"Receive care from your dental team."},
                    {title:"Stay connected",text:"Use the secure patient portal for follow-up."},
                  ];
                  const step = settings.content?.journey?.steps?.[index] || defaults[index];
                  return <div key={index} className="rounded-xl bg-slate-50 p-3 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500">Step {index+1}</div>
                    <input value={step?.title || ""} onChange={e=>updateJourneyStep(index,"title",e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-white text-sm" />
                    <textarea value={step?.text || ""} onChange={e=>updateJourneyStep(index,"text",e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-white text-sm min-h-14" />
                  </div>;
                })}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking CTA</div>
                <input value={settings.content?.booking?.title || ""} onChange={e=>updateSectionContent("booking","title",e.target.value)} placeholder="Ready to request an appointment?" className="w-full px-3 py-2.5 rounded-xl border" />
                <textarea value={settings.content?.booking?.subtitle || ""} onChange={e=>updateSectionContent("booking","subtitle",e.target.value)} placeholder="Booking CTA description" className="w-full px-3 py-2.5 rounded-xl border min-h-16" />
                <input value={settings.content?.booking?.button || ""} onChange={e=>updateSectionContent("booking","button",e.target.value)} placeholder="Book Consultation" className="w-full px-3 py-2.5 rounded-xl border" />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</div>
                <textarea value={settings.content?.contact?.description || ""} onChange={e=>updateSectionContent("contact","description",e.target.value)} placeholder="Contact section description" className="w-full px-3 py-2.5 rounded-xl border min-h-16" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <div className="flex items-center gap-2 font-bold"><CalendarClock size={17}/>Online booking hours</div>
            <p className="mt-1 text-xs text-slate-500">Set each day independently. These hours are validated by the booking server before a request can be submitted.</p>

            <div className="mt-4 space-y-2">
              {DAY_LABELS.map(([day,label]) => {
                const row = businessHours.find((item) => item.weekday === day) || {
                  clinic_id: activeClinicId,
                  weekday: day,
                  enabled: false,
                  open_time: "09:00",
                  close_time: "17:00",
                  slot_minutes: 30,
                };
                return <div key={day} className={`grid grid-cols-[72px_1fr] gap-3 rounded-xl border p-3 ${row.enabled?"bg-white":"bg-slate-50"}`}>
                  <label className="flex items-center gap-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(event)=>updateBusinessHour(day,{ enabled:event.target.checked, open_time:row.open_time || "09:00", close_time:row.close_time || "17:00" })}
                    />
                    {label}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="time"
                      disabled={!row.enabled}
                      value={(row.open_time || "09:00").slice(0,5)}
                      onChange={(event)=>updateBusinessHour(day,{ open_time:event.target.value })}
                      className="min-w-0 rounded-lg border px-2 py-2 text-xs disabled:bg-slate-100"
                      aria-label={label+" opening time"}
                    />
                    <input
                      type="time"
                      disabled={!row.enabled}
                      value={(row.close_time || "17:00").slice(0,5)}
                      onChange={(event)=>updateBusinessHour(day,{ close_time:event.target.value })}
                      className="min-w-0 rounded-lg border px-2 py-2 text-xs disabled:bg-slate-100"
                      aria-label={label+" closing time"}
                    />
                    <select
                      disabled={!row.enabled}
                      value={row.slot_minutes}
                      onChange={(event)=>updateBusinessHour(day,{ slot_minutes:Number(event.target.value) })}
                      className="min-w-0 rounded-lg border bg-white px-2 py-2 text-xs disabled:bg-slate-100"
                      aria-label={label+" slot interval"}
                    >
                      {[15,20,30,45,60].map((value)=><option key={value} value={value}>{value} min</option>)}
                    </select>
                  </div>
                </div>;
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold">Minimum notice
                <select value={Number(bookingSettings.leadTimeHours)} onChange={e=>updateBookingSetting("leadTimeHours",Number(e.target.value))} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-white">
                  {[0,1,2,4,12,24,48,72].map(value=><option key={value} value={value}>{value === 0 ? "None" : value + " hours"}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold">Booking horizon · {Number(bookingSettings.horizonDays)} days
                <input type="range" min="7" max="365" step="7" value={Number(bookingSettings.horizonDays)} onChange={e=>updateBookingSetting("horizonDays",Number(e.target.value))} className="mt-3 w-full" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <div className="font-bold">Sections</div>
            <div className="space-y-2 mt-4">
              {settings.sections.map((section,index)=><div key={section.key} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                <input type="checkbox" checked={section.enabled} onChange={()=>toggleSection(section.key)} />
                <span className="text-sm flex-1">{sectionNames[section.key] || section.key}</span>
                <button onClick={()=>moveSection(index,-1)} disabled={index===0} className="p-1 disabled:opacity-20"><ArrowUp size={14}/></button>
                <button onClick={()=>moveSection(index,1)} disabled={index===settings.sections.length-1} className="p-1 disabled:opacity-20"><ArrowDown size={14}/></button>
              </div>)}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <div className="font-bold">Contact information</div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <input value={clinicDraft.phone} onChange={e=>setClinicDraft({...clinicDraft,phone:e.target.value})} placeholder="Phone" className="px-3 py-2.5 rounded-xl border" />
              <input value={clinicDraft.whatsapp} onChange={e=>setClinicDraft({...clinicDraft,whatsapp:e.target.value})} placeholder="WhatsApp" className="px-3 py-2.5 rounded-xl border" />
              <input value={clinicDraft.email} onChange={e=>setClinicDraft({...clinicDraft,email:e.target.value})} placeholder="Email" className="px-3 py-2.5 rounded-xl border col-span-2" />
              <input value={clinicDraft.address} onChange={e=>setClinicDraft({...clinicDraft,address:e.target.value})} placeholder="Address" className="px-3 py-2.5 rounded-xl border col-span-2" />
              <input value={clinicDraft.city} onChange={e=>setClinicDraft({...clinicDraft,city:e.target.value})} placeholder="City" className="px-3 py-2.5 rounded-xl border" />
              <input value={clinicDraft.country} onChange={e=>setClinicDraft({...clinicDraft,country:e.target.value})} placeholder="Country" className="px-3 py-2.5 rounded-xl border" />
              <input value={clinicDraft.timezone} onChange={e=>setClinicDraft({...clinicDraft,timezone:e.target.value})} placeholder="Timezone, e.g. Asia/Hebron" className="px-3 py-2.5 rounded-xl border" />
              <input value={clinicDraft.currency} onChange={e=>setClinicDraft({...clinicDraft,currency:e.target.value.toUpperCase()})} maxLength={3} placeholder="Currency" className="px-3 py-2.5 rounded-xl border uppercase" />
            </div>
          </section>

          <button onClick={()=>selectedTheme && setSettings({...settings,tokens:selectedTheme.default_tokens})} className="w-full py-3 rounded-xl border bg-white text-sm font-semibold">Reset design to {selectedTheme?.name || "theme"} defaults</button>
        </div>

        <div className="2xl:sticky 2xl:top-4">
          <div className="rounded-3xl border bg-slate-200 p-3 md:p-5 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Preview · {selectedTheme?.name}</div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700"><Check size={13}/>Responsive theme renderer</div>
            </div>
            <div className="rounded-2xl overflow-hidden bg-white border max-h-[calc(100vh-115px)] overflow-y-auto">
              {previewSite && <div className="origin-top" style={{fontSize:"90%"}}><ClinicThemeRenderer site={previewSite} preview /></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
