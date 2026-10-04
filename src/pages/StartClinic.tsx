import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Eye,
  Globe2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { saasRepository } from "@/saas/repository";
import type { SaasPlan, ThemeDefinition } from "@/saas/types";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export default function StartClinic() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [form, setForm] = useState({
    owner_name: "",
    clinic_name: "",
    email: "",
    password: "",
    terms_accepted: false,
    demo_checkout_acknowledged: true,
    website: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const requestedTheme = searchParams.get("theme") || "modern";
  const requestedPlan = searchParams.get("plan") || "pro";

  useEffect(() => {
    let active = true;
    void Promise.all([saasRepository.listThemes(), saasRepository.listPlans()])
      .then(([themeRows, planRows]) => {
        if (!active) return;
        setThemes(themeRows);
        setPlans(planRows);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load plans.");
      })
      .finally(() => {
        if (active) setLoadingCatalog(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.key === requestedTheme) || themes.find((theme) => theme.key === "modern") || null,
    [themes, requestedTheme],
  );
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.code === requestedPlan) || plans.find((plan) => plan.code === "pro") || plans[0] || null,
    [plans, requestedPlan],
  );

  const planSupportsTheme = (plan: SaasPlan, theme: ThemeDefinition | null) =>
    !theme || theme.key === "modern" || Boolean(plan.features?.all_themes);

  const setChoice = (key: "theme" | "plan", value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next, { replace: true });
    setError("");
  };

  const clinicSlug = slugify(form.clinic_name) || "your-clinic";
  const expectedUrl = `clinic-${clinicSlug}-lunadent.vercel.app`;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedTheme || !selectedPlan) return;
    if (!planSupportsTheme(selectedPlan, selectedTheme)) {
      setError(`${selectedPlan.name} includes the Modern theme only. Choose Modern or another plan.`);
      return;
    }
    if (!supabase) {
      setError("LunaDent authentication is not configured.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const result = await saasRepository.selfServeSignup({
        owner_name: form.owner_name.trim(),
        clinic_name: form.clinic_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        plan_code: selectedPlan.code,
        theme_key: selectedTheme.key,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        currency: "USD",
        terms_accepted: form.terms_accepted,
        demo_checkout_acknowledged: form.demo_checkout_acknowledged,
        website: form.website,
      });

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });
      if (sessionError) throw sessionError;

      window.location.assign("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your clinic.");
      setSubmitting(false);
    }
  };

  if (loadingCatalog) {
    return <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-300">Preparing clinic signup...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
            <ArrowLeft size={16} /> Back to LunaDent
          </Link>
          <Link to="/staff/login" className="text-sm font-semibold text-violet-300 hover:text-violet-200">
            Already have a clinic? Sign in
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[.92fr_1.08fr]">
          <aside className="rounded-[28px] border border-white/10 bg-white/[.05] p-5 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-200">
              <Sparkles size={13} /> Choose your clinic look
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight">Launch a working clinic tenant in a few minutes.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Pick a real LunaDent theme, choose a plan, create the owner account, then complete the clinic details in onboarding.
            </p>

            <div className="mt-7">
              <div className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">Theme</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                {themes.map((theme) => {
                  const selected = selectedTheme?.key === theme.key;
                  return (
                    <div key={theme.key} className={`rounded-2xl border p-3 ${selected ? "border-violet-400 bg-violet-400/10" : "border-white/10 bg-black/10"}`}>
                      <button type="button" onClick={() => setChoice("theme", theme.key)} className="w-full text-left">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold">{theme.name}</div>
                          {selected && <Check size={16} className="text-violet-300" />}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{theme.description}</div>
                      </button>
                      <Link to={`/demo/theme/${theme.key}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                        <Eye size={13} /> Live demo
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-7">
              <div className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">Plan · demo checkout</div>
              <div className="mt-3 space-y-2">
                {plans.map((plan) => {
                  const compatible = planSupportsTheme(plan, selectedTheme);
                  const selected = selectedPlan?.code === plan.code;
                  return (
                    <button
                      type="button"
                      key={plan.code}
                      disabled={!compatible}
                      onClick={() => setChoice("plan", plan.code)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left ${selected ? "border-cyan-400 bg-cyan-400/10" : "border-white/10 bg-black/10"} ${!compatible ? "cursor-not-allowed opacity-40" : ""}`}
                    >
                      <div>
                        <div className="font-bold">{plan.name}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {compatible ? plan.description : "Choose Modern for this plan."}
                        </div>
                      </div>
                      <div className="pl-4 text-right">
                        <div className="font-black">{plan.currency === "USD" ? "$" : ""}{Number(plan.price_monthly).toFixed(0)}</div>
                        <div className="text-[10px] text-slate-500">demo / month</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="rounded-[28px] bg-white p-5 text-slate-950 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b pb-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[.14em] text-violet-600">Create clinic owner account</div>
                <h2 className="mt-1 text-2xl font-black">Your clinic starts here</h2>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-700"><Stethoscope size={20} /></div>
            </div>

            <form onSubmit={submit} className="mt-6">
              {error && <div role="alert" className="mb-5 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold">Your name
                  <div className="relative mt-1.5">
                    <UserRound size={15} className="absolute left-3 top-3.5 text-slate-400" />
                    <input required maxLength={120} autoComplete="name" value={form.owner_name} onChange={(event)=>setForm({...form,owner_name:event.target.value})} className="w-full rounded-xl border py-3 pl-9 pr-3" placeholder="Clinic owner" />
                  </div>
                </label>
                <label className="text-xs font-semibold">Clinic name
                  <div className="relative mt-1.5">
                    <Stethoscope size={15} className="absolute left-3 top-3.5 text-slate-400" />
                    <input required maxLength={140} autoComplete="organization" value={form.clinic_name} onChange={(event)=>setForm({...form,clinic_name:event.target.value})} className="w-full rounded-xl border py-3 pl-9 pr-3" placeholder="Smile Dental" />
                  </div>
                </label>
                <label className="text-xs font-semibold sm:col-span-2">Email
                  <div className="relative mt-1.5">
                    <Mail size={15} className="absolute left-3 top-3.5 text-slate-400" />
                    <input required type="email" autoComplete="email" value={form.email} onChange={(event)=>setForm({...form,email:event.target.value})} className="w-full rounded-xl border py-3 pl-9 pr-3" placeholder="owner@clinic.com" />
                  </div>
                </label>
                <label className="text-xs font-semibold sm:col-span-2">Password
                  <div className="relative mt-1.5">
                    <LockKeyhole size={15} className="absolute left-3 top-3.5 text-slate-400" />
                    <input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={form.password} onChange={(event)=>setForm({...form,password:event.target.value})} className="w-full rounded-xl border py-3 pl-9 pr-3" placeholder="At least 8 characters" />
                  </div>
                </label>
              </div>

              <input tabIndex={-1} aria-hidden="true" autoComplete="off" value={form.website} onChange={(event)=>setForm({...form,website:event.target.value})} className="absolute -left-[9999px] h-px w-px opacity-0" />

              <div className="mt-6 rounded-2xl border bg-slate-50 p-4">
                <div className="flex items-center gap-2 font-bold"><Globe2 size={17} /> Your included clinic URL</div>
                <div className="mt-2 break-all font-mono text-xs text-slate-700">{expectedUrl}</div>
                <div className="mt-2 text-xs leading-5 text-slate-500">
                  LunaDent reserves an available <b>vercel.app</b> address automatically. If the first name is taken, a short suffix is added.
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 font-bold text-emerald-900"><CreditCard size={17} /> Demo checkout</div>
                <div className="mt-2 text-sm text-emerald-800">
                  {selectedPlan?.name || "Selected plan"} · {selectedPlan?.currency === "USD" ? "$" : ""}{Number(selectedPlan?.price_monthly || 0).toFixed(0)} / month
                </div>
                <div className="mt-1 text-xs leading-5 text-emerald-700">No real card is charged right now. Clicking Create Clinic activates this demo subscription for the current prototype.</div>
              </div>

              <label className="mt-5 flex items-start gap-3 text-sm text-slate-600">
                <input required type="checkbox" checked={form.terms_accepted} onChange={(event)=>setForm({...form,terms_accepted:event.target.checked})} className="mt-1" />
                <span>I agree to the <Link to="/terms" className="font-semibold text-violet-700">Terms</Link> and <Link to="/privacy" className="font-semibold text-violet-700">Privacy Policy</Link>.</span>
              </label>

              <button disabled={submitting || !selectedTheme || !selectedPlan} className="mt-6 w-full rounded-xl bg-slate-950 py-3.5 font-semibold text-white disabled:opacity-50">
                {submitting ? "Creating your clinic..." : `Create clinic on ${selectedPlan?.name || "selected plan"}`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={13} /> Tenant-isolated workspace · owner account · managed clinic URL
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
