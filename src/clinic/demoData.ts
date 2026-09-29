import type { Appointment, ClinicalNote, DentalChartEntry, Doctor, InventoryItem, Invoice, Patient, Payment, PatientDocument, TreatmentCatalogItem, TreatmentPlan } from "./types";

const now = new Date().toISOString();

export const demoPatients: Patient[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    patient_no: "PT-1001",
    first_name: "Sofia",
    last_name: "Anderson",
    date_of_birth: "1993-08-12",
    sex: "female",
    phone: "+1 310 555 0192",
    email: "sofia@example.com",
    address: "Beverly Hills, CA",
    allergies: "Penicillin",
    chronic_conditions: "None",
    current_medications: "None",
    dental_history: "Porcelain veneers completed in 2025.",
    notes: "Prefers morning appointments.",
    status: "active",
    created_at: now,
    updated_at: now,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    patient_no: "PT-1002",
    first_name: "Priya",
    last_name: "Nair",
    date_of_birth: "1988-04-03",
    sex: "female",
    phone: "+1 310 555 0144",
    email: "priya@example.com",
    address: "West Hollywood, CA",
    allergies: "None known",
    chronic_conditions: "Controlled hypertension",
    current_medications: "Amlodipine",
    dental_history: "Implant consultation pending.",
    notes: null,
    status: "active",
    created_at: now,
    updated_at: now,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    patient_no: "PT-1003",
    first_name: "Marcus",
    last_name: "Taylor",
    date_of_birth: "1997-11-22",
    sex: "male",
    phone: "+1 310 555 0170",
    email: "marcus@example.com",
    address: "Santa Monica, CA",
    allergies: "Latex sensitivity",
    chronic_conditions: "None",
    current_medications: "None",
    dental_history: "Clear aligner treatment in progress.",
    notes: null,
    status: "active",
    created_at: now,
    updated_at: now,
  },
];

export const demoDoctors: Doctor[] = [
  { id: "d1111111-1111-4111-8111-111111111111", display_name: "Dr. Amelia Hart", specialty: "Cosmetic Dentistry", active: true },
  { id: "d2222222-2222-4222-8222-222222222222", display_name: "Dr. Noah Williams", specialty: "Implantology", active: true },
  { id: "d3333333-3333-4333-8333-333333333333", display_name: "Dr. Mia Chen", specialty: "Orthodontics", active: true },
];

export const demoTreatments: TreatmentCatalogItem[] = [
  { id: "t1111111-1111-4111-8111-111111111111", code: "CONSULT", name_en: "Dental Consultation", name_ar: "استشارة أسنان", duration_minutes: 30, default_price: 80, active: true },
  { id: "t2222222-2222-4222-8222-222222222222", code: "FILL", name_en: "Composite Filling", name_ar: "حشوة تجميلية", duration_minutes: 45, default_price: 180, active: true },
  { id: "t3333333-3333-4333-8333-333333333333", code: "RCT", name_en: "Root Canal Treatment", name_ar: "علاج عصب", duration_minutes: 90, default_price: 650, active: true },
  { id: "t4444444-4444-4444-8444-444444444444", code: "CROWN", name_en: "Ceramic Crown", name_ar: "تلبيسة سيراميك", duration_minutes: 60, default_price: 950, active: true },
];

const start1 = new Date(); start1.setHours(10, 30, 0, 0);
const end1 = new Date(start1); end1.setMinutes(end1.getMinutes() + 45);
const start2 = new Date(); start2.setHours(12, 0, 0, 0);
const end2 = new Date(start2); end2.setMinutes(end2.getMinutes() + 30);

export const demoAppointments: Appointment[] = [
  { id: "a1111111-1111-4111-8111-111111111111", patient_id: demoPatients[0].id, doctor_id: demoDoctors[0].id, treatment_id: demoTreatments[1].id, start_at: start1.toISOString(), end_at: end1.toISOString(), status: "confirmed", room: "Chair 1", patient: demoPatients[0], doctor: demoDoctors[0], treatment: demoTreatments[1] },
  { id: "a2222222-2222-4222-8222-222222222222", patient_id: demoPatients[2].id, doctor_id: demoDoctors[2].id, treatment_id: demoTreatments[0].id, start_at: start2.toISOString(), end_at: end2.toISOString(), status: "checked_in", room: "Chair 2", patient: demoPatients[2], doctor: demoDoctors[2], treatment: demoTreatments[0] },
];

