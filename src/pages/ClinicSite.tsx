import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ClinicThemeRenderer from "@/components/ClinicThemeRenderer";
import { saasRepository } from "@/saas/repository";
import type { PublicClinicSite } from "@/saas/types";

export default function ClinicSite() {
  const { clinicSlug = "" } = useParams();
  const [site, setSite] = useState<PublicClinicSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    void saasRepository.getClinicSiteBySlug(clinicSlug)
      .then((data) => {
        if (!active) return;
        setSite(data);
        setNotFound(!data);
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [clinicSlug]);

  if (loading) return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">Loading clinic website...</div>;
  if (notFound || !site) return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-5">
      <div className="text-center max-w-lg">
        <div className="text-5xl">🦷</div>
        <h1 className="text-3xl font-bold mt-4">Clinic website unavailable</h1>
        <p className="text-slate-500 mt-2">This clinic website is not published or the address is incorrect.</p>
        <Link to="/" className="inline-block mt-6 px-5 py-3 rounded-xl bg-slate-950 text-white font-semibold">Back to LunaDent</Link>
      </div>
    </div>
  );

  return <ClinicThemeRenderer site={site} />;
}
