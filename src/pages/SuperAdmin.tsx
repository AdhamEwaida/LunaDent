import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, ExternalLink, LayoutTemplate, LogOut, Plus, RefreshCw, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { saasRepository } from "@/saas/repository";
import { supabase } from "@/lib/supabase";
import type { Clinic, ClinicCommercialRow, SaasPlan, ThemeDefinition } from "@/saas/types";
import { useAuth } from "@/auth/AuthContext";

type ClinicRow = ClinicCommercialRow;

type LeadRow = {
  id: string;
  full_name: string;
  clinic_name?: string | null;
  email: string;
  phone?: string | null;
  message?: string | null;
  status: string;
  created_at: string;
};

export default function SuperAdmin() {
  const { user, signOut, memberships, setActiveClinicId } = useAuth();
  const navigate = useNavigate();
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    owner_name: "",
    owner_email: "",
    temporary_password: "",
    theme_key: "modern",
    plan_code: "starter",
    currency: "USD",
    timezone: "Asia/Hebron",
  });

  const load = async () => {
    setError("");
    try {
      const [clinicRows, themeRows, planRows] = await Promise.all([
        saasRepository.listAllClinics(),
        saasRepository.listThemes(),
        saasRepository.listPlans(),
      ]);
      setClinics(clinicRows as ClinicRow[]);
      setThemes(themeRows);
      setPlans(planRows);

      if (supabase) {
        const { data } = await supabase.from("saas_leads").select("*").order("created_at", { ascending: false }).limit(30);
        setLeads((data ?? []) as LeadRow[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load platform data.");
    }
  };

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => {
    const total = clinics.length;
    const active = clinics.filter(c => c.status === "active").length;
    const trials = clinics.filter(c => c.status === "trialing").length;
    const suspended = clinics.filter(c => c.status === "suspended").length;
    const mrr = clinics.reduce((sum, clinic) => {
      const subscription = Array.isArray(clinic.subscription) ? clinic.subscription[0] : clinic.subscription;
      const plan = subscription?.plan;
      if (!subscription || subscription.status !== "active") return sum;
      return sum + Number(plan?.price_monthly || 0);
    }, 0);
    return { total, active, trials, suspended, mrr };
  }, [clinics]);

  const selectedProvisionPlan = plans.find((plan) => plan.code === form.plan_code) ?? null;
  const provisionThemes = themes.filter((theme) => theme.key === "modern" || Boolean(selectedProvisionPlan?.features?.all_themes));

  const createClinic = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saasRepository.createClinic(form);
      setShowCreate(false);
      setForm({
        name: "", slug: "", owner_name: "", owner_email: "", temporary_password: "",
        theme_key: "modern", plan_code: "starter", currency: "USD", timezone: "Asia/Hebron",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create clinic.");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (clinic: ClinicRow, status: Clinic["status"]) => {
    try {
      await saasRepository.updateClinicStatus(clinic.id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update clinic.");
    }
  };

  const setPlan = async (clinic: ClinicRow, planCode: string) => {
    setError("");
    try {
      await saasRepository.setClinicPlan(clinic.id, planCode);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update plan.");
    }
  };

  const setSubscriptionStatus = async (
    clinic: ClinicRow,
    status: "trialing" | "active" | "past_due" | "canceled" | "suspended",
  ) => {
    setError("");
    try {
      await saasRepository.updateSubscriptionStatus(clinic.id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update subscription.");
    }
  };

  const openOwnClinic = (clinicId: string) => {
    if (!memberships.some((membership) => membership.clinic_id === clinicId)) return;
    setActiveClinicId(clinicId);
    navigate("/admin");
  };

  const updateLead = async (leadId: string, status: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("saas_leads").update({ status }).eq("id", leadId);
    if (error) setError(error.message);
    else await load();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="h-16 bg-slate-950 text-white px-5 md:px-8 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-3 font-bold">
          <span className="w-9 h-9 rounded-xl grid place-items-center bg-gradient-to-br from-violet-500 to-cyan-400">L</span>
          LunaDent <span className="text-slate-400 font-medium">Super Admin</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-slate-400">{user?.email}</span>
          <button onClick={() => void signOut().then(() => navigate("/staff/login"))} className="p-2 rounded-lg hover:bg-white/10" aria-label="Sign out"><LogOut size={17}/></button>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-5 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-violet-700 bg-violet-100 px-3 py-1.5 rounded-full"><ShieldCheck size={14}/>Platform owner</div>
            <h1 className="text-3xl md:text-4xl font-black mt-3">Dental SaaS Control Center</h1>
            <p className="text-slate-600 mt-2">Manage clinics, subscriptions, themes and sales leads without opening patient medical records.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void load()} className="px-4 py-2.5 rounded-xl border bg-white text-sm font-semibold inline-flex items-center gap-2"><RefreshCw size={15}/>Refresh</button>
            <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2.5 rounded-xl bg-slate-950 text-white text-sm font-semibold inline-flex items-center gap-2"><Plus size={15}/>New Clinic</button>
          </div>
        </div>

        {error && <div className="mt-5 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>}

        <section className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4 mt-8">
          {[
            ["Clinics", stats.total],
            ["Active", stats.active],
            ["Trials", stats.trials],
            ["Suspended", stats.suspended],
            ["Active MRR", `${stats.mrr.toFixed(0)}`],
          ].map(([label,value])=>(
            <div key={String(label)} className="rounded-2xl bg-white border p-5">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="text-3xl font-black mt-2">{value}</div>
            </div>
          ))}
        </section>

        {showCreate && (
          <section className="mt-6 rounded-3xl bg-white border p-6">
            <div className="flex items-center gap-2 mb-5"><Building2 size={19}/><h2 className="font-bold text-xl">Provision a clinic</h2></div>
            <form onSubmit={createClinic} className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <label className="text-xs font-semibold">Clinic name
                <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value,slug:form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border" />
              </label>
              <label className="text-xs font-semibold">Slug
                <input required value={form.slug} onChange={e=>setForm({...form,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"")})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border" />
              </label>
              <label className="text-xs font-semibold">Owner name
                <input required value={form.owner_name} onChange={e=>setForm({...form,owner_name:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border" />
              </label>
              <label className="text-xs font-semibold">Owner email
                <input required type="email" value={form.owner_email} onChange={e=>setForm({...form,owner_email:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border" />
              </label>
              <label className="text-xs font-semibold">Temporary password
                <input required minLength={8} type="password" value={form.temporary_password} onChange={e=>setForm({...form,temporary_password:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border" />
              </label>
              <label className="text-xs font-semibold">Starting theme
                <select value={form.theme_key} onChange={e=>setForm({...form,theme_key:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-white">
                  {provisionThemes.map(theme=><option key={theme.key} value={theme.key}>{theme.name}{theme.premium?" · Premium":""}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold">Plan
                <select
                  value={form.plan_code}
                  onChange={e=>{
                    const nextPlan = plans.find((plan)=>plan.code===e.target.value);
                    setForm({
                      ...form,
                      plan_code:e.target.value,
                      theme_key: nextPlan?.features?.all_themes ? form.theme_key : "modern",
                    });
                  }}
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border bg-white"
                >
                  {plans.map(plan=><option key={plan.code} value={plan.code}>{plan.name} · {plan.currency} {Number(plan.price_monthly).toFixed(0)}/mo</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold">Timezone
                <input value={form.timezone} onChange={e=>setForm({...form,timezone:e.target.value})} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border" />
              </label>
              <div className="md:col-span-2 xl:col-span-4 flex justify-end">
                <button disabled={saving} className="px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold">{saving?"Provisioning...":"Create Clinic + Owner"}</button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-8 rounded-3xl bg-white border overflow-hidden">
          <div className="px-6 py-5 border-b flex items-center justify-between">
            <div><h2 className="font-bold text-xl">Clinics</h2><p className="text-xs text-slate-500 mt-1">Tenant configuration and commercial status.</p></div>
            <Building2 className="text-slate-300"/>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr><th className="px-5 py-3">Clinic</th><th className="px-5 py-3">Theme</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Subscription</th><th className="px-5 py-3">Website</th><th className="px-5 py-3">Clinic status</th><th className="px-5 py-3">Actions</th></tr>
              </thead>
              <tbody>
                {clinics.map(clinic=>{
                  const subscription=Array.isArray(clinic.subscription)?clinic.subscription[0]:clinic.subscription;
                  const site=Array.isArray(clinic.site)?clinic.site[0]:clinic.site;
                  const ownMembership=memberships.some(m=>m.clinic_id===clinic.id);
                  return <tr key={clinic.id} className="border-t">
                    <td className="px-5 py-4"><div className="font-semibold">{clinic.name}</div><div className="text-xs text-slate-500">/{clinic.slug}</div></td>
                    <td className="px-5 py-4 capitalize">{site?.theme_key || "—"}</td>
                    <td className="px-5 py-4">
                      <select
                        value={subscription?.plan?.code || ""}
                        onChange={e=>void setPlan(clinic,e.target.value)}
                        className="min-w-32 rounded-lg border bg-white px-2 py-1.5 text-xs font-semibold"
                        aria-label={"Plan for " + clinic.name}
                      >
                        {plans.map(plan=><option key={plan.code} value={plan.code}>{plan.name}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={subscription?.status || "trialing"}
                        onChange={e=>void setSubscriptionStatus(clinic,e.target.value as "trialing" | "active" | "past_due" | "canceled" | "suspended")}
                        className="min-w-32 rounded-lg border bg-white px-2 py-1.5 text-xs font-semibold"
                        aria-label={"Subscription status for " + clinic.name}
                      >
                        {["trialing","active","past_due","canceled","suspended"].map(status=><option key={status} value={status}>{status.replaceAll("_"," ")}</option>)}
                      </select>
                      {subscription?.trial_ends_at && <div className="mt-1 text-[10px] text-slate-500">Trial to {new Date(subscription.trial_ends_at).toLocaleDateString()}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <Link to={`/c/${clinic.slug}`} target="_blank" className="inline-flex items-center gap-1 text-violet-700 font-semibold">{site?.published?"Published":"Draft"}<ExternalLink size={13}/></Link>
                    </td>
                    <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${clinic.status==="active"?"bg-emerald-100 text-emerald-700":clinic.status==="trialing"?"bg-blue-100 text-blue-700":clinic.status==="suspended"?"bg-amber-100 text-amber-800":"bg-slate-100 text-slate-600"}`}>{clinic.status}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {clinic.status==="suspended"
                          ? <button onClick={()=>void setStatus(clinic,"active")} className="text-xs font-semibold text-emerald-700">Activate</button>
                          : <button onClick={()=>void setStatus(clinic,"suspended")} className="text-xs font-semibold text-amber-700">Suspend</button>}
                        {ownMembership && <button onClick={()=>openOwnClinic(clinic.id)} className="text-xs font-semibold text-violet-700">Workspace</button>}
                      </div>
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.1fr_.9fr] gap-6 mt-8">
          <div className="rounded-3xl bg-white border overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center gap-2"><UsersRound size={18}/><h2 className="font-bold text-lg">Sales Leads</h2></div>
            <div className="divide-y">
              {leads.length===0 && <div className="p-8 text-sm text-slate-500">No demo requests yet.</div>}
              {leads.map(lead=><div key={lead.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div><div className="font-semibold">{lead.clinic_name || "Unnamed clinic"}</div><div className="text-sm text-slate-600">{lead.full_name} · {lead.email}</div>{lead.message && <div className="text-xs text-slate-500 mt-2">{lead.message}</div>}</div>
                  <select value={lead.status} onChange={e=>void updateLead(lead.id,e.target.value)} className="text-xs border rounded-lg px-2 py-1.5 bg-white">
                    {["new","contacted","qualified","converted","closed"].map(status=><option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>)}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 text-white p-6">
            <div className="flex items-center gap-2"><LayoutTemplate size={18}/><h2 className="font-bold text-lg">Theme Library</h2></div>
            <div className="space-y-3 mt-5">
              {themes.map(theme=><div key={theme.key} className="rounded-2xl bg-white/[.06] border border-white/10 p-4 flex items-center justify-between">
                <div><div className="font-semibold">{theme.name}</div><div className="text-xs text-slate-400 mt-1">{theme.description}</div></div>
                <span className="text-xs">{theme.premium?"Premium":"Included"}</span>
              </div>)}
            </div>
            <div className="mt-6 text-xs text-slate-400 flex items-center gap-2"><Sparkles size={14}/>Clinic owners customize design tokens without editing code.</div>
          </div>
        </section>
      </main>
    </div>
  );
}
