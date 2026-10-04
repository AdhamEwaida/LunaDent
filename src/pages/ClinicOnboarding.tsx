import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe2,
  ImagePlus,
  LockKeyhole,
  Palette,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { saasRepository } from "@/saas/repository";
import type { ClinicSiteSettings, SiteTokens, ThemeDefinition } from "@/saas/types";

const steps = [
  { label: "Clinic", description: "Contact and regional settings" },
  { label: "Theme", description: "Choose the website layout" },
  { label: "Branding", description: "Colors, logo and hero image" },
  { label: "Website", description: "Your opening message and CTA" },
  { label: "Launch", description: "Publish your starter website and open LunaDent" },
] as const;

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const maxImageBytes = 10 * 1024 * 1024;

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value.trim() }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function validHex(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value.trim());
}

export default function ClinicOnboarding() {
  const {
    activeClinic,
    activeClinicId,
    activeClinicRole,
    entitlements,
    refreshTenantContext,
  } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);
  const [settings, setSettings] = useState<ClinicSiteSettings | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(true);
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
  const [tagline, setTagline] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroCta, setHeroCta] = useState("Book Appointment");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const allThemesEnabled = Boolean(entitlements?.plan?.features?.all_themes);
  const customDomainEnabled = Boolean(entitlements?.plan?.features?.custom_domain);
  const planName = entitlements?.plan?.name || "Current plan";

  useEffect(() => {
    if (!activeClinicId || !activeClinic) return;

    let active = true;
    setLoadingSetup(true);
    setError("");

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
    ])
      .then(([themeRows, site]) => {
        if (!active) return;

        const requestedTheme = site.theme_key || "modern";
        const themeAllowed = requestedTheme === "modern" || allThemesEnabled;
        const nextThemeKey = themeAllowed ? requestedTheme : "modern";
        const theme = themeRows.find((row) => row.key === nextThemeKey) || themeRows[0] || null;
        const preserveCurrentTokens = nextThemeKey === site.theme_key;

        setThemes(themeRows);
        setSettings(site);
        setSelectedTheme(nextThemeKey);
        setPrimary(
          preserveCurrentTokens
            ? site.tokens?.colors?.primary || theme?.default_tokens?.colors?.primary || "#2457C5"
            : theme?.default_tokens?.colors?.primary || "#2457C5",
        );
        setAccent(
          preserveCurrentTokens
            ? site.tokens?.colors?.accent || theme?.default_tokens?.colors?.accent || "#26A69A"
            : theme?.default_tokens?.colors?.accent || "#26A69A",
        );
        setLogoUrl(site.logo_url || null);
        setHeroUrl(site.hero_image_url || null);
        setTagline(site.tagline || "");
        setHeroTitle(site.content?.hero?.title || activeClinic.name || "Welcome to our clinic");
        setHeroSubtitle(
          site.content?.hero?.subtitle ||
            "Modern dental care with a simple, comfortable patient experience.",
        );
        setHeroCta(site.content?.hero?.primaryCta || "Book Appointment");
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load onboarding.");
      })
      .finally(() => {
        if (active) setLoadingSetup(false);
      });

    return () => {
      active = false;
    };
  }, [activeClinicId, activeClinic, allThemesEnabled]);

  const selected = useMemo(
    () => themes.find((theme) => theme.key === selectedTheme) ?? null,
    [themes, selectedTheme],
  );

  const themeAllowed = (theme: ThemeDefinition) => theme.key === "modern" || allThemesEnabled;

  if (!activeClinicId || !activeClinic) {
    return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">No clinic selected.</div>;
  }
  if (activeClinicRole !== "clinic_owner") {
    return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">Clinic Owner access required.</div>;
  }
  if (activeClinic.onboarding_completed) {
    return <Navigate to="/admin" replace />;
  }
  if (loadingSetup) {
    return <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-300">Preparing your clinic setup...</div>;
  }
  if (!settings) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-5 text-center text-slate-600">
        <div>
          <div className="font-bold text-slate-950">Clinic website settings are unavailable.</div>
          <div className="mt-2 text-sm">{error || "Please refresh and try again."}</div>
        </div>
      </div>
    );
  }

  const includedClinicUrl = settings.platform_subdomain
    ? `https://${settings.platform_subdomain}`
    : `https://lunadent.vercel.app/c/${activeClinic.slug}`;

  const buildTokens = (): SiteTokens => {
    if (!selected) return settings.tokens || {};
    const preserveCurrentTheme = settings.theme_key === selected.key;
    return {
      ...selected.default_tokens,
      ...(preserveCurrentTheme ? settings.tokens : {}),
      colors: {
        ...(selected.default_tokens?.colors || {}),
        ...(preserveCurrentTheme ? settings.tokens?.colors || {} : {}),
        primary,
        accent,
      },
    };
  };

  const buildContent = () => ({
    ...settings.content,
    hero: {
      ...(settings.content?.hero || {}),
      title: heroTitle.trim(),
      subtitle: heroSubtitle.trim(),
      primaryCta: heroCta.trim() || "Book Appointment",
    },
  });

  const validateStep = (currentStep: number) => {
    if (currentStep === 0) {
      const requiredFields = [
        form.name,
        form.phone,
        form.whatsapp,
        form.email,
        form.address,
        form.city,
        form.country,
        form.timezone,
        form.currency,
      ];
      if (requiredFields.some((value) => !value.trim())) {
        return "Complete all clinic contact and regional fields before continuing.";
      }
      if (!validEmail(form.email)) return "Enter a valid clinic email address.";
      if (!validTimezone(form.timezone)) return "Enter a valid IANA timezone such as Asia/Hebron.";
      if (!/^[A-Z]{3}$/.test(form.currency.trim().toUpperCase())) {
        return "Currency must use a three-letter code such as USD, ILS, or JOD.";
      }
    }

    if (currentStep === 1) {
      if (!selected) return "Choose a website theme.";
      if (!themeAllowed(selected)) return "This theme is not included in the clinic plan.";
    }

    if (currentStep === 2) {
      if (!validHex(primary) || !validHex(accent)) {
        return "Use six-digit hex colors such as #2457C5.";
      }
    }

    if (currentStep === 3) {
      if (!heroTitle.trim()) return "Add a clear website headline.";
      if (!heroSubtitle.trim()) return "Add a short website introduction.";
      if (!heroCta.trim()) return "Add a booking call-to-action label.";
    }

    return "";
  };

  const chooseTheme = (theme: ThemeDefinition) => {
    if (!themeAllowed(theme)) return;
    setSelectedTheme(theme.key);
    setPrimary(theme.default_tokens?.colors?.primary || "#2457C5");
    setAccent(theme.default_tokens?.colors?.accent || "#26A69A");
    setMessage("");
    setError("");
  };

  const uploadAsset = async (event: ChangeEvent<HTMLInputElement>, kind: "logo" | "hero") => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage("");
    setError("");

    if (!allowedImageTypes.has(file.type)) {
      setError("Use JPEG, PNG, WebP, AVIF, or GIF images.");
      event.target.value = "";
      return;
    }
    if (file.size > maxImageBytes) {
      setError("Clinic website images must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    setSaving(true);
    try {
      const url = await saasRepository.uploadClinicAsset(activeClinicId, file, kind);
      const nextSite = await saasRepository.updateSiteSettings(activeClinicId, {
        ...(kind === "logo" ? { logo_url: url } : { hero_image_url: url }),
        published: false,
      });
      setSettings(nextSite);
      if (kind === "logo") setLogoUrl(url);
      else setHeroUrl(url);
      setMessage(kind === "logo" ? "Logo uploaded and saved." : "Hero image uploaded and saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const persistDraft = async (complete: boolean) => {
    if (!selected) throw new Error("Choose a website theme before continuing.");

    const normalizedForm = {
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim().toLowerCase(),
      address: form.address.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      timezone: form.timezone.trim(),
      currency: form.currency.trim().toUpperCase(),
    };

    const [, nextSite] = await Promise.all([
      saasRepository.updateClinic(activeClinicId, {
        ...normalizedForm,
        onboarding_completed: false,
      }),
      saasRepository.updateSiteSettings(activeClinicId, {
        theme_key: selectedTheme,
        site_title: normalizedForm.name,
        tagline: tagline.trim() || null,
        logo_url: logoUrl,
        hero_image_url: heroUrl,
        tokens: buildTokens(),
        content: buildContent(),
        published: complete,
      }),
    ]);

    setForm(normalizedForm);
    setSettings(nextSite);

    if (complete) {
      await saasRepository.updateClinic(activeClinicId, { onboarding_completed: true });
    }
  };

  const next = async () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      await persistDraft(false);
      setStep((current) => Math.min(current + 1, steps.length - 1));
      setMessage("Progress saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save onboarding progress.");
    } finally {
      setSaving(false);
    }
  };

  const back = () => {
    setMessage("");
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  };

  const finish = async () => {
    const validationError = [0, 1, 2, 3]
      .map(validateStep)
      .find(Boolean);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      await persistDraft(true);
      await refreshTenantContext();
      navigate("/admin/site-builder", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to finish onboarding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-5 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400">
            <Sparkles size={20} />
          </div>
          <div className="mt-4 text-xs font-semibold uppercase tracking-[.2em] text-violet-300">LunaDent Clinic Setup</div>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">Set up {activeClinic.name}</h1>
          <p className="mt-2 text-sm text-slate-400">
            Set the clinic basics, then LunaDent launches a starter website you can keep editing anytime.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-5 gap-1.5 sm:gap-2">
          {steps.map((item, index) => (
            <div key={item.label} className="min-w-0 text-center" aria-current={index === step ? "step" : undefined}>
              <div className={`h-1 rounded-full ${index <= step ? "bg-violet-400" : "bg-white/10"}`} />
              <div className={`mt-2 truncate text-[10px] sm:text-[11px] ${index === step ? "text-white" : "text-slate-500"}`}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white text-slate-950">
          <div className="border-b bg-slate-50 px-5 py-4 sm:px-8">
            <div className="text-xs font-semibold uppercase tracking-[.15em] text-violet-700">
              Step {step + 1} of {steps.length}
            </div>
            <div className="mt-1 text-sm text-slate-500">{steps[step].description}</div>
          </div>

          <div className="p-5 sm:p-8">
            {error && <div role="alert" className="mb-5 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}
            {message && <div className="mb-5 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">{message}</div>}

            {step === 0 && (
              <section>
                <div className="flex items-center gap-2"><Building2 size={19} /><h2 className="text-xl font-bold">Clinic details</h2></div>
                <p className="mt-2 text-sm text-slate-500">These details power the dashboard, invoices, booking experience, and public website.</p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="text-xs font-semibold">Clinic name
                    <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 w-full rounded-xl border px-3 py-3" autoComplete="organization" />
                  </label>
                  <label className="text-xs font-semibold">Clinic email
                    <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1.5 w-full rounded-xl border px-3 py-3" autoComplete="email" />
                  </label>
                  <label className="text-xs font-semibold">Phone
                    <input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1.5 w-full rounded-xl border px-3 py-3" autoComplete="tel" />
                  </label>
                  <label className="text-xs font-semibold">WhatsApp
                    <input required value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} className="mt-1.5 w-full rounded-xl border px-3 py-3" autoComplete="tel" />
                  </label>
                  <label className="text-xs font-semibold md:col-span-2">Address
                    <input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="mt-1.5 w-full rounded-xl border px-3 py-3" autoComplete="street-address" />
                  </label>
                  <label className="text-xs font-semibold">City
                    <input required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="mt-1.5 w-full rounded-xl border px-3 py-3" autoComplete="address-level2" />
                  </label>
                  <label className="text-xs font-semibold">Country
                    <input required value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="mt-1.5 w-full rounded-xl border px-3 py-3" autoComplete="country-name" />
                  </label>
                  <label className="text-xs font-semibold">Timezone
                    <input required value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} className="mt-1.5 w-full rounded-xl border px-3 py-3" placeholder="Asia/Hebron" />
                    <span className="mt-1 block font-normal text-slate-400">Use an IANA timezone so booking hours remain correct year-round.</span>
                  </label>
                  <label className="text-xs font-semibold">Currency
                    <input required maxLength={3} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} className="mt-1.5 w-full rounded-xl border px-3 py-3 uppercase" placeholder="USD" />
                    <span className="mt-1 block font-normal text-slate-400">Three-letter code used across treatment plans and accounting.</span>
                  </label>
                </div>
              </section>
            )}

            {step === 1 && (
              <section>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2"><Palette size={19} /><h2 className="text-xl font-bold">Choose a website theme</h2></div>
                    <p className="mt-2 text-sm text-slate-500">Themes are full layouts. You can change the choice later without rebuilding the clinic website.</p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{planName}</div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {themes.map((theme) => {
                    const allowed = themeAllowed(theme);
                    const chosen = selectedTheme === theme.key;
                    return (
                      <button
                        type="button"
                        key={theme.key}
                        disabled={!allowed}
                        onClick={() => chooseTheme(theme)}
                        className={`relative rounded-2xl border p-4 text-left transition ${chosen ? "border-violet-400 ring-2 ring-violet-500" : allowed ? "hover:border-slate-300" : "cursor-not-allowed bg-slate-50 opacity-60"}`}
                      >
                        {!allowed && (
                          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600 shadow-sm">
                            <LockKeyhole size={11} /> Upgrade
                          </div>
                        )}
                        <div
                          className="mb-4 h-32 rounded-xl"
                          style={{ background: `linear-gradient(135deg,${theme.default_tokens?.colors?.primary || "#475569"}22,${theme.default_tokens?.colors?.accent || "#94a3b8"}88)` }}
                        />
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold">{theme.name}</div>
                          {chosen && <Check size={17} className="text-violet-600" />}
                        </div>
                        <div className="mt-2 text-xs leading-5 text-slate-500">{theme.description}</div>
                      </button>
                    );
                  })}
                </div>

                {!allThemesEnabled && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    Your current plan includes the Modern layout. Pro and Enterprise unlock all clinic website themes.
                  </div>
                )}
              </section>
            )}

            {step === 2 && (
              <section>
                <div className="flex items-center gap-2"><ImagePlus size={19} /><h2 className="text-xl font-bold">Branding</h2></div>
                <p className="mt-2 text-sm text-slate-500">Set recognizable colors and imagery now. Advanced typography and layout controls remain in Website Builder.</p>

                <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
                  <div className="space-y-4">
                    <label className="block text-xs font-semibold">Primary color
                      <div className="mt-1.5 flex gap-2">
                        <input aria-label="Primary color picker" type="color" value={validHex(primary) ? primary : "#2457C5"} onChange={(event) => setPrimary(event.target.value)} className="h-11 w-12 rounded-xl border p-1" />
                        <input value={primary} onChange={(event) => setPrimary(event.target.value)} className="min-w-0 flex-1 rounded-xl border px-3 py-3 font-mono text-sm" />
                      </div>
                    </label>
                    <label className="block text-xs font-semibold">Accent color
                      <div className="mt-1.5 flex gap-2">
                        <input aria-label="Accent color picker" type="color" value={validHex(accent) ? accent : "#26A69A"} onChange={(event) => setAccent(event.target.value)} className="h-11 w-12 rounded-xl border p-1" />
                        <input value={accent} onChange={(event) => setAccent(event.target.value)} className="min-w-0 flex-1 rounded-xl border px-3 py-3 font-mono text-sm" />
                      </div>
                    </label>
                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">Quick preview</div>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl" style={{ background: validHex(primary) ? primary : "#2457C5" }} />
                        <div className="h-7 w-20 rounded-full" style={{ background: validHex(accent) ? accent : "#26A69A" }} />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid min-h-48 cursor-pointer place-items-center rounded-2xl border border-dashed p-4 text-center">
                      {logoUrl ? (
                        <div>
                          <img src={logoUrl} alt="Clinic logo preview" className="mx-auto max-h-24 max-w-full object-contain" />
                          <div className="mt-3 text-xs font-semibold text-slate-500">Replace logo</div>
                        </div>
                      ) : (
                        <div><Upload size={22} className="mx-auto text-slate-400" /><div className="mt-2 text-sm font-semibold">Upload logo</div><div className="mt-1 text-xs text-slate-400">PNG, WebP, AVIF, GIF or JPEG · max 10 MB</div></div>
                      )}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="hidden" disabled={saving} onChange={(event) => void uploadAsset(event, "logo")} />
                    </label>

                    <label className="grid min-h-48 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed p-4 text-center">
                      {heroUrl ? (
                        <div className="w-full">
                          <img src={heroUrl} alt="Clinic hero preview" className="h-28 w-full rounded-xl object-cover" />
                          <div className="mt-3 text-xs font-semibold text-slate-500">Replace hero image</div>
                        </div>
                      ) : (
                        <div><ImagePlus size={22} className="mx-auto text-slate-400" /><div className="mt-2 text-sm font-semibold">Hero image</div><div className="mt-1 text-xs text-slate-400">A wide, high-quality clinic photo works best</div></div>
                      )}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="hidden" disabled={saving} onChange={(event) => void uploadAsset(event, "hero")} />
                    </label>
                  </div>
                </div>
              </section>
            )}

            {step === 3 && (
              <section>
                <div className="flex items-center gap-2"><WandSparkles size={19} /><h2 className="text-xl font-bold">Website starting content</h2></div>
                <p className="mt-2 text-sm text-slate-500">Give the public website a useful starting point. Everything remains editable in Website Builder.</p>

                <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_.85fr]">
                  <div className="space-y-4">
                    <label className="block text-xs font-semibold">Clinic tagline
                      <input value={tagline} onChange={(event) => setTagline(event.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-3" placeholder="Confident smiles, thoughtful care" />
                    </label>
                    <label className="block text-xs font-semibold">Hero headline
                      <input required value={heroTitle} onChange={(event) => setHeroTitle(event.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-3" />
                    </label>
                    <label className="block text-xs font-semibold">Hero introduction
                      <textarea required rows={4} value={heroSubtitle} onChange={(event) => setHeroSubtitle(event.target.value)} className="mt-1.5 w-full resize-y rounded-xl border px-3 py-3" />
                    </label>
                    <label className="block text-xs font-semibold">Primary booking button
                      <input required value={heroCta} onChange={(event) => setHeroCta(event.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-3" />
                    </label>
                  </div>

                  <div className="overflow-hidden rounded-2xl border bg-slate-950 p-5 text-white">
                    <div className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">Draft preview</div>
                    <div className="mt-8 text-xs font-semibold" style={{ color: validHex(accent) ? accent : "#26A69A" }}>{tagline || form.name}</div>
                    <div className="mt-3 text-3xl font-black leading-tight">{heroTitle || "Your clinic headline"}</div>
                    <div className="mt-4 text-sm leading-6 text-slate-300">{heroSubtitle || "A short introduction to the clinic."}</div>
                    <div className="mt-6 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ background: validHex(primary) ? primary : "#2457C5" }}>
                      {heroCta || "Book Appointment"}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {step === 4 && (
              <section>
                <div className="text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check size={28} /></div>
                  <h2 className="mt-5 text-3xl font-black">Your clinic foundation is ready</h2>
                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    Finishing setup publishes this starter website and opens Website Builder so you can keep refining it.
                  </p>
                </div>

                <div className="mx-auto mt-7 grid max-w-4xl gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border p-4">
                    <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Clinic</div>
                    <div className="mt-2 text-lg font-bold">{form.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{form.city}, {form.country}</div>
                    <div className="mt-3 text-xs text-slate-500">{form.timezone} · {form.currency}</div>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Website</div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl" style={{ background: validHex(primary) ? primary : "#2457C5" }} />
                      <div>
                        <div className="font-bold">{selected?.name || selectedTheme}</div>
                        <div className="text-xs text-slate-500">Ready to publish when you finish</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-slate-600">{heroTitle}</div>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Brand assets</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3"><div className="font-semibold">Logo</div><div className="mt-1 text-xs text-slate-500">{logoUrl ? "Ready" : "Can be added later"}</div></div>
                      <div className="rounded-xl bg-slate-50 p-3"><div className="font-semibold">Hero image</div><div className="mt-1 text-xs text-slate-500">{heroUrl ? "Ready" : "Can be added later"}</div></div>
                    </div>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-slate-400"><Globe2 size={14} /> Clinic URL</div>
                    <div className="mt-2 break-all font-mono text-xs font-bold text-slate-800">{includedClinicUrl}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">
                      {customDomainEnabled
                        ? "This managed LunaDent URL is included. You can also connect your own custom domain later from Website Builder."
                        : "This managed LunaDent URL is included with the clinic and goes live when you finish setup."}
                    </div>
                  </div>
                </div>

                <div className="mx-auto mt-5 max-w-4xl rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  After launch, open the workspace to manage treatments, doctors, business hours, staff, branding, and the website anytime.
                </div>
              </section>
            )}

            <div className="mt-8 flex items-center justify-between gap-3 border-t pt-5">
              <button
                type="button"
                onClick={back}
                disabled={step === 0 || saving}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-30"
              >
                <ChevronLeft size={15} /> Back
              </button>

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => void next()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save & continue"} {!saving && <ChevronRight size={15} />}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void finish()}
                  disabled={saving}
                  className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Launching..." : "Launch clinic & open Website Builder"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
