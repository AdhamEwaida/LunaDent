import type { CSSProperties } from "react";
import type { SiteTokens } from "./types";

export const fontStacks: Record<string,string> = {
  Inter: "Inter, ui-sans-serif, system-ui, sans-serif",
  Manrope: "Manrope, Inter, ui-sans-serif, system-ui, sans-serif",
  "Cormorant Garamond": "'Cormorant Garamond', Georgia, serif",
  Georgia: "Georgia, 'Times New Roman', serif",
  System: "ui-sans-serif, system-ui, sans-serif",
};

export function mergeTokens(base: SiteTokens = {}, custom: SiteTokens = {}): SiteTokens {
  return {
    colors: { ...(base.colors || {}), ...(custom.colors || {}) },
    typography: { ...(base.typography || {}), ...(custom.typography || {}) },
    layout: { ...(base.layout || {}), ...(custom.layout || {}) },
  };
}

export function tokensToStyle(tokens: SiteTokens): CSSProperties {
  const colors = tokens.colors || {};
  const typography = tokens.typography || {};
  const layout = tokens.layout || {};
  return {
    "--site-primary": colors.primary || "#2457C5",
    "--site-secondary": colors.secondary || "#EAF1FF",
    "--site-accent": colors.accent || "#26A69A",
    "--site-bg": colors.background || "#FFFFFF",
    "--site-surface": colors.surface || "#F8FAFC",
    "--site-text": colors.text || "#172033",
    "--site-muted": colors.muted || "#667085",
    "--site-heading-font": fontStacks[typography.headingFont || "Inter"] || typography.headingFont || fontStacks.Inter,
    "--site-body-font": fontStacks[typography.bodyFont || "Inter"] || typography.bodyFont || fontStacks.Inter,
    "--site-heading-scale": String(typography.headingScale || 1),
    "--site-body-scale": String(typography.bodyScale || 1),
    "--site-max-width": `${layout.maxWidth || 1200}px`,
    "--site-section-space": `${layout.sectionSpacing || 88}px`,
    "--site-hero-height": `${layout.heroMinHeight || 620}px`,
    "--site-nav-height": `${layout.navHeight || 76}px`,
    "--site-button-radius": `${layout.buttonRadius ?? 18}px`,
    "--site-card-radius": `${layout.cardRadius ?? 24}px`,
  } as CSSProperties;
}
