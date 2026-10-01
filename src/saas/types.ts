export type PlatformRole = "user" | "super_admin";
export type ClinicRole = "clinic_owner" | "dentist" | "receptionist" | "accountant";
export type ClinicStatus = "trialing" | "active" | "suspended" | "archived";

export type Clinic = {
  id: string;
  name: string;
  slug: string;
  legal_name?: string | null;
  status: ClinicStatus;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  currency: string;
  timezone: string;
  locale: string;
  onboarding_completed: boolean;
  logo_path?: string | null;
  created_at: string;
  updated_at: string;
};

export type ClinicMembership = {
  id: string;
  clinic_id: string;
  user_id: string;
  role: ClinicRole;
  active: boolean;
  clinic?: Clinic | null;
};

export type ThemeDefinition = {
  id: string;
  key: "modern" | "luxury" | "clinical" | string;
  name: string;
  description?: string | null;
  preview_image?: string | null;
  premium: boolean;
  active: boolean;
  default_tokens: SiteTokens;
};

export type SiteTokens = {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    surface?: string;
    text?: string;
    muted?: string;
  };
  typography?: {
    headingFont?: string;
    bodyFont?: string;
    headingScale?: number;
    bodyScale?: number;
  };
  layout?: {
    maxWidth?: number;
    sectionSpacing?: number;
    heroMinHeight?: number;
    navHeight?: number;
    buttonRadius?: number;
    cardRadius?: number;
    cardShadow?: "none" | "subtle" | "soft" | "medium" | "strong";
  };
};

export type SiteSection = {
  key: "hero" | "services" | "doctors" | "journey" | "booking" | "contact" | string;
  enabled: boolean;
};

export type HeroSiteContent = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  primaryCta?: string;
  secondaryCta?: string;
};

export type SectionSiteContent = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

export type JourneyStep = {
  step: string;
  title: string;
  text: string;
};

export type BookingSettings = {
  days?: number[];
  start?: string;
  end?: string;
  slotMinutes?: number;
  leadTimeHours?: number;
  horizonDays?: number;
};

export type ClinicSiteContent = {
  hero?: HeroSiteContent;
  services?: SectionSiteContent;
  doctors?: SectionSiteContent;
  journey?: {
    title?: string;
    steps?: JourneyStep[];
  };
  booking?: {
    title?: string;
    subtitle?: string;
    button?: string;
  };
  contact?: {
    description?: string;
  };
  bookingSettings?: BookingSettings;
  [key: string]: unknown;
};

export type SiteNavigationItem = {
  label?: string;
  href?: string;
  enabled?: boolean;
  [key: string]: unknown;
};

export type ClinicSiteSettings = {
  clinic_id: string;
  theme_key: string;
  published: boolean;
  custom_domain?: string | null;
  domain_verified: boolean;
  site_title?: string | null;
  tagline?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  hero_image_url?: string | null;
  tokens: SiteTokens;
  sections: SiteSection[];
  content: ClinicSiteContent;
  assets: Record<string, unknown>;
  navigation: SiteNavigationItem[];
  updated_at: string;
};

export type SaasPlan = {
  id: string;
  code: "starter" | "pro" | "enterprise" | string;
  name: string;
  description?: string | null;
  price_monthly: number;
  currency: string;
  active: boolean;
  features: Record<string, boolean>;
  limits: Record<string, number>;
};

export type Subscription = {
  id: string;
  clinic_id: string;
  plan_id?: string | null;
  status: "trialing" | "active" | "past_due" | "canceled" | "suspended";
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  billing_provider: string;
  plan?: SaasPlan | null;
};

export type ClinicSiteSummary = Pick<ClinicSiteSettings, "theme_key" | "published" | "custom_domain">;
export type SubscriptionWithPlan = Omit<Subscription, "plan"> & { plan?: SaasPlan | null };

export type ClinicCommercialRow = Clinic & {
  subscription?: SubscriptionWithPlan | SubscriptionWithPlan[] | null;
  site?: ClinicSiteSummary | ClinicSiteSummary[] | null;
};

export type PublicClinicSite = {
  clinic: Clinic;
  settings: ClinicSiteSettings;
  theme: ThemeDefinition | null;
  doctors: Array<{
    id: string;
    display_name: string;
    specialty?: string | null;
    bio_en?: string | null;
  }>;
  treatments: Array<{
    id: string;
    code: string;
    name_en: string;
    name_ar?: string | null;
    description_en?: string | null;
    duration_minutes: number;
    default_price: number;
  }>;
};

export type ClinicEntitlements = {
  clinic_id: string;
  clinic_status: ClinicStatus;
  usable: boolean;
  subscription_status: Subscription["status"] | "missing";
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  plan: (Omit<SaasPlan, "id"> & { id?: string }) | null;
};
