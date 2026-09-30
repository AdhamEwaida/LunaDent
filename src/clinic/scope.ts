export const ACTIVE_CLINIC_STORAGE_KEY = "lunadent_active_clinic_id";

export function resolveClinicId(explicit?: string | null): string {
  if (explicit) return explicit;
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(ACTIVE_CLINIC_STORAGE_KEY);
    if (stored) return stored;
  }
  throw new Error("Select a clinic first.");
}
