import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ClinicThemeRenderer from "@/components/ClinicThemeRenderer";
import { saasRepository } from "@/saas/repository";
import type { PublicClinicSite } from "@/saas/types";

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

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

  useEffect(() => {
    if (!site) return;

    const previousTitle = document.title;
    const title = site.settings.site_title || site.clinic.name;
    const description = site.settings.tagline || `Book dental care with ${site.clinic.name}.`;
    const pageUrl = window.location.href;
    const themeColor = site.settings.tokens?.colors?.primary || "#2457C5";

    document.title = `${title} | Dental Clinic`;
    const descriptionMeta = upsertMeta('meta[name="description"]', { name: "description", content: description });
    const themeMeta = upsertMeta('meta[name="theme-color"]', { name: "theme-color", content: themeColor });
    const ogTitle = upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    const ogDescription = upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    const ogType = upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    const ogUrl = upsertMeta('meta[property="og:url"]', { property: "og:url", content: pageUrl });

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const canonicalWasCreated = !canonical;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    const previousCanonical = canonical.href;
    canonical.href = pageUrl.split("#")[0];

    let favicon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const previousFavicon = favicon?.href || "";
    const faviconWasCreated = !favicon;
    if (site.settings.favicon_url) {
      if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        document.head.appendChild(favicon);
      }
      favicon.href = site.settings.favicon_url;
    }

    return () => {
      document.title = previousTitle;
      if (canonicalWasCreated) canonical?.remove();
      else if (canonical) canonical.href = previousCanonical;
      if (faviconWasCreated) favicon?.remove();
      else if (favicon && previousFavicon) favicon.href = previousFavicon;
      for (const meta of [descriptionMeta, themeMeta, ogTitle, ogDescription, ogType, ogUrl]) {
        if (meta.dataset.lunadentTemporary === "true") meta.remove();
      }
    };
  }, [site]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          <p className="mt-4 text-sm font-medium">Loading clinic website…</p>
        </div>
      </div>
    );
  }

  if (notFound || !site) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-5">
        <div className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">🦷</div>
          <h1 className="text-3xl font-bold mt-4">Clinic website unavailable</h1>
          <p className="text-slate-500 mt-2">This clinic website is not published or the address is incorrect.</p>
          <Link to="/" className="inline-block mt-6 px-5 py-3 rounded-xl bg-slate-950 text-white font-semibold">Back to LunaDent</Link>
        </div>
      </div>
    );
  }

  return <ClinicThemeRenderer site={site} />;
}
