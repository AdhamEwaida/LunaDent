import { isSupabaseConfigured, supabase } from "@/lib/supabase";
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

export const clinicRepository = {
  mode: isSupabaseConfigured ? "supabase" : "demo" as "supabase" | "demo",

  async listPatients(query = ""): Promise<Patient[]> {
    if (supabase) {
      let request = supabase
        .from("patients")
        .select("*")
        .neq("status", "archived")
        .order("created_at", { ascending: false });

      if (query.trim()) {
        const safe = query.trim().replaceAll(",", " ");
        request = request.or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,patient_no.ilike.%${safe}%,phone.ilike.%${safe}%,email.ilike.%${safe}%`);
      }

      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as Patient[];
    }

    const patients = loadLocal<Patient[]>("patients", demoPatients);
    return query.trim() ? patients.filter((patient) => normalizePatientSearch(patient, query)) : patients;
  },

  async getPatientByAuthUserId(authUserId: string): Promise<Patient | null> {
    if (supabase) {
      const { data, error } = await supabase.from("patients").select("*").eq("auth_user_id", authUserId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: medical } = await supabase.from("patient_medical_history").select("blood_type,allergies,chronic_conditions,current_medications,dental_history,clinical_summary").eq("patient_id", data.id).maybeSingle();
      return { ...data, ...(medical ?? {}), notes: medical?.clinical_summary ?? null } as Patient;
    }
    return loadLocal<Patient[]>("patients", demoPatients)[0] ?? null;
  },

  async getPatient(id: string): Promise<Patient | null> {
    if (supabase) {
      const { data, error } = await supabase.from("patients").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: medical } = await supabase.from("patient_medical_history").select("blood_type,allergies,chronic_conditions,current_medications,dental_history,clinical_summary").eq("patient_id", id).maybeSingle();
      return { ...data, ...(medical ?? {}), notes: medical?.clinical_summary ?? null } as Patient;
    }
    return loadLocal<Patient[]>("patients", demoPatients).find((patient) => patient.id === id) ?? null;
  },

  async createPatient(input: Partial<Patient>): Promise<Patient> {
    if (supabase) {
      const { data, error } = await supabase
        .from("patients")
        .insert({
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
      const { data, error } = await supabase
        .from("patients")
        .update({ ...patch, id: undefined, patient_no: undefined, created_at: undefined })
        .eq("id", id)
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
      const { error } = await supabase.from("patient_medical_history").upsert({
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

  async listAppointments(patientId?: string): Promise<Appointment[]> {
    if (supabase) {
      let request = supabase
        .from("appointments")
        .select("*, patient:patients(id,patient_no,first_name,last_name), doctor:doctors(id,display_name), treatment:treatments(id,name_en,name_ar)")
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
      const { data, error } = await supabase.from("dental_chart_entries").select("*").eq("patient_id", patientId).order("recorded_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DentalChartEntry[];
    }
    return loadLocal<DentalChartEntry[]>("dental_chart", demoDentalChart).filter((entry) => entry.patient_id === patientId);
  },

  async saveDentalChartEntry(input: Omit<DentalChartEntry, "id" | "recorded_at">): Promise<DentalChartEntry> {
    if (supabase) {
      const { data, error } = await supabase.from("dental_chart_entries").insert(input).select("*").single();
      if (error) throw error;
      return data as DentalChartEntry;
    }
    const entries = loadLocal<DentalChartEntry[]>("dental_chart", demoDentalChart);
    const created: DentalChartEntry = { ...input, id: crypto.randomUUID(), recorded_at: new Date().toISOString() };
    saveLocal("dental_chart", [created, ...entries]);
    return created;
  },

  async listTreatmentPlans(patientId?: string): Promise<TreatmentPlan[]> {
    if (supabase) {
      let request = supabase.from("treatment_plans").select("*, patient:patients(id,patient_no,first_name,last_name)").order("created_at", { ascending: false });
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

  async listClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
    if (supabase) {
      const { data, error } = await supabase.from("clinical_notes").select("*").eq("patient_id", patientId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClinicalNote[];
    }
    return loadLocal<ClinicalNote[]>("clinical_notes", demoClinicalNotes).filter((note) => note.patient_id === patientId);
  },

  async createClinicalNote(patientId: string, note: string, noteType: ClinicalNote["note_type"] = "progress"): Promise<ClinicalNote> {
    if (supabase) {
      const { data, error } = await supabase.from("clinical_notes").insert({ patient_id: patientId, note, note_type: noteType }).select("*").single();
      if (error) throw error;
      return data as ClinicalNote;
    }
    const notes = loadLocal<ClinicalNote[]>("clinical_notes", demoClinicalNotes);
    const created: ClinicalNote = { id: crypto.randomUUID(), patient_id: patientId, note, note_type: noteType, created_at: new Date().toISOString() };
    saveLocal("clinical_notes", [created, ...notes]);
    return created;
  },

  async listInvoices(patientId?: string): Promise<Invoice[]> {
    if (supabase) {
      let request = supabase.from("invoices").select("*, patient:patients(id,patient_no,first_name,last_name)").order("created_at", { ascending: false });
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

  async listPayments(patientId?: string): Promise<Payment[]> {
    if (supabase) {
      let request = supabase.from("payments").select("*").order("paid_at", { ascending: false });
      if (patientId) request = request.eq("patient_id", patientId);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as Payment[];
    }
    const payments = loadLocal<Payment[]>("payments", demoPayments);
    return patientId ? payments.filter((payment) => payment.patient_id === patientId) : payments;
  },

  async listPatientDocuments(patientId: string): Promise<PatientDocument[]> {
    if (supabase) {
      const { data, error } = await supabase.from("patient_documents").select("*").eq("patient_id", patientId).eq("patient_visible", true).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PatientDocument[];
    }
    return loadLocal<PatientDocument[]>("documents", demoDocuments).filter((document) => document.patient_id === patientId && document.patient_visible);
  },

  async createPatientDocumentUrl(storagePath: string): Promise<string | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.storage.from("patient-files").createSignedUrl(storagePath, 300);
    if (error) throw error;
    return data.signedUrl;
  },

  async listInventory(): Promise<InventoryItem[]> {
    if (supabase) {
      const { data, error } = await supabase.from("inventory_items").select("*").eq("active", true).order("name");
      if (error) throw error;
      return (data ?? []) as InventoryItem[];
    }
    return loadLocal<InventoryItem[]>("inventory", demoInventory);
  },

  async createBookingRequest(input: { full_name: string; email?: string; phone: string; requested_treatment?: string; requested_doctor?: string; preferred_date?: string; preferred_time?: string; notes?: string }): Promise<BookingRequest> {
    if (!input.full_name.trim() || !input.phone.trim()) throw new Error("Name and phone are required.");

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
      const { data, error } = await supabase.from("booking_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BookingRequest[];
    }
    return loadLocal<BookingRequest[]>("booking_requests", []);
  },

  async updateBookingRequestStatus(id: string, status: BookingRequest["status"]): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from("booking_requests").update({ status }).eq("id", id);
      if (error) throw error;
      return;
    }
    const requests = loadLocal<BookingRequest[]>("booking_requests", []);
    saveLocal("booking_requests", requests.map((request) => request.id === id ? { ...request, status } : request));
  },

  async listDoctors(): Promise<Doctor[]> {
    if (supabase) {
      const { data, error } = await supabase.from("doctors").select("*").eq("active", true).order("display_name");
      if (error) throw error;
      return (data ?? []) as Doctor[];
    }
    return loadLocal<Doctor[]>("doctors", demoDoctors);
  },

  async listTreatments(): Promise<TreatmentCatalogItem[]> {
    if (supabase) {
      const { data, error } = await supabase.from("treatments").select("*").eq("active", true).order("name_en");
      if (error) throw error;
      return (data ?? []) as TreatmentCatalogItem[];
    }
    return loadLocal<TreatmentCatalogItem[]>("treatments", demoTreatments);
  },

  async createDoctor(input: { display_name: string; specialty?: string; phone?: string; email?: string; license_number?: string }): Promise<Doctor> {
    if (!input.display_name.trim()) throw new Error("Doctor name is required.");
    if (!supabase) throw new Error("Live database is required for doctor management.");
    const { data, error } = await supabase.from("doctors").insert({
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
    const { data, error } = await supabase.functions.invoke("manage-clinic-users", { body: { action: "list" } });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
    return data?.users ?? [];
  },

  async createClinicUser(input: { email: string; password: string; full_name: string; role: "admin" | "dentist" | "receptionist" | "accountant"; specialty?: string; license_number?: string }): Promise<void> {
    if (!supabase) throw new Error("Live database is required for user management.");
    const { data, error } = await supabase.functions.invoke("manage-clinic-users", { body: { action: "create", ...input } });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
  },

  async updateClinicUser(input: { user_id: string; role: "admin" | "dentist" | "receptionist" | "accountant"; active: boolean }): Promise<void> {
    if (!supabase) throw new Error("Live database is required for user management.");
    const { data, error } = await supabase.functions.invoke("manage-clinic-users", { body: { action: "update", ...input } });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
  },

  async getDashboardSummary(): Promise<{ totalPatients: number; todayAppointments: number; outstandingBalance: number; activeLeads: number; lowStock: number; monthlyRevenue: number; recentAppointments: Appointment[] }> {
    if (!supabase) return { totalPatients: demoPatients.length, todayAppointments: demoAppointments.length, outstandingBalance: demoInvoices.reduce((s, i) => s + Number(i.balance_due), 0), activeLeads: 0, lowStock: demoInventory.filter((i) => i.quantity <= i.minimum_stock).length, monthlyRevenue: demoPayments.reduce((s, p) => s + Number(p.amount), 0), recentAppointments: demoAppointments.slice(0, 5) };
    const now = new Date();
    const dayStart = new Date(now); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(now); dayEnd.setHours(23,59,59,999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [patientsRes, apptsRes, invoicesRes, inventoryRes, paymentsRes] = await Promise.all([
      supabase.from("patients").select("id", { count: "exact", head: true }).neq("status", "archived"),
      supabase.from("appointments").select("*, patient:patients(id,patient_no,first_name,last_name), doctor:doctors(id,display_name), treatment:treatments(id,name_en,name_ar)").gte("start_at", dayStart.toISOString()).lte("start_at", dayEnd.toISOString()).order("start_at").limit(8),
      supabase.from("invoices").select("balance_due").neq("status", "void"),
      supabase.from("inventory_items").select("quantity,minimum_stock").eq("active", true),
      supabase.from("payments").select("amount").gte("paid_at", monthStart.toISOString()),
    ]);
    for (const response of [patientsRes, apptsRes, invoicesRes, inventoryRes, paymentsRes]) if (response.error) throw response.error;
    let activeLeads = 0;
    const leadRes = await supabase.from("booking_requests").select("id", { count: "exact", head: true }).in("status", ["new","contacted"]);
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
