import { useCallback, useEffect, useMemo, useState } from "react";
import { History, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/lib/supabase";

type AuditRow = {
  id: number;
  actor_user_id?: string | null;
  actor_name?: string | null;
  actor_email?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: { changed_fields?: string[] } | null;
  created_at: string;
};

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ClinicAuditLog() {
  const { activeClinicId } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!supabase || !activeClinicId) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("manage-clinic-users", {
        body: { action: "audit", clinic_id: activeClinicId },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(String(data.error));
      setRows((data?.logs || []) as AuditRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit history.");
    } finally {
      setLoading(false);
    }
  }, [activeClinicId]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (action !== "all" && row.action !== action) return false;
      if (!needle) return true;
      return [row.entity_type,row.entity_id,row.actor_name,row.actor_email,row.action]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [rows, query, action]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="rounded-2xl border bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold"><History size={18} />Clinic Audit Log</div>
            <p className="mt-1 text-sm text-slate-500">Security history records who changed an entity and which fields changed. Patient and clinical contents are not copied into the audit log.</p>
          </div>
          <button type="button" onClick={()=>void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"><RefreshCw size={14} />Refresh</button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px]">
          <label className="relative">
            <Search size={15} className="absolute left-3 top-3.5 text-slate-400" />
            <input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search actor, entity, or ID" className="w-full rounded-xl border py-3 pl-9 pr-3 text-sm" />
          </label>
          <select value={action} onChange={(event)=>setAction(event.target.value)} className="rounded-xl border bg-white px-3 py-3 text-sm">
            <option value="all">All actions</option>
            <option value="insert">Created</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
          </select>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="overflow-hidden rounded-2xl border bg-white">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading audit history…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <ShieldCheck size={30} className="mx-auto text-slate-300" />
            <div className="mt-3 font-semibold">No matching audit events</div>
            <div className="mt-1 text-sm text-slate-500">Changes made after audit logging was enabled will appear here.</div>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((row) => {
              const fields = Array.isArray(row.metadata?.changed_fields) ? row.metadata.changed_fields : [];
              const actor = row.actor_name || row.actor_email || (row.actor_user_id ? "Clinic user" : "System");
              return <div key={row.id} className="grid gap-3 p-4 md:grid-cols-[150px_1fr_180px] md:items-center">
                <div>
                  <span className={"inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold " + (row.action === "delete" ? "bg-red-50 text-red-700" : row.action === "insert" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700")}>{label(row.action)}</span>
                  <div className="mt-2 text-xs text-slate-500">{new Date(row.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-semibold">{label(row.entity_type)}</div>
                  <div className="mt-1 text-xs text-slate-500">Entity {row.entity_id ? row.entity_id.slice(0, 12) : "—"}</div>
                  {fields.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{fields.map((field)=><span key={field} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{label(field)}</span>)}</div>}
                </div>
                <div className="md:text-right">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Actor</div>
                  <div className="mt-1 text-sm font-medium">{actor}</div>
                  {row.actor_name && row.actor_email && <div className="text-xs text-slate-500">{row.actor_email}</div>}
                </div>
              </div>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
