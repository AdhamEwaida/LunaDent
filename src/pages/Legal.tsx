import { Link } from "react-router-dom";

const lastUpdated = "October 1, 2026";

function LegalShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white">L</span>
            LunaDent
          </Link>
          <Link to="/" className="text-sm font-semibold text-slate-600">Back to platform</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">LunaDent SaaS</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">{title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{intro}</p>
        <p className="mt-2 text-xs text-slate-400">Last updated: {lastUpdated}</p>
        <div className="mt-10 space-y-9 text-sm leading-7 text-slate-700">{children}</div>
      </main>
      <footer className="border-t bg-white py-7">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-x-5 gap-y-2 px-5 text-xs text-slate-500">
          <span>© 2026 LunaDent</span>
          <Link to="/privacy" className="hover:text-slate-900">Privacy</Link>
          <Link to="/terms" className="hover:text-slate-900">Terms</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalShell
      title="Privacy Policy"
      intro="This policy explains the main categories of information LunaDent processes when providing the dental clinic software platform and public clinic websites."
    >
      <Section title="1. Information processed through LunaDent">
        <p>LunaDent can process account details, clinic and staff information, patient records entered by authorized clinic users, appointment and booking information, treatment-plan information, invoices and payments recorded in the platform, uploaded patient documents, website configuration, and support or demo-request information.</p>
        <p>Public booking forms may collect a patient's name, phone number, optional email, treatment preference, doctor preference, preferred date and time, and optional notes.</p>
      </Section>

      <Section title="2. Clinic and platform responsibilities">
        <p>Clinics use LunaDent to manage their own operations and patient relationships. A clinic determines which patient information its authorized users enter, upload, display, or share through its workspace. LunaDent provides the software infrastructure used to store and process that information.</p>
        <p>If you are a patient, questions about the accuracy, clinical meaning, or use of a record created by a clinic should generally be directed to that clinic.</p>
      </Section>

      <Section title="3. How information is used">
        <p>Information is used to authenticate users, operate clinic workspaces, manage appointments and booking requests, provide patient-portal access, maintain treatment and financial workflows, host clinic websites, protect the service, troubleshoot issues, and respond to requests from clinics or prospective customers.</p>
      </Section>

      <Section title="4. Access controls and isolation">
        <p>LunaDent uses role-based access and tenant-scoped database controls so clinic staff access is limited according to their clinic membership and role. Patient-portal access is scoped to the patient's linked records. Platform administration does not automatically grant access to every clinic's clinical records.</p>
      </Section>

      <Section title="5. Service providers">
        <p>LunaDent relies on infrastructure and software providers to operate the service, including hosting, database, authentication, storage, source-control, and deployment providers. Information may be processed by those providers only as required to deliver the service and according to the configuration of the LunaDent account.</p>
      </Section>

      <Section title="6. Retention and deletion">
        <p>Data is retained while needed to provide the service, satisfy clinic operational needs, maintain security and auditability, or meet applicable contractual or legal requirements. Clinics should establish their own retention practices for patient and business records. Deletion requests may be subject to legitimate retention obligations.</p>
      </Section>

      <Section title="7. Security">
        <p>LunaDent uses technical controls including authentication, role-based permissions, tenant isolation, private storage for patient files, and encrypted HTTPS connections. No online service can guarantee absolute security, and clinics remain responsible for protecting their credentials, devices, and authorized-user access.</p>
      </Section>

      <Section title="8. Contact and policy updates">
        <p>Privacy questions can be submitted through the Request Demo/contact form on the LunaDent platform. This policy may be updated as the product, providers, or legal requirements change. Material updates should be reflected by a new “last updated” date.</p>
      </Section>
    </LegalShell>
  );
}

export function TermsOfService() {
  return (
    <LegalShell
      title="Terms of Service"
      intro="These baseline terms govern use of the LunaDent software platform. A signed proposal, order form, or other written agreement with a clinic may add to or override these terms for that customer."
    >
      <Section title="1. The service">
        <p>LunaDent provides software for dental-clinic operations, including patient and appointment management, treatment workflows, booking requests, patient-portal features, website configuration, and plan-dependent finance or inventory features.</p>
        <p>LunaDent is a software platform. It does not provide dental treatment, clinical diagnosis, emergency services, or medical advice.</p>
      </Section>

      <Section title="2. Accounts and authorized users">
        <p>Clinic owners are responsible for the users they authorize, the roles assigned to those users, and keeping account credentials secure. Users must provide accurate account information and must not share credentials in a way that defeats role-based access controls.</p>
      </Section>

      <Section title="3. Clinic data and lawful use">
        <p>Clinics are responsible for ensuring they have an appropriate basis to enter, upload, use, and share information through LunaDent. Users must not use the platform to violate law, infringe rights, upload malicious content, interfere with service security, or access another clinic's data without authorization.</p>
      </Section>

      <Section title="4. Plans, limits, and billing">
        <p>Available functionality depends on the clinic's selected plan and current subscription status. Plan limits can include staff seats, dentist seats, storage, and access to specific product modules. Pricing shown on the platform is informational until confirmed in the applicable order or commercial agreement.</p>
        <p>If a subscription becomes suspended or otherwise unusable, LunaDent may restrict plan-protected operational actions while preserving data subject to the applicable agreement and retention requirements.</p>
      </Section>

      <Section title="5. Booking and patient communications">
        <p>A booking request submitted through a clinic website is a request for a preferred time, not a confirmed appointment. The clinic remains responsible for reviewing and confirming appointments and for clinical communications with its patients.</p>
      </Section>

      <Section title="6. Availability and changes">
        <p>LunaDent may update the service to improve security, reliability, or functionality. Reasonable efforts are made to maintain service availability, but uninterrupted operation is not guaranteed. Planned or emergency maintenance, third-party outages, and events outside reasonable control may affect availability.</p>
      </Section>

      <Section title="7. Intellectual property">
        <p>LunaDent and its software, interface, and platform materials remain the property of their respective owners. Clinics retain their rights in clinic branding and the information they lawfully provide to the platform.</p>
      </Section>

      <Section title="8. Termination">
        <p>Access may be suspended or terminated for non-payment, security risk, material misuse, or as provided in the applicable commercial agreement. Data export, retention, and deletion following termination are subject to that agreement and applicable obligations.</p>
      </Section>

      <Section title="9. Warranty and liability framework">
        <p>The service is provided subject to the warranties, service commitments, limitations, and liability terms stated in the applicable signed agreement. Clinics should not rely on the platform as the sole mechanism for emergency care, legally required backups, or time-critical clinical decisions.</p>
      </Section>

      <Section title="10. Contact">
        <p>Questions about these terms or a clinic subscription can be submitted through the LunaDent Request Demo/contact form.</p>
      </Section>
    </LegalShell>
  );
}