export const demoDentalChart: DentalChartEntry[] = [
  { id: "c1111111-1111-4111-8111-111111111111", patient_id: demoPatients[0].id, tooth_no: 16, condition: "filling", surfaces: ["O"], status: "existing", notes: "Composite filling", recorded_at: now },
  { id: "c2222222-2222-4222-8222-222222222222", patient_id: demoPatients[0].id, tooth_no: 26, condition: "root_canal", surfaces: [], status: "planned", notes: "Endodontic treatment recommended", recorded_at: now },
];

export const demoTreatmentPlans: TreatmentPlan[] = [
  { id: "p1111111-1111-4111-8111-111111111111", patient_id: demoPatients[0].id, title: "Upper left rehabilitation", status: "proposed", estimated_total: 1600, discount_total: 100, notes: "RCT followed by ceramic crown", created_at: now, patient: demoPatients[0] },
  { id: "p2222222-2222-4222-8222-222222222222", patient_id: demoPatients[1].id, title: "Implant treatment plan", status: "approved", estimated_total: 3200, discount_total: 0, notes: "Implant and final crown", created_at: now, patient: demoPatients[1] },
];

export const demoClinicalNotes: ClinicalNote[] = [
  { id: "n1111111-1111-4111-8111-111111111111", patient_id: demoPatients[0].id, doctor_id: demoDoctors[0].id, note_type: "diagnosis", note: "Sensitivity on tooth 26. Radiographic assessment supports endodontic treatment.", created_at: now },
];

export const demoInventory: InventoryItem[] = [
  { id: "i1111111-1111-4111-8111-111111111111", sku: "COMP-A2", name: "Composite A2", category: "Restorative", quantity: 7, unit: "syringe", minimum_stock: 5, cost_per_unit: 28, supplier: "Dental Supply Co.", batch_no: "A2-2609", expiry_date: "2027-08-01", active: true },
  { id: "i2222222-2222-4222-8222-222222222222", sku: "ANEST-2", name: "Articaine 4%", category: "Anesthetic", quantity: 18, unit: "cartridge", minimum_stock: 20, cost_per_unit: 1.7, supplier: "MediDent", batch_no: "ART-112", expiry_date: "2027-01-20", active: true },
  { id: "i3333333-3333-4333-8333-333333333333", sku: "GLOVE-M", name: "Nitrile Gloves M", category: "Consumables", quantity: 12, unit: "box", minimum_stock: 8, cost_per_unit: 7.5, supplier: "SafeHands", batch_no: "GLV-44", expiry_date: null, active: true },
];

export const demoInvoices: Invoice[] = [
  { id: "v1111111-1111-4111-8111-111111111111", patient_id: demoPatients[0].id, invoice_no: "INV-001001", status: "partially_paid", subtotal: 1600, discount_total: 100, tax_total: 0, total: 1500, paid_total: 500, balance_due: 1000, issued_at: now, due_at: null },
  { id: "v2222222-2222-4222-8222-222222222222", patient_id: demoPatients[1].id, invoice_no: "INV-001002", status: "issued", subtotal: 3200, discount_total: 0, tax_total: 0, total: 3200, paid_total: 0, balance_due: 3200, issued_at: now, due_at: null },
];

export const demoPayments: Payment[] = [
  { id: "m1111111-1111-4111-8111-111111111111", patient_id: demoPatients[0].id, invoice_id: demoInvoices[0].id, amount: 500, method: "card", reference: "CARD-1048", paid_at: now, notes: null },
];

export const demoDocuments: PatientDocument[] = [
  { id: "f1111111-1111-4111-8111-111111111111", patient_id: demoPatients[0].id, document_type: "consent", title: "Treatment Consent", storage_path: "demo/consent.pdf", mime_type: "application/pdf", file_size: 120000, patient_visible: true, created_at: now },
];
