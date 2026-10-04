import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { resolveClinicId } from "@/clinic/scope";
import {
  demoAppointments,
  demoClinicalNotes,
  demoDentalChart,
  demoDoctors,
  demoInventory,
  demoInvoices,
  demoPayments,
  demoDocuments,
  demoPatients,
  demoTreatmentPlans,
  demoTreatments,
} from "./demoData";
import type {
  Appointment,
  BookingRequest,
  ClinicalNote,
  DentalChartEntry,
  Doctor,
  InventoryItem,
  Invoice,
  Patient,
  Payment,
  PatientDocument,
  TreatmentCatalogItem,
  TreatmentPlan,
  TreatmentPlanItem,
} from "./types";

const storageKey = (name: string) => `lunadent_demo_${name}`;

function loadLocal<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(name));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(name: string, value: T) {
  try {
    localStorage.setItem(storageKey(name), JSON.stringify(value));
  } catch {
    // Demo persistence is best-effort only.
  }
}

function normalizePatientSearch(patient: Patient, query: string) {
  const haystack = [
    patient.patient_no,
    patient.first_name,
    patient.last_name,
    patient.phone,
    patient.email,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

const currentClinicId = (explicit?: string | null) => resolveClinicId(explicit);

export const clinicRepository = {
  mode: isSupabaseConfigured ? "supabase" : "demo" as "supabase" | "demo",

  async listPatients(query = ""): Promise<Patient[]> {
    if (supabase) {
      const { data, error } = await supabase.rpc("search_patients", {
        p_clinic_id: currentClinicId(),
        p_query: query.trim() || null,
      });
      if (error) throw error;
      return (data ?? []) as Patient[];
    }

    const patients = loadLocal<Patient[]>("patients", demoPatients);
    return query.trim() ? patients.filter((patient) => normalizePatientSearch(patient, query)) : patients;
  },

  async createMyPatientProfile(input: {
    clinic_id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
    date_of_birth?: string;
    sex?: "male" | "female" | "other" | "";
    address?: string;
  }): Promise<string> {
    if (!supabase) {
      const created = await this.createPatient(input);
      return created.id;
    }

    const { data, error } = await supabase.rpc("create_my_patient_profile", {
      p_clinic_id: input.clinic_id,
      p_first_name: input.first_name.trim(),
      p_last_name: input.last_name.trim(),
      p_phone: input.phone?.trim() || null,
      p_email: input.email?.trim().toLowerCase() || null,
      p_date_of_birth: input.date_of_birth || null,
      p_sex: input.sex || null,
      p_address: input.address?.trim() || null,
    });

    if (error) throw error;
    return String(data);
  },

  async listMyPatientRecords(authUserId: string): Promise<Array<Patient & { clinic?: { id: string; name: string; slug: string } | null }>> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("patients")
      .select("*, clinic:clinics(id,name,slug)")
      .eq("auth_user_id", authUserId)
      .neq("status", "archived")
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as unknown as Array<Patient & { clinic?: { id: string; name: string; slug: string } | null }>;
  },

  async getPatientByAuthUserId(authUserId: string, clinicId?: string | null): Promise<Patient | null> {
    if (supabase) {
      let request = supabase.from("patients").select("*").eq("auth_user_id", authUserId);
      if (clinicId) request = request.eq("clinic_id", clinicId);
      const { data, error } = await request.limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: medical } = await supabase.from("patient_medical_history").select("blood_type,allergies,chronic_conditions,current_medications,dental_history,clinical_summary").eq("patient_id", data.id).maybeSingle();
      return { ...data, ...(medical ?? {}), notes: medical?.clinical_summary ?? null } as Patient;
    }
    return loadLocal<Patient[]>("patients", demoPatients)[0] ?? null;
  },

  async getPatient(id: string): Promise<Patient | null> {
    if (supabase) {
      let request = supabase.from("patients").select("*").eq("id", id);
      const clinicId = localStorage.getItem(ACTIVE_CLINIC_KEY);
      if (clinicId) request = request.eq("clinic_id", clinicId);
      const { data, error } = await request.maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: medical } = await supabase.from("patient_medical_history").select("blood_type,allergies,chronic_conditions,current_medications,dental_history,clinical_summary").eq("patient_id", id).maybeSingle();
      return { ...data, ...(medical ?? {}), notes: medical?.clinical_summary ?? null } as Patient;
    }
    return loadLocal<Patient[]>("patients", demoPatients).find((patient) => patient.id === id) ?? null;
  },

  async createPatient(input: Partial<Patient>): Promise<Patient> {
    if (supabase) {
      const clinicId = currentClinicId();
      const { data, error } = await supabase
        .from("patients")
        .insert({
          clinic_id: clinicId,
          first_name: input.first_name,
          last_name: input.last_name,
          phone: input.phone || null,
          email: input.email || null,
          date_of_birth: input.date_of_birth || null,
          sex: input.sex || null,
          address: input.address || null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as Patient;
    }

    const patients = loadLocal<Patient[]>("patients", demoPatients);
    const serial = Math.max(1000, ...patients.map((p) => Number(p.patient_no.replace(/\D/g, "")) || 0)) + 1;
    const created: Patient = {
      id: crypto.randomUUID(),
      patient_no: `PT-${serial}`,
      first_name: input.first_name || "New",
      last_name: input.last_name || "Patient",
      date_of_birth: input.date_of_birth || null,
      sex: input.sex || null,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      blood_type: null,
      allergies: input.allergies || null,
      chronic_conditions: input.chronic_conditions || null,
      current_medications: input.current_medications || null,
      dental_history: null,
      notes: input.notes || null,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const next = [created, ...patients];
    saveLocal("patients", next);
    return created;
  },

  async updatePatient(id: string, patch: Partial<Patient>): Promise<Patient> {
    if (supabase) {
      const allowed = {
        first_name: patch.first_name,
        last_name: patch.last_name,
        date_of_birth: patch.date_of_birth,
        sex: patch.sex,
        phone: patch.phone,
        email: patch.email,
        address: patch.address,
        emergency_contact_name: patch.emergency_contact_name,
        emergency_contact_phone: patch.emergency_contact_phone,
        status: patch.status,
      };
      const payload = Object.fromEntries(Object.entries(allowed).filter(([, value]) => value !== undefined));
      const { data, error } = await supabase
        .from("patients")
        .update(payload)
        .eq("id", id)
        .eq("clinic_id", currentClinicId())
        .select("*")
        .single();
      if (error) throw error;
      return data as Patient;
    }

    const patients = loadLocal<Patient[]>("patients", demoPatients);
    const next = patients.map((patient) => patient.id === id ? { ...patient, ...patch, updated_at: new Date().toISOString() } : patient);
    saveLocal("patients", next);
    return next.find((patient) => patient.id === id)!;
  },

  async updatePatientMedicalHistory(patientId: string, patch: Pick<Patient, "blood_type" | "allergies" | "chronic_conditions" | "current_medications" | "dental_history" | "notes">): Promise<void> {
    if (supabase) {
      const clinicId = currentClinicId();
      const { error } = await supabase.from("patient_medical_history").upsert({
        clinic_id: clinicId,
        patient_id: patientId,
        blood_type: patch.blood_type || null,
        allergies: patch.allergies || null,
        chronic_conditions: patch.chronic_conditions || null,
        current_medications: patch.current_medications || null,
        dental_history: patch.dental_history || null,
        clinical_summary: patch.notes || null,
      }, { onConflict: "patient_id" });
      if (error) throw error;
      return;
    }
    const patients = loadLocal<Patient[]>("patients", demoPatients);
    saveLocal("patients", patients.map((patient) => patient.id === patientId ? { ...patient, ...patch, updated_at: new Date().toISOString() } : patient));
  },

  async listAppointments(patientId?: string, clinicIdOverride?: string | null): Promise<Appointment[]> {
    if (supabase) {
      const clinicId = currentClinicId(clinicIdOverride);
      let request = supabase
        .from("appointments")
        .select("*, patient:patients!appointments_clinic_patient_fkey(id,patient_no,first_name,last_name), doctor:doctors!appointments_clinic_doctor_fkey(id,display_name), treatment:treatments!appointments_clinic_treatment_fkey(id,name_en,name_ar)")
        .eq("clinic_id", clinicId)
        .order("start_at", { ascending: true });
      if (patientId) request = request.eq("patient_id", patientId);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as unknown as Appointment[];
    }

    const appointments = loadLocal<Appointment[]>("appointments", demoAppointments);
    return patientId ? appointments.filter((appointment) => appointment.patient_id === patientId) : appointments;
  },

  async createAppointment(input: Partial<Appointment>): Promise<Appointment> {
    if (!input.patient_id || !input.start_at || !input.end_at) throw new Error("Patient, start time and end time are required.");
    if (supabase) {
      const { data, error } = await supabase.from("appointments").insert({
        clinic_id: currentClinicId(),
        patient_id: input.patient_id,
        doctor_id: input.doctor_id || null,
        treatment_id: input.treatment_id || null,
        start_at: input.start_at,
        end_at: input.end_at,
        status: input.status || "scheduled",
        room: input.room || null,
        notes: input.notes || null,
      }).select("*").single();
      if (error) throw error;
      return data as Appointment;
    }

    const appointments = loadLocal<Appointment[]>("appointments", demoAppointments);
    const patients = loadLocal<Patient[]>("patients", demoPatients);
    const doctors = loadLocal<Doctor[]>("doctors", demoDoctors);
    const treatments = loadLocal<TreatmentCatalogItem[]>("treatments", demoTreatments);
    const created: Appointment = {
      id: crypto.randomUUID(),
      patient_id: input.patient_id,
      doctor_id: input.doctor_id || null,
      treatment_id: input.treatment_id || null,
      start_at: input.start_at,
      end_at: input.end_at,
      status: input.status || "scheduled",
      room: input.room || null,
      notes: input.notes || null,
      patient: patients.find((p) => p.id === input.patient_id) ?? null,
      doctor: doctors.find((d) => d.id === input.doctor_id) ?? null,
      treatment: treatments.find((t) => t.id === input.treatment_id) ?? null,
    };
    saveLocal("appointments", [created, ...appointments]);
    return created;
  },

  async listDentalChart(patientId: string): Promise<DentalChartEntry[]> {
    if (supabase) {
      const { data, error } = await supabase.from("dental_chart_entries").select("*").eq("clinic_id", currentClinicId()).eq("patient_id", patientId).order("recorded_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DentalChartEntry[];
    }
    return loadLocal<DentalChartEntry[]>("dental_chart", demoDentalChart).filter((entry) => entry.patient_id === patientId);
  },

  async saveDentalChartEntry(input: Omit<DentalChartEntry, "id" | "recorded_at">): Promise<DentalChartEntry> {
    if (supabase) {
      const { data, error } = await supabase.from("dental_chart_entries").insert({ ...input, clinic_id: currentClinicId() }).select("*").single();
      if (error) throw error;
      return data as DentalChartEntry;
    }
    const entries = loadLocal<DentalChartEntry[]>("dental_chart", demoDentalChart);
    const created: DentalChartEntry = { ...input, id: crypto.randomUUID(), recorded_at: new Date().toISOString() };
    saveLocal("dental_chart", [created, ...entries]);
    return created;
  },

  async listTreatmentPlans(patientId?: string, clinicIdOverride?: string | null): Promise<TreatmentPlan[]> {
    if (supabase) {
      let request = supabase.from("treatment_plans").select("*, patient:patients(id,patient_no,first_name,last_name)").eq("clinic_id", currentClinicId(clinicIdOverride)).order("created_at", { ascending: false });
      if (patientId) request = request.eq("patient_id", patientId);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as unknown as TreatmentPlan[];
    }
    const plans = loadLocal<TreatmentPlan[]>("treatment_plans", demoTreatmentPlans);
    return patientId ? plans.filter((plan) => plan.patient_id === patientId) : plans;
  },

  async createTreatmentPlan(input: Partial<TreatmentPlan>): Promise<TreatmentPlan> {
    if (!input.patient_id || !input.title) throw new Error("Patient and title are required.");
    if (supabase) {
      const { data, error } = await supabase.from("treatment_plans").insert({
        clinic_id: currentClinicId(),
        patient_id: input.patient_id,
        title: input.title,
        status: input.status || "draft",
        estimated_total: input.estimated_total || 0,
        discount_total: input.discount_total || 0,
        notes: input.notes || null,
      }).select("*").single();
      if (error) throw error;
      return data as TreatmentPlan;
    }
    const plans = loadLocal<TreatmentPlan[]>("treatment_plans", demoTreatmentPlans);
    const patient = loadLocal<Patient[]>("patients", demoPatients).find((p) => p.id === input.patient_id) ?? null;
    const created: TreatmentPlan = {
      id: crypto.randomUUID(),
      patient_id: input.patient_id,
      title: input.title,
      status: input.status || "draft",
      estimated_total: input.estimated_total || 0,
      discount_total: input.discount_total || 0,
      notes: input.notes || null,
      created_at: new Date().toISOString(),
      patient,
    };
    saveLocal("treatment_plans", [created, ...plans]);
    return created;
  },

  async listTreatmentPlanItems(treatmentPlanId: string): Promise<TreatmentPlanItem[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from("treatment_plan_items")
        .select("*")
        .eq("clinic_id", currentClinicId())
        .eq("treatment_plan_id", treatmentPlanId)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as TreatmentPlanItem[];
    }
    return loadLocal<TreatmentPlanItem[]>("treatment_plan_items", [])
      .filter((item) => item.treatment_plan_id === treatmentPlanId)
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  async createTreatmentPlanItem(input: {
    treatment_plan_id: string;
    treatment_id?: string | null;
    tooth_no?: number | null;
    description: string;
    quantity: number;
    unit_price: number;
    discount?: number;
  }): Promise<TreatmentPlanItem> {
    if (!input.treatment_plan_id || !input.description.trim()) throw new Error("Treatment plan and description are required.");
    if (!(input.quantity > 0) || input.unit_price < 0 || Number(input.discount || 0) < 0) {
      throw new Error("Quantity and pricing values are invalid.");
    }

    if (supabase) {
      const existing = await this.listTreatmentPlanItems(input.treatment_plan_id);
      const { data, error } = await supabase.from("treatment_plan_items").insert({
        clinic_id: currentClinicId(),
        treatment_plan_id: input.treatment_plan_id,
        treatment_id: input.treatment_id || null,
        tooth_no: input.tooth_no || null,
        description: input.description.trim(),
        quantity: input.quantity,
        unit_price: input.unit_price,
        discount: input.discount || 0,
        status: "planned",
        sort_order: existing.length,
      }).select("*").single();
      if (error) throw error;
      return data as TreatmentPlanItem;
    }

    const items = loadLocal<TreatmentPlanItem[]>("treatment_plan_items", []);
    const created: TreatmentPlanItem = {
      id: crypto.randomUUID(),
      treatment_plan_id: input.treatment_plan_id,
      treatment_id: input.treatment_id || null,
      tooth_no: input.tooth_no || null,
      description: input.description.trim(),
      quantity: input.quantity,
      unit_price: input.unit_price,
      discount: input.discount || 0,
      status: "planned",
      sort_order: items.filter((item) => item.treatment_plan_id === input.treatment_plan_id).length,
    };
    saveLocal("treatment_plan_items", [...items, created]);
    return created;
  },

  async updateTreatmentPlanItemStatus(id: string, status: TreatmentPlanItem["status"]): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from("treatment_plan_items")
        .update({ status })
        .eq("id", id)
        .eq("clinic_id", currentClinicId());
      if (error) throw error;
      return;
    }
    const items = loadLocal<TreatmentPlanItem[]>("treatment_plan_items", []);
    saveLocal("treatment_plan_items", items.map((item) => item.id === id ? { ...item, status } : item));
  },

  async deleteTreatmentPlanItem(id: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from("treatment_plan_items")
        .delete()
        .eq("id", id)
        .eq("clinic_id", currentClinicId());
      if (error) throw error;
      return;
    }
    const items = loadLocal<TreatmentPlanItem[]>("treatment_plan_items", []);
    saveLocal("treatment_plan_items", items.filter((item) => item.id !== id));
  },

  async setTreatmentPlanStatus(id: string, status: TreatmentPlan["status"]): Promise<void> {
    if (supabase) {
      const { error } = await supabase.rpc("set_treatment_plan_status", {
        p_treatment_plan_id: id,
        p_status: status,
      });
      if (error) throw error;
      return;
    }
    const plans = loadLocal<TreatmentPlan[]>("treatment_plans", demoTreatmentPlans);
    saveLocal("treatment_plans", plans.map((plan) => plan.id === id ? { ...plan, status } : plan));
  },

  async listClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
    if (supabase) {
      const { data, error } = await supabase.from("clinical_notes").select("*").eq("clinic_id", currentClinicId()).eq("patient_id", patientId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClinicalNote[];
    }
    return loadLocal<ClinicalNote[]>("clinical_notes", demoClinicalNotes).filter((note) => note.patient_id === patientId);
  },

  async createClinicalNote(patientId: string, note: string, noteType: ClinicalNote["note_type"] = "progress"): Promise<ClinicalNote> {
    if (supabase) {
      const { data, error } = await supabase.from("clinical_notes").insert({ clinic_id: currentClinicId(), patient_id: patientId, note, note_type: noteType }).select("*").single();
      if (error) throw error;
      return data as ClinicalNote;
    }
    const notes = loadLocal<ClinicalNote[]>("clinical_notes", demoClinicalNotes);
    const created: ClinicalNote = { id: crypto.randomUUID(), patient_id: patientId, note, note_type: noteType, created_at: new Date().toISOString() };
    saveLocal("clinical_notes", [created, ...notes]);
    return created;
  },

  async listInvoices(patientId?: string, clinicIdOverride?: string | null): Promise<Invoice[]> {
    if (supabase) {
      let request = supabase.from("invoices").select("*, patient:patients!invoices_clinic_patient_fkey(id,patient_no,first_name,last_name)").eq("clinic_id", currentClinicId(clinicIdOverride)).order("created_at", { ascending: false });
      if (patientId) request = request.eq("patient_id", patientId);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as Invoice[];
    }
    const invoices = loadLocal<Invoice[]>("invoices", demoInvoices).map((invoice) => ({ ...invoice, patient: loadLocal<Patient[]>("patients", demoPatients).find((patient) => patient.id === invoice.patient_id) ?? null }));
    return patientId ? invoices.filter((invoice) => invoice.patient_id === patientId) : invoices;
  },

  async createInvoice(input: { patient_id: string; description: string; amount: number; due_at?: string | null }): Promise<string> {
    if (!input.patient_id || !input.description.trim() || !(input.amount > 0)) throw new Error("Patient, description and positive amount are required.");
    if (supabase) {
      const { data, error } = await supabase.rpc("create_simple_invoice", {
        p_patient_id: input.patient_id,
        p_description: input.description.trim(),
        p_amount: input.amount,
        p_due_at: input.due_at || null,
      });
      if (error) throw error;
      return String(data);
    }
    const invoices = loadLocal<Invoice[]>("invoices", demoInvoices);
    const serial = Math.max(1000, ...invoices.map((invoice) => Number(invoice.invoice_no.replace(/\D/g, "")) || 0)) + 1;
    const id = crypto.randomUUID();
    const patient = loadLocal<Patient[]>("patients", demoPatients).find((row) => row.id === input.patient_id) ?? null;
    const invoice: Invoice = { id, patient_id: input.patient_id, invoice_no: `INV-${String(serial).padStart(6, "0")}`, status: "issued", subtotal: input.amount, discount_total: 0, tax_total: 0, total: input.amount, paid_total: 0, balance_due: input.amount, issued_at: new Date().toISOString(), due_at: input.due_at || null, patient };
    saveLocal("invoices", [invoice, ...invoices]);
    return id;
  },

  async recordPayment(input: { invoice_id: string; amount: number; method: Payment["method"]; reference?: string }): Promise<string> {
    if (!(input.amount > 0)) throw new Error("Payment amount must be positive.");
    if (supabase) {
      const { data, error } = await supabase.rpc("record_invoice_payment", { p_invoice_id: input.invoice_id, p_amount: input.amount, p_method: input.method, p_reference: input.reference || null });
      if (error) throw error;
      return String(data);
    }
    const invoices = loadLocal<Invoice[]>("invoices", demoInvoices);
    const invoice = invoices.find((row) => row.id === input.invoice_id);
    if (!invoice) throw new Error("Invoice not found.");
    const amount = Math.min(input.amount, Number(invoice.balance_due));
    const payment: Payment = { id: crypto.randomUUID(), patient_id: invoice.patient_id, invoice_id: invoice.id, amount, method: input.method, reference: input.reference || null, paid_at: new Date().toISOString(), notes: null };
    saveLocal("payments", [payment, ...loadLocal<Payment[]>("payments", demoPayments)]);
    const paidTotal = Number(invoice.paid_total) + amount;
    const updated = invoices.map((row) => row.id === invoice.id ? { ...row, paid_total: paidTotal, balance_due: Math.max(Number(row.total) - paidTotal, 0), status: paidTotal >= Number(row.total) ? "paid" as const : "partially_paid" as const } : row);
    saveLocal("invoices", updated);
    return payment.id;
  },

  async listPayments(patientId?: string, clinicIdOverride?: string | null): Promise<Payment[]> {
    if (supabase) {
      let request = supabase.from("payments").select("*").eq("clinic_id", currentClinicId(clinicIdOverride)).order("paid_at", { ascending: false });
      if (patientId) request = request.eq("patient_id", patientId);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as Payment[];
    }
    const payments = loadLocal<Payment[]>("payments", demoPayments);
    return patientId ? payments.filter((payment) => payment.patient_id === patientId) : payments;
  },

  async listPatientDocuments(
    patientId: string,
    clinicIdOverride?: string | null,
    patientVisibleOnly = true,
  ): Promise<PatientDocument[]> {
    if (supabase) {
      let request = supabase
        .from("patient_documents")
        .select("*")
        .eq("patient_id", patientId)
        .eq("clinic_id", currentClinicId(clinicIdOverride));
      if (patientVisibleOnly) request = request.eq("patient_visible", true);
      const { data, error } = await request.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PatientDocument[];
    }
    return loadLocal<PatientDocument[]>("documents", demoDocuments).filter(
      (document) => document.patient_id === patientId && (!patientVisibleOnly || document.patient_visible),
    );
  },

  async uploadPatientDocument(input: {
    patient_id: string;
    file: File;
    title: string;
    document_type: string;
    patient_visible: boolean;
  }): Promise<PatientDocument> {
    if (!supabase) throw new Error("Live database is required for document uploads.");
    if (!input.title.trim()) throw new Error("Document title is required.");

    const allowedTypes = new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/dicom",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);
    if (!allowedTypes.has(input.file.type)) throw new Error("Unsupported file type.");
    if (input.file.size <= 0 || input.file.size > 25 * 1024 * 1024) throw new Error("Document must be 25 MB or smaller.");

    const clinicId = currentClinicId();
    const safeName = input.file.name
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(-120) || "document";
    const storagePath = `${clinicId}/${input.patient_id}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("patient-files")
      .upload(storagePath, input.file, { upsert: false, contentType: input.file.type });
    if (uploadError) throw uploadError;

    const { data: identity } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("patient_documents").insert({
      clinic_id: clinicId,
      patient_id: input.patient_id,
      document_type: input.document_type.trim() || "other",
      title: input.title.trim(),
      storage_path: storagePath,
      mime_type: input.file.type,
      file_size: input.file.size,
      patient_visible: input.patient_visible,
      uploaded_by: identity.user?.id || null,
    }).select("*").single();

    if (error) {
      await supabase.storage.from("patient-files").remove([storagePath]).catch(() => undefined);
      throw error;
    }
    return data as PatientDocument;
  },

  async updatePatientDocumentVisibility(id: string, patientVisible: boolean): Promise<void> {
    if (!supabase) {
      const docs = loadLocal<PatientDocument[]>("documents", demoDocuments);
      saveLocal("documents", docs.map((doc) => doc.id === id ? { ...doc, patient_visible: patientVisible } : doc));
      return;
    }
    const { error } = await supabase
      .from("patient_documents")
      .update({ patient_visible: patientVisible })
      .eq("id", id)
      .eq("clinic_id", currentClinicId());
    if (error) throw error;
  },

  async deletePatientDocument(document: PatientDocument): Promise<void> {
    if (!supabase) {
      const docs = loadLocal<PatientDocument[]>("documents", demoDocuments);
      saveLocal("documents", docs.filter((doc) => doc.id !== document.id));
      return;
    }
    const { error: storageError } = await supabase.storage.from("patient-files").remove([document.storage_path]);
    if (storageError) throw storageError;
    const { error } = await supabase
      .from("patient_documents")
      .delete()
      .eq("id", document.id)
      .eq("clinic_id", currentClinicId());
    if (error) throw error;
  },

  async createPatientDocumentUrl(storagePath: string): Promise<string | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.storage.from("patient-files").createSignedUrl(storagePath, 300);
    if (error) throw error;
    return data.signedUrl;
  },

  async listInventory(): Promise<InventoryItem[]> {
    if (supabase) {
      const { data, error } = await supabase.from("inventory_items").select("*").eq("clinic_id", currentClinicId()).eq("active", true).order("name");
      if (error) throw error;
      return (data ?? []) as InventoryItem[];
    }
    return loadLocal<InventoryItem[]>("inventory", demoInventory);
  },

  async createBookingRequest(input: { clinic_id?: string; full_name: string; email?: string; phone: string; requested_treatment?: string; requested_doctor?: string; preferred_date?: string; preferred_time?: string; notes?: string }): Promise<BookingRequest> {
    if (!input.full_name.trim() || !input.phone.trim()) throw new Error("Name and phone are required.");

    const clinicId = currentClinicId(input.clinic_id);
    const created: BookingRequest = {
      id: crypto.randomUUID(),
      full_name: input.full_name.trim(),
      email: input.email?.trim() || null,
      phone: input.phone.trim(),
      requested_treatment: input.requested_treatment || null,
      requested_doctor: input.requested_doctor || null,
      preferred_date: input.preferred_date || null,
      preferred_time: input.preferred_time || null,
      notes: input.notes?.trim() || null,
      status: "new",
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { error } = await supabase.from("booking_requests").insert({
        id: created.id,
        clinic_id: clinicId,
        full_name: created.full_name,
        email: created.email,
        phone: created.phone,
        requested_treatment: created.requested_treatment,
        requested_doctor: created.requested_doctor,
        preferred_date: created.preferred_date,
        preferred_time: created.preferred_time,
        notes: created.notes,
      });
      if (error) throw error;
      return created;
    }

    const requests = loadLocal<BookingRequest[]>("booking_requests", []);
    saveLocal("booking_requests", [created, ...requests]);
    return created;
  },

  async listBookingRequests(): Promise<BookingRequest[]> {
    if (supabase) {
      const { data, error } = await supabase.from("booking_requests").select("*").eq("clinic_id", currentClinicId()).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BookingRequest[];
    }
    return loadLocal<BookingRequest[]>("booking_requests", []);
  },

  async convertBookingRequest(id: string): Promise<{ patient_id: string; appointment_id: string }> {
    if (!supabase) throw new Error("Live database is required to convert booking requests.");
    const { data, error } = await supabase.rpc("convert_booking_request", {
      p_booking_request_id: id,
    });
    if (error) throw error;
    const result = data as { patient_id?: string; appointment_id?: string } | null;
    if (!result?.patient_id || !result?.appointment_id) throw new Error("Booking conversion did not return an appointment.");
    return { patient_id: result.patient_id, appointment_id: result.appointment_id };
  },

  async updateBookingRequestStatus(id: string, status: BookingRequest["status"]): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from("booking_requests").update({ status }).eq("id", id).eq("clinic_id", currentClinicId());
      if (error) throw error;
      return;
    }
    const requests = loadLocal<BookingRequest[]>("booking_requests", []);
    saveLocal("booking_requests", requests.map((request) => request.id === id ? { ...request, status } : request));
  },

  async listDoctors(): Promise<Doctor[]> {
    if (supabase) {
      const { data, error } = await supabase.from("doctors").select("*").eq("clinic_id", currentClinicId()).eq("active", true).order("display_name");
      if (error) throw error;
      return (data ?? []) as Doctor[];
    }
    return loadLocal<Doctor[]>("doctors", demoDoctors);
  },

  async listTreatments(): Promise<TreatmentCatalogItem[]> {
    if (supabase) {
      const { data, error } = await supabase.from("treatments").select("*").eq("clinic_id", currentClinicId()).eq("active", true).order("name_en");
      if (error) throw error;
      return (data ?? []) as TreatmentCatalogItem[];
    }
    return loadLocal<TreatmentCatalogItem[]>("treatments", demoTreatments);
  },

  async createDoctor(input: { display_name: string; specialty?: string; phone?: string; email?: string; license_number?: string }): Promise<Doctor> {
    if (!input.display_name.trim()) throw new Error("Doctor name is required.");
    if (!supabase) throw new Error("Live database is required for doctor management.");
    const { data, error } = await supabase.from("doctors").insert({
      clinic_id: currentClinicId(),
      display_name: input.display_name.trim(),
      specialty: input.specialty?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      license_number: input.license_number?.trim() || null,
    }).select("*").single();
    if (error) throw error;
    return data as Doctor;
  },

  async createTreatment(input: { code: string; name_en: string; name_ar?: string; duration_minutes: number; default_price: number }): Promise<TreatmentCatalogItem> {
    if (!input.code.trim() || !input.name_en.trim()) throw new Error("Code and treatment name are required.");
    if (!supabase) throw new Error("Live database is required for treatment management.");
    const { data, error } = await supabase.from("treatments").insert({
      clinic_id: currentClinicId(),
      code: input.code.trim().toUpperCase(),
      name_en: input.name_en.trim(),
      name_ar: input.name_ar?.trim() || null,
      duration_minutes: input.duration_minutes,
      default_price: input.default_price,
    }).select("*").single();
    if (error) throw error;
    return data as TreatmentCatalogItem;
  },

  async createInventoryItem(input: { sku: string; name: string; category?: string; quantity: number; unit?: string; minimum_stock: number; cost_per_unit: number; supplier?: string; batch_no?: string; expiry_date?: string }): Promise<InventoryItem> {
    if (!input.sku.trim() || !input.name.trim()) throw new Error("SKU and name are required.");
    if (!supabase) throw new Error("Live database is required for inventory management.");
    const { data, error } = await supabase.from("inventory_items").insert({
      clinic_id: currentClinicId(),
      sku: input.sku.trim().toUpperCase(), name: input.name.trim(), category: input.category?.trim() || null,
      quantity: input.quantity, unit: input.unit?.trim() || null, minimum_stock: input.minimum_stock,
      cost_per_unit: input.cost_per_unit, supplier: input.supplier?.trim() || null, batch_no: input.batch_no?.trim() || null,
      expiry_date: input.expiry_date || null,
    }).select("*").single();
    if (error) throw error;
    return data as InventoryItem;
  },

  async recordInventoryTransaction(input: { inventory_item_id: string; transaction_type: "receive" | "consume" | "adjust" | "waste"; quantity: number; appointment_id?: string | null }): Promise<string> {
    if (!(input.quantity > 0)) throw new Error("Quantity must be positive.");
    if (!supabase) throw new Error("Live database is required for inventory management.");
    const { data, error } = await supabase.rpc("record_inventory_transaction", {
      p_inventory_item_id: input.inventory_item_id,
      p_transaction_type: input.transaction_type,
      p_quantity: input.quantity,
      p_appointment_id: input.appointment_id || null,
    });
    if (error) throw error;
    return String(data);
  },

  async updateAppointmentStatus(id: string, status: Appointment["status"]): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.rpc("set_appointment_status", { p_appointment_id: id, p_status: status });
    if (error) throw error;
  },

  async listClinicUsers(): Promise<Array<{ id: string; email?: string; full_name?: string; role: string; active: boolean; last_sign_in_at?: string | null; email_confirmed_at?: string | null; must_change_password?: boolean }>> {
    if (!supabase) return [];
    const { data, error } = await supabase.functions.invoke("manage-clinic-users", { body: { action: "list", clinic_id: currentClinicId() } });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
    return data?.users ?? [];
  },

  async createClinicUser(input: { email: string; password: string; full_name: string; role: "dentist" | "receptionist" | "accountant"; specialty?: string; license_number?: string }): Promise<void> {
    if (!supabase) throw new Error("Live database is required for user management.");
    const { data, error } = await supabase.functions.invoke("manage-clinic-users", { body: { action: "create", clinic_id: currentClinicId(), ...input } });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
  },

  async updateClinicUser(input: { user_id: string; role: "dentist" | "receptionist" | "accountant"; active: boolean }): Promise<void> {
    if (!supabase) throw new Error("Live database is required for user management.");
    const { data, error } = await supabase.functions.invoke("manage-clinic-users", { body: { action: "update", clinic_id: currentClinicId(), ...input } });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
  },

  async getDashboardSummary(): Promise<{ totalPatients: number; todayAppointments: number; outstandingBalance: number; activeLeads: number; lowStock: number; monthlyRevenue: number; recentAppointments: Appointment[] }> {
    if (!supabase) return { totalPatients: demoPatients.length, todayAppointments: demoAppointments.length, outstandingBalance: demoInvoices.reduce((s, i) => s + Number(i.balance_due), 0), activeLeads: 0, lowStock: demoInventory.filter((i) => i.quantity <= i.minimum_stock).length, monthlyRevenue: demoPayments.reduce((s, p) => s + Number(p.amount), 0), recentAppointments: demoAppointments.slice(0, 5) };
    const clinicId = currentClinicId();
    const now = new Date();
    const dayStart = new Date(now); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(now); dayEnd.setHours(23,59,59,999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [patientsRes, apptsRes, invoicesRes, inventoryRes, paymentsRes] = await Promise.all([
      supabase.from("patients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId).neq("status", "archived"),
      supabase.from("appointments").select("*, patient:patients!appointments_clinic_patient_fkey(id,patient_no,first_name,last_name), doctor:doctors!appointments_clinic_doctor_fkey(id,display_name), treatment:treatments!appointments_clinic_treatment_fkey(id,name_en,name_ar)").eq("clinic_id", clinicId).gte("start_at", dayStart.toISOString()).lte("start_at", dayEnd.toISOString()).order("start_at").limit(8),
      supabase.from("invoices").select("balance_due").eq("clinic_id", clinicId).neq("status", "void"),
      supabase.from("inventory_items").select("quantity,minimum_stock").eq("clinic_id", clinicId).eq("active", true),
      supabase.from("payments").select("amount").eq("clinic_id", clinicId).gte("paid_at", monthStart.toISOString()),
    ]);
    for (const response of [patientsRes, apptsRes, invoicesRes, inventoryRes, paymentsRes]) if (response.error) throw response.error;
    let activeLeads = 0;
    const leadRes = await supabase.from("booking_requests").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId).in("status", ["new","contacted"]);
    if (!leadRes.error) activeLeads = leadRes.count || 0;
    return {
      totalPatients: patientsRes.count || 0,
      todayAppointments: apptsRes.data?.length || 0,
      outstandingBalance: (invoicesRes.data || []).reduce((s, row) => s + Number(row.balance_due || 0), 0),
      activeLeads,
      lowStock: (inventoryRes.data || []).filter((row) => Number(row.quantity) <= Number(row.minimum_stock)).length,
      monthlyRevenue: (paymentsRes.data || []).reduce((s, row) => s + Number(row.amount || 0), 0),
      recentAppointments: (apptsRes.data || []) as unknown as Appointment[],
    };
  },
};
