import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { saasRepository } from "@/saas/repository";
import type { PublicClinicSite } from "@/saas/types";

function normalizeHostname(value: string) {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

function platformHosts() {
  const configured = String(import.meta.env.VITE_PLATFORM_HOSTS || "")
    .split(",")
    .map(normalizeHostname)
    .filter(Boolean);
  return new Set(["lunadent.vercel.app", "localhost", "127.0.0.1", ...configured]);
}

export function getPlatformHomeUrl() {
  return String(import.meta.env.VITE_PLATFORM_URL || "https://lunadent.vercel.app").replace(/\/$/, "");
}

export function getCustomDomainHostname() {
  if (typeof window === "undefined") return null;
  const hostname = normalizeHostname(window.location.hostname);
  if (!hostname) return null;
  if (platformHosts().has(hostname)) return null;
  if (hostname.endsWith(".localhost") || hostname.endsWith(".local")) return null;
  if (hostname.endsWith(".vercel.app")) {
    return /^clinic-[a-z0-9-]+-lunadent\.vercel\.app$/.test(hostname) ? hostname : null;
  }
  return hostname;
}

export function clinicPublicHref(site: PublicClinicSite, suffix = "") {
  const customHostname = getCustomDomainHostname();
  const configuredDomain = normalizeHostname(site.settings.custom_domain || "");
  const managedDomain = normalizeHostname(site.settings.platform_subdomain || "");
  const cleanSuffix = suffix ? (suffix.startsWith("/") ? suffix : `/${suffix}`) : "";

  if (
    customHostname &&
    (
      managedDomain === customHostname ||
      (site.settings.domain_verified && configuredDomain === customHostname)
    )
  ) {
    return cleanSuffix || "/";
  }

  return `/c/${site.clinic.slug}${cleanSuffix}`;
}

export function usePublicClinicSite() {
  const { clinicSlug: routeClinicSlug = "" } = useParams();
  const customHostname = useMemo(() => getCustomDomainHostname(), []);
  const [site, setSite] = useState<PublicClinicSite | null>(null);
  const [loading, setLoading] = useState(Boolean(routeClinicSlug || customHostname));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!routeClinicSlug && !customHostname) {
      setSite(null);
      setLoading(false);
      setError("");
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    const request = routeClinicSlug
      ? saasRepository.getClinicSiteBySlug(routeClinicSlug)
      : saasRepository.getClinicSiteByDomain(customHostname || "");

    void request
      .then((row) => {
        if (!active) return;
        setSite(row);
        if (!row) setError("Clinic website is unavailable.");
      })
      .catch((err) => {
        if (!active) return;
        setSite(null);
        setError(err instanceof Error ? err.message : "Unable to load clinic.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [routeClinicSlug, customHostname]);

  return {
    site,
    loading,
    error,
    clinicSlug: site?.clinic.slug || routeClinicSlug,
    customHostname,
  };
}
