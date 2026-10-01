import { useEffect, useMemo, useState } from "react";
import { Check, CreditCard, Gauge, LockKeyhole, ShieldCheck, UsersRound } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/lib/supabase";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function featureLabel(key: string) {
  return key.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ClinicPlan() {
  const { activeClinic, activeClinicId, activeClinicRole, entitlements } = useAuth();
  const [usage, setUsage] = useState({ staff: 0, dentists: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase || !activeClinicId) return;
    let alive = true;
    void Promise.all([
      supabase.from("clinic_memberships").select("*", { count: "exact", head: true }).eq("clinic_id", activeClinicId).eq("active", true),
      supabase.from("clinic_memberships").select("*", { count: "exact", head: true }).eq("clinic_id", activeClinicId).eq("active", true).eq("role", "dentist"),
    ]).then(([staff, dentists]) => {
      if (!alive) return;
      if (staff.error) throw staff.error;
      if (dentists.error) throw dentists.error;
      setUsage({ staff: Number(staff.count || 0), dentists: Number(dentists.count || 0) });
    }).catch((err) => alive && setError(err instanceof Error ? err.message : "Unable to load plan usage."));
    return () => { alive = false; };
  }, [activeClinicId]);

  const plan = entitlements?.plan;
  const features = useMemo(() => Object.entries(plan?.features || {}).sort(([a], [b]) => a.localeCompare(b)), [plan?.features]);
  const staffLimit = Number(plan?.limits?.staff || 0);
  const dentistLimit = Number(plan?.limits?.dentists || 0);

  if (!activeClinic || !activeClinicId || !plan) {
    return <div className="rounded-2xl border bg-white p-8 text-sm text-slate-500">Plan information is unavailable for this clinic.</div>;
  }

  const usageBar = (current: number, limit: number) => {
    const ratio = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0;
    return (
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-violet-500" style={{ width: ratio + "%" }} />
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="overflow-hidden rounded-3xl border bg-slate-950 text-white">
        <div className="grid gap-8 p-6 md:grid-cols-[1fr_auto] md:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-violet-200">
              <CreditCard size={14} /> Subscription
            </div>
            <h2 className="mt-4 text-3xl font-black">{plan.name}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">{plan.description || "Clinic subscription and feature access."}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className={"rounded-full px-3 py-1.5 font-semibold " + (entitlements?.usable ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200")}>
                {(entitlements?.subscription_status || "missing").replaceAll("_", " ")}
              </span>
              {entitlements?.trial_ends_at && <span className="rounded-full bg-white/10 px-3 py-1.5 text-slate-300">Trial ends {formatDate(entitlements.trial_ends_at)}</span>}
              {entitlements?.current_period_end && <span className="rounded-full bg-white/10 px-3 py-1.5 text-slate-300">Period ends {formatDate(entitlements.current_period_end)}</span>}
            </div>
          </div>
          <div className="min-w-40 rounded-2xl border border-white/10 bg-white/5 p-5 text-right">
            <div className="text-xs uppercase tracking-wider text-slate-400">Listed price</div>
            <div className="mt-2 text-3xl font-black">{plan.currency === "USD" ? "$" : ""}{Number(plan.price_monthly || 0).toFixed(0)}</div>
            <div className="text-xs text-slate-400">per month</div>
          </div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center gap-2 font-bold"><UsersRound size={18} />Staff usage</div>
          <div className="mt-5 flex items-end justify-between"><div><div className="text-3xl font-black">{usage.staff}</div><div className="text-xs text-slate-500">active staff</div></div><div className="text-sm font-semibold text-slate-500">Limit {staffLimit || "—"}</div></div>
          {staffLimit > 0 && usageBar(usage.staff, staffLimit)}
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center gap-2 font-bold"><Gauge size={18} />Dentist seats</div>
          <div className="mt-5 flex items-end justify-between"><div><div className="text-3xl font-black">{usage.dentists}</div><div className="text-xs text-slate-500">active dentists</div></div><div className="text-sm font-semibold text-slate-500">Limit {dentistLimit || "—"}</div></div>
          {dentistLimit > 0 && usageBar(usage.dentists, dentistLimit)}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <div className="flex items-center gap-2 font-bold"><ShieldCheck size={18} />Plan features</div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([key, enabled]) => (
            <div key={key} className={"flex items-center gap-3 rounded-xl border p-3 text-sm " + (enabled ? "bg-emerald-50/50" : "bg-slate-50 text-slate-400")}>
              <span className={"grid h-7 w-7 place-items-center rounded-lg " + (enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500")}>
                {enabled ? <Check size={14} /> : <LockKeyhole size={13} />}
              </span>
              <span className="font-medium">{featureLabel(key)}</span>
            </div>
          ))}
        </div>
      </section>

      {activeClinicRole === "clinic_owner" && (
        <section className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
          <div className="font-bold text-violet-950">Need a different plan?</div>
          <p className="mt-1 text-sm leading-relaxed text-violet-800">Plan changes are controlled by the LunaDent platform owner so clinic data and billing state stay consistent. Contact your LunaDent account manager to change plan.</p>
        </section>
      )}
    </div>
  );
}
