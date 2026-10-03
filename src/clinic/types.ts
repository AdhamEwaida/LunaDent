export type AppRole = "admin" | "dentist" | "receptionist" | "accountant" | "patient";

export type Patient = {
  clinic_id?: string;
  id: string;
  auth_user_id?: string | null;
  patient_no: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  sex?: "male" | "female" | "other" | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  blood_type?: string | null;
  allergies?: string | null;
  chronic_conditions?: string | null;
  current_medications?: string | null;
  dental_history?: string | null;
  notes?: string | null;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
};

export type AppointmentStatus = "scheduled" | "confirmed" | "checked_in" | "in_treatment" | "completed" | "cancelled" | "no_show";

export type Appointment = {
  clinic_id?: string;
  id: string;
  patient_id: string;
  doctor_id?: string | null;
  treatment_id?: string | null;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  room?: string | null;
  notes?: string | null;
  patient?: Pick<Patient, "id" | "patient_no" | "first_name" | "last_name"> | null;
  doctor?: { id: string; display_name: string } | null;
  treatment?: { id: string; name_en: string; name_ar?: string | null } | null;
};

export type ToothCondition = "healthy" | "caries" | "filling" | "crown" | "implant" | "missing" | "extraction" | "root_canal" | "bridge" | "veneer" | "fracture";

export type DentalChartEntry = {
  clinic_id?: string;
  id: string;
  patient_id: string;
  tooth_no: number;
  condition: ToothCondition;
  surfaces: string[];
  notes?: string | null;
  status: "existing" | "planned" | "completed";
  recorded_at: string;
};

export type ClinicalNote = {
  clinic_id?: string;
  id: string;
  patient_id: string;
  doctor_id?: string | null;
  note_type: "progress" | "diagnosis" | "procedure" | "follow_up";
  note: string;
  created_at: string;
};

export type TreatmentPlan = {
  clinic_id?: string;
  id: string;
  patient_id: string;
  title: string;
  status: "draft" | "proposed" | "approved" | "in_progress" | "completed" | "cancelled";
  estimated_total: number;
  discount_total: number;
  notes?: string | null;
  approved_at?: string | null;
  created_at: string;
  patient?: Pick<Patient, "id" | "patient_no" | "first_name" | "last_name"> | null;
};

export type TreatmentPlanItem = {
  clinic_id?: string;
  id: string;
  treatment_plan_id: string;
  treatment_id?: string | null;
  tooth_no?: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  sort_order: number;
};

export type Invoice = {
  clinic_id?: string;
  id: string;
  patient_id: string;
  invoice_no: string;
  status: "draft" | "issued" | "partially_paid" | "paid" | "void";
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  paid_total: number;
  balance_due: number;
  issued_at?: string | null;
  due_at?: string | null;
  patient?: Pick<Patient, "id" | "patient_no" | "first_name" | "last_name"> | null;
};

export type InventoryItem = {
  clinic_id?: string;
  id: string;
  sku: string;
  name: string;
  category?: string | null;
  quantity: number;
  unit?: string | null;
  minimum_stock: number;
  cost_per_unit: number;
  supplier?: string | null;
  batch_no?: string | null;
  expiry_date?: string | null;
  active: boolean;
};

export type Doctor = {
  clinic_id?: string;
  id: string;
  profile_id?: string | null;
  display_name: string;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
  active: boolean;
};

export type TreatmentCatalogItem = {
  clinic_id?: string;
  id: string;
  code: string;
  name_en: string;
  name_ar?: string | null;
  duration_minutes: number;
  default_price: number;
  active: boolean;
};

export type BookingRequest = {
  clinic_id?: string;
  id: string;
  full_name: string;
  email?: string | null;
  phone: string;
  treatment_id?: string | null;
  doctor_id?: string | null;
  requested_treatment?: string | null;
  requested_doctor?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  notes?: string | null;
  status: "new" | "contacted" | "converted" | "closed";
  created_at: string;
};

export type Payment = {
  clinic_id?: string;
  id: string;
  patient_id: string;
  invoice_id?: string | null;
  amount: number;
  method: "cash" | "card" | "bank_transfer" | "other";
  reference?: string | null;
  paid_at: string;
  notes?: string | null;
};

export type PatientDocument = {
  clinic_id?: string;
  id: string;
  patient_id: string;
  document_type: string;
  title: string;
  storage_path: string;
  mime_type?: string | null;
  file_size?: number | null;
  patient_visible: boolean;
  created_at: string;
};
