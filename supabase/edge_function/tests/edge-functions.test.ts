import { assert, assertEquals } from "../deps.ts";

const projectUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
const functionUrl = (name: string) => `${projectUrl}/functions/v1/${name}`;

Deno.test("Edge sources retain required security guards", async () => {
  const clinicUsers = await Deno.readTextFile(
    "../functions/manage-clinic-users/index.ts",
  );
  const manageSaas = await Deno.readTextFile(
    "../functions/manage-saas/index.ts",
  );
  const publicBooking = await Deno.readTextFile(
    "../functions/public-booking/index.ts",
  );

  assert(clinicUsers.includes('authHeader?.startsWith("Bearer ")'));
  assert(clinicUsers.includes('platform_role === "super_admin"'));
  assert(clinicUsers.includes("STAFF_LIMIT_REACHED"));
  assert(clinicUsers.includes("DENTIST_LIMIT_REACHED"));

  assert(manageSaas.includes('platform_role !== "super_admin"'));
  assert(manageSaas.includes('from("profiles")'));
  assert(manageSaas.includes('eq("email", ownerEmail)'));

  assert(publicBooking.includes('req.method !== "POST"'));
  assert(publicBooking.includes("booking_abuse_events"));
  assert(publicBooking.includes("RATE_LIMITED"));
  assert(publicBooking.includes("loadAvailability"));
});

Deno.test({
  name: "Live public booking rejects unsupported methods without mutation",
  ignore: !projectUrl,
  async fn() {
    const response = await fetch(functionUrl("public-booking"), {
      method: "GET",
    });
    assertEquals(response.status, 405);
  },
});

Deno.test({
  name: "Live public booking rejects a request without clinic context",
  ignore: !projectUrl,
  async fn() {
    const response = await fetch(functionUrl("public-booking"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assertEquals(response.status, 400);
  },
});

for (const functionName of ["manage-clinic-users", "manage-saas"]) {
  Deno.test({
    name: `Live ${functionName} rejects unauthenticated calls`,
    ignore: !projectUrl,
    async fn() {
      const response = await fetch(functionUrl(functionName), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "context" }),
      });
      assertEquals(response.status, 401);
    },
  });
}
